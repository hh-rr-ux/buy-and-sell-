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
  confirmedRevenue: number                   // 今月の全体売上（salesSummary）
  sellRevenue:      number                   // 今月の売却分売上
  buyRevenue:       number                   // 今月の購入分売上
  paymentByMonth:   Record<string, number>   // 月別売上（先月比計算用）
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
  sellRevenue:      0,
  buyRevenue:       0,
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

        // ── salesSummary 構造確認ログ（行0〜9の全値）──
        console.log(`[salesSummary] 行数=${salesRows.length} 列名=${JSON.stringify(salesRows[0] ? Object.keys(salesRows[0]) : [])}`)
        salesRows.slice(0, 10).forEach((row, i) =>
          console.log(`[salesSummary] 行${i}:`, JSON.stringify(row))
        )

        const realStats = salesRows.length > 0 ? mapSalesSummary(salesRows) : null
        const monthlyStats = realStats && realStats.length > 0
          ? mergeInquiries(realStats, inqMap)
          : mergeInquiries(mockMonthlyStats, inqMap)

        // 入金確認タブ → 今月の確定売上
        const paymentRows = Array.isArray(json.paymentRecords) ? json.paymentRecords : []
        console.log(`[paymentRecords] 配列=${Array.isArray(json.paymentRecords)} 行数=${paymentRows.length}`)
        if (paymentRows.length > 0) console.log('[paymentRecords] 行0:', JSON.stringify(paymentRows[0]))
        const paymentByMonth = mapPaymentRecords(paymentRows)

        // JST (UTC+9) 基準で今月・先月キーを生成
        const jstNow       = new Date(Date.now() + 9 * 60 * 60 * 1000)
        const thisMonth    = jstNow.toISOString().slice(0, 7)  // "2026-04"
        const jstLastMonth = new Date(jstNow)
        jstLastMonth.setMonth(jstLastMonth.getMonth() - 1)
        const lastMonth    = jstLastMonth.toISOString().slice(0, 7)  // "2026-03"

        // ── salesSummary 固定インデックスで今月・先月を特定 ──
        // ユーザー確認済み: salesRows[5] = 2026年4月（全体発生月 = 5,593,400）
        const SUMMARY_BASE_IDX   = 5   // 2026年4月のインデックス
        const SUMMARY_BASE_YEAR  = 2026
        const SUMMARY_BASE_MONTH = 4
        const calcSalesRowIdx = (year: number, month: number): number =>
          SUMMARY_BASE_IDX + (year - SUMMARY_BASE_YEAR) * 12 + (month - SUMMARY_BASE_MONTH)

        const jstYear       = parseInt(thisMonth.slice(0, 4))
        const jstMonthNum   = parseInt(thisMonth.slice(5, 7))
        const jstLastYear   = parseInt(lastMonth.slice(0, 4))
        const jstLastMonthN = parseInt(lastMonth.slice(5, 7))
        const thisRowIdx    = calcSalesRowIdx(jstYear, jstMonthNum)
        const lastRowIdx    = calcSalesRowIdx(jstLastYear, jstLastMonthN)
        const thisRow       = salesRows[thisRowIdx]
        const lastRow       = salesRows[lastRowIdx]

        const parseSalesRev = (row: Record<string, string> | undefined, ...cols: string[]): number => {
          if (!row) return 0
          for (const col of cols) {
            const v = parseFloat((row[col] ?? '').replace(/,/g, ''))
            if (!isNaN(v) && v > 0) return Math.floor(v)
          }
          return 0
        }
        const salesThisMonth = parseSalesRev(thisRow, '↓【全体】発生月で集計', '↓【全体】売上対象月で集計')
        const salesLastMonth = parseSalesRev(lastRow, '↓【全体】発生月で集計', '↓【全体】売上対象月で集計')
        const salesSellMonth = parseSalesRev(thisRow, '↓【売却】発生月で集計', '↓【売却】売上対象月で集計')
        const salesBuyMonth  = parseSalesRev(thisRow, '↓【購入】発生月で集計', '↓【購入】売上対象月で集計')

        console.log(`[salesSummary] idx=${thisRowIdx} 全体=${salesThisMonth.toLocaleString()} 売却=${salesSellMonth.toLocaleString()} 購入=${salesBuyMonth.toLocaleString()}円`)
        console.log(`[salesSummary] 先月idx=${lastRowIdx} 全体=${salesLastMonth.toLocaleString()}円`)

        // paymentByMonth に salesSummary データを補完
        if (salesThisMonth > 0 && !paymentByMonth[thisMonth]) paymentByMonth[thisMonth] = salesThisMonth
        if (salesLastMonth > 0 && !paymentByMonth[lastMonth]) paymentByMonth[lastMonth] = salesLastMonth

        const confirmedRevenue = paymentByMonth[thisMonth] ?? 0
        const sellRevenue      = salesSellMonth
        const buyRevenue       = salesBuyMonth

        console.log(`[useSheetData] 今月の売上（確定）=${confirmedRevenue.toLocaleString()}円（売却=${sellRevenue.toLocaleString()} 購入=${buyRevenue.toLocaleString()}）`)

        const now = Date.now()
        const result: SheetData = {
          sellCases: sells, buyCases: buys, monthlyStats,
          inquirySummary: inqMap, confirmedRevenue, sellRevenue, buyRevenue, paymentByMonth,
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
