/**
 * dataLoader.ts
 *
 * データ読み込みモジュール
 * 現在はモックデータを返しますが、将来的に以下のAPIに置き換える予定:
 * - Chatwork API: 問い合わせ・活動ログの取得
 * - Google Sheets API: 案件データの取得・更新
 */

import {
  sellCases,
  buyCases,
  monthlyStats,
  recentActivities,
  staffStats,
  conversionFunnel,
  type SellCase,
  type BuyCase,
  type MonthlyStats,
} from './mockData'

// TODO: 環境変数に以下を設定してください
// CHATWORK_API_TOKEN=your_chatwork_api_token
// GOOGLE_SHEETS_API_KEY=your_google_sheets_api_key
// GOOGLE_SHEETS_ID=your_spreadsheet_id

export interface DashboardData {
  sellCases: SellCase[]
  buyCases: BuyCase[]
  monthlyStats: MonthlyStats[]
  recentActivities: typeof recentActivities
  staffStats: typeof staffStats
  conversionFunnel: typeof conversionFunnel
  kpis: KPIData
}

export interface KPIData {
  monthlyClosedDeals: number
  monthlyRevenue: number
  activeCases: number
  monthlyInquiries: number
  conversionRate: number
  avgDealDays: number
  closedDealsTrend: number
  revenueTrend: number
  activeCasesTrend: number
  inquiriesTrend: number
}

function calculateKPIs(
  sells: SellCase[],
  buys: BuyCase[],
  stats: MonthlyStats[]
): KPIData {
  const currentMonth = stats[stats.length - 1]
  const prevMonth = stats[stats.length - 2]

  const monthlyClosedDeals =
    currentMonth.closedSell + currentMonth.closedBuy
  const prevMonthClosedDeals = prevMonth.closedSell + prevMonth.closedBuy

  const activeCases = sells.filter((c) => c.stage !== '決済').length +
    buys.filter((c) => c.stage !== '決済').length

  const allDays = [
    ...sells.map((c) => {
      const start = new Date(c.startDate)
      const now = new Date('2026-03-31')
      return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    }),
    ...buys.map((c) => {
      const start = new Date(c.startDate)
      const now = new Date('2026-03-31')
      return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    }),
  ]
  const avgDealDays = Math.floor(
    allDays.reduce((sum, d) => sum + d, 0) / allDays.length
  )

  const conversionRate = Math.round(
    ((monthlyClosedDeals / currentMonth.newInquiries) * 100)
  )

  const closedDealsTrend = prevMonthClosedDeals > 0
    ? Math.round(((monthlyClosedDeals - prevMonthClosedDeals) / prevMonthClosedDeals) * 100)
    : 0

  const revenueTrend = prevMonth.revenue > 0
    ? Math.round(((currentMonth.revenue - prevMonth.revenue) / prevMonth.revenue) * 100)
    : 0

  const prevActiveCases = 13
  const activeCasesTrend = Math.round(((activeCases - prevActiveCases) / prevActiveCases) * 100)

  const inquiriesTrend = prevMonth.newInquiries > 0
    ? Math.round(
      ((currentMonth.newInquiries - prevMonth.newInquiries) / prevMonth.newInquiries) * 100
    )
    : 0

  return {
    monthlyClosedDeals,
    monthlyRevenue: currentMonth.revenue,
    activeCases,
    monthlyInquiries: currentMonth.newInquiries,
    conversionRate,
    avgDealDays,
    closedDealsTrend,
    revenueTrend,
    activeCasesTrend,
    inquiriesTrend,
  }
}

/**
 * ダッシュボード用データを取得する
 *
 * TODO: モックデータの代わりにAPIから取得する実装に置き換える
 * 例:
 *   const response = await fetch(`https://api.chatwork.com/v2/rooms/${ROOM_ID}/messages`, {
 *     headers: { 'X-ChatWorkToken': process.env.CHATWORK_API_TOKEN }
 *   })
 *   const messages = await response.json()
 *   // メッセージをパースして案件データに変換する処理
 */
export async function loadDashboardData(): Promise<DashboardData> {
  // 将来的にはここでAPIを呼び出す
  return {
    sellCases,
    buyCases,
    monthlyStats,
    recentActivities,
    staffStats,
    conversionFunnel,
    kpis: calculateKPIs(sellCases, buyCases, monthlyStats),
  }
}

export async function loadSellCases(): Promise<SellCase[]> {
  // TODO: Google Sheets APIから売却案件を取得
  return sellCases
}

export async function loadBuyCases(): Promise<BuyCase[]> {
  // TODO: Google Sheets APIから購入案件を取得
  return buyCases
}

export { sellCases, buyCases, monthlyStats, recentActivities, staffStats, conversionFunnel }
export { calculateKPIs }
