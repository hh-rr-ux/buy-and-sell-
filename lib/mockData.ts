export type SellStage =
  | '問い合わせ'
  | '査定'
  | '媒介契約'
  | '販売活動'
  | '売買契約'
  | '決済'
  | '相談終了'  // スプシから取得するが表示はカウントのみ

export type BuyStage =
  | '問い合わせ'
  | '内見'
  | '購入申し込み'
  | '売買契約'
  | 'ローン審査'
  | '決済'
  | '相談終了'  // スプシから取得するが表示はカウントのみ

export type Staff = '鈴木' | '田中' | '佐藤' | '山田' | '伊藤'

export interface SellCase {
  id: string
  clientName: string
  propertyName: string   // 物件名（スプシ連携時はシートの「物件名」列を使用）
  propertyAddress: string
  propertyType: string
  prefecture: string     // 都道府県（スプシ連携時はシートから取得）
  askingPrice: number      // 販売価格（円）
  contractPrice?: number   // 成約価格（円）— シートの「成約価格」列（シート連携時に設定）
  assessmentPrice?: number // 査定価格（円）— シートの「査定価格」列（シート連携時に設定）
  brokerageFee: number    // 仲介手数料（スプシから直接取得）
  stage: SellStage
  staff: Staff
  startDate: string
  lastContactDate: string
  notes: string
  daysInStage: number
  counterpartyBroker: string  // 購入側の仲介業者（両手の場合は「リベ」、未定は「—」）
}

export interface BuyCase {
  id: string
  clientName: string
  propertyName: string   // 物件名（スプシ連携時はシートの「物件名」列を使用）
  desiredArea: string
  propertyType: string
  prefecture: string     // 都道府県（スプシ連携時はシートから取得）
  budget: number         // 買付価格（円）
  contractPrice: number  // 成約価格（円）— シートの「成約価格」列
  brokerageFee: number   // 仲介手数料（スプシから直接取得）
  stage: BuyStage
  staff: Staff
  startDate: string
  lastContactDate: string
  notes: string
  daysInStage: number
  counterpartyBroker: string  // 売却側の仲介業者（両手の場合は「リベ」、未定は「—」）
}

export interface MonthlyStats {
  month: string
  closedSell: number
  closedBuy: number
  newInquiries: number
  revenue: number
  totalRevenue: number   // 全体売上（スプシ「全体売上」列）
}

// ── 案件管理シート対応インターフェース ────────────────────────────────
// スプレッドシート列: 物件名, 進捗, 担当, 物件価格, 仲介手数料, 全体売上
export interface Case {
  id: string
  propertyName: string     // 物件名
  type: 'sell' | 'buy'    // 売却 or 購入
  stage: string            // 進捗
  staff: string            // 担当
  propertyPrice: number    // 物件価格
  brokerageFee: number     // 仲介手数料（スプシから直接取得）
}

// ── LINE問い合わせシート対応インターフェース ──────────────────────────
// スプレッドシート列: 日付, 問い合わせ数
export interface LineInquiry {
  date: string   // YYYY-MM-DD
  count: number  // 問い合わせ数（公式LINEからの問い合わせ）
}

// ── Google Calendar イベント ──────────────────────────────────────────
// Google Calendar API v3 の events.list レスポンスに対応
export type CalendarEventType =
  | '査定'       // 物件査定
  | '内見'       // 物件内見
  | '契約'       // 各種契約（媒介・売買）
  | '決済'       // 決済
  | '打ち合わせ'  // 社内・顧客との打ち合わせ
  | 'その他'

export interface CalendarEvent {
  id: string
  title: string           // Google Calendar の summary
  eventType: CalendarEventType
  start: string           // ISO8601 (YYYY-MM-DDTHH:mm:ss+09:00)
  end: string             // ISO8601
  allDay: boolean
  caseId?: string         // 紐づく案件ID（売却:S000 / 購入:B000）
  clientName?: string     // お客様名
  staff: Staff
  location?: string
  description?: string    // Google Calendar の description
}

// ── Chatwork メッセージ ───────────────────────────────────────────────
export interface ChatworkMessage {
  messageId: string
  roomId: string
  roomName: string
  roomType: 'operations' | 'hp_line' | 'recruitment' | 'notification' | 'customer'
  account: { name: string }
  body: string
  sendTime: number  // unix timestamp
}

// ── Chatwork ルームサマリー ───────────────────────────────────────────
export interface ChatworkRoom {
  roomId: string
  name: string
  type: 'operations' | 'hp_line' | 'recruitment' | 'notification' | 'customer'
  description: string
  unreadCount: number
  latestMessage: string
  latestTime: string
}

export const SELL_STAGES: SellStage[] = [
  '問い合わせ', '査定', '媒介契約', '販売活動', '売買契約', '決済',
]

export const BUY_STAGES: BuyStage[] = [
  '問い合わせ', '内見', '購入申し込み', '売買契約', 'ローン審査', '決済',
]

export const STAFF_LIST: Staff[] = ['鈴木', '田中', '佐藤', '山田', '伊藤']

// ── エリア設定 ────────────────────────────────────────────────────────────
export const SELL_AREAS: Record<string, string[]> = {
  '関東': ['東京都', '神奈川県', '埼玉県', '千葉県'],
  '東海': ['愛知県'],
  '関西': ['大阪府', '京都府', '兵庫県'],
}

export const BUY_AREAS: Record<string, string[]> = {
  '関東': ['東京都', '千葉県'],
  '関西': ['大阪府'],
}

// 仲介手数料計算（消費税10%込み）
export function calcBrokerageFee(price: number): number {
  let fee: number
  if (price >= 4000000) {
    fee = price * 0.03 + 60000
  } else if (price >= 2000000) {
    fee = price * 0.04 + 20000
  } else {
    fee = price * 0.05
  }
  return Math.floor(fee * 1.1)
}

/** 価格優先ルール: 成約価格 > 販売価格 > 査定価格 */
export function getBestSellPrice(c: SellCase): number {
  return c.contractPrice || c.askingPrice || c.assessmentPrice || 0
}

/** 価格優先ルール: 成約価格 > 買付価格 */
export function getBestBuyPrice(c: BuyCase): number {
  return c.contractPrice || c.budget || 0
}

// 金額を「〇〇万円」形式でフォーマット
export function formatPrice(price: number): string {
  if (price >= 100000000) {
    const oku = Math.floor(price / 100000000)
    const man = Math.floor((price % 100000000) / 10000)
    return man > 0 ? `${oku}億${man}万円` : `${oku}億円`
  }
  return `${Math.floor(price / 10000).toLocaleString()}万円`
}

