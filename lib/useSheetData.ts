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
 * キャッシュ優先度:
 *   1. モジュールキャッシュ（SPA遷移で再fetchしない）
 *   2. sessionStorage（リロード後も即時表示）
 *   3. フォールバック表示しつつバックグラウンドでfetch
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

// セッションキーを上げてキャッシュ互換を切る
const SESSION_KEY = 'bns_sheet_data_v13'

// ページ間キャッシュ（SPA遷移で再fetchしない）
let cache: SheetData | null = null

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

export function useSheetData(): SheetData {
  // モジュールキャッシュ → sessionStorage → FALLBACK の順で初期値を決定
  const [data, setData] = useState<SheetData>(() => {
    return cache ?? loadFromSession() ?? FALLBACK
  })

  useEffect(() => {
    // sessionStorage に有効データがあれば即時表示（ちらつき防止）
    const sessionData = loadFromSession()
    if (sessionData && !cache) {
      setData(sessionData)
    }

    // 常にAPIから最新データをfetch
    fetch('/api/sheets-data')
      .then(r => {
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
        console.group('[useSheetData] APIレスポンス')
        console.log('sellCases:', json.sellCases)
        console.log('buyCases:', json.buyCases)
        console.log('sellInquiries:', json.sellInquiries)
        console.log('buyInquiries:', json.buyInquiries)
        console.log('salesSummary:', json.salesSummary)
        console.groupEnd()
        // ──────────────────────────────────────────────────

        // エラーオブジェクトが返った場合の詳細ログ
        const sellError = !Array.isArray(json.sellCases) && json.sellCases
          ? (json.sellCases as { error: string }).error
          : null
        const buyError = !Array.isArray(json.buyCases) && json.buyCases
          ? (json.buyCases as { error: string }).error
          : null

        if (sellError) console.warn('[useSheetData] sellCases エラー:', sellError)
        if (buyError)  console.warn('[useSheetData] buyCases エラー:', buyError)

        const sellArr = Array.isArray(json.sellCases) ? json.sellCases : []
        const buyArr  = Array.isArray(json.buyCases)  ? json.buyCases  : []

        console.log(`[useSheetData] 件数: 売却=${sellArr.length}件, 購入=${buyArr.length}件`)

        // データソース判定
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

        const sells = sellFromApi
          ? sellArr.map((r, i) => mapSellCase(r, i))
          : mockSellCases

        const buys = buyFromApi
          ? buyArr.map((r, i) => mapBuyCase(r, i))
          : mockBuyCases

        const inqMap = mapInquiryStats(
          json.sellInquiries ?? {},
          json.buyInquiries  ?? {},
        )

        // 売上集計タブがあればそれを使い、なければモックにinqMapをマージ
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
        setData(result)
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : String(err)
        console.error('[useSheetData] fetch失敗:', message)
        clearSheetCache()
        setData({ ...FALLBACK, loaded: true, dataSource: 'error', errorMessage: message })
      })
  }, [])

  return data
}
