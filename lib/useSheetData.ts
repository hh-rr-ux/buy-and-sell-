'use client'

import { useState, useEffect } from 'react'
import {
  sellCases as mockSellCases,
  buyCases  as mockBuyCases,
  monthlyStats as mockMonthlyStats,
  type SellCase, type BuyCase, type MonthlyStats,
} from './mockData'
import { mapSellCase, mapBuyCase, mapInquiryStats, mapSalesSummary, mapPaymentRecords } from './sheetMapper'

export interface SheetData {
  sellCases:        SellCase[]
  buyCases:         BuyCase[]
  monthlyStats:     MonthlyStats[]
  inquirySummary:   Record<string, { newInquiries: number; closedSell: number; closedBuy: number }>
  confirmedRevenue: number                   // 入金確認タブの今月確定売上
  paymentByMonth:   Record<string, number>   // 入金確認タブの月別集計（先月比計算用）
  loadedAt:         string                   // データ取得日時 "2026/04/05 15:30"
  loaded:           boolean
  dataSource:       'real' | 'mock_fallback' | 'error'
  errorMessage?:    string
}

// ── キャッシュ（モジュールスコープ・全ページ共有） ──
let cache:          SheetData | null = null
let cacheTimestamp  = 0
const CACHE_TTL     = 300_000 // 5分（ms）

const FALLBACK: SheetData = {
  sellCases:        mockSellCases,
  buyCases:         mockBuyCases,
  monthlyStats:     mockMonthlyStats,
  inquirySummary:   {},
  confirmedRevenue: 0,
  paymentByMonth:   {},
  loadedAt:         '',
  loaded:           false,
  dataSource:       'mock_fallback',
}

export function clearSheetCache() {
  cache          = null
  cacheTimestamp = 0
}

function mergeInquiries(
  stats:  MonthlyStats[],
  inqMap: Record<string, { newInquiries: number; closedSell: number; closedBuy: number }>,
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

function formatLoadedAt(ts: number): string {
  return new Date(ts).toLocaleString('ja-JP', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  }).replace(/\//g, '/')
}

export function useSheetData(): SheetData {
  const [data, setData] = useState<SheetData>(FALLBACK)

  useEffect(() => {
    // ① キャッシュが有効なら API を呼ばない
    if (cache && Date.now() - cacheTimestamp < CACHE_TTL) {
      const remaining = Math.round((CACHE_TTL - (Date.now() - cacheTimestamp)) / 1000)
      console.log(`[useSheetData] キャッシュHIT（残り${remaining}秒）`)
      setData(cache)
      return
    }

    // ② キャッシュ無効 → API fetch
    console.log('[useSheetData] リクエスト開始')

    fetch('/api/sheets-data')
      .then(r => {
        const cacheStatus = r.headers.get('X-Cache') ?? '不明'
        const sheetsReqs  = r.headers.get('X-Sheets-Requests') ?? '?'
        console.log(`[useSheetData] レスポンス: HTTP ${r.status} | X-Cache=${cacheStatus} | Sheets API=${sheetsReqs}回`)
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((json: {
        sellCases:      Record<string, string>[] | { error: string }
        buyCases:       Record<string, string>[] | { error: string }
        sellInquiries:  Record<string, Record<string, number[]>>
        buyInquiries:   Record<string, Record<string, number[]>>
        salesSummary:   Record<string, string>[]
        paymentRecords: Record<string, string>[]
      }) => {
        console.group('[useSheetData] APIレスポンス詳細')
        console.log('sellCases:', json.sellCases)
        console.log('buyCases:', json.buyCases)
        console.log('sellInquiries:', json.sellInquiries)
        console.log('buyInquiries:', json.buyInquiries)
        console.log('salesSummary:', json.salesSummary)
        console.log('paymentRecords:', json.paymentRecords)
        console.groupEnd()

        const sellArr = Array.isArray(json.sellCases) ? json.sellCases : []
        const buyArr  = Array.isArray(json.buyCases)  ? json.buyCases  : []

        const sellError = !Array.isArray(json.sellCases) && json.sellCases
          ? (json.sellCases as { error: string }).error : null
        const buyError  = !Array.isArray(json.buyCases) && json.buyCases
          ? (json.buyCases as { error: string }).error : null

        if (sellError) console.warn('[useSheetData] sellCases エラー:', sellError)
        if (buyError)  console.warn('[useSheetData] buyCases エラー:', buyError)

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

        // 入金確認タブ → 今月の確定売上
        const paymentRows = Array.isArray(json.paymentRecords) ? json.paymentRecords : []
        const paymentByMonth = mapPaymentRecords(paymentRows)

        // JST (UTC+9) 基準で今月・先月キーを生成
        const jstNow      = new Date(Date.now() + 9 * 60 * 60 * 1000)
        const thisMonth   = jstNow.toISOString().slice(0, 7)  // "2026-04"
        const jstLastMonth = new Date(jstNow)
        jstLastMonth.setMonth(jstLastMonth.getMonth() - 1)
        const lastMonth   = jstLastMonth.toISOString().slice(0, 7)  // "2026-03"

        const confirmedRevenue = paymentByMonth[thisMonth] ?? 0
        const lastMonthRevenue = paymentByMonth[lastMonth] ?? 0

        console.log(`[useSheetData] 入金確認 判定キー: 今月=${thisMonth} 先月=${lastMonth}`)
        console.log(`[useSheetData] 入金確認 今月=${confirmedRevenue.toLocaleString()}円 先月=${lastMonthRevenue.toLocaleString()}円`)
        console.log('[useSheetData] 入金確認 paymentByMonth全月:', paymentByMonth)

        const now = Date.now()
        const result: SheetData = {
          sellCases: sells, buyCases: buys, monthlyStats,
          inquirySummary: inqMap, confirmedRevenue, paymentByMonth,
          loadedAt: formatLoadedAt(now),
          loaded: true, dataSource, errorMessage,
        }

        // ✅ 成功時のみキャッシュを更新
        cache          = result
        cacheTimestamp = now
        console.log(`[useSheetData] キャッシュ保存 TTL:${CACHE_TTL / 1000}秒`)
        setData(result)
      })
      .catch(err => {
        const message = err instanceof Error ? err.message : String(err)
        console.error('[useSheetData] fetch失敗:', message)
        // エラー時はキャッシュをクリアしない
        if (cache) {
          console.log('[useSheetData] エラー → 既存キャッシュを継続使用')
          setData(cache)
        } else {
          setData({ ...FALLBACK, loaded: true, dataSource: 'error', errorMessage: message })
        }
      })
  }, [])

  return data
}