export const sellCases: SellCase[] = [
  {
    id: 'S001', clientName: '山本 太郎', propertyName: '太子堂マンション',
    propertyAddress: '東京都世田谷区太子堂3-1-5', propertyType: 'マンション',
    prefecture: '東京都',
    askingPrice: 65000000, brokerageFee: calcBrokerageFee(65000000),
    stage: '販売活動', staff: '鈴木',
    startDate: '2026-01-10', lastContactDate: '2026-03-25',
    notes: '3LDK、築15年。内覧希望者3組あり。', daysInStage: 32,
    counterpartyBroker: '東急リバブル',
  },
  {
    id: 'S002', clientName: '田村 花子', propertyName: '綱島東戸建て',
    propertyAddress: '神奈川県横浜市港北区綱島東2-8-12', propertyType: '戸建て',
    prefecture: '神奈川県',
    askingPrice: 48000000, brokerageFee: calcBrokerageFee(48000000),
    stage: '媒介契約', staff: '田中',
    startDate: '2026-02-15', lastContactDate: '2026-03-28',
    notes: '4LDK、築8年。専任媒介契約締結済み。', daysInStage: 18,
    counterpartyBroker: 'リベ',
  },
  {
    id: 'S003', clientName: '佐々木 一郎', propertyName: '代々木レジデンス',
    propertyAddress: '東京都渋谷区代々木5-22-1', propertyType: 'マンション',
    prefecture: '東京都',
    askingPrice: 92000000, brokerageFee: calcBrokerageFee(92000000),
    stage: '売買契約', staff: '佐藤',
    startDate: '2025-11-20', lastContactDate: '2026-03-20',
    notes: '2LDK高層階。契約書確認中。', daysInStage: 7,
    counterpartyBroker: '野村不動産アーバンネット',
  },
  {
    id: 'S004', clientName: '中村 美咲', propertyName: '春日戸建て',
    propertyAddress: '千葉県千葉市中央区春日1-15-8', propertyType: '戸建て',
    prefecture: '千葉県',
    askingPrice: 32000000, brokerageFee: calcBrokerageFee(32000000),
    stage: '査定', staff: '山田',
    startDate: '2026-03-18', lastContactDate: '2026-03-28',
    notes: '3LDK、築25年。リフォーム歴あり。', daysInStage: 13,
    counterpartyBroker: '—',
  },
  {
    id: 'S005', clientName: '渡辺 健二', propertyName: '自由が丘プレミアム',
    propertyAddress: '東京都目黒区自由が丘1-8-20', propertyType: 'マンション',
    prefecture: '東京都',
    askingPrice: 78000000, brokerageFee: calcBrokerageFee(78000000),
    stage: '決済', staff: '鈴木',
    startDate: '2025-10-05', lastContactDate: '2026-03-31',
    notes: '3LDK、来月決済予定。', daysInStage: 3,
    counterpartyBroker: 'リベ',
  },
  {
    id: 'S006', clientName: '小林 直子', propertyName: '常盤土地',
    propertyAddress: '埼玉県さいたま市浦和区常盤6-4-9', propertyType: '土地',
    prefecture: '埼玉県',
    askingPrice: 25000000, brokerageFee: calcBrokerageFee(25000000),
    stage: '問い合わせ', staff: '伊藤',
    startDate: '2026-03-25', lastContactDate: '2026-03-27',
    notes: '60坪。用途地域確認中。', daysInStage: 6,
    counterpartyBroker: '—',
  },
  {
    id: 'S007', clientName: '加藤 正雄', propertyName: '荻窪ガーデン',
    propertyAddress: '東京都杉並区荻窪4-32-7', propertyType: 'マンション',
    prefecture: '東京都',
    askingPrice: 55000000, brokerageFee: calcBrokerageFee(55000000),
    stage: '販売活動', staff: '田中',
    startDate: '2026-01-28', lastContactDate: '2026-03-22',
    notes: '2LDK、内覧対応中。価格調整検討。', daysInStage: 45,
    counterpartyBroker: '住友不動産販売',
  },
  {
    id: 'S008', clientName: '松本 恵子', propertyName: '武蔵小杉タワー',
    propertyAddress: '神奈川県川崎市中原区武蔵小杉2-1-5', propertyType: 'マンション',
    prefecture: '神奈川県',
    askingPrice: 71000000, brokerageFee: calcBrokerageFee(71000000),
    stage: '媒介契約', staff: '佐藤',
    startDate: '2026-02-20', lastContactDate: '2026-03-29',
    notes: '3LDK高層。専属専任媒介。', daysInStage: 12,
    counterpartyBroker: 'リベ',
  },
  {
    id: 'S009', clientName: '中川 亮', propertyName: '天王寺マンション',
    propertyAddress: '大阪府大阪市天王寺区上本町2-3-1', propertyType: 'マンション',
    prefecture: '大阪府',
    askingPrice: 58000000, brokerageFee: calcBrokerageFee(58000000),
    stage: '販売活動', staff: '山田',
    startDate: '2026-02-01', lastContactDate: '2026-03-28',
    notes: '3LDK、築10年。内覧対応中。', daysInStage: 20,
    counterpartyBroker: '大京穴吹不動産',
  },
  {
    id: 'S010', clientName: '伊藤 明美', propertyName: '西宮戸建て',
    propertyAddress: '兵庫県西宮市甲子園4-5-8', propertyType: '戸建て',
    prefecture: '兵庫県',
    askingPrice: 42000000, brokerageFee: calcBrokerageFee(42000000),
    stage: '媒介契約', staff: '伊藤',
    startDate: '2026-03-01', lastContactDate: '2026-03-29',
    notes: '4LDK、築12年。専任媒介契約締結済み。', daysInStage: 10,
    counterpartyBroker: '—',
  },
  {
    id: 'S011', clientName: '鈴木 浩二', propertyName: '名古屋駅前マンション',
    propertyAddress: '愛知県名古屋市中村区名駅3-7-2', propertyType: 'マンション',
    prefecture: '愛知県',
    askingPrice: 35000000, brokerageFee: calcBrokerageFee(35000000),
    stage: '査定', staff: '鈴木',
    startDate: '2026-03-20', lastContactDate: '2026-03-30',
    notes: '2LDK、築18年。査定依頼受付。', daysInStage: 11,
    counterpartyBroker: '—',
  },
  {
    id: 'S012', clientName: '田中 京子', propertyName: '京都市内町家',
    propertyAddress: '京都府京都市中京区御池通室町東入1-2', propertyType: '戸建て',
    prefecture: '京都府',
    askingPrice: 65000000, brokerageFee: calcBrokerageFee(65000000),
    stage: '問い合わせ', staff: '田中',
    startDate: '2026-03-28', lastContactDate: '2026-03-30',
    notes: '町家リノベ物件。問い合わせ初期対応中。', daysInStage: 3,
    counterpartyBroker: '—',
  },
]

