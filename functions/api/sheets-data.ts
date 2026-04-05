/**
 * GET /api/sheets-data
 *
 * Google Sheets から売却・購入案件データ、問い合わせ統計、売上集計を取得して返す。
 * useSheetData.ts が期待するフォーマット:
 *   sellCases:     Record<string, string>[]
 *   buyCases:      Record<string, string>[]
 *   sellInquiries: Record<string, Record<string, number[]>>  // 月 → 列名 → 値の配列
 *   buyInquiries:  Record<string, Record<string, number[]>>
 *   salesSummary:  Record<string, string>[]
 *
 * 環境変数 (Cloudflare Pages ダッシュボード または KV で設定):
 *   GOOGLE_SHEETS_ID            スプレッドシートID
 *   GOOGLE_SHEETS_API_KEY       Google Sheets API キー
 *   GOOGLE_SHEETS_SELL_RANGE    売却シート範囲  (デフォルト: 【売却】案件管理!A1:Z500)
 *   GOOGLE_SHEETS_BUY_RANGE     購入シート範囲  (デフォルト: 【購入】案件管理!A1:Z500)
 *   GOOGLE_SHEETS_SELL_INQ_RANGE 売却問い合わせ範囲 (任意)
 *   GOOGLE_SHEETS_BUY_INQ_RANGE  購入問い合わせ範囲 (任意)
 *   GOOGLE_SHEETS_SUMMARY_RANGE  売上集計範囲   (任意)
 */

const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets'

interface KVNamespace {
  get(key: string): Promise<string | null>
}

interface Env {
  SETTINGS_KV?: KVNamespace
  GOOGLE_SHEETS_ID?: string
  GOOGLE_SHEETS_API_KEY?: string
  GOOGLE_SHEETS_SELL_RANGE?: string
  GOOGLE_SHEETS_BUY_RANGE?: string
  GOOGLE_SHEETS_SELL_INQ_RANGE?: string
  GOOGLE_SHEETS_BUY_INQ_RANGE?: string
  GOOGLE_SHEETS_SUMMARY_RANGE?: string
}

/** KV → env var の順で値を取得 */
async function getConfig(kv: KVNamespace | undefined, env: Env, key: keyof Env): Promise<string> {
  const kvVal = await kv?.get(key as string)
  return kvVal ?? (env[key] as string | undefined) ?? ''
}

/**
 * Google Sheets API から 1 つの range を取得し、
 * ヘッダー行をキーとした Record<string, string>[] に変換する。
 */
async function fetchSheetRows(
  sheetsId: string,
  apiKey: string,
  range: string,
): Promise<Record<string, string>[] | { error: string }> {
  const url = `${SHEETS_API_BASE}/${sheetsId}/values/${encodeURIComponent(range)}?key=${apiKey}&valueRenderOption=FORMATTED_VALUE`
  let res: Response
  try {
    res = await fetch(url)
  } catch (e) {
    return { error: `fetch失敗: ${String(e)}` }
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    return { error: `HTTP ${res.status}: ${body.slice(0, 200)}` }
  }
  const json = (await res.json()) as { values?: string[][] }
  const rows = json.values ?? []
  if (rows.length < 2) return []

  const headers = rows[0].map(h => h.trim())
  return rows.slice(1).map(row => {
    const obj: Record<string, string> = {}
    headers.forEach((h, i) => {
      obj[h] = row[i]?.trim() ?? ''
    })
    return obj
  })
}

/**
 * 問い合わせシートの範囲を取得し、
 * 月列をキーとした InquiryData に変換する。
 *
 * シート想定形式:
 *   月       | 新規問い合わせ | 成約
 *   26年4月  | 5             | 1
 *   26年3月  | 3             | 0
 *
 * 戻り値: { "26年4月": { "新規問い合わせ": [5], "成約": [1] }, ... }
 */
async function fetchInquiryData(
  sheetsId: string,
  apiKey: string,
  range: string,
): Promise<Record<string, Record<string, number[]>>> {
  const rows = await fetchSheetRows(sheetsId, apiKey, range)
  if (!Array.isArray(rows)) return {}

  const result: Record<string, Record<string, number[]>> = {}
  for (const row of rows) {
    // 月列: "月", "年月", "対象月" のいずれかを使う
    const month = row['月'] ?? row['年月'] ?? row['対象月'] ?? ''
    if (!month) continue

    if (!result[month]) result[month] = {}
    for (const [col, val] of Object.entries(row)) {
      if (col === '月' || col === '年月' || col === '対象月') continue
      const num = parseFloat(val.replace(/,/g, ''))
      if (!isNaN(num)) {
        result[month][col] = [...(result[month][col] ?? []), num]
      }
    }
  }
  return result
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const kv = env.SETTINGS_KV

  const [sheetsId, apiKey] = await Promise.all([
    getConfig(kv, env, 'GOOGLE_SHEETS_ID'),
    getConfig(kv, env, 'GOOGLE_SHEETS_API_KEY'),
  ])

  if (!sheetsId || !apiKey) {
    return Response.json({
      sellCases:     { error: 'GOOGLE_SHEETS_ID または GOOGLE_SHEETS_API_KEY が未設定です' },
      buyCases:      { error: 'GOOGLE_SHEETS_ID または GOOGLE_SHEETS_API_KEY が未設定です' },
      sellInquiries: {},
      buyInquiries:  {},
      salesSummary:  [],
    })
  }

  const [sellRange, buyRange, sellInqRange, buyInqRange, summaryRange] = await Promise.all([
    getConfig(kv, env, 'GOOGLE_SHEETS_SELL_RANGE'),
    getConfig(kv, env, 'GOOGLE_SHEETS_BUY_RANGE'),
    getConfig(kv, env, 'GOOGLE_SHEETS_SELL_INQ_RANGE'),
    getConfig(kv, env, 'GOOGLE_SHEETS_BUY_INQ_RANGE'),
    getConfig(kv, env, 'GOOGLE_SHEETS_SUMMARY_RANGE'),
  ])

  const effectiveSellRange    = sellRange    || '【売却】案件管理!A1:Z500'
  const effectiveBuyRange     = buyRange     || '【購入】案件管理!A1:Z500'

  // 案件データと任意データを並列取得
  const [sellCases, buyCases, sellInquiries, buyInquiries, salesSummary] = await Promise.all([
    fetchSheetRows(sheetsId, apiKey, effectiveSellRange),
    fetchSheetRows(sheetsId, apiKey, effectiveBuyRange),
    sellInqRange
      ? fetchInquiryData(sheetsId, apiKey, sellInqRange)
      : Promise.resolve({} as Record<string, Record<string, number[]>>),
    buyInqRange
      ? fetchInquiryData(sheetsId, apiKey, buyInqRange)
      : Promise.resolve({} as Record<string, Record<string, number[]>>),
    summaryRange
      ? fetchSheetRows(sheetsId, apiKey, summaryRange)
      : Promise.resolve([] as Record<string, string>[]),
  ])

  return Response.json({
    sellCases,
    buyCases,
    sellInquiries,
    buyInquiries,
    salesSummary: Array.isArray(salesSummary) ? salesSummary : [],
  })
}
