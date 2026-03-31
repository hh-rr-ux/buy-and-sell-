export type SellStage =
  | '問い合わせ'
  | '査定'
  | '媒介契約'
  | '販売活動'
  | '売買契約'
  | '決済'

export type BuyStage =
  | '問い合わせ'
  | '内見'
  | '購入申し込み'
  | '売買契約'
  | 'ローン審査'
  | '決済'

export type Staff = '鈴木' | '田中' | '佐藤' | '山田' | '伊藤'

export interface SellCase {
  id: string
  clientName: string
  propertyAddress: string
  propertyType: string
  askingPrice: number
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
  desiredArea: string
  propertyType: string
  budget: number
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
}

export const SELL_STAGES: SellStage[] = [
  '問い合わせ',
  '査定',
  '媒介契約',
  '販売活動',
  '売買契約',
  '決済',
]

export const BUY_STAGES: BuyStage[] = [
  '問い合わせ',
  '内見',
  '購入申し込み',
  '売買契約',
  'ローン審査',
  '決済',
]

export const STAFF_LIST: Staff[] = ['鈴木', '田中', '佐藤', '山田', '伊藤']

export const sellCases: SellCase[] = [
  {
    id: 'S001',
    clientName: '山本 太郎',
    propertyAddress: '東京都世田谷区太子堂3-1-5',
    propertyType: 'マンション',
    askingPrice: 65000000,
    stage: '販売活動',
    staff: '鈴木',
    startDate: '2026-01-10',
    lastContactDate: '2026-03-25',
    notes: '3LDK、築15年。内覧希望者3組あり。',
    daysInStage: 32,
  },
  {
    id: 'S002',
    clientName: '田村 花子',
    propertyAddress: '神奈川県横浜市港北区綱島東2-8-12',
    propertyType: '戸建て',
    askingPrice: 48000000,
    stage: '媒介契約',
    staff: '田中',
    startDate: '2026-02-15',
    lastContactDate: '2026-03-28',
    notes: '4LDK、築8年。専任媒介契約締結済み。',
    daysInStage: 18,
  },
  {
    id: 'S003',
    clientName: '佐々木 一郎',
    propertyAddress: '東京都渋谷区代々木5-22-1',
    propertyType: 'マンション',
    askingPrice: 92000000,
    stage: '売買契約',
    staff: '佐藤',
    startDate: '2025-11-20',
    lastContactDate: '2026-03-20',
    notes: '2LDK高層階。契約書確認中。',
    daysInStage: 7,
  },
  {
    id: 'S004',
    clientName: '中村 美咲',
    propertyAddress: '千葉県千葉市中央区春日1-15-8',
    propertyType: '戸建て',
    askingPrice: 32000000,
    stage: '査定',
    staff: '山田',
    startDate: '2026-03-18',
    lastContactDate: '2026-03-28',
    notes: '3LDK、築25年。リフォーム歴あり。',
    daysInStage: 13,
  },
  {
    id: 'S005',
    clientName: '渡辺 健二',
    propertyAddress: '東京都目黒区自由が丘1-8-20',
    propertyType: 'マンション',
    askingPrice: 78000000,
    stage: '決済',
    staff: '鈴木',
    startDate: '2025-10-05',
    lastContactDate: '2026-03-31',
    notes: '3LDK、来月決済予定。',
    daysInStage: 3,
  },
  {
    id: 'S006',
    clientName: '小林 直子',
    propertyAddress: '埼玉県さいたま市浦和区常盤6-4-9',
    propertyType: '土地',
    askingPrice: 25000000,
    stage: '問い合わせ',
    staff: '伊藤',
    startDate: '2026-03-25',
    lastContactDate: '2026-03-27',
    notes: '60坪。用途地域確認中。',
    daysInStage: 6,
  },
  {
    id: 'S007',
    clientName: '加藤 正雄',
    propertyAddress: '東京都杉並区荻窪4-32-7',
    propertyType: 'マンション',
    askingPrice: 55000000,
    stage: '販売活動',
    staff: '田中',
    startDate: '2026-01-28',
    lastContactDate: '2026-03-22',
    notes: '2LDK、内覧対応中。価格調整検討。',
    daysInStage: 45,
  },
  {
    id: 'S008',
    clientName: '松本 恵子',
    propertyAddress: '神奈川県川崎市中原区武蔵小杉2-1-5',
    propertyType: 'マンション',
    askingPrice: 71000000,
    stage: '媒介契約',
    staff: '佐藤',
    startDate: '2026-02-20',
    lastContactDate: '2026-03-29',
    notes: '3LDK高層。専属専任媒介。',
    daysInStage: 12,
  },
]

