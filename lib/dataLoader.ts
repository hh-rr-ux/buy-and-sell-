/**
 * dataLoader.ts
 *
 * データソース:
 * 1. Google Sheets API
 *    - 案件管理シート (物件名, 進捗, 担当, 物件価格, 仲介手数料, 全体売上)
 *    - LINE問い合わせシート (日付, 問い合わせ数)
 *
 * 2. Chatwork API
 *    - 運用チャット (CHATWORK_ROOM_OPERATIONS): 事業進捗
 *    - HP,LINEチャット (CHATWORK_ROOM_HP_LINE): 専門家とのやりとり
 *    - 求人チャット (CHATWORK_ROOM_RECRUITMENT): 求人
 *    - 通知チャット (CHATWORK_ROOM_NOTIFICATION): LINE問い合わせ通知（自動転送）
 *    - メッセージチャット (CHATWORK_ROOM_CUSTOMER): お客様メッセージ転送
 *
 * 環境変数 (GitHub Secrets に設定):
 *   CHATWORK_API_TOKEN
 *   CHATWORK_ROOM_OPERATIONS
 *   CHATWORK_ROOM_HP_LINE
 *   CHATWORK_ROOM_RECRUITMENT
 *   CHATWORK_ROOM_NOTIFICATION
 *   CHATWORK_ROOM_CUSTOMER
 *   GOOGLE_SHEETS_API_KEY
 *   GOOGLE_SHEETS_ID
 *   GOOGLE_SHEETS_CASES_RANGE   (例: "案件管理!A2:F100")
 *   GOOGLE_SHEETS_LINE_RANGE    (例: "LINE問い合わせ!A2:B100")
 */

import {
  sellCases,
  buyCases,
  monthlyStats,
  recentActivities,
  staffStats,
  conversionFunnel,
  lineInquiries,
  chatworkRooms,
  chatworkMessages,
  type SellCase,
  type BuyCase,
  type MonthlyStats,
  type Case,
  type LineInquiry,
  type ChatworkRoom,
  type ChatworkMessage,
} from './mockData'
import { CHATWORK_API_BASE, CHATWORK_ROOMS, GOOGLE_SHEETS, GOOGLE_SHEETS_API_BASE } from './config'

