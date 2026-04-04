/**
 * GET /api/chatwork-rooms
 *
 * Returns Chatwork room info (name, unread count, latest message) for all
 * configured rooms. Reads credentials from KV first, falls back to env vars.
 *
 * No auth required — this endpoint serves the public inquiries dashboard page.
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

type RoomType = 'operations' | 'hp_line' | 'recruitment' | 'notification' | 'customer'

interface RoomResult {
  roomId: string
  name: string
  type: RoomType
  description: string
  unreadCount: number
  latestMessage: string
  latestTime: string
}

async function fetchRoom(
  token: string,
  roomId: string,
  type: RoomType,
): Promise<RoomResult | null> {
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
          hour: '2-digit',
          minute: '2-digit',
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

  const roomDefs: { key: keyof Env; type: RoomType }[] = [
    { key: 'CHATWORK_ROOM_OPERATIONS',   type: 'operations'   },
    { key: 'CHATWORK_ROOM_HP_LINE',      type: 'hp_line'      },
    { key: 'CHATWORK_ROOM_RECRUITMENT',  type: 'recruitment'  },
    { key: 'CHATWORK_ROOM_NOTIFICATION', type: 'notification' },
    { key: 'CHATWORK_ROOM_CUSTOMER',     type: 'customer'     },
  ]

  const roomIds = await Promise.all(
    roomDefs.map(async def => ({
      id: (await kv?.get(def.key as string)) ?? (env[def.key] as string | undefined) ?? '',
      type: def.type,
    })),
  )

  const results = await Promise.all(
    roomIds
      .filter(r => r.id !== '')
      .map(r => fetchRoom(token, r.id, r.type)),
  )

  const rooms = results.filter((r): r is RoomResult => r !== null)

  return Response.json({ rooms })
}