export const buyCases: BuyCase[] = [
  {
    id: 'B001', clientName: '伊藤 誠', propertyName: '世田谷・目黒エリア',
    desiredArea: '東京都世田谷区・目黒区', propertyType: 'マンション',
    prefecture: '東京都',
    budget: 70000000, brokerageFee: calcBrokerageFee(70000000), contractPrice: 0,
    stage: '内見', staff: '山田',
    startDate: '2026-02-10', lastContactDate: '2026-03-30',
    notes: '3LDK希望。学区重視。週末内見3件予定。', daysInStage: 15,
    counterpartyBroker: '東急リバブル',
  },
  {
    id: 'B002', clientName: '高橋 由美', propertyName: '千葉市戸建て',
    desiredArea: '千葉県千葉市', propertyType: '戸建て',
    prefecture: '千葉県',
    budget: 55000000, brokerageFee: calcBrokerageFee(55000000), contractPrice: 0,
    stage: '購入申し込み', staff: '鈴木',
    startDate: '2026-01-20', lastContactDate: '2026-03-28',
    notes: '4LDK希望。申込書提出済み。', daysInStage: 8,
    counterpartyBroker: '野村不動産アーバンネット',
  },
  {
    id: 'B003', clientName: '森 大輔', propertyName: '代々木パークビュー',
    desiredArea: '東京都渋谷区・新宿区', propertyType: 'マンション',
    prefecture: '東京都',
    budget: 95000000, brokerageFee: calcBrokerageFee(95000000), contractPrice: 0,
    stage: '売買契約', staff: '佐藤',
    startDate: '2025-12-01', lastContactDate: '2026-03-25',
    notes: '2LDK、代々木物件で契約締結。', daysInStage: 5,
    counterpartyBroker: 'リベ',
  },
  {
    id: 'B004', clientName: '岡田 幸子', propertyName: '浦安シーサイド',
    desiredArea: '千葉県浦安市・市川市', propertyType: 'マンション',
    prefecture: '千葉県',
    budget: 42000000, brokerageFee: calcBrokerageFee(42000000), contractPrice: 0,
    stage: 'ローン審査', staff: '田中',
    startDate: '2025-11-15', lastContactDate: '2026-03-20',
    notes: '2LDK、銀行審査中。結果待ち。', daysInStage: 21,
    counterpartyBroker: '住友不動産販売',
  },
  {
    id: 'B005', clientName: '木村 博', propertyName: '江戸川・葛飾エリア',
    desiredArea: '東京都江戸川区・葛飾区', propertyType: '戸建て',
    prefecture: '東京都',
    budget: 38000000, brokerageFee: calcBrokerageFee(38000000), contractPrice: 0,
    stage: '問い合わせ', staff: '伊藤',
    startDate: '2026-03-22', lastContactDate: '2026-03-28',
    notes: '3LDK希望。資金計画相談中。', daysInStage: 9,
    counterpartyBroker: '—',
  },
  {
    id: 'B006', clientName: '清水 雅代', propertyName: '江東リバーサイド',
    desiredArea: '東京都江東区・江戸川区', propertyType: 'マンション',
    prefecture: '東京都',
    budget: 60000000, brokerageFee: calcBrokerageFee(60000000), contractPrice: 0,
    stage: '決済', staff: '山田',
    startDate: '2025-10-20', lastContactDate: '2026-03-31',
    notes: '3LDK、今週決済完了予定。', daysInStage: 2,
    counterpartyBroker: 'リベ',
  },
  {
    id: 'B007', clientName: '藤田 健太郎', propertyName: '中野・練馬エリア',
    desiredArea: '東京都中野区・練馬区', propertyType: 'マンション',
    prefecture: '東京都',
    budget: 50000000, brokerageFee: calcBrokerageFee(50000000), contractPrice: 0,
    stage: '内見', staff: '鈴木',
    startDate: '2026-03-01', lastContactDate: '2026-03-29',
    notes: '2LDK希望。内見5件実施済み。絞り込み段階。', daysInStage: 22,
    counterpartyBroker: 'センチュリー21',
  },
  {
    id: 'B008', clientName: '佐藤 美穂', propertyName: '大阪市内マンション',
    desiredArea: '大阪府大阪市', propertyType: 'マンション',
    prefecture: '大阪府',
    budget: 45000000, brokerageFee: calcBrokerageFee(45000000), contractPrice: 0,
    stage: '内見', staff: '佐藤',
    startDate: '2026-03-10', lastContactDate: '2026-03-30',
    notes: '2LDK希望。大阪市内で内見実施中。', daysInStage: 12,
    counterpartyBroker: 'リベ',
  },
  {
    id: 'B009', clientName: '山田 隆史', propertyName: '大阪市中央区エリア',
    desiredArea: '大阪府大阪市中央区', propertyType: 'マンション',
    prefecture: '大阪府',
    budget: 38000000, brokerageFee: calcBrokerageFee(38000000), contractPrice: 0,
    stage: '問い合わせ', staff: '山田',
    startDate: '2026-03-27', lastContactDate: '2026-03-30',
    notes: '1LDK〜2LDK希望。問い合わせ初期対応中。', daysInStage: 4,
    counterpartyBroker: '—',
  },
]

export const monthlyStats: MonthlyStats[] = [
  { month: '2025年10月', closedSell: 2, closedBuy: 3, newInquiries: 8,  revenue: 4200000,  totalRevenue: 4200000  },
  { month: '2025年11月', closedSell: 3, closedBuy: 2, newInquiries: 6,  revenue: 5800000,  totalRevenue: 5800000  },
  { month: '2025年12月', closedSell: 4, closedBuy: 4, newInquiries: 5,  revenue: 9200000,  totalRevenue: 9200000  },
  { month: '2026年1月',  closedSell: 2, closedBuy: 3, newInquiries: 9,  revenue: 4600000,  totalRevenue: 4600000  },
  { month: '2026年2月',  closedSell: 3, closedBuy: 2, newInquiries: 11, revenue: 6300000,  totalRevenue: 6300000  },
  { month: '2026年3月',  closedSell: 2, closedBuy: 2, newInquiries: 14, revenue: 7100000,  totalRevenue: 7100000  },
]

export const recentActivities = [
  { id: 1, type: 'contract',    message: '佐々木様（S003）と売買契約を締結しました', staff: '佐藤', time: '2時間前' },
  { id: 2, type: 'inquiry',     message: '新規問い合わせ：小林様より土地売却の相談',  staff: '伊藤', time: '4時間前' },
  { id: 3, type: 'viewing',     message: '山本様物件（S001）の内覧対応を完了',        staff: '鈴木', time: '昨日' },
  { id: 4, type: 'loan',        message: '岡田様（B004）のローン審査書類を提出',      staff: '田中', time: '昨日' },
  { id: 5, type: 'settlement',  message: '清水様（B006）の決済が今週完了予定',        staff: '山田', time: '2日前' },
  { id: 6, type: 'application', message: '高橋様（B002）から購入申し込みを受領',      staff: '鈴木', time: '3日前' },
]

export const staffStats = [
  { name: '鈴木', activeCases: 3, closedThisMonth: 2, avgDays: 45 },
  { name: '田中', activeCases: 3, closedThisMonth: 1, avgDays: 52 },
  { name: '佐藤', activeCases: 3, closedThisMonth: 2, avgDays: 38 },
  { name: '山田', activeCases: 3, closedThisMonth: 1, avgDays: 61 },
  { name: '伊藤', activeCases: 2, closedThisMonth: 0, avgDays: 29 },
]

export const conversionFunnel = [
  { stage: '問い合わせ',     count: 35, percentage: 100 },
  { stage: '査定/内見',     count: 22, percentage: 63 },
  { stage: '媒介契約/申込', count: 14, percentage: 40 },
  { stage: '販売活動/審査', count: 10, percentage: 29 },
  { stage: '売買契約',      count: 7,  percentage: 20 },
  { stage: '決済',          count: 5,  percentage: 14 },
]

