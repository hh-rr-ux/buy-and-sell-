'use client'

/**
 * useSheetData
 *
 * /api/sheets-data（管理者セッション必須）からスプシデータを取得し、
 * SellCase[] / BuyCase[] にマッピングして返す。
 *
 * - セッション内でキャッシュ（1回だけfetch）
 * - 401 / エラー時はモックデータにフォールバック
 */

import { useState, useEffect } from 'react'
import {
  sellCases as mockSellCases,
  buyCases  as mockBuyCases,
  monthlyStats as mockMonthlyStats,
  type SellCase, type BuyCase, type MonthlyStats,
} from './mockData'
import { mapSellCase, mapBuyCase, mapInquiryStats } from './sheetMapper'

export interface SheetData {
  sellCases:      SellCase[]
  buyCases:       BuyCase[]
  monthlyStats:   MonthlyStats[]
  inquirySummary: Record<string, { newInquiries: number; closedSell: number; closedBuy: number }>
  loaded:         boolean
}

// ページ間でキャッシュ（SPA遷移で再fetchしない）
let cache: SheetData | null = null

const FALLBACK: SheetData = {
  sellCases:      mockSellCases,
  buyCases:       mockBuyCases,
  monthlyStats:   mockMonthlyStats,
  inquirySummary: {},
  loaded:         false,
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
  const [data, setData] = useState<SheetData>(cache ?? FALLBACK)

  useEffect(() => {
    if (cache) { setData(cache); return }

    fetch('/api/sheets-data')
      .then(r => {
        if (!r.ok) throw new Error(`${r.status}`)
        return r.json()
      })
      .then((json: {
        sellCases:     Record<string, string>[]
        buyCases:      Record<string, string>[]
        sellInquiries: Record<string, Record<string, number[]>>
        buyInquiries:  Record<string, Record<string, number[]>>
      }) => {
        const sells = Array.isArray(json.sellCases) && json.sellCases.length > 0
          ? json.sellCases.map((r, i) => mapSellCase(r, i))
          : mockSellCases

        const buys = Array.isArray(json.buyCases) && json.buyCases.length > 0
          ? json.buyCases.map((r, i) => mapBuyCase(r, i))
          : mockBuyCases

        const inqMap = mapInquiryStats(
          json.sellInquiries ?? {},
          json.buyInquiries  ?? {},
        )

        const result: SheetData = {
          sellCases:      sells,
          buyCases:       buys,
          monthlyStats:   mergeInquiries(mockMonthlyStats, inqMap),
          inquirySummary: inqMap,
          loaded:         true,
        }
        cache = result
        setData(result)
      })
      .catch(() => {
        // 401 / ネットワークエラー → モックのまま loaded=true にする
        const fallback: SheetData = { ...FALLBACK, loaded: true }
        cache = fallback
        setData(fallback)
      })
  }, [])

  return data
}