export interface DashboardData {
  sellCases: SellCase[]
  buyCases: BuyCase[]
  monthlyStats: MonthlyStats[]
  recentActivities: typeof recentActivities
  staffStats: typeof staffStats
  conversionFunnel: typeof conversionFunnel
  lineInquiries: LineInquiry[]
  chatworkRooms: ChatworkRoom[]
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

export function calculateKPIs(
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

// ─────────────────────────────────────────────────────────────────────────────
// Google Sheets: 案件管理シート
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Google Sheets から案件一覧を取得する
 *
 * TODO: 以下の実装に置き換える
 *
 * const url = `${GOOGLE_SHEETS_API_BASE}/${GOOGLE_SHEETS.ID}/values/${encodeURIComponent(GOOGLE_SHEETS.CASES_RANGE)}?key=${GOOGLE_SHEETS.API_KEY}`
 * const res = await fetch(url)
 * const json = await res.json()
 * // json.values は string[][] で返る
 * // 列順: 物件名(0), 進捗(1), 担当(2), 物件価格(3), 仲介手数料(4), 全体売上(5)
 * return json.values.map((row: string[], i: number) => ({
 *   id: `SHEET-${i + 1}`,
 *   propertyName:  row[0] || '',
 *   type:          row[1]?.includes('売') ? 'sell' : 'buy',
 *   stage:         row[1] || '',
 *   staff:         row[2] || '',
 *   propertyPrice: Number(row[3]?.replace(/,/g, '')) || 0,
 *   brokerageFee:  Number(row[4]?.replace(/,/g, '')) || 0,
 * }))
 */
export async function loadCases(): Promise<Case[]> {
  // TODO: Google Sheets API から取得（上記コメント参照）
  // 現在はモックデータを返す
  return [
    ...sellCases.map(c => ({
      id: c.id,
      propertyName: c.propertyName,
      type: 'sell' as const,
      stage: c.stage,
      staff: c.staff,
      propertyPrice: c.askingPrice,
      brokerageFee: c.brokerageFee,
    })),
    ...buyCases.map(c => ({
      id: c.id,
      propertyName: c.propertyName,
      type: 'buy' as const,
      stage: c.stage,
      staff: c.staff,
      propertyPrice: c.budget,
      brokerageFee: c.brokerageFee,
    })),
  ]
}

// ─────────────────────────────────────────────────────────────────────────────
// Google Sheets: LINE問い合わせシート
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Google Sheets から LINE問い合わせ数を取得する
 *
 * TODO: 以下の実装に置き換える
 *
 * const url = `${GOOGLE_SHEETS_API_BASE}/${GOOGLE_SHEETS.ID}/values/${encodeURIComponent(GOOGLE_SHEETS.LINE_RANGE)}?key=${GOOGLE_SHEETS.API_KEY}`
 * const res = await fetch(url)
 * const json = await res.json()
 * // json.values は string[][] で返る
 * // 列順: 日付(0), 問い合わせ数(1)
 * return json.values.map((row: string[]) => ({
 *   date:  row[0] || '',   // 例: "2026-03-31" または "2026/03/31"
 *   count: Number(row[1]) || 0,
 * }))
 */
export async function loadLineInquiries(): Promise<LineInquiry[]> {
  // TODO: Google Sheets API から取得（上記コメント参照）
  // 現在はモックデータを返す
  return lineInquiries
}

// ─────────────────────────────────────────────────────────────────────────────
// Chatwork API: ルーム一覧
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Chatwork API から各ルームの概要を取得する
 *
 * TODO: 以下の実装に置き換える
 *
 * const token = process.env.CHATWORK_API_TOKEN
 * const headers = { 'X-ChatWorkToken': token }
 * const roomIds = [
 *   { id: CHATWORK_ROOMS.OPERATIONS,   type: 'operations',   name: '運用チャット' },
 *   { id: CHATWORK_ROOMS.HP_LINE,      type: 'hp_line',      name: 'HP,LINEチャット' },
 *   { id: CHATWORK_ROOMS.RECRUITMENT,  type: 'recruitment',  name: '求人チャット' },
 *   { id: CHATWORK_ROOMS.NOTIFICATION, type: 'notification', name: '通知チャット' },
 *   { id: CHATWORK_ROOMS.CUSTOMER,     type: 'customer',     name: 'メッセージチャット' },
 * ]
 * const results = await Promise.all(roomIds.map(async (room) => {
 *   const res = await fetch(`${CHATWORK_API_BASE}/rooms/${room.id}`, { headers })
 *   const data = await res.json()
 *   const msgRes = await fetch(`${CHATWORK_API_BASE}/rooms/${room.id}/messages?force=1`, { headers })
 *   const messages = await msgRes.json()
 *   const latest = Array.isArray(messages) ? messages[messages.length - 1] : null
 *   return {
 *     roomId: room.id,
 *     name: room.name,
 *     type: room.type,
 *     description: data.description || '',
 *     unreadCount: data.unread_num || 0,
 *     latestMessage: latest?.body || '',
 *     latestTime: latest ? new Date(latest.send_time * 1000).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) : '',
 *   }
 * }))
 * return results
 */
export async function loadChatworkRooms(): Promise<ChatworkRoom[]> {
  // TODO: Chatwork API から取得（上記コメント参照）
  // 現在はモックデータを返す
  return chatworkRooms
}

// ─────────────────────────────────────────────────────────────────────────────
// Chatwork API: メッセージ取得
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 指定ルームの最新メッセージを取得する
 *
 * TODO: 以下の実装に置き換える
 *
 * const token = process.env.CHATWORK_API_TOKEN
 * const res = await fetch(`${CHATWORK_API_BASE}/rooms/${roomId}/messages?force=1`, {
 *   headers: { 'X-ChatWorkToken': token }
 * })
 * const messages = await res.json()
 * // 最新N件を返す（APIは最大40件返す）
 * const roomTypeMap: Record<string, ChatworkMessage['roomType']> = {
 *   [CHATWORK_ROOMS.OPERATIONS]:   'operations',
 *   [CHATWORK_ROOMS.HP_LINE]:      'hp_line',
 *   [CHATWORK_ROOMS.RECRUITMENT]:  'recruitment',
 *   [CHATWORK_ROOMS.NOTIFICATION]: 'notification',
 *   [CHATWORK_ROOMS.CUSTOMER]:     'customer',
 * }
 * return messages.slice(-limit).map((m: any) => ({
 *   messageId: String(m.message_id),
 *   roomId:    String(roomId),
 *   roomName:  '',  // 別途 loadChatworkRooms() で補完する
 *   roomType:  roomTypeMap[roomId] || 'operations',
 *   account:   { name: m.account?.name || '' },
 *   body:      m.body || '',
 *   sendTime:  m.send_time || 0,
 * }))
 */
export async function loadLatestMessages(roomId: string, limit: number = 10): Promise<ChatworkMessage[]> {
  // TODO: Chatwork API から取得（上記コメント参照）
  // 現在はモックデータを返す（指定ルームIDに一致するもの優先）
  const filtered = chatworkMessages.filter(m => m.roomId === roomId)
  const all = filtered.length > 0 ? filtered : chatworkMessages
  return all.slice(0, limit)
}

// ─────────────────────────────────────────────────────────────────────────────
// ダッシュボード統合データ
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ダッシュボード用データを取得する
 */
export async function loadDashboardData(): Promise<DashboardData> {
  const [rooms, inquiries] = await Promise.all([
    loadChatworkRooms(),
    loadLineInquiries(),
  ])

  return {
    sellCases,
    buyCases,
    monthlyStats,
    recentActivities,
    staffStats,
    conversionFunnel,
    lineInquiries: inquiries,
    chatworkRooms: rooms,
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
