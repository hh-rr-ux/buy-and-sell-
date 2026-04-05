/**
 * GET /api/sheets-data
 *
 * Google Sheets から売却・購入案件データ、問い合わせ統計、売上集計を取得して返す。
 *
 * ── パフォーマンス設計 ──
 * 1. KVキャッシュ（TTL 5分）: キャッシュHIT時はSheets APIを呼ばない
 * 2. batchGet API: 複数レンジを1回のAPIリクエストで取得（2〜5 → 1回）
 * 3. 429 RATE_LIMIT時: 5秒後に1回リトライ
 *
 * ── レスポンスヘッダー（デバッグ用） ──
 * X-Cache: HIT | MISS
 * X-Sheets-Requests: {n}  (このリクエストで何回Sheets APIを呼んだか)
 *
 * ── 環境変数 (Cloudflare Pages ダッシュボード または KV で設定) ──
 * GOOGLE_SHEETS_ID             スプレッドシートID
 * GOOGLE_SHEETS_API_KEY        Google Sheets API キー
 * GOOGLE_SHEETS_SELL_RANGE     売却シート範囲  (デフォルト: 【売却】案件管理!A1:Z500)
 * GOOGLE_SHEETS_BUY_RANGE      購入シート範囲  (デフォルト: 【購入】案件管理!A1:Z500)
 * GOOGLE_SHEETS_SELL_INQ_RANGE 売却問い合わせ範囲 (任意)
 * GOOGLE_SHEETS_BUY_INQ_RANGE  購入問い合わせ範囲 (任意)
 * GOOGLE_SHEETS_SUMMARY_RANGE  売上集計範囲   (任意)
 * GOOGLE_SHEETS_PAYMENT_RANGE  入金確認タブ範囲 (任意)
 */

const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets'
const CACHE_KEY = 'sheets:data:v3'  // 直接env読み込みデバッグ用にv3に変更
const CACHE_TTL_SECONDS = 300 // 5分

interface KVNamespace {
  get(key: string): Promise<string | null>
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>
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
  GOOGLE_SHEETS_PAYMENT_RANGE?: string  // 入金確認タブ
}

/** KV → env var の順で値を取得 */
async function getConfig(kv: KVNamespace | undefined, env: Env, key: keyof Env): Promise<string> {
  const kvVal = await kv?.get(key as string)
  return kvVal ?? (env[key] as string | undefined) ?? ''
}

/**
 * batchGet API で複数レンジを 1 回のリクエストで取得する。
 * 429 RATE_LIMIT の場合は 5 秒待って 1 回だけリトライする。
 *
 * 戻り値: レンジの順番に対応した string[][][] （各レンジの values）
 */
async function batchGetRanges(
  sheetsId: string,
  apiKey: string,
  ranges: string[],
): Promise<string[][][] | { error: string }> {
  const params = new URLSearchParams({ key: apiKey, valueRenderOption: 'FORMATTED_VALUE' })
  for (const r of ranges) params.append('ranges', r)
  const url = `${SHEETS_API_BASE}/${sheetsId}/values:batchGet?${params}`

  const doFetch = () => fetch(url)

  let res: Response
  try {
    res = await doFetch()
  } catch (e) {
    return { error: `fetch失敗: ${String(e)}` }
  }

  // 429 → 5秒後に1回リトライ
  if (res.status === 429) {
    console.warn('[sheets-data] 429 RATE_LIMIT_EXCEEDED → 5秒後にリトライ')
    await new Promise(resolve => setTimeout(resolve, 5000))
    try {
      res = await doFetch()
    } catch (e) {
      return { error: `リトライfetch失敗: ${String(e)}` }
    }
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    return { error: `HTTP ${res.status}: ${body.slice(0, 300)}` }
  }

  const json = (await res.json()) as { valueRanges?: { values?: string[][] }[] }
  return (json.valueRanges ?? []).map(vr => vr.values ?? [])
}

