/**
 * GET /api/evaluation
 *
 * Calls Anthropic Claude to generate staff evaluations from Chatwork data.
 * Requires a valid auth cookie and ANTHROPIC_API_KEY env var.
 */

import { verifyRequest } from '../_lib/jwt'

interface KVNamespace {
  get(key: string): Promise<string | null>
}

interface Env {
  JWT_SECRET: string
  SETTINGS_KV?: KVNamespace
  ANTHROPIC_API_KEY?: string
  CHATWORK_API_TOKEN?: string
  CHATWORK_ROOM_OPERATIONS?: string
}

interface ChatworkMessage {
  message_id: number
  account: { account_id: number; name: string; avatar_image_url: string }
  body: string
  send_time: number
  update_time: number
}

interface StaffEval {
  name: string
  score: number
  summary: string
  strengths: string[]
  improvements: string[]
  ownerMessage: string
}

// ── Chatwork helpers ──────────────────────────────────────────────────────

async function fetchChatworkMessages(
  token: string,
  roomId: string,
  limit = 100,
): Promise<ChatworkMessage[]> {
  const url = `https://api.chatwork.com/v2/rooms/${roomId}/messages?force=1`
  const res = await fetch(url, {
    headers: { 'X-ChatWorkToken': token },
  })
  if (!res.ok) throw new Error(`Chatwork API error: ${res.status}`)
  const messages = (await res.json()) as ChatworkMessage[]
  // Return the most recent `limit` messages
  return messages.slice(-limit)
}

// ── Anthropic helpers ─────────────────────────────────────────────────────

async function evaluateWithClaude(
  apiKey: string,
  messagesText: string,
): Promise<StaffEval[]> {
  const prompt = `以下はビジネスチャットのメッセージログです。
各担当者のパフォーマンスを客観的に評価してください。

メッセージログ:
${messagesText}

以下のJSON形式で各担当者の評価を返してください（余分なテキストなし）:
[
  {
    "name": "担当者名",
    "score": 1〜5の整数,
    "summary": "総合評価（1〜2文）",
    "strengths": ["強み1", "強み2"],
    "improvements": ["改善点1", "改善点2"],
    "ownerMessage": "オーナーからの一言コメント"
  }
]`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Anthropic API error ${res.status}: ${err}`)
  }

  const data = (await res.json()) as {
    content: Array<{ type: string; text: string }>
  }
  const text = data.content.find(c => c.type === 'text')?.text ?? '[]'

  // Strip markdown code fences if present
  const clean = text.replace(/^```(?:json)?\s*/m, '').replace(/\s*```$/m, '').trim()
  return JSON.parse(clean) as StaffEval[]
}

// ── Handler ───────────────────────────────────────────────────────────────

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!await verifyRequest(request, env.JWT_SECRET ?? '')) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: 'ANTHROPIC_API_KEY が設定されていません。Cloudflare Pages の環境変数を確認してください。' },
      { status: 503 },
    )
  }

  const token = (await env.SETTINGS_KV?.get('CHATWORK_API_TOKEN')) ?? env.CHATWORK_API_TOKEN ?? ''
  const roomId = (await env.SETTINGS_KV?.get('CHATWORK_ROOM_OPERATIONS')) ?? env.CHATWORK_ROOM_OPERATIONS ?? ''

  if (!token || !roomId) {
    return Response.json(
      { error: 'Chatwork の設定が不完全です（CHATWORK_API_TOKEN, CHATWORK_ROOM_OPERATIONS）' },
      { status: 503 },
    )
  }

  try {
    const messages = await fetchChatworkMessages(token, roomId)

    if (messages.length === 0) {
      return Response.json({ error: 'チャットにメッセージがありません' }, { status: 422 })
    }

    // Format messages for the prompt
    const messagesText = messages
      .map(m => `[${m.account.name}] ${m.body}`)
      .join('\n')

    const evaluations = await evaluateWithClaude(env.ANTHROPIC_API_KEY, messagesText)
    return Response.json({ evaluations })
  } catch (err) {
    const message = err instanceof Error ? err.message : '不明なエラー'
    return Response.json({ error: message }, { status: 500 })
  }
}
