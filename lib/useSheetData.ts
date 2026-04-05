'use client'

/**
 * useSheetData
 *
 * /api/sheets-data からスプシデータを取得し、
 * SellCase[] / BuyCase[] にマッピングして返す。
 *
 * dataSource フィールドで「今どのデータを表示しているか」を返す:
 *   'real'          → APIから取得した実データ
 *   'mock_fallback' → APIが空・エラーのためデモデータを表示中
 *   'error'         → fetch自体が失敗（ネットワークエラー等）
 *
 * ── リクエスト最適化 ──
 * 1. モジュールキャッシュ + TTL: 5分以内のSPA遷移では再fetchしない
 * 2. sessionStorage + TTL: リロード後も5分以内なら前回データを即時表示
 * 3. pendingFetch: 複数コンポーネントが同時にmountしても /api/sheets-data は1回だけ呼ぶ
 */

import { useState, useEffect } from 'react'
import {
  sellCases as mockSellCases,
  buyCases  as mockBuyCases,
  monthlyStats as mockMonthlyStats,
  type SellCase, type BuyCase, type MonthlyStats,
} from './mockData'
import { mapSellCase, mapBuyCase, mapInquiryStats, mapSalesSummary } from './sheetMapper'

export interface SheetData {
  sellCases:      SellCase[]
  buyCases:       BuyCase[]
  monthlyStats:   MonthlyStats[]
  inquirySummary: Record<string, { newInquiries: number; closedSell: number; closedBuy: number }>
  loaded:         boolean
  /** 'real' = 実データ表示中 / 'mock_fallback' = デモデータ表示中 / 'error' = fetch失敗 */
  dataSource:     'real' | 'mock_fallback' | 'error'
  /** dataSource が 'mock_fallback' / 'error' の場合の詳細メッセージ */
  errorMessage?:  string
}

const SESSION_KEY = 'bns_sheet_data_v22'
const CACHE_TTL_MS = 5 * 60 * 1000 // 5分

// ── モジュールレベルのキャッシュ・状態（全コンポーネント共有） ──
let cache: SheetData | null = null
let cacheExpiresAt = 0
/**
 * 進行中のfetch Promise。
 * 複数コンポーネントが同時にuseSheetData()を呼んでも
 * /api/sheets-data へのリクエストは1回だけになる。
 */
let pendingFetch: Promise<SheetData> | null = null

function isCacheValid(): boolean {
  return cache !== null && Date.now() < cacheExpiresAt
}

const FALLBACK: SheetData = {
  sellCases:      mockSellCases,
  buyCases:       mockBuyCases,
  monthlyStats:   mockMonthlyStats,
  inquirySummary: {},
  loaded:         false,
  dataSource:     'mock_fallback',
}

// sessionStorage に保存する際は fetchedAt を付加
type StoredSheetData = SheetData & { fetchedAt?: number }

function loadFromSession(): SheetData | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredSheetData
    if (!parsed.loaded) return null
    // TTLチェック: fetchedAt がない or 期限切れなら使わない
    if (!parsed.fetchedAt || Date.now() - parsed.fetchedAt > CACHE_TTL_MS) {
      sessionStorage.removeItem(SESSION_KEY)
      return null
    }
    return parsed
  } catch { return null }
}

function saveToSession(data: SheetData) {
  if (typeof window === 'undefined') return
  try {
    const stored: StoredSheetData = { ...data, fetchedAt: Date.now() }
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(stored))
  } catch {}
}

export function clearSheetCache() {
  cache = null
  cacheExpiresAt = 0
  if (typeof window !== 'undefined') {
    try { sessionStorage.removeItem(SESSION_KEY) } catch {}
  }
}

/** モック monthlyStats に実際の問い合わせ数をマージする */
function mergeInquiries(
  stats:   MonthlyStats[],
  inqMap:  Record<string, { newInquiries: number; closedSell: number; closedBuy: number }>,
): MonthlyStats[] {
  return stats.map(m => {
    const real = inqMap[m.month]
    if (!real) return m
    return {
      ...m,
      newInquiries: real.newInquiries > 0 ? real.newInquiries : m.newInquiries,
      closedSell:   real.closedSell   > 0 ? real.closedSell   : m.closedSell,
      closedBuy:    real.closedBuy    > 0 ? real.closedBuy    : m.closedBuy,
    }
  })
}

/**
 * /api/sheets-data を fetch して SheetData を返す。
 * - モジュールキャッシュが5分以内なら即座にキャッシュを返す（fetch不要）
 * - 既に進行中の fetch がある場合は同じ Promise を返す（重複排除）
 */
