/**
 * GET /api/chatwork-rooms
 *
 * Returns Chatwork room info for all configured rooms.
 * Reads from KV-accumulated data (populated by /api/sync-chatwork).
 * Falls back to live Chatwork API if KV has no data yet.
 *
 * No auth required — serves the public inquiries dashboard page.
 */

const CHATWORK_API_BASE = 'https://api.chatwork.com/v2'

interface KVNamespace {
  get(key: string): Promise<string | null>
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

interface StoredRoom {
  roomId: string
  name: string
  type: RoomType
  description: string
  unreadCount: number
  latestMessage: string
  latestTime: string
  syncedAt?: string
}

interface ChatworkRoomAPI {
  room_id: number
  name: string
  description: string
  unread_num: number
}

interface ChatworkMessageAPI {
  message_id: number
  body: string
  send_time: number
}

const ROOM_DEFS: { envKey: keyof Env; type: RoomType }[] = [
  { envKey: 'CHATWORK_ROOM_OPERATIONS',   type: 'operations'   },
  { envKey: 'CHATWORK_ROOM_HP_LINE',      type: 'hp_line'      },
  { envKey: 'CHATWORK_ROOM_RECRUITMENT',  type: 'recruitment'  },
  { envKey: 'CHATWORK_ROOM_NOTIFICATION', type: 'notification' },
  { envKey: 'CHATWORK_ROOM_CUSTOMER',     type: 'customer'     },
]

async function fetchRoomLive(
  token: string,
  roomId: string,
  type: RoomType,
): Promise<StoredRoom | null> {
  try {
    const headers = { 'X-ChatWorkToken': token }
    const [roomRes, msgRes] = await Promise.all([
      fetch(`${CHATWORK_API_BASE}/rooms/${roomId}`, { headers }),
      fetch(`${CHATWORK_API_BASE}/rooms/${roomId}/messages?force=1`, { headers }),
    ])
    if (!roomRes.ok) return null
    const room = (await roomRes.json()) as ChatworkRoomAPI
    let latestMessage = ''
    let latestTime = ''
    if (msgRes.ok) {
      const messages = (await msgRes.json()) as ChatworkMessageAPI[]
      if (Array.isArray(messages) && messages.length > 0) {
        const last = messages[messages.length - 1]
        latestMessage = last.body ?? ''
        latestTime = new Date(last.send_time * 1000).toLocaleTimeString('ja-JP', {
          hour: '2-digit', minute: '2-digit',
        })
      }
    }
    return {
      roomId,
      name: room.name ?? '',
      type,
      description: room.description ?? '',
      unreadCount: room.unread_num ?? 0,
      latestMessage,
      latestTime,
    }
  } catch {
    return null
  }
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const kv = env.SETTINGS_KV
  const token = (await kv?.get('CHATWORK_API_TOKEN')) ?? env.CHATWORK_API_TOKEN ?? ''

  if (!token) {
    return Response.json({ error: 'CHATWORK_API_TOKEN が未設定です', rooms: [] })
  }

  const rooms: StoredRoom[] = []
  const lastSync = await kv?.get('chatwork:last_sync')

  await Promise.all(
    ROOM_DEFS.map(async def => {
      const roomId = (await kv?.get(def.envKey as string)) ?? (env[def.envKey] as string | undefined) ?? ''
      if (!roomId) return

      // Use KV-stored data if available
      let room: StoredRoom | null = null
      if (kv) {
        const stored = await kv.get(`chatwork:room:${def.type}`)
        if (stored) {
          try { room = JSON.parse(stored) as StoredRoom } catch { /* ignore */ }
        }
      }

      // Fall back to live API if KV has no data
      if (!room) {
        room = await fetchRoomLive(token, roomId, def.type)
      }

      if (room) rooms.push(room)
    }),
  )

  // Sort: notification/customer first, then others
  rooms.sort((a, b) => {
    const order: Record<RoomType, number> = {
      notification: 0, customer: 1, operations: 2, hp_line: 3, recruitment: 4,
    }
    return (order[a.type] ?? 9) - (order[b.type] ?? 9)
  })

  return Response.json({ rooms, lastSync: lastSync ?? null })
}
