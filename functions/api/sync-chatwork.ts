/**
 * POST /api/sync-chatwork
 *
 * Fetches all Chatwork room messages and accumulates them in KV.
 * Called by GitHub Actions every 6 hours after deployment.
 * No auth required — this endpoint only writes internal data, nothing is exposed.
 *
 * Rate-limited: skips if last sync was less than 30 minutes ago.
 *
 * KV schema:
 *   chatwork:room:{type}      → latest room info (name, unreadCount, etc.)
 *   chatwork:messages:{type}  → accumulated message array (deduplicated by messageId)
 *   chatwork:last_sync        → ISO timestamp of last successful sync
 */

const CHATWORK_API_BASE = 'https://api.chatwork.com/v2'
const MIN_SYNC_INTERVAL_MS = 30 * 60 * 1000  // 30 minutes

interface KVNamespace {
  get(key: string): Promise<string | null>
  put(key: string, value: string): Promise<void>
}

interface Env {
  SETTINGS_KV?: KVNamespace
  CHATWORK_API_TOKEN?: string
  CHATWORK_ROOM_OPERATIONS?: string
  CHATWORK_ROOM_HP_LINE?: string
  CHATWORK_ROOM_RECRUITMENT?: string
  CHATWORK_ROOM_NOTIFICATION?: string
  CHATWORK_ROOM_CUSTOMER?: string
}

type RoomType = 'operations' | 'hp_line' | 'recruitment' | 'notification' | 'customer'

interface StoredMessage {
  messageId: string
  roomId: string
  roomName: string
  roomType: RoomType
  account: { name: string }
  body: string
  sendTime: number
}

interface StoredRoom {
  roomId: string
  name: string
  type: RoomType
  description: string
  unreadCount: number
  latestMessage: string
  latestTime: string
  syncedAt: string
}

interface ChatworkRoomAPI {
  room_id: number
  name: string
  description: string
  unread_num: number
}

interface ChatworkMessageAPI {
  message_id: number
  account: { account_id: number; name: string }
  body: string
  send_time: number
}

async function getKvValue<T>(kv: KVNamespace, key: string): Promise<T | null> {
  const raw = await kv.get(key)
  if (!raw) return null
  try { return JSON.parse(raw) as T } catch { return null }
}

async function syncRoom(
  kv: KVNamespace,
  token: string,
  roomId: string,
  type: RoomType,
): Promise<{ room: StoredRoom; newCount: number } | null> {
  const headers = { 'X-ChatWorkToken': token }

  try {
    const [roomRes, msgRes] = await Promise.all([
      fetch(`${CHATWORK_API_BASE}/rooms/${roomId}`, { headers }),
      fetch(`${CHATWORK_API_BASE}/rooms/${roomId}/messages?force=1`, { headers }),
    ])

    if (!roomRes.ok) return null

    const roomData = (await roomRes.json()) as ChatworkRoomAPI
    const newMessages: ChatworkMessageAPI[] = msgRes.ok
      ? ((await msgRes.json()) as ChatworkMessageAPI[])
      : []

    const msgArray = Array.isArray(newMessages) ? newMessages : []
    const latest = msgArray[msgArray.length - 1]

    const room: StoredRoom = {
      roomId,
      name: roomData.name ?? '',
      type,
      description: roomData.description ?? '',
      unreadCount: roomData.unread_num ?? 0,
      latestMessage: latest?.body ?? '',
      latestTime: latest
        ? new Date(latest.send_time * 1000).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
        : '',
      syncedAt: new Date().toISOString(),
    }

    // Accumulate messages — merge with existing, deduplicate by messageId
    const existing = (await getKvValue<StoredMessage[]>(kv, `chatwork:messages:${type}`)) ?? []
    const existingIds = new Set(existing.map(m => m.messageId))

    const newStored: StoredMessage[] = msgArray
      .filter(m => !existingIds.has(String(m.message_id)))
      .map(m => ({
        messageId: String(m.message_id),
        roomId,
        roomName: roomData.name ?? '',
        roomType: type,
        account: { name: m.account?.name ?? '' },
        body: m.body ?? '',
        sendTime: m.send_time ?? 0,
      }))

    const merged = [...existing, ...newStored]
      .sort((a, b) => a.sendTime - b.sendTime)

    await Promise.all([
      kv.put(`chatwork:room:${type}`, JSON.stringify(room)),
      kv.put(`chatwork:messages:${type}`, JSON.stringify(merged)),
    ])

    return { room, newCount: newStored.length }
  } catch {
    return null
  }
}

export const onRequestPost: PagesFunction<Env> = async ({ env }) => {
  const kv = env.SETTINGS_KV

  if (!kv) {
    return Response.json({ error: 'SETTINGS_KV が未設定です' }, { status: 503 })
  }

  // Rate limit: skip if synced within last 30 minutes
  const lastSync = await kv.get('chatwork:last_sync')
  if (lastSync) {
    const elapsed = Date.now() - new Date(lastSync).getTime()
    if (elapsed < MIN_SYNC_INTERVAL_MS) {
      return Response.json({
        skipped: true,
        reason: `前回の同期から ${Math.round(elapsed / 60000)} 分しか経過していません`,
        lastSync,
      })
    }
  }

  const token = (await kv.get('CHATWORK_API_TOKEN')) ?? env.CHATWORK_API_TOKEN ?? ''

  if (!token) {
    return Response.json({ error: 'CHATWORK_API_TOKEN が未設定です' }, { status: 503 })
  }

  const roomDefs: { envKey: keyof Env; type: RoomType }[] = [
    { envKey: 'CHATWORK_ROOM_OPERATIONS',   type: 'operations'   },
    { envKey: 'CHATWORK_ROOM_HP_LINE',      type: 'hp_line'      },
    { envKey: 'CHATWORK_ROOM_RECRUITMENT',  type: 'recruitment'  },
    { envKey: 'CHATWORK_ROOM_NOTIFICATION', type: 'notification' },
    { envKey: 'CHATWORK_ROOM_CUSTOMER',     type: 'customer'     },
  ]

  const summary: Record<string, unknown> = {}

  await Promise.all(
    roomDefs.map(async def => {
      const roomId = (await kv.get(def.envKey as string)) ?? (env[def.envKey] as string | undefined) ?? ''
      if (!roomId) {
        summary[def.type] = { skipped: true, reason: 'ルームID未設定' }
        return
      }
      const result = await syncRoom(kv, token, roomId, def.type)
      summary[def.type] = result
        ? { roomName: result.room.name, newMessages: result.newCount }
        : { error: 'API取得失敗' }
    }),
  )

  await kv.put('chatwork:last_sync', new Date().toISOString())

  return Response.json({ ok: true, syncedAt: new Date().toISOString(), summary })
}
