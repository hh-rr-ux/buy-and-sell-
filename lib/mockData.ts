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
  askingPrice: number    // 物件価格（円）
  brokerageFee: number   // 仲介手数料（スプシから直接取得）
  stage: SellStage
  staff: Staff
  startDate: string
  lastContactDate: string
  notes: string
  daysInStage: number
}

export interface BuyCase {
  id: string
  clientName: string
  propertyName: string   // 物件名（スプシ連携時はシートの「物件名」列を使用）
  desiredArea: string
  propertyType: string
  prefecture: string     // 都道府県（スプシ連携時はシートから取得）
  budget: number         // 予算（円）
  brokerageFee: number   // 仲介手数料（スプシから直接取得）
  stage: BuyStage
  staff: Staff
  startDate: string
  lastContactDate: string
  notes: string
  daysInStage: number
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
  },
  {
    id: 'S002', clientName: '田村 花子', propertyName: '綱島東戸建て',
    propertyAddress: '神奈川県横浜市港北区綱島東2-8-12', propertyType: '戸建て',
    prefecture: '神奈川県',
    askingPrice: 48000000, brokerageFee: calcBrokerageFee(48000000),
    stage: '媒介契約', staff: '田中',
    startDate: '2026-02-15', lastContactDate: '2026-03-28',
    notes: '4LDK、築8年。専任媒介契約締結済み。', daysInStage: 18,
  },
  {
    id: 'S003', clientName: '佐々木 一郎', propertyName: '代々木レジデンス',
    propertyAddress: '東京都渋谷区代々木5-22-1', propertyType: 'マンション',
    prefecture: '東京都',
    askingPrice: 92000000, brokerageFee: calcBrokerageFee(92000000),
    stage: '売買契約', staff: '佐藤',
    startDate: '2025-11-20', lastContactDate: '2026-03-20',
    notes: '2LDK高層階。契約書確認中。', daysInStage: 7,
  },
  {
    id: 'S004', clientName: '中村 美咲', propertyName: '春日戸建て',
    propertyAddress: '千葉県千葉市中央区春日1-15-8', propertyType: '戸建て',
    prefecture: '千葉県',
    askingPrice: 32000000, brokerageFee: calcBrokerageFee(32000000),
    stage: '査定', staff: '山田',
    startDate: '2026-03-18', lastContactDate: '2026-03-28',
    notes: '3LDK、築25年。リフォーム歴あり。', daysInStage: 13,
  },
  {
    id: 'S005', clientName: '渡辺 健二', propertyName: '自由が丘プレミアム',
    propertyAddress: '東京都目黒区自由が丘1-8-20', propertyType: 'マンション',
    prefecture: '東京都',
    askingPrice: 78000000, brokerageFee: calcBrokerageFee(78000000),
    stage: '決済', staff: '鈴木',
    startDate: '2025-10-05', lastContactDate: '2026-03-31',
    notes: '3LDK、来月決済予定。', daysInStage: 3,
  },
  {
    id: 'S006', clientName: '小林 直子', propertyName: '常盤土地',
    propertyAddress: '埼玉県さいたま市浦和区常盤6-4-9', propertyType: '土地',
    prefecture: '埼玉県',
    askingPrice: 25000000, brokerageFee: calcBrokerageFee(25000000),
    stage: '問い合わせ', staff: '伊藤',
    startDate: '2026-03-25', lastContactDate: '2026-03-27',
    notes: '60坪。用途地域確認中。', daysInStage: 6,
  },
  {
    id: 'S007', clientName: '加藤 正雄', propertyName: '荻窪ガーデン',
    propertyAddress: '東京都杉並区荻窪4-32-7', propertyType: 'マンション',
    prefecture: '東京都',
    askingPrice: 55000000, brokerageFee: calcBrokerageFee(55000000),
    stage: '販売活動', staff: '田中',
    startDate: '2026-01-28', lastContactDate: '2026-03-22',
    notes: '2LDK、内覧対応中。価格調整検討。', daysInStage: 45,
  },
  {
    id: 'S008', clientName: '松本 恵子', propertyName: '武蔵小杉タワー',
    propertyAddress: '神奈川県川崎市中原区武蔵小杉2-1-5', propertyType: 'マンション',
    prefecture: '神奈川県',
    askingPrice: 71000000, brokerageFee: calcBrokerageFee(71000000),
    stage: '媒介契約', staff: '佐藤',
    startDate: '2026-02-20', lastContactDate: '2026-03-29',
    notes: '3LDK高層。専属専任媒介。', daysInStage: 12,
  },
  {
    id: 'S009', clientName: '中川 亮', propertyName: '天王寺マンション',
    propertyAddress: '大阪府大阪市天王寺区上本町2-3-1', propertyType: 'マンション',
    prefecture: '大阪府',
    askingPrice: 58000000, brokerageFee: calcBrokerageFee(58000000),
    stage: '販売活動', staff: '山田',
    startDate: '2026-02-01', lastContactDate: '2026-03-28',
    notes: '3LDK、築10年。内覧対応中。', daysInStage: 20,
  },
  {
    id: 'S010', clientName: '伊藤 明美', propertyName: '西宮戸建て',
    propertyAddress: '兵庫県西宮市甲子園4-5-8', propertyType: '戸建て',
    prefecture: '兵庫県',
    askingPrice: 42000000, brokerageFee: calcBrokerageFee(42000000),
    stage: '媒介契約', staff: '伊藤',
    startDate: '2026-03-01', lastContactDate: '2026-03-29',
    notes: '4LDK、築12年。専任媒介契約締結済み。', daysInStage: 10,
  },
  {
    id: 'S011', clientName: '鈴木 浩二', propertyName: '名古屋駅前マンション',
    propertyAddress: '愛知県名古屋市中村区名駅3-7-2', propertyType: 'マンション',
    prefecture: '愛知県',
    askingPrice: 35000000, brokerageFee: calcBrokerageFee(35000000),
    stage: '査定', staff: '鈴木',
    startDate: '2026-03-20', lastContactDate: '2026-03-30',
    notes: '2LDK、築18年。査定依頼受付。', daysInStage: 11,
  },
  {
    id: 'S012', clientName: '田中 京子', propertyName: '京都市内町家',
    propertyAddress: '京都府京都市中京区御池通室町東入1-2', propertyType: '戸建て',
    prefecture: '京都府',
    askingPrice: 65000000, brokerageFee: calcBrokerageFee(65000000),
    stage: '問い合わせ', staff: '田中',
    startDate: '2026-03-28', lastContactDate: '2026-03-30',
    notes: '町家リノベ物件。問い合わせ初期対応中。', daysInStage: 3,
  },
]