/** string[][] → ヘッダー行をキーとした Record<string, string>[] に変換 */
function valuesToRows(values: string[][]): Record<string, string>[] {
  if (values.length < 2) return []
  const headers = values[0].map(h => h.trim())
  return values.slice(1).map(row => {
    const obj: Record<string, string> = {}
    headers.forEach((h, i) => { if (h) obj[h] = row[i]?.trim() ?? '' })
    return obj
  })
}

/** Record<string, string>[] → 月別問い合わせデータ形式に変換 */
function rowsToInquiryData(
  rows: Record<string, string>[],
): Record<string, Record<string, number[]>> {
  const result: Record<string, Record<string, number[]>> = {}
  for (const row of rows) {
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
  // ── 環境変数を直接ログ（KV経由ではなく env から直読み） ──
  console.log('[sheets-data] PAYMENT_RANGE=', env.GOOGLE_SHEETS_PAYMENT_RANGE)
  console.log('[sheets-data] SUMMARY_RANGE=', env.GOOGLE_SHEETS_SUMMARY_RANGE)
  console.log('[sheets-data] SHEETS_ID=', env.GOOGLE_SHEETS_ID ? '(set)' : '(unset)')

  const kv = env.SETTINGS_KV

  // ── KVキャッシュ確認（5分以内なら再利用） ──
  if (kv) {
    const cached = await kv.get(CACHE_KEY)
    if (cached) {
      console.log('[sheets-data] KVキャッシュHIT → Sheets APIリクエストなし')
      return Response.json(JSON.parse(cached), {
        headers: {
          'X-Cache': 'HIT',
          'X-Sheets-Requests': '0',
          'Cache-Control': `public, max-age=${CACHE_TTL_SECONDS}`,
        },
      })
    }
    console.log('[sheets-data] KVキャッシュMISS → Sheets APIを呼び出し')
  }

  // ── 環境変数取得 ──
  const [sheetsId, apiKey] = await Promise.all([
    getConfig(kv, env, 'GOOGLE_SHEETS_ID'),
    getConfig(kv, env, 'GOOGLE_SHEETS_API_KEY'),
  ])

  if (!sheetsId || !apiKey) {
    const errMsg = 'GOOGLE_SHEETS_ID または GOOGLE_SHEETS_API_KEY が未設定です'
    return Response.json({
      sellCases:      { error: errMsg },
      buyCases:       { error: errMsg },
      sellInquiries:  {},
      buyInquiries:   {},
      salesSummary:   [],
      paymentRecords: [],
    }, { headers: { 'X-Cache': 'MISS', 'X-Sheets-Requests': '0', 'Cache-Control': 'no-store' } })
  }

  const [sellRange, buyRange, sellInqRange, buyInqRange, summaryRange, paymentRange] = await Promise.all([
    getConfig(kv, env, 'GOOGLE_SHEETS_SELL_RANGE'),
    getConfig(kv, env, 'GOOGLE_SHEETS_BUY_RANGE'),
    getConfig(kv, env, 'GOOGLE_SHEETS_SELL_INQ_RANGE'),
    getConfig(kv, env, 'GOOGLE_SHEETS_BUY_INQ_RANGE'),
    getConfig(kv, env, 'GOOGLE_SHEETS_SUMMARY_RANGE'),
    getConfig(kv, env, 'GOOGLE_SHEETS_PAYMENT_RANGE'),
  ])

  // 環境変数の読み込み状況をログ出力（デバッグ用）
  console.log('[sheets-data] 環境変数確認:',
    `PAYMENT_RANGE="${paymentRange || '未設定'}"`,
    `SUMMARY_RANGE="${summaryRange || '未設定'}"`,
    `SELL_INQ_RANGE="${sellInqRange || '未設定'}"`,
  )

  const effectiveSellRange = sellRange || '【売却】案件管理!A1:Z500'
  const effectiveBuyRange  = buyRange  || '【購入】案件管理!A1:Z500'

  // ── paymentRange は KV よりも env を優先（KV に空文字が混入するケースを回避） ──
  const effectivePaymentRange = env.GOOGLE_SHEETS_PAYMENT_RANGE || paymentRange

  // ── batchGet: 全レンジを 1 回の API リクエストで取得 ──
  const allRanges: string[] = [effectiveSellRange, effectiveBuyRange]
  if (sellInqRange)          allRanges.push(sellInqRange)
  if (buyInqRange)           allRanges.push(buyInqRange)
  if (summaryRange)          allRanges.push(summaryRange)
  if (effectivePaymentRange) allRanges.push(effectivePaymentRange)

  console.log(`[sheets-data] batchGet: ${allRanges.length}レンジ → Sheets APIリクエスト1回`)
  console.log('[sheets-data] リクエストレンジ一覧:', allRanges)
  console.log(`[sheets-data] 入金確認レンジ: ${effectivePaymentRange ? `"${effectivePaymentRange}" (index=${allRanges.indexOf(effectivePaymentRange)})` : '未設定（スキップ）'}`)
  console.log('[sheets-data] paymentRange(KV)=', paymentRange || '(空)', '  env直読み=', env.GOOGLE_SHEETS_PAYMENT_RANGE || '(空)')

  const batchResult = await batchGetRanges(sheetsId, apiKey, allRanges)

  if (!Array.isArray(batchResult)) {
    // batchGet 自体がエラー（429リトライ後も失敗）
    console.error('[sheets-data] batchGetエラー:', batchResult.error)
    return Response.json({
      sellCases:      { error: batchResult.error },
      buyCases:       { error: batchResult.error },
      sellInquiries:  {},
      buyInquiries:   {},
      salesSummary:   [],
      paymentRecords: [],
    }, { headers: { 'X-Cache': 'MISS', 'X-Sheets-Requests': '1', 'Cache-Control': 'no-store' } })
  }

  // レンジ順にインデックスで取り出す
  let idx = 0
  const sellValues    = batchResult[idx++] ?? []
  const buyValues     = batchResult[idx++] ?? []
  const sellInqValues  = sellInqRange          ? (batchResult[idx++] ?? []) : []
  const buyInqValues   = buyInqRange           ? (batchResult[idx++] ?? []) : []
  const summaryValues  = summaryRange          ? (batchResult[idx++] ?? []) : []
  const paymentValues  = effectivePaymentRange ? (batchResult[idx++] ?? []) : []

  const sellCases     = valuesToRows(sellValues)
  const buyCases      = valuesToRows(buyValues)
  const sellInquiries = rowsToInquiryData(valuesToRows(sellInqValues))
  const buyInquiries  = rowsToInquiryData(valuesToRows(buyInqValues))
  const salesSummary  = valuesToRows(summaryValues)
  const paymentRecords = valuesToRows(paymentValues)

  console.log(
    `[sheets-data] 取得完了: 売却=${sellCases.length}件, 購入=${buyCases.length}件, ` +
    `入金=${paymentRecords.length}件 (effectivePaymentRange設定=${!!effectivePaymentRange})`,
  )
  console.log('[sheets-data] paymentRecords件数=', paymentRecords.length)
  if (paymentRecords.length > 0) {
    console.log('[sheets-data] paymentRecords先頭2件:', JSON.stringify(paymentRecords.slice(0, 2)))
  }

  const result = { sellCases, buyCases, sellInquiries, buyInquiries, salesSummary, paymentRecords }

  // ── KVにキャッシュ保存（TTL 5分） ──
  if (kv) {
    await kv.put(CACHE_KEY, JSON.stringify(result), { expirationTtl: CACHE_TTL_SECONDS })
    console.log(`[sheets-data] KVキャッシュ保存完了 (TTL: ${CACHE_TTL_SECONDS}秒)`)
  }

  return Response.json(result, {
    headers: {
      'X-Cache': 'MISS',
      'X-Sheets-Requests': '1', // batchGetで1回
      'Cache-Control': `public, max-age=${CACHE_TTL_SECONDS}`,
    },
  })
}