// ── LINE問い合わせ（過去30日分モックデータ） ──────────────────────────
// 実際のデータはスプレッドシート「LINE問い合わせ」シートから取得予定
// 列構成: 日付, 問い合わせ数
export const lineInquiries: LineInquiry[] = [
  { date: '2026-03-01', count: 3 },
  { date: '2026-03-02', count: 1 },
  { date: '2026-03-03', count: 5 },
  { date: '2026-03-04', count: 2 },
  { date: '2026-03-05', count: 4 },
  { date: '2026-03-06', count: 6 },
  { date: '2026-03-07', count: 2 },
  { date: '2026-03-08', count: 3 },
  { date: '2026-03-09', count: 1 },
  { date: '2026-03-10', count: 4 },
  { date: '2026-03-11', count: 7 },
  { date: '2026-03-12', count: 3 },
  { date: '2026-03-13', count: 2 },
  { date: '2026-03-14', count: 5 },
  { date: '2026-03-15', count: 4 },
  { date: '2026-03-16', count: 1 },
  { date: '2026-03-17', count: 3 },
  { date: '2026-03-18', count: 6 },
  { date: '2026-03-19', count: 2 },
  { date: '2026-03-20', count: 4 },
  { date: '2026-03-21', count: 3 },
  { date: '2026-03-22', count: 5 },
  { date: '2026-03-23', count: 2 },
  { date: '2026-03-24', count: 4 },
  { date: '2026-03-25', count: 6 },
  { date: '2026-03-26', count: 3 },
  { date: '2026-03-27', count: 5 },
  { date: '2026-03-28', count: 4 },
  { date: '2026-03-29', count: 7 },
  { date: '2026-03-30', count: 3 },
]

// ── Chatwork ルームモックデータ ───────────────────────────────────────
// 実際のデータはChatwork APIから取得予定
// ルームID は GitHub Secrets の CHATWORK_ROOM_* に設定
export const chatworkRooms: ChatworkRoom[] = [
  {
    roomId: 'ROOM_OPERATIONS',
    name: '運用チャット',
    type: 'operations',
    description: '事業進捗の報告・共有',
    unreadCount: 2,
    latestMessage: '3月の月次集計を共有します。売上目標達成率は98%でした。',
    latestTime: '10:32',
  },
  {
    roomId: 'ROOM_HP_LINE',
    name: 'HP,LINEチャット',
    type: 'hp_line',
    description: 'HPやLINEの専門家とのやりとり',
    unreadCount: 5,
    latestMessage: 'LP改修の件、デザイン案を送りました。ご確認ください。',
    latestTime: '09:15',
  },
  {
    roomId: 'ROOM_RECRUITMENT',
    name: '求人チャット',
    type: 'recruitment',
    description: '求人関連のやりとり',
    unreadCount: 0,
    latestMessage: '来週の面接日程を調整しました。3名の候補者です。',
    latestTime: '昨日',
  },
  {
    roomId: 'ROOM_NOTIFICATION',
    name: '通知チャット',
    type: 'notification',
    description: '公式LINEからの問い合わせ通知（自動転送）',
    unreadCount: 8,
    latestMessage: '[LINE通知] 新規問い合わせ：「3LDKマンションを探しています」',
    latestTime: '11:05',
  },
  {
    roomId: 'ROOM_CUSTOMER',
    name: 'メッセージチャット',
    type: 'customer',
    description: 'お客様からのメッセージ転送',
    unreadCount: 3,
    latestMessage: '[転送] 山本様より「内覧の希望日を変更したいのですが」',
    latestTime: '10:58',
  },
]

