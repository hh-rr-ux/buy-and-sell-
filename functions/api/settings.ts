/**
 * GET  /api/settings  — list current settings (masked sensitive values)
 * POST /api/settings  — update a setting (stored in KV, overrides env var)
 *
 * Both endpoints require a valid auth cookie.
 *
 * Cloudflare bindings required:
 *   JWT_SECRET  (env var)
 *   SETTINGS_KV (KV namespace — optional; without it, settings are read-only)
 */

import { verifyRequest } from '../_lib/jwt'

// ── KV namespace type (subset of Cloudflare KVNamespace) ──────────────────
interface KVNamespace {
  get(key: string): Promise<string | null>
  put(key: string, value: string): Promise<void>
  delete(key: string): Promise<void>
}

interface Env {
  JWT_SECRET: string
  SETTINGS_KV?: KVNamespace
  // Managed env vars (read-only from Functions perspective)
  CHATWORK_API_TOKEN?: string
  CHATWORK_ROOM_OPERATIONS?: string
  CHATWORK_ROOM_HP_LINE?: string
  CHATWORK_ROOM_RECRUITMENT?: string
  CHATWORK_ROOM_NOTIFICATION?: string
  CHATWORK_ROOM_CUSTOMER?: string
  GOOGLE_SHEETS_ID?: string
  GOOGLE_SHEETS_API_KEY?: string
  GOOGLE_SHEETS_CASES_RANGE?: string
  GOOGLE_SHEETS_LINE_RANGE?: string
  GOOGLE_SHEETS_SELL_RANGE?: string
  GOOGLE_SHEETS_BUY_RANGE?: string
  GOOGLE_SHEETS_SELL_INQ_RANGE?: string
  GOOGLE_SHEETS_BUY_INQ_RANGE?: string
  GOOGLE_SHEETS_SUMMARY_RANGE?: string
  ANTHROPIC_API_KEY?: string
}

// ── Setting definitions ───────────────────────────────────────────────────

type Group = 'chatwork' | 'sheets' | 'ai'

interface SettingDef {
  key: keyof Env
  label: string
  group: Group
  sensitive: boolean
}

const SETTING_DEFS: SettingDef[] = [
  { key: 'CHATWORK_API_TOKEN',         label: 'Chatwork APIトークン',       group: 'chatwork', sensitive: true  },
  { key: 'CHATWORK_ROOM_OPERATIONS',   label: '運用チャット ルームID',       group: 'chatwork', sensitive: false },
  { key: 'CHATWORK_ROOM_HP_LINE',      label: 'HP,LINEチャット ルームID',   group: 'chatwork', sensitive: false },
  { key: 'CHATWORK_ROOM_RECRUITMENT',  label: '求人チャット ルームID',       group: 'chatwork', sensitive: false },
  { key: 'CHATWORK_ROOM_NOTIFICATION', label: '通知チャット ルームID',       group: 'chatwork', sensitive: false },
  { key: 'CHATWORK_ROOM_CUSTOMER',     label: 'メッセージチャット ルームID', group: 'chatwork', sensitive: false },
  { key: 'GOOGLE_SHEETS_ID',             label: 'スプレッドシートID',              group: 'sheets',   sensitive: false },
  { key: 'GOOGLE_SHEETS_API_KEY',        label: 'Google Sheets APIキー',           group: 'sheets',   sensitive: true  },
  { key: 'GOOGLE_SHEETS_SELL_RANGE',     label: '売却案件シート範囲',               group: 'sheets',   sensitive: false },
  { key: 'GOOGLE_SHEETS_BUY_RANGE',      label: '購入案件シート範囲',               group: 'sheets',   sensitive: false },
  { key: 'GOOGLE_SHEETS_SELL_INQ_RANGE', label: '売却問い合わせシート範囲（任意）', group: 'sheets',   sensitive: false },
  { key: 'GOOGLE_SHEETS_BUY_INQ_RANGE',  label: '購入問い合わせシート範囲（任意）', group: 'sheets',   sensitive: false },
  { key: 'GOOGLE_SHEETS_SUMMARY_RANGE',  label: '売上集計シート範囲（任意）',       group: 'sheets',   sensitive: false },
  { key: 'GOOGLE_SHEETS_CASES_RANGE',    label: '案件管理シート範囲（旧）',         group: 'sheets',   sensitive: false },
  { key: 'GOOGLE_SHEETS_LINE_RANGE',     label: 'LINE問い合わせシート範囲（旧）',   group: 'sheets',   sensitive: false },
  { key: 'ANTHROPIC_API_KEY',          label: 'Anthropic APIキー',           group: 'ai',       sensitive: true  },
]

const ALLOWED_KEYS = new Set(SETTING_DEFS.map(d => d.key))

function maskValue(value: string, sensitive: boolean): string {
  if (!sensitive) return value
  if (value.length <= 8) return '••••••••'
  return value.slice(0, 4) + '••••' + value.slice(-4)
}

// ── GET /api/settings ─────────────────────────────────────────────────────

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!await verifyRequest(request, env.JWT_SECRET ?? '')) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const kvAvailable = !!env.SETTINGS_KV

  const settings = await Promise.all(
    SETTING_DEFS.map(async def => {
      const envValue = (env[def.key] as string | undefined) ?? ''

      // KV overrides env var
      let kvValue: string | null = null
      if (env.SETTINGS_KV) {
        kvValue = await env.SETTINGS_KV.get(def.key as string)
      }

      const effectiveValue = kvValue ?? envValue
      const configured = effectiveValue.length > 0
      const source: 'kv' | 'env' | 'none' =
        kvValue !== null ? 'kv' : configured ? 'env' : 'none'

      return {
        key: def.key as string,
        label: def.label,
        group: def.group,
        sensitive: def.sensitive,
        configured,
        source,
        value: configured ? maskValue(effectiveValue, def.sensitive) : '',
      }
    }),
  )

  return Response.json({ settings, kvAvailable })
}

// ── POST /api/settings ────────────────────────────────────────────────────

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!await verifyRequest(request, env.JWT_SECRET ?? '')) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!env.SETTINGS_KV) {
    return Response.json({ error: 'KV storage not configured' }, { status: 503 })
  }

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const entries = Object.entries(body)
  if (entries.length !== 1) {
    return Response.json({ error: 'Send exactly one key per request' }, { status: 400 })
  }

  const [key, value] = entries[0]

  if (!ALLOWED_KEYS.has(key as keyof Env)) {
    return Response.json({ error: 'Unknown setting key' }, { status: 400 })
  }

  if (typeof value !== 'string') {
    return Response.json({ error: 'Value must be a string' }, { status: 400 })
  }

  if (value === '') {
    // Empty string = delete from KV (falls back to env var)
    await env.SETTINGS_KV.delete(key)
  } else {
    await env.SETTINGS_KV.put(key, value)
  }

  return Response.json({ ok: true })
}