export const buyCases: BuyCase[] = [
  {
    id: 'B001', clientName: '伊藤 誠', propertyName: '世田谷・目黒エリア',
    desiredArea: '東京都世田谷区・目黒区', propertyType: 'マンション',
    prefecture: '東京都',
    budget: 70000000, brokerageFee: calcBrokerageFee(70000000),
    stage: '内見', staff: '山田',
    startDate: '2026-02-10', lastContactDate: '2026-03-30',
    notes: '3LDK希望。学区重視。週末内見3件予定。', daysInStage: 15,
  },
  {
    id: 'B002', clientName: '高橋 由美', propertyName: '千葉市戸建て',
    desiredArea: '千葉県千葉市', propertyType: '戸建て',
    prefecture: '千葉県',
    budget: 55000000, brokerageFee: calcBrokerageFee(55000000),
    stage: '購入申し込み', staff: '鈴木',
    startDate: '2026-01-20', lastContactDate: '2026-03-28',
    notes: '4LDK希望。申込書提出済み。', daysInStage: 8,
  },
  {
    id: 'B003', clientName: '森 大輔', propertyName: '代々木パークビュー',
    desiredArea: '東京都渋谷区・新宿区', propertyType: 'マンション',
    prefecture: '東京都',
    budget: 95000000, brokerageFee: calcBrokerageFee(95000000),
    stage: '売買契約', staff: '佐藤',
    startDate: '2025-12-01', lastContactDate: '2026-03-25',
    notes: '2LDK、代々木物件で契約締結。', daysInStage: 5,
  },
  {
    id: 'B004', clientName: '岡田 幸子', propertyName: '浦安シーサイド',
    desiredArea: '千葉県浦安市・市川市', propertyType: 'マンション',
    prefecture: '千葉県',
    budget: 42000000, brokerageFee: calcBrokerageFee(42000000),
    stage: 'ローン審査', staff: '田中',
    startDate: '2025-11-15', lastContactDate: '2026-03-20',
    notes: '2LDK、銀行審査中。結果待ち。', daysInStage: 21,
  },
  {
    id: 'B005', clientName: '木村 博', propertyName: '江戸川・葛飾エリア',
    desiredArea: '東京都江戸川区・葛飾区', propertyType: '戸建て',
    prefecture: '東京都',
    budget: 38000000, brokerageFee: calcBrokerageFee(38000000),
    stage: '問い合わせ', staff: '伊藤',
    startDate: '2026-03-22', lastContactDate: '2026-03-28',
    notes: '3LDK希望。資金計画相談中。', daysInStage: 9,
  },
  {
    id: 'B006', clientName: '清水 雅代', propertyName: '江東リバーサイド',
    desiredArea: '東京都江東区・江戸川区', propertyType: 'マンション',
    prefecture: '東京都',
    budget: 60000000, brokerageFee: calcBrokerageFee(60000000),
    stage: '決済', staff: '山田',
    startDate: '2025-10-20', lastContactDate: '2026-03-31',
    notes: '3LDK、今週決済完了予定。', daysInStage: 2,
  },
  {
    id: 'B007', clientName: '藤田 健太郎', propertyName: '中野・練馬エリア',
    desiredArea: '東京都中野区・練馬区', propertyType: 'マンション',
    prefecture: '東京都',
    budget: 50000000, brokerageFee: calcBrokerageFee(50000000),
    stage: '内見', staff: '鈴木',
    startDate: '2026-03-01', lastContactDate: '2026-03-29',
    notes: '2LDK希望。内見5件実施済み。絞り込み段階。', daysInStage: 22,
  },
  {
    id: 'B008', clientName: '佐藤 美穂', propertyName: '大阪市内マンション',
    desiredArea: '大阪府大阪市', propertyType: 'マンション',
    prefecture: '大阪府',
    budget: 45000000, brokerageFee: calcBrokerageFee(45000000),
    stage: '内見', staff: '佐藤',
    startDate: '2026-03-10', lastContactDate: '2026-03-30',
    notes: '2LDK希望。大阪市内で内見実施中。', daysInStage: 12,
  },
  {
    id: 'B009', clientName: '山田 隆史', propertyName: '大阪市中央区エリア',
    desiredArea: '大阪府大阪市中央区', propertyType: 'マンション',
    prefecture: '大阪府',
    budget: 38000000, brokerageFee: calcBrokerageFee(38000000),
    stage: '問い合わせ', staff: '山田',
    startDate: '2026-03-27', lastContactDate: '2026-03-30',
    notes: '1LDK〜2LDK希望。問い合わせ初期対応中。', daysInStage: 4,
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

// ── Chatwork メッセージモックデータ（直近10件） ───────────────────────
export const chatworkMessages: ChatworkMessage[] = [
  {
    messageId: 'msg001',
    roomId: 'ROOM_NOTIFICATION',
    roomName: '通知チャット',
    roomType: 'notification',
    account: { name: 'LINE公式アカウント' },
    body: '[LINE通知] 新規問い合わせ：「3LDKマンションを探しています。予算は6000万円前後です。」',
    sendTime: 1743382500,
  },
  {
    messageId: 'msg002',
    roomId: 'ROOM_CUSTOMER',
    roomName: 'メッセージチャット',
    roomType: 'customer',
    account: { name: '転送Bot' },
    body: '[転送] 山本様より「内覧の希望日を変更したいのですが、来週土曜日は可能ですか？」',
    sendTime: 1743381800,
  },
  {
    messageId: 'msg003',
    roomId: 'ROOM_NOTIFICATION',
    roomName: '通知チャット',
    roomType: 'notification',
    account: { name: 'LINE公式アカウント' },
    body: '[LINE通知] 新規問い合わせ：「戸建ての売却を検討しています。査定をお願いしたいです。」',
    sendTime: 1743380000,
  },
  {
    messageId: 'msg004',
    roomId: 'ROOM_OPERATIONS',
    roomName: '運用チャット',
    roomType: 'operations',
    account: { name: '鈴木' },
    body: '3月の月次集計を共有します。売上目標達成率は98%でした。来月は引き続き注力します。',
    sendTime: 1743378000,
  },
  {
    messageId: 'msg005',
    roomId: 'ROOM_HP_LINE',
    roomName: 'HP,LINEチャット',
    roomType: 'hp_line',
    account: { name: 'LP制作担当' },
    body: 'LP改修の件、デザイン案を送りました。ご確認ください。修正点があればお知らせください。',
    sendTime: 1743375000,
  },
  {
    messageId: 'msg006',
    roomId: 'ROOM_NOTIFICATION',
    roomName: '通知チャット',
    roomType: 'notification',
    account: { name: 'LINE公式アカウント' },
    body: '[LINE通知] 新規問い合わせ：「川崎市内でファミリー向けマンションを購入したいです。」',
    sendTime: 1743372000,
  },
  {
    messageId: 'msg007',
    roomId: 'ROOM_CUSTOMER',
    roomName: 'メッセージチャット',
    roomType: 'customer',
    account: { name: '転送Bot' },
    body: '[転送] 高橋様より「申込書の記入方法について教えていただけますか？」',
    sendTime: 1743369000,
  },
  {
    messageId: 'msg008',
    roomId: 'ROOM_OPERATIONS',
    roomName: '運用チャット',
    roomType: 'operations',
    account: { name: '田中' },
    body: '荻窪ガーデン（S007）の価格調整について、オーナーと協議しました。来週結論を出す予定です。',
    sendTime: 1743366000,
  },
  {
    messageId: 'msg009',
    roomId: 'ROOM_RECRUITMENT',
    roomName: '求人チャット',
    roomType: 'recruitment',
    account: { name: '採用担当' },
    body: '来週の面接日程を調整しました。3名の候補者です。詳細はカレンダーをご確認ください。',
    sendTime: 1743300000,
  },
  {
    messageId: 'msg010',
    roomId: 'ROOM_NOTIFICATION',
    roomName: '通知チャット',
    roomType: 'notification',
    account: { name: 'LINE公式アカウント' },
    body: '[LINE通知] 新規問い合わせ：「相続した土地の売却について相談したいです。」',
    sendTime: 1743363000,
  },
]