// ── Chatwork メッセージモックデータ ──────────────────────────────────
// TODO: Chatwork API連携後は実データに差し替え
// sendTime は Unix timestamp（秒）
export const chatworkMessages: ChatworkMessage[] = [
  // ── LINE通知・Bot ──
  { messageId: 'msg001', roomId: 'ROOM_NOTIFICATION', roomName: '通知チャット', roomType: 'notification',
    account: { name: 'LINE公式アカウント' },
    body: '[LINE通知] 新規問い合わせ：「3LDKマンションを探しています。予算は6000万円前後です。」',
    sendTime: 1743382500 },
  { messageId: 'msg003', roomId: 'ROOM_NOTIFICATION', roomName: '通知チャット', roomType: 'notification',
    account: { name: 'LINE公式アカウント' },
    body: '[LINE通知] 新規問い合わせ：「戸建ての売却を検討しています。査定をお願いしたいです。」',
    sendTime: 1743380000 },
  { messageId: 'msg006', roomId: 'ROOM_NOTIFICATION', roomName: '通知チャット', roomType: 'notification',
    account: { name: 'LINE公式アカウント' },
    body: '[LINE通知] 新規問い合わせ：「川崎市内でファミリー向けマンションを購入したいです。」',
    sendTime: 1743372000 },
  { messageId: 'msg010', roomId: 'ROOM_NOTIFICATION', roomName: '通知チャット', roomType: 'notification',
    account: { name: 'LINE公式アカウント' },
    body: '[LINE通知] 新規問い合わせ：「相続した土地の売却について相談したいです。」',
    sendTime: 1743363000 },
  { messageId: 'msg002', roomId: 'ROOM_CUSTOMER', roomName: 'メッセージチャット', roomType: 'customer',
    account: { name: '転送Bot' },
    body: '[転送] 山本様より「内覧の希望日を変更したいのですが、来週土曜日は可能ですか？」',
    sendTime: 1743381800 },
  { messageId: 'msg007', roomId: 'ROOM_CUSTOMER', roomName: 'メッセージチャット', roomType: 'customer',
    account: { name: '転送Bot' },
    body: '[転送] 高橋様より「申込書の記入方法について教えていただけますか？」',
    sendTime: 1743369000 },
  { messageId: 'msg009', roomId: 'ROOM_RECRUITMENT', roomName: '求人チャット', roomType: 'recruitment',
    account: { name: '採用担当' },
    body: '来週の面接日程を調整しました。3名の候補者です。詳細はカレンダーをご確認ください。',
    sendTime: 1743300000 },

  // ── 鈴木 ──
  { messageId: 'msg_s01', roomId: 'ROOM_OPERATIONS', roomName: '運用チャット', roomType: 'operations',
    account: { name: '鈴木' },
    body: '3月の月次集計を共有します。売上目標達成率は98%でした。来月は引き続き注力します。',
    sendTime: 1743378000 },
  { messageId: 'msg_s02', roomId: 'ROOM_CUSTOMER', roomName: 'メッセージチャット', roomType: 'customer',
    account: { name: '鈴木' },
    body: '山本様の内覧日変更の件、来週土曜14時で調整しました。確認よろしくお願いします。',
    sendTime: 1743381500 },  // 転送Bot受信から約5分後に返信
  { messageId: 'msg_s03', roomId: 'ROOM_OPERATIONS', roomName: '運用チャット', roomType: 'operations',
    account: { name: '鈴木' },
    body: '太子堂マンション（S001）、今週内覧3組対応しました。来週中に購入希望者から連絡が来る予定です。進捗次第で媒介契約の話を進めます。',
    sendTime: 1743340000 },
  { messageId: 'msg_s04', roomId: 'ROOM_OPERATIONS', roomName: '運用チャット', roomType: 'operations',
    account: { name: '鈴木' },
    body: '新入りの佐藤さんへ：先週の査定同行ありがとうございました。査定コメントの書き方、参考にしてもらえると助かります。資料共有しますね。',
    sendTime: 1743295000 },
  { messageId: 'msg_s05', roomId: 'ROOM_OPERATIONS', roomName: '運用チャット', roomType: 'operations',
    account: { name: '鈴木' },
    body: '来週の週次MTGのアジェンダ作成しました。各自担当案件の進捗を3分以内で共有お願いします。',
    sendTime: 1743250000 },

  // ── 田中 ──
  { messageId: 'msg_t01', roomId: 'ROOM_OPERATIONS', roomName: '運用チャット', roomType: 'operations',
    account: { name: '田中' },
    body: '荻窪ガーデン（S007）の価格調整について、オーナーと協議しました。来週結論を出す予定です。',
    sendTime: 1743366000 },
  { messageId: 'msg_t02', roomId: 'ROOM_CUSTOMER', roomName: 'メッセージチャット', roomType: 'customer',
    account: { name: '田中' },
    body: '高橋様の申込書の件、本日中に書類の記入例をPDFで送付します。不明点があればいつでもご連絡ください。',
    sendTime: 1743369800 },  // 転送Bot受信から約13分後
  { messageId: 'msg_t03', roomId: 'ROOM_OPERATIONS', roomName: '運用チャット', roomType: 'operations',
    account: { name: '田中' },
    body: '綱島東（S002）、先週の媒介契約をオーナーに郵送で送付しました。先方のご確認待ちです。',
    sendTime: 1743320000 },
  { messageId: 'msg_t04', roomId: 'ROOM_OPERATIONS', roomName: '運用チャット', roomType: 'operations',
    account: { name: '田中' },
    body: '名古屋（S011）の売買契約、渡辺様より署名済み書類が届きました。決済日の調整に入ります。',
    sendTime: 1743270000 },
  { messageId: 'msg_t05', roomId: 'ROOM_OPERATIONS', roomName: '運用チャット', roomType: 'operations',
    account: { name: '田中' },
    body: '荻窪ガーデン（S007）の件、オーナーが価格を下げることに同意されました。改めて販売条件を更新します。',
    sendTime: 1743430000 },  // 価格交渉を結論付けた後続メッセージ

  // ── 佐藤 ──
  { messageId: 'msg_sa01', roomId: 'ROOM_OPERATIONS', roomName: '運用チャット', roomType: 'operations',
    account: { name: '佐藤' },
    body: '代々木レジデンス（S003）、売買契約の署名が完了しました。決済に向けて司法書士と日程調整中です。',
    sendTime: 1743360000 },
  { messageId: 'msg_sa02', roomId: 'ROOM_CUSTOMER', roomName: 'メッセージチャット', roomType: 'customer',
    account: { name: '佐藤' },
    body: '佐々木様より「ローンの本審査はいつ頃になりますか？」と問い合わせがありました。銀行側に確認して折り返します。',
    sendTime: 1743355000 },
  { messageId: 'msg_sa03', roomId: 'ROOM_OPERATIONS', roomName: '運用チャット', roomType: 'operations',
    account: { name: '佐藤' },
    body: '今月の担当案件進捗まとめです。S003:決済準備中 / S005:内見2組対応済み / S006:購入申込み受領。',
    sendTime: 1743300000 },
  { messageId: 'msg_sa04', roomId: 'ROOM_OPERATIONS', roomName: '運用チャット', roomType: 'operations',
    account: { name: '佐藤' },
    body: '佐々木様のローン本審査、銀行より通過の連絡がありました。決済日を来月10日で仮押さえしました。',
    sendTime: 1743410000 },  // 顧客問い合わせに対し翌日フォロー完了

  // ── 山田 ──
  { messageId: 'msg_y01', roomId: 'ROOM_OPERATIONS', roomName: '運用チャット', roomType: 'operations',
    account: { name: '山田' },
    body: '代々木レジデンス（S003）決済完了しました。佐藤さんと連携しスムーズに進められました。',
    sendTime: 1743350000 },
  { messageId: 'msg_y02', roomId: 'ROOM_CUSTOMER', roomName: 'メッセージチャット', roomType: 'customer',
    account: { name: '山田' },
    body: '鈴木様より「決済後の登記はどのくらいかかりますか？」とご質問いただきました。司法書士に確認し30分以内に回答しました。',
    sendTime: 1743348000 },
  { messageId: 'msg_y03', roomId: 'ROOM_OPERATIONS', roomName: '運用チャット', roomType: 'operations',
    account: { name: '山田' },
    body: 'S004の中野ハウス、販売開始から45日経過しています。価格見直しの検討を提案したいのですが、いかがでしょうか。',
    sendTime: 1743290000 },
  // 山田はS003を決済まで持っていったが、S004については課題認識はあるが相談止まり
  { messageId: 'msg_y04', roomId: 'ROOM_OPERATIONS', roomName: '運用チャット', roomType: 'operations',
    account: { name: '山田' },
    body: 'S004の件、先週から進展なしです。オーナーが価格据え置きを希望しているため、様子見しています。',
    sendTime: 1743430000 },

  // ── 伊藤 ──
  { messageId: 'msg_i01', roomId: 'ROOM_OPERATIONS', roomName: '運用チャット', roomType: 'operations',
    account: { name: '伊藤' },
    body: '千葉の案件（B004）、川村様の内見が完了しました。感触は良好です。',
    sendTime: 1743200000 },
  // 伊藤の最後のメッセージ発信はここで止まっており、その後2週間弱発言なし
  { messageId: 'msg_i02', roomId: 'ROOM_CUSTOMER', roomName: 'メッセージチャット', roomType: 'customer',
    account: { name: '転送Bot' },
    body: '[転送] 川村様より「先日の内見、ありがとうございました。購入を前向きに検討しています。次のステップを教えてください。」',
    sendTime: 1743350000 },  // 伊藤担当案件への顧客メッセージだが、担当者からの返信がチャット上に確認できない
]