function startSheetFetch(): Promise<SheetData> {
  // ① モジュールキャッシュが有効なら fetch しない（SPA遷移の最適化）
  if (isCacheValid()) {
    const remainSec = Math.round((cacheExpiresAt - Date.now()) / 1000)
    console.log(`[useSheetData] モジュールキャッシュHIT（残り${remainSec}秒）→ APIリクエストなし`)
    return Promise.resolve(cache!)
  }

  // ② 同じ fetch が進行中なら使い回す（同一ページ内の複数コンポーネント対策）
  if (pendingFetch) {
    console.log('[useSheetData] 重複排除: 進行中のfetchを再利用（APIリクエストは発生しない）')
    return pendingFetch
  }

  // ③ 新規 fetch
  console.log('[useSheetData] /api/sheets-data へリクエスト開始 (#1)')

  pendingFetch = fetch('/api/sheets-data')
    .then(async r => {
      const cacheStatus = r.headers.get('X-Cache') ?? '不明'
      const sheetsReqs  = r.headers.get('X-Sheets-Requests') ?? '?'
      console.log(
        `[useSheetData] レスポンス受信: HTTP ${r.status} | X-Cache=${cacheStatus} | Sheets APIリクエスト数=${sheetsReqs}回`,
      )

      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      return r.json()
    })
    .then((json: {
      sellCases:     Record<string, string>[] | { error: string }
      buyCases:      Record<string, string>[] | { error: string }
      sellInquiries: Record<string, Record<string, number[]>>
      buyInquiries:  Record<string, Record<string, number[]>>
      salesSummary:  Record<string, string>[]
    }) => {
      // ─── DEBUG: APIレスポンス全体をコンソールに出力 ───
      console.group('[useSheetData] APIレスポンス詳細')
      console.log('sellCases:', json.sellCases)
      console.log('buyCases:', json.buyCases)
      console.log('sellInquiries:', json.sellInquiries)
      console.log('buyInquiries:', json.buyInquiries)
      console.log('salesSummary:', json.salesSummary)
      console.groupEnd()
      // ────────────────────────────────────────────────────

      const sellError = !Array.isArray(json.sellCases) && json.sellCases
        ? (json.sellCases as { error: string }).error : null
      const buyError = !Array.isArray(json.buyCases) && json.buyCases
        ? (json.buyCases as { error: string }).error : null

      if (sellError) console.warn('[useSheetData] sellCases エラー:', sellError)
      if (buyError)  console.warn('[useSheetData] buyCases エラー:', buyError)

      const sellArr = Array.isArray(json.sellCases) ? json.sellCases : []
      const buyArr  = Array.isArray(json.buyCases)  ? json.buyCases  : []

      console.log(`[useSheetData] 件数: 売却=${sellArr.length}件, 購入=${buyArr.length}件`)

      const sellFromApi = sellArr.length > 0
      const buyFromApi  = buyArr.length > 0
      const isRealData  = sellFromApi || buyFromApi

      let dataSource: SheetData['dataSource'] = isRealData ? 'real' : 'mock_fallback'
      let errorMessage: string | undefined

      if (!isRealData) {
        const reasons: string[] = []
        if (sellError) reasons.push(`売却: ${sellError}`)
        else           reasons.push('売却: 0件')
        if (buyError)  reasons.push(`購入: ${buyError}`)
        else           reasons.push('購入: 0件')
        errorMessage = reasons.join(' / ')
        console.warn('[useSheetData] 実データなし → デモデータ表示:', errorMessage)
      }

      const sells = sellFromApi ? sellArr.map((r, i) => mapSellCase(r, i)) : mockSellCases
      const buys  = buyFromApi  ? buyArr.map((r, i)  => mapBuyCase(r, i))  : mockBuyCases

      const inqMap = mapInquiryStats(json.sellInquiries ?? {}, json.buyInquiries ?? {})

      const salesRows = Array.isArray(json.salesSummary) ? json.salesSummary : []
      const realStats = salesRows.length > 0 ? mapSalesSummary(salesRows) : null
      const monthlyStats = realStats && realStats.length > 0
        ? mergeInquiries(realStats, inqMap)
        : mergeInquiries(mockMonthlyStats, inqMap)

      const result: SheetData = {
        sellCases:      sells,
        buyCases:       buys,
        monthlyStats,
        inquirySummary: inqMap,
        loaded:         true,
        dataSource,
        errorMessage,
      }

      // モジュールキャッシュに保存（TTL 5分）
      cache = result
      cacheExpiresAt = Date.now() + CACHE_TTL_MS
      console.log(`[useSheetData] モジュールキャッシュ保存（TTL: ${CACHE_TTL_MS / 1000}秒）`)

      saveToSession(result)
      return result
    })
    .catch((err): SheetData => {
      const message = err instanceof Error ? err.message : String(err)
      console.error('[useSheetData] fetch失敗:', message)
      clearSheetCache()
      return { ...FALLBACK, loaded: true, dataSource: 'error', errorMessage: message }
    })
    .finally(() => {
      pendingFetch = null
    })

  return pendingFetch
}

export function useSheetData(): SheetData {
  const [data, setData] = useState<SheetData>(() => {
    // 初期値: キャッシュ有効 → キャッシュ、なければ sessionStorage、なければ FALLBACK
    if (isCacheValid()) return cache!
    return loadFromSession() ?? FALLBACK
  })

  useEffect(() => {
    // キャッシュが有効ならAPIを呼ばずに表示を更新して終了
    if (isCacheValid()) {
      setData(cache!)
      return
    }

    // sessionStorage に有効データがあれば即時表示（ちらつき防止）
    const sessionData = loadFromSession()
    if (sessionData && !cache) {
      setData(sessionData)
    }

    // fetchを開始（キャッシュ有効なら内部で即座に返る）
    startSheetFetch().then(result => setData(result))
  }, [])

  return data
}