export const buyCases: BuyCase[] = [
  {
    id: 'B001',
    clientName: '伊藤 誠',
    desiredArea: '東京都世田谷区・目黒区',
    propertyType: 'マンション',
    budget: 70000000,
    stage: '内見',
    staff: '山田',
    startDate: '2026-02-10',
    lastContactDate: '2026-03-30',
    notes: '3LDK希望。学区重視。週末内見3件予定。',
    daysInStage: 15,
  },
  {
    id: 'B002',
    clientName: '高橋 由美',
    desiredArea: '神奈川県横浜市',
    propertyType: '戸建て',
    budget: 55000000,
    stage: '購入申し込み',
    staff: '鈴木',
    startDate: '2026-01-20',
    lastContactDate: '2026-03-28',
    notes: '4LDK希望。申込書提出済み。',
    daysInStage: 8,
  },
  {
    id: 'B003',
    clientName: '森 大輔',
    desiredArea: '東京都渋谷区・新宿区',
    propertyType: 'マンション',
    budget: 95000000,
    stage: '売買契約',
    staff: '佐藤',
    startDate: '2025-12-01',
    lastContactDate: '2026-03-25',
    notes: '2LDK、代々木物件で契約締結。',
    daysInStage: 5,
  },
  {
    id: 'B004',
    clientName: '岡田 幸子',
    desiredArea: '千葉県浦安市・市川市',
    propertyType: 'マンション',
    budget: 42000000,
    stage: 'ローン審査',
    staff: '田中',
    startDate: '2025-11-15',
    lastContactDate: '2026-03-20',
    notes: '2LDK、銀行審査中。結果待ち。',
    daysInStage: 21,
  },
  {
    id: 'B005',
    clientName: '木村 博',
    desiredArea: '埼玉県川口市・戸田市',
    propertyType: '戸建て',
    budget: 38000000,
    stage: '問い合わせ',
    staff: '伊藤',
    startDate: '2026-03-22',
    lastContactDate: '2026-03-28',
    notes: '3LDK希望。資金計画相談中。',
    daysInStage: 9,
  },
  {
    id: 'B006',
    clientName: '清水 雅代',
    desiredArea: '東京都江東区・江戸川区',
    propertyType: 'マンション',
    budget: 60000000,
    stage: '決済',
    staff: '山田',
    startDate: '2025-10-20',
    lastContactDate: '2026-03-31',
    notes: '3LDK、今週決済完了予定。',
    daysInStage: 2,
  },
  {
    id: 'B007',
    clientName: '藤田 健太郎',
    desiredArea: '東京都中野区・練馬区',
    propertyType: 'マンション',
    budget: 50000000,
    stage: '内見',
    staff: '鈴木',
    startDate: '2026-03-01',
    lastContactDate: '2026-03-29',
    notes: '2LDK希望。内見5件実施済み。絞り込み段階。',
    daysInStage: 22,
  },
]

export const monthlyStats: MonthlyStats[] = [
  {
    month: '2025年10月',
    closedSell: 2,
    closedBuy: 3,
    newInquiries: 8,
    revenue: 4200000,
  },
  {
    month: '2025年11月',
    closedSell: 3,
    closedBuy: 2,
    newInquiries: 6,
    revenue: 5800000,
  },
  {
    month: '2025年12月',
    closedSell: 4,
    closedBuy: 4,
    newInquiries: 5,
    revenue: 9200000,
  },
  {
    month: '2026年1月',
    closedSell: 2,
    closedBuy: 3,
    newInquiries: 9,
    revenue: 4600000,
  },
  {
    month: '2026年2月',
    closedSell: 3,
    closedBuy: 2,
    newInquiries: 11,
    revenue: 6300000,
  },
  {
    month: '2026年3月',
    closedSell: 2,
    closedBuy: 2,
    newInquiries: 14,
    revenue: 7100000,
  },
]

export const recentActivities = [
  {
    id: 1,
    type: 'contract',
    message: '佐々木様（S003）と売買契約を締結しました',
    staff: '佐藤',
    time: '2時間前',
  },
  {
    id: 2,
    type: 'inquiry',
    message: '新規問い合わせ：小林様より土地売却の相談',
    staff: '伊藤',
    time: '4時間前',
  },
  {
    id: 3,
    type: 'viewing',
    message: '山本様物件（S001）の内覧対応を完了',
    staff: '鈴木',
    time: '昨日',
  },
  {
    id: 4,
    type: 'loan',
    message: '岡田様（B004）のローン審査書類を提出',
    staff: '田中',
    time: '昨日',
  },
  {
    id: 5,
    type: 'settlement',
    message: '清水様（B006）の決済が今週完了予定',
    staff: '山田',
    time: '2日前',
  },
  {
    id: 6,
    type: 'application',
    message: '高橋様（B002）から購入申し込みを受領',
    staff: '鈴木',
    time: '3日前',
  },
]

export const staffStats = [
  { name: '鈴木', activeCases: 3, closedThisMonth: 2, avgDays: 45 },
  { name: '田中', activeCases: 3, closedThisMonth: 1, avgDays: 52 },
  { name: '佐藤', activeCases: 3, closedThisMonth: 2, avgDays: 38 },
  { name: '山田', activeCases: 3, closedThisMonth: 1, avgDays: 61 },
  { name: '伊藤', activeCases: 2, closedThisMonth: 0, avgDays: 29 },
]

export const conversionFunnel = [
  { stage: '問い合わせ', count: 35, percentage: 100 },
  { stage: '査定/内見', count: 22, percentage: 63 },
  { stage: '媒介契約/申込', count: 14, percentage: 40 },
  { stage: '販売活動/審査', count: 10, percentage: 29 },
  { stage: '売買契約', count: 7, percentage: 20 },
  { stage: '決済', count: 5, percentage: 14 },
]