// ── モックカレンダーデータ ────────────────────────────────────────────
// TODO: Google Calendar API連携時は calendarService.ts の fetchEvents() に差し替え
export const mockCalendarEvents: CalendarEvent[] = [
  {
    id: 'evt001',
    title: '【査定】山田様 / 世田谷区マンション',
    eventType: '査定',
    start: '2026-04-01T10:00:00+09:00',
    end:   '2026-04-01T11:30:00+09:00',
    allDay: false,
    caseId: 'S001',
    clientName: '山田',
    staff: '鈴木',
    location: '東京都世田谷区xxx',
  },
  {
    id: 'evt002',
    title: '【内見】佐藤様 / 港区タワーマンション',
    eventType: '内見',
    start: '2026-04-02T14:00:00+09:00',
    end:   '2026-04-02T15:30:00+09:00',
    allDay: false,
    caseId: 'B001',
    clientName: '佐藤',
    staff: '田中',
    location: '東京都港区xxx',
  },
  {
    id: 'evt003',
    title: '【契約】田中様 / 大阪府吹田市一戸建て 媒介契約',
    eventType: '契約',
    start: '2026-04-03T13:00:00+09:00',
    end:   '2026-04-03T14:00:00+09:00',
    allDay: false,
    caseId: 'S009',
    clientName: '田中',
    staff: '佐藤',
    location: '事務所',
  },
  {
    id: 'evt004',
    title: '【決済】鈴木様 / 横浜市戸建て',
    eventType: '決済',
    start: '2026-04-07T10:00:00+09:00',
    end:   '2026-04-07T12:00:00+09:00',
    allDay: false,
    caseId: 'S003',
    clientName: '鈴木',
    staff: '山田',
    location: '司法書士事務所',
  },
  {
    id: 'evt005',
    title: '社内打ち合わせ（週次）',
    eventType: '打ち合わせ',
    start: '2026-04-08T09:00:00+09:00',
    end:   '2026-04-08T10:00:00+09:00',
    allDay: false,
    staff: '鈴木',
    location: '事務所',
  },
  {
    id: 'evt006',
    title: '【内見】川村様 / 千葉市中古マンション',
    eventType: '内見',
    start: '2026-04-10T11:00:00+09:00',
    end:   '2026-04-10T12:30:00+09:00',
    allDay: false,
    caseId: 'B004',
    clientName: '川村',
    staff: '伊藤',
    location: '千葉市xxx',
  },
  {
    id: 'evt007',
    title: '【契約】渡辺様 / 名古屋市マンション 売買契約',
    eventType: '契約',
    start: '2026-04-14T15:00:00+09:00',
    end:   '2026-04-14T16:30:00+09:00',
    allDay: false,
    caseId: 'S011',
    clientName: '渡辺',
    staff: '田中',
    location: '事務所',
  },
]

// ── スタッフ評価 ────────────────────────────────────────────────────────
// TODO: Chatwork API連携後は実メッセージを解析して自動生成
//
// 評価軸と採点ロジック:
//   responseSpeed   : お客様転送メッセージへの返信時間（分）を計測し5段階に変換
//                     ～15分: 5 / ～30分: 4 / ～60分: 3 / ～120分: 2 / 2時間超: 1
//   customerHandling: 顧客対応の具体性・丁寧さ・フォロー完結度をメッセージ内容から評価
//   caseProgress    : 担当案件の平均ステージ深度・決済完了率・滞留日数を数値化
//   teamContrib     : 情報共有の頻度・質・他スタッフへの言及・会議ファシリ行動を評価
//
// EvalCriterion.evidence: 評価根拠となる具体的メッセージIDまたはデータポイント

export interface EvalCriterion {
  score: number         // 1〜5
  rationale: string     // なぜその点数か（第三者視点）
  evidence: {
    type: 'message' | 'case_data'
    label: string       // 引用・データの見出し
    content: string     // 実際のメッセージ引用 or データ説明
  }[]
}

export interface StaffEvaluation {
  staff: Staff
  responseSpeed: EvalCriterion
  customerHandling: EvalCriterion
  caseProgress: EvalCriterion
  teamContrib: EvalCriterion
  totalScore: number      // 100点換算（各軸 × 5点満点 → 合計/20 × 100）
  rank: 'S' | 'A' | 'B' | 'C'
  summary: string         // 総合所見（第三者視点）
  improvementPoint: string
}

