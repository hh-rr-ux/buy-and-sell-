'use client'

/**
 * useSheetData
 *
 * /api/sheets-data からスプシデータを取得し、
 * SellCase[] / BuyCase[] にマッピングして返す。
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
}

const SESSION_KEY = 'bns_sheet_data_v10'

// ページ間キャッシュ（SPA遷移で再fetchしない）
let cache: SheetData | null = null

const FALLBACK: SheetData = {
  sellCases:      mockSellCases,
  buyCases:       mockBuyCases,
  monthlyStats:   mockMonthlyStats,
  inquirySummary: {},
  loaded:         false,
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
        if (!r.ok) throw new Error(`${r.status}`)
        return r.json()
      })
      .then((json: {
        sellCases:     Record<string, string>[] | { error: string }
        buyCases:      Record<string, string>[] | { error: string }
        sellInquiries: Record<string, Record<string, number[]>>
        buyInquiries:  Record<string, Record<string, number[]>>
        salesSummary:  Record<string, string>[]
      }) => {
        // エラーオブジェクトが返った場合はログ出力
        if (json.sellCases && !Array.isArray(json.sellCases)) {
          console.warn('[useSheetData] sellCases にエラー:', json.sellCases)
        }
        if (json.buyCases && !Array.isArray(json.buyCases)) {
          console.warn('[useSheetData] buyCases にエラー:', json.buyCases)
        }

        const sellArr = Array.isArray(json.sellCases) ? json.sellCases : []
        const buyArr  = Array.isArray(json.buyCases)  ? json.buyCases  : []

        const sells = sellArr.length > 0
          ? sellArr.map((r, i) => mapSellCase(r, i))
          : mockSellCases

        const buys = buyArr.length > 0
          ? buyArr.map((r, i) => mapBuyCase(r, i))
          : mockBuyCases

        console.log(`[useSheetData] 取得完了: 売却=${sellArr.length}件, 購入=${buyArr.length}件 (実データ: ${sellArr.length > 0 || buyArr.length > 0})`)

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
        }
        cache = result
        saveToSession(result)
        setData(result)
      })
      .catch((err) => {
        // 401 / エラー → sessionStorage をクリアして次回再fetchできるようにする
        console.error('[useSheetData] fetch失敗:', err)
        clearSheetCache()
        setData({ ...FALLBACK, loaded: true })
      })
  }, [])

  return data
}
