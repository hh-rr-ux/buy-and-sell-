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
 * 1. モジュールキャッシュ: SPA遷移では再fetchしない
 * 2. sessionStorage: リロード後も前回データを即時表示
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

const SESSION_KEY = 'bns_sheet_data_v16'

// ── モジュールレベルのキャッシュ・状態（全コンポーネント共有） ──
let cache: SheetData | null = null
/**
 * 進行中のfetch Promise。
 * 複数コンポーネントが同時にuseSheetData()を呼んでも
 * /api/sheets-data へのリクエストは1回だけになる。
 */
let pendingFetch: Promise<SheetData> | null = null

const FALLBACK: SheetData = {
  sellCases:      mockSellCases,
  buyCases:       mockBuyCases,
  monthlyStats:   mockMonthlyStats,
  inquirySummary: {},
  loaded:         false,
  dataSource:     'mock_fallback',
}

function loadFromSession(): SheetData | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as SheetData
    return parsed.loaded ? parsed : null
  } catch { return null }
}

function saveToSession(data: SheetData) {
  if (typeof window === 'undefined') return
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(data)) } catch {}
}

export function clearSheetCache() {
  cache = null
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
 * 既に進行中の fetch がある場合は同じ Promise を返す（重複排除）。
 */
function startSheetFetch(): Promise<SheetData> {
  if (pendingFetch) {
    console.log('[useSheetData] 重複排除: 進行中のfetchを再利用（APIリクエストは発生しない）')
    return pendingFetch
  }

  console.log('[useSheetData] /api/sheets-data へリクエスト開始 (#1)')

  pendingFetch = fetch('/api/sheets-data')
    .then(async r => {
      // レスポンスヘッダーでキャッシュ状況を確認
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
      cache = result
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
      // Promise完了後はクリア（次回ページロード時に再fetchできるように）
      pendingFetch = null
      console.log('[useSheetData] fetch完了（pendingFetchをクリア）')
    })

  return pendingFetch
}

export function useSheetData(): SheetData {
  const [data, setData] = useState<SheetData>(() => {
    return cache ?? loadFromSession() ?? FALLBACK
  })

  useEffect(() => {
    // sessionStorage に有効データがあれば即時表示（ちらつき防止）
    const sessionData = loadFromSession()
    if (sessionData && !cache) {
      setData(sessionData)
    }

    // 重複排除fetchを使用（複数コンポーネントでmountされても1回しかAPIを叩かない）
    startSheetFetch().then(result => setData(result))
  }, [])

  return data
}