export const mockStaffEvaluations: StaffEvaluation[] = [
  {
    staff: '鈴木',
    responseSpeed: {
      score: 5,
      rationale: '転送Botで受信した山本様の内覧日変更依頼（23:10）に対し、約5分後（23:15）に「来週土曜14時で調整しました」と返信。業務時間外にも関わらず迅速に対応しており、即応性が突出して高い。',
      evidence: [
        { type: 'message', label: '転送受信 (msg002)', content: '[転送] 山本様より「内覧の希望日を変更したいのですが、来週土曜日は可能ですか？」' },
        { type: 'message', label: '鈴木返信 (msg_s02) — 約5分後', content: '山本様の内覧日変更の件、来週土曜14時で調整しました。確認よろしくお願いします。' },
      ],
    },
    customerHandling: {
      score: 4,
      rationale: '顧客からの変更依頼に対し、確認ではなく「14時で調整しました」と具体的な代替案を即提示している。受け身ではなく能動的に解決する対応スタイルが確認できる。ただし当月のお客様対応メッセージのサンプル数が少ないため満点には至らない。',
      evidence: [
        { type: 'message', label: '鈴木返信 (msg_s02)', content: '「来週土曜14時で調整しました。確認よろしくお願いします。」→ 提案型の返答で顧客の不安を即解消している。' },
      ],
    },
    caseProgress: {
      score: 4,
      rationale: '担当案件S001は「販売活動」ステージで今週3組の内見対応済み。案件を前進させるためのアクション（内見調整・購入希望者フォロー）が連続して確認できる。決済案件はまだないが、パイプライン管理は適切。',
      evidence: [
        { type: 'message', label: '進捗共有 (msg_s03)', content: '太子堂マンション（S001）、今週内覧3組対応しました。来週中に購入希望者から連絡が来る予定です。進捗次第で媒介契約の話を進めます。' },
        { type: 'case_data', label: '案件データ', content: 'S001: 販売活動（daysInStage: 32日） — 販売活動ステージの平均よりやや長めだが、内見3組対応中で停滞ではない。' },
      ],
    },
    teamContrib: {
      score: 5,
      rationale: '月次集計の自発的な数値共有、週次MTGアジェンダの作成と進め方の指示、後輩スタッフへの資料共有の申し出が確認できる。チームの情報共有基盤を自ら作っており、組織運営への貢献度が全員の中で最も高い。',
      evidence: [
        { type: 'message', label: '月次報告 (msg_s01)', content: '3月の月次集計を共有します。売上目標達成率は98%でした。来月は引き続き注力します。' },
        { type: 'message', label: '後輩指導 (msg_s04)', content: '新入りの佐藤さんへ：先週の査定同行ありがとうございました。査定コメントの書き方、参考にしてもらえると助かります。資料共有しますね。' },
        { type: 'message', label: 'MTG設計 (msg_s05)', content: '来週の週次MTGのアジェンダ作成しました。各自担当案件の進捗を3分以内で共有お願いします。' },
      ],
    },
    totalScore: 90,
    rank: 'S',
    summary: 'チームリーダーとしての振る舞いがメッセージ全体から一貫して確認できる。即応性・情報共有・後進育成のすべてで高水準を維持しており、現時点でチーム内最高評価。数値管理（達成率98%）を言語化してチームに共有する習慣は、他スタッフの行動の基準値を引き上げる効果がある。',
    improvementPoint: '現状は申し分ないが、担当案件S001の販売活動ステージが32日経過している。内見対応は積極的だが、購入希望者の意思決定を加速させる提案（購入特典の提示・競合物件との比較資料など）を組み込むことで、さらにクロージングスピードを上げられる可能性がある。',
  },
  {
    staff: '田中',
    responseSpeed: {
      score: 3,
      rationale: '高橋様の申込書問い合わせへの返信は約13分後と許容範囲内。ただし「本日中に送付します」という表現は即時対応ではなく当日内対応であり、より迅速なレスポンスが望ましい場面もある。',
      evidence: [
        { type: 'message', label: '転送受信 (msg007)', content: '[転送] 高橋様より「申込書の記入方法について教えていただけますか？」' },
        { type: 'message', label: '田中返信 (msg_t02) — 約13分後', content: '高橋様の申込書の件、本日中に書類の記入例をPDFで送付します。不明点があればいつでもご連絡ください。' },
      ],
    },
    customerHandling: {
      score: 4,
      rationale: '申込書問い合わせに対し「記入例PDFを送付する」という具体的な解決策を提示しており、顧客が次に何をすれば良いかが明確。「不明点があればいつでも」という一文も安心感を与える丁寧な表現で、対応の質は高い。',
      evidence: [
        { type: 'message', label: '田中返信 (msg_t02)', content: '本日中に書類の記入例をPDFで送付します。不明点があればいつでもご連絡ください。→ 具体策の提示＋継続サポートの意思表明が明示されている。' },
      ],
    },
    caseProgress: {
      score: 5,
      rationale: '荻窪ガーデン（S007）のオーナー価格交渉を「来週結論を出す」と共有した翌週に「価格を下げることに同意」と確実に結論付けており、交渉の完結能力が高い。名古屋（S011）も売買契約を締結し決済へ進んでいる。複数案件を並行して前進させている点が特に評価できる。',
      evidence: [
        { type: 'message', label: '交渉経過 (msg_t01)', content: '荻窪ガーデン（S007）の価格調整について、オーナーと協議しました。来週結論を出す予定です。' },
        { type: 'message', label: '交渉完結 (msg_t05)', content: '荻窪ガーデン（S007）の件、オーナーが価格を下げることに同意されました。改めて販売条件を更新します。→ 翌週に確実に結論を出している。' },
        { type: 'message', label: '契約完了 (msg_t04)', content: '名古屋（S011）の売買契約、渡辺様より署名済み書類が届きました。決済日の調整に入ります。' },
      ],
    },
    teamContrib: {
      score: 4,
      rationale: '案件の節目節目でチームへの報告を行う習慣が確認できる（郵送送付・交渉経緯・契約完了）。発言内容はいずれも事実の共有にとどまり、チーム全体への提案や他スタッフへの貢献は限定的。情報発信の質は高いが、量・多様性では鈴木に次ぐ水準。',
      evidence: [
        { type: 'message', label: '進捗共有 (msg_t03)', content: '綱島東（S002）、先週の媒介契約をオーナーに郵送で送付しました。先方のご確認待ちです。' },
        { type: 'message', label: '交渉共有 (msg_t01)', content: '荻窪ガーデン（S007）の価格調整について、オーナーと協議しました。来週結論を出す予定です。' },
      ],
    },
    totalScore: 80,
    rank: 'A',
    summary: '案件推進力が全員の中で最も安定しており、交渉→合意→次アクションという流れを確実に作れている。顧客対応も具体的で丁寧。応答速度のみやや改善の余地があるが、全体的に高水準のパフォーマンス。',
    improvementPoint: '顧客対応の返信を「本日中」ではなく「30分以内」を目標にすることで、顧客満足度がさらに向上する。また、自身の交渉・クロージングのノウハウをチームに言語化して共有することで、チーム全体の案件推進力底上げに繋げられる。',
  },
  {
    staff: '佐藤',
    responseSpeed: {
      score: 3,
      rationale: '佐々木様からのローン審査問い合わせに対し「銀行側に確認して折り返します」と一次応答しており、確認が必要な内容での対応としては適切。ただし折り返しまでの時間が不明なため、最終的な回答速度の評価は翌日の完結メッセージから推定。',
      evidence: [
        { type: 'message', label: '顧客問い合わせ対応 (msg_sa02)', content: '佐々木様より「ローンの本審査はいつ頃になりますか？」と問い合わせがありました。銀行側に確認して折り返します。' },
        { type: 'message', label: 'フォロー完結 (msg_sa04)', content: '佐々木様のローン本審査、銀行より通過の連絡がありました。決済日を来月10日で仮押さえしました。→ 翌日には完結しており、問い合わせを放置していない点は評価できる。' },
      ],
    },
    customerHandling: {
      score: 4,
      rationale: '顧客の不安（ローン審査時期）に対し、自分で判断できない内容を正直に伝えた上で「折り返す」と約束し、翌日に結果を報告している。確認して完結させるプロセスが丁寧で、顧客に余計な不安を与えない対応が確認できる。',
      evidence: [
        { type: 'message', label: '一次応答 (msg_sa02)', content: '「銀行側に確認して折り返します」→ 不確実な情報を憶測で伝えず、確認後に回答するという誠実な対応。' },
        { type: 'message', label: '完結報告 (msg_sa04)', content: '「銀行より通過の連絡がありました。決済日を来月10日で仮押さえしました。」→ 回答止まりではなく、次の具体的ステップまで先回りして実行している。' },
      ],
    },
    caseProgress: {
      score: 4,
      rationale: 'S003（代々木レジデンス）を売買契約→決済準備中まで牽引。複数案件（S003/S005/S006）の進捗を月次でまとめて報告しており、案件を並行管理できている。決済完了案件が出れば評価がさらに上がる段階。',
      evidence: [
        { type: 'message', label: '売買契約報告 (msg_sa01)', content: '代々木レジデンス（S003）、売買契約の署名が完了しました。決済に向けて司法書士と日程調整中です。' },
        { type: 'message', label: '複数案件管理 (msg_sa03)', content: '今月の担当案件進捗まとめです。S003:決済準備中 / S005:内見2組対応済み / S006:購入申込み受領。' },
      ],
    },
    teamContrib: {
      score: 3,
      rationale: '担当案件の進捗を一覧でまとめて共有する行動は評価できる。ただし自身の業務範囲の報告にとどまっており、他スタッフへの支援や組織全体への提案行動は確認できない。情報共有の「頻度」も鈴木・田中と比較してやや少ない。',
      evidence: [
        { type: 'message', label: '進捗まとめ (msg_sa03)', content: '今月の担当案件進捗まとめです。S003:決済準備中 / S005:内見2組対応済み / S006:購入申込み受領。→ 複数案件を一括共有する効率的な報告スタイル。' },
      ],
    },
    totalScore: 70,
    rank: 'B',
    summary: '顧客対応の誠実さと案件管理の丁寧さが際立つ。「確認して折り返す」というプロセスを守った上で翌日に完結させる対応は、信頼構築において非常に重要。チーム内での発信量は少ないが、発信するときの内容の質は高い。',
    improvementPoint: 'チャットへの発信頻度を上げることで、チーム内での認知度・信頼度がさらに高まる。特に「詰まっていること・相談したいこと」をチャットで積極的に発信する習慣をつけることで、早期に問題解決ができ、案件推進スピードが向上する。',
  },
  {
    staff: '山田',
    responseSpeed: {
      score: 4,
      rationale: '顧客からの「決済後の登記はどのくらいかかりますか？」という質問に対し「30分以内に回答した」と自身のメッセージで言及しており、対応速度は高い。ただし自己申告であり、転送Botのタイムスタンプとの照合ができないため最高評価は留保。',
      evidence: [
        { type: 'message', label: '顧客対応記録 (msg_y02)', content: '鈴木様より「決済後の登記はどのくらいかかりますか？」とご質問いただきました。司法書士に確認し30分以内に回答しました。' },
      ],
    },
    customerHandling: {
      score: 3,
      rationale: '決済に関する顧客質問に司法書士確認の上で回答しており、正確性を優先した対応は適切。ただしメッセージが「対応した」という事後報告のみで、顧客への具体的な回答内容がチャット上に記録されておらず、対応品質の詳細が検証しにくい。',
      evidence: [
        { type: 'message', label: '対応報告 (msg_y02)', content: '「司法書士に確認し30分以内に回答しました」→ 正確な情報を提供しようとする姿勢は評価できるが、回答内容の記録がないため品質の詳細検証が困難。' },
      ],
    },
    caseProgress: {
      score: 4,
      rationale: 'S003の決済完了を報告しており、最終ステージまで案件を完結させる実績が確認できる。一方S004（中野ハウス）については45日経過と滞留を認識しながらも「オーナーが価格据え置きを希望しているため様子見」と2週間以上具体的な打開策なし。成約力はあるが、停滞案件への対処が課題。',
      evidence: [
        { type: 'message', label: '決済完了 (msg_y01)', content: '代々木レジデンス（S003）決済完了しました。佐藤さんと連携しスムーズに進められました。' },
        { type: 'message', label: '滞留認識 (msg_y03)', content: 'S004の中野ハウス、販売開始から45日経過しています。価格見直しの検討を提案したいのですが、いかがでしょうか。' },
        { type: 'message', label: '停滞継続 (msg_y04)', content: 'S004の件、先週から進展なしです。オーナーが価格据え置きを希望しているため、様子見しています。→ 問題認識から2週間以上、具体的な打開策なし。' },
      ],
    },
    teamContrib: {
      score: 3,
      rationale: 'S003の決済完了を報告した際に「佐藤さんと連携しスムーズに」と協力関係を言及しており、チームワークを大切にする姿勢が読み取れる。ただしS004の停滞について「様子見」で終わらせており、チームへの相談・打開策の提案などの積極的行動が見られない。',
      evidence: [
        { type: 'message', label: '連携言及 (msg_y01)', content: '「佐藤さんと連携しスムーズに進められました」→ 協力関係の明示はチームの結束に貢献。' },
        { type: 'message', label: '停滞報告止まり (msg_y04)', content: 'S004の件、先週から進展なしです。オーナーが価格据え置きを希望しているため、様子見しています。→ 報告はあるが、チームへの相談・解決策提案がない。' },
      ],
    },
    totalScore: 70,
    rank: 'B',
    summary: '決済完了という最も重要な成果を出しており、基礎的なクロージング能力は高い。ただしS004の停滞案件に対して「様子見」という受動的な姿勢が続いており、この点が評価を押し下げている。顧客対応の内容がチャット上に記録されていない部分があり、外部から品質を検証しにくい点も課題。',
    improvementPoint: 'S004の停滞について、オーナーへの具体的な打開策（価格以外の付加価値訴求、他社競合情報の提示など）をチームに相談しながら検討することを推奨。停滞案件を放置する期間が長くなるほど機会損失が拡大するため、2週間を超えたら必ずチームに打開策を相談するルールを設けると良い。',
  },
  {
    staff: '伊藤',
    responseSpeed: {
      score: 1,
      rationale: '担当案件B004の顧客（川村様）から「購入を前向きに検討しています。次のステップを教えてください。」というメッセージが届いているが、チャット上に伊藤からの返信が確認できない。購入意思を明確に示した顧客へのフォローが1週間以上放置されている可能性があり、深刻な機会損失リスクがある。',
      evidence: [
        { type: 'message', label: '顧客メッセージ (msg_i02)', content: '[転送] 川村様より「先日の内見、ありがとうございました。購入を前向きに検討しています。次のステップを教えてください。」' },
        { type: 'case_data', label: '返信確認', content: '上記メッセージ（3/31 09:30頃）以降、伊藤からの返信メッセージがチャット上に確認できない。顧客が次のアクションを求めているにも関わらず対応が滞っている。' },
      ],
    },
    customerHandling: {
      score: 2,
      rationale: '内見後に「感触は良好」と報告するまでは良いが、購入意欲を示した顧客への次ステップ案内ができていない。不動産取引において購入意思表示後の対応速度は成約率に直結する最重要局面であり、この場面での未対応は顧客対応として深刻な課題。',
      evidence: [
        { type: 'message', label: '内見後報告 (msg_i01)', content: '千葉の案件（B004）、川村様の内見が完了しました。感触は良好です。→ 内見後報告までは実施されている。' },
        { type: 'message', label: '顧客未対応 (msg_i02)', content: '川村様「購入を前向きに検討しています。次のステップを教えてください。」→ この重要なメッセージへのチャット上の返信なし。' },
      ],
    },
    caseProgress: {
      score: 2,
      rationale: '担当案件B004は内見まで進んでいるが、顧客が購入意欲を示した後にステージが前進していない。案件の推進機会（購入申し込み誘導）を活かせていない状態が確認できる。チャット上の直近発言が3週間以上前であり、案件全体の活動量が低い。',
      evidence: [
        { type: 'case_data', label: '案件データ (B004)', content: 'B004: 内見ステージ — 顧客が購入意思を示しているにも関わらず「購入申し込み」ステージへ進んでいない。' },
        { type: 'message', label: '最終発言 (msg_i01)', content: '「千葉の案件（B004）、川村様の内見が完了しました。感触は良好です。」→ これが確認できる最後の自発的発言（約3週間前）。' },
      ],
    },
    teamContrib: {
      score: 1,
      rationale: '直近3週間のチャットログで伊藤からの自発的な発信は1件のみ（内見完了報告）。チームへの情報共有・相談・提案が極めて少なく、業務状況がチームから見えない状態になっている。他スタッフへの言及や支援行動も確認できない。',
      evidence: [
        { type: 'message', label: '発信状況', content: '対象期間（直近3週間）での伊藤からの自発的発信: 1件（msg_i01: 内見完了報告のみ）。鈴木5件・田中5件・佐藤4件・山田4件と比較して著しく少ない。' },
        { type: 'case_data', label: 'チーム貢献活動', content: '他スタッフへの返信・相談・支援申し出: 確認できず。' },
      ],
    },
    totalScore: 30,
    rank: 'C',
    summary: '購入意欲を明確に示した顧客への未対応が最も深刻な問題。不動産取引において「買いたい」という意思表示への初動対応は成約率を大きく左右する。この案件（B004）の機会損失が現実になる前に、速やかなフォローが必要。チャット上の存在感も著しく低く、チームからのサポートを受けにくい状況にある。',
    improvementPoint: '最優先: 川村様への返信と次ステップ案内（購入申し込み書類の準備案内など）を本日中に実施すること。中長期: 毎朝1回「担当案件の今日のアクション」をチャットに投稿することを習慣化する。週1回の週次報告（各案件の状態を3行でまとめる）も導入することで、チームからのフォローを受けやすくなる。',
  },
]
