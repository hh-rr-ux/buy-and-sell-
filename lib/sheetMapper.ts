/**
 * sheetMapper.ts
 *
 * /api/sheets-data が返す Record<string, string>[] を
 * アプリ内型（SellCase / BuyCase）にマッピングする。
 *
 * 実際のシート列名（sheets-preview で確認済み）:
 *   【売却】案件管理: 管理No, ステータス, 顧客名, 物件名, 号室, 所在地（市区名）,
 *                    エリア区分, 担当者, 物件種別, 媒介契約日, 売買契約日, 決済日 など
 *                    ※ 物件価格列なし → askingPrice は 0
 *   【購入】案件管理: 管理No, ステータス, 顧客名, 物件名, 所在地（市区名）,
 *                    売主仲介／担当, エリア区分, 担当者, 物件種別,
 *                    買付価格, 成約価格, 仲介手数料（税込）など
 */

import {
  type SellCase, type BuyCase,
  type SellStage, type BuyStage, type Staff,
  calcBrokerageFee, SELL_STAGES, BUY_STAGES,
} from './mockData'

type SheetRow = Record<string, string>
type InquiryData = Record<string, Record<string, number[]>>

/** 列名の候補リストから最初に値が取れたものを返す */
function g(row: SheetRow, ...keys: string[]): string {
  for (const k of keys) {
    const v = row[k]
    if (v !== undefined && v !== '') return v
  }
  return ''
}

/** 日付文字列から経過日数を計算 */
function daysFromDate(s: string): number {
  if (!s) return 0
  // "2025/04/01", "2025-04-01", "2025年4月1日" 等に対応
  const clean = s.replace(/年/g, '/').replace(/月/g, '/').replace(/日/g, '').trim()
  const d = new Date(clean)
  if (isNaN(d.getTime())) return 0
  const now = new Date()
  return Math.max(0, Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)))
}

/** 数値文字列をパース（万円・億円表記も対応） */
function parseNum(s: string): number {
  if (!s) return 0
  const clean = s.replace(/[^\d.億万]/g, '')
  const oku = clean.match(/^([\d.]+)億/)
  if (oku) return Math.floor(parseFloat(oku[1]) * 100_000_000)
  const man = clean.match(/^([\d.]+)万/)
  if (man) return Math.floor(parseFloat(man[1]) * 10_000)
  return Math.floor(parseFloat(clean) || 0)
}

/**
 * ステージ名の正規化。
 * シートの実際の値（例: "対応終了（他決など）"）をアプリ内ステージ名にマッピング。
 */
function normalizeStage(raw: string, validStages: readonly string[]): string {
  if (validStages.includes(raw)) return raw
  const aliases: Record<string, string> = {
    // 表記ゆれ — 問い合わせ系
    '問合わせ':              '問い合わせ',
    '問合せ':               '問い合わせ',
    '新規問い合わせ':       '問い合わせ',
    '新規問合せ':           '問い合わせ',
    '新規':                 '問い合わせ',
    '相談':                 '問い合わせ',
    '相談中':               '問い合わせ',
    // 査定系
    '面談':                 '査定',
    '現地調査':             '査定',
    '訪問査定':             '査定',
    '机上査定':             '査定',
    '査定中':               '査定',
    '査定後お客様返答待ち': '査定',
    '面談後お客様返答待ち': '査定',
    // 媒介系
    '媒介':                 '媒介契約',
    '専任媒介':             '媒介契約',
    '一般媒介':             '媒介契約',
    '専属専任':             '媒介契約',
    '物件調査・図面作成依頼': '媒介契約',
    // 販売活動系
    '販売':                 '販売活動',
    '販売中':               '販売活動',
    '広告中':               '販売活動',
    '募集中':               '販売活動',
    // 内見系
    '内覧':                 '内見',
    '内見中':               '内見',
    '物件紹介':             '内見',
    '物件案内':             '内見',
    // 購入申し込み系
    '買付':                 '購入申し込み',
    '買付申込':             '購入申し込み',
    '申込':                 '購入申し込み',
    '購入申込':             '購入申し込み',
    '買付証明':             '購入申し込み',
    // 売買契約系
    '契約':                 '売買契約',
    '契約済':               '売買契約',
    '契約済み':             '売買契約',
    '売買契約準備（書類作成）': '売買契約',
    // ローン系
    'ローン':               'ローン審査',
    'ローン確認':           'ローン審査',
    'ローン審査中':         'ローン審査',
    '融資審査':             'ローン審査',
    // 決済系
    '決済済':               '決済',
    '決済済み':             '決済',
    '引渡':                 '決済',
    '引渡し':               '決済',
    '引き渡し':             '決済',
    '完了':                 '決済',
    '契約完了':             '決済',
    // 終了系
    '対応終了（他決など）':       '相談終了',
    '取扱終了':                   '相談終了',
    '相談終了':                   '相談終了',
    '対応終了':                   '相談終了',
    'キャンセル':                 '相談終了',
    '取下':                       '相談終了',
    '取下げ':                     '相談終了',
    '中止':                       '相談終了',
    '他決':                       '相談終了',
    '相談終了（相場確認のみ）':         '相談終了',
    '相談終了（将来検討／半年〜数年）': '相談終了',
  }
  return aliases[raw] || raw
}

/** ステージに対応する「そのステージに入った日」を返す */
function sellStageDateKey(row: SheetRow, stage: string): string {
  switch (stage) {
    case '決済':       return g(row, '決済日', '引渡日', '引き渡し日')
    case '売買契約':   return g(row, '売買契約日', '契約日')
    case '媒介契約':
    case '販売活動':   return g(row, '媒介契約日')
    case '査定':       return g(row, '面談日', '査定日', '訪問日')
    default:           return g(row, '面談日', '問い合わせ日', '登録日', '受付日', '開始日')
  }
}

export function mapSellCase(row: SheetRow, idx: number): SellCase {
  const priceStr      = g(row, '物件価格', '希望価格', '売価', '価格', '販売価格')
  const price         = parseNum(priceStr)
  const contractStr   = g(row, '成約価格', '成約金額')
  const contractPrice = parseNum(contractStr)
  const assessStr     = g(row, '査定価格', '査定額', '査定金額')
  const assessmentPrice = parseNum(assessStr)
  const feeStr        = g(row, '仲介手数料（税込）', '仲介手数料', '手数料', '報酬額')
  const baseForFee    = contractPrice || price || assessmentPrice
  const fee           = parseNum(feeStr) || (baseForFee > 0 ? calcBrokerageFee(baseForFee) : 0)
  const stageRaw      = g(row, 'ステータス', '進捗', 'ステージ', '状況', '進捗状況')
  const stage         = normalizeStage(stageRaw, [...SELL_STAGES, '相談終了']) as SellStage
  const startDate     = g(row, '面談日', '媒介契約日', '開始日', '受付日', '問い合わせ日', '登録日')
  const stageDate     = sellStageDateKey(row, stage) || startDate

  return {
    id:                 g(row, '管理No', 'No', 'ID', '番号', 'No.', '管理番号') || `S${String(idx + 1).padStart(3, '0')}`,
    clientName:         g(row, '顧客名', 'お客様名', '氏名', '顧客', 'お客様', '売主名'),
    propertyName:       g(row, '物件名', '物件', '名称', '物件名称') || `物件${idx + 1}`,
    propertyAddress:    g(row, '所在地（市区名）', '住所', '物件住所', '所在地', '物件所在地'),
    propertyType:       g(row, '物件種別', '種別', '種類', 'タイプ'),
    prefecture:         g(row, 'エリア区分', '都道府県', '県', '府', '都'),
    askingPrice:        price,
    contractPrice,
    assessmentPrice,
    brokerageFee:       fee,
    stage,
    staff:              (g(row, '担当者', '担当', '担当スタッフ', '担当名') || '—') as Staff,
    startDate,
    lastContactDate:    g(row, '次回報告日', '決済日', '売買契約日', '最終連絡日', '最終対応日'),
    notes:              g(row, 'メモ', '備考', '特記事項', 'コメント', '備考欄'),
    daysInStage:        daysFromDate(stageDate),
    counterpartyBroker: g(row, '買側業者', '対応業者', '相手業者', '仲介業者', '購入側業者') || '—',
  }
}

/** ステージに対応する「そのステージに入った日」を返す */
function buyStageDateKey(row: SheetRow, stage: string): string {
  switch (stage) {
    case '決済':          return g(row, '決済日', '引渡日', '引き渡し日')
    case 'ローン審査':
    case '売買契約':      return g(row, '売買契約日', '契約日')
    case '購入申し込み':  return g(row, '買付申込日', '申込日', '買付日')
    case '内見':          return g(row, '内見日', '案内日')
    default:              return g(row, '面談日', '問い合わせ日', '登録日', '受付日', '開始日')
  }
}

export function mapBuyCase(row: SheetRow, idx: number): BuyCase {
  const budgetStr   = g(row, '買付価格', '予算', '購入予算', '物件価格', '価格')
  const contractStr = g(row, '成約価格', '成約金額')
  const budget        = parseNum(budgetStr)
  const contractPrice = parseNum(contractStr)
  const feeStr    = g(row, '仲介手数料（税込）', '仲介手数料', '手数料', '報酬額')
  const basePrice = contractPrice || budget
  const fee       = parseNum(feeStr) || (basePrice > 0 ? calcBrokerageFee(basePrice) : 0)
  const stageRaw  = g(row, 'ステータス', '進捗', 'ステージ', '状況', '進捗状況')
  const stage     = normalizeStage(stageRaw, [...BUY_STAGES, '相談終了']) as BuyStage
  const startDate = g(row, '面談日', '開始日', '受付日', '問い合わせ日', '登録日')
  const stageDate = buyStageDateKey(row, stage) || startDate

  return {
    id:                 g(row, '管理No', 'No', 'ID', '番号', 'No.', '管理番号') || `B${String(idx + 1).padStart(3, '0')}`,
    clientName:         g(row, '顧客名', 'お客様名', '氏名', '顧客', 'お客様', '買主名'),
    propertyName:       g(row, '物件名', '物件', '名称', '希望物件', '物件名称') || `物件${idx + 1}`,
    desiredArea:        g(row, '所在地（市区名）', '希望エリア', 'エリア区分', '希望地域', '地域'),
    propertyType:       g(row, '物件種別', '種別', '種類', 'タイプ'),
    prefecture:         g(row, 'エリア区分', '都道府県', '県', '府', '都'),
    budget,
    contractPrice,
    brokerageFee:       fee,
    stage,
    staff:              (g(row, '担当者', '担当', '担当スタッフ', '担当名') || '—') as Staff,
    startDate,
    lastContactDate:    g(row, '決済日', '売買契約', '次回報告日', '最終連絡日', '最終対応日'),
    notes:              g(row, 'メモ', '備考', '特記事項', 'コメント', '備考欄'),
    daysInStage:        daysFromDate(stageDate),
    counterpartyBroker: g(row, '売主仲介／担当', '売側業者', '対応業者', '相手業者', '仲介業者') || '—',
  }
}

/** 売上集計タブ → MonthlyStats[] */
export function mapSalesSummary(
  rows: SheetRow[],
): import('./mockData').MonthlyStats[] {
  return rows.map(row => {
    const month = g(row, '月', '売上対象月', '年月', '対象月', '期間')
    if (!month) return null
    const revenue     = parseNum(g(row, '売上', '売上合計', '仲介手数料合計', '手数料合計', '売上金額', '合計売上', '売上（税込）'))
    const closedSell  = parseInt(g(row, '売却成約', '成約（売却）', '売却成約数', '売却件数', '成約件数売却', '売却')) || 0
    const closedBuy   = parseInt(g(row, '購入成約', '成約（購入）', '購入成約数', '購入件数', '成約件数購入', '購入')) || 0
    const newInquiries = parseInt(g(row, '新規問い合わせ', '問い合わせ数', '新規問合せ', '問合せ数', '問合せ')) || 0
    return { month, revenue, closedSell, closedBuy, newInquiries, totalRevenue: revenue }
  }).filter((m): m is NonNullable<typeof m> => m !== null)
}

/** 入金確認タブ → 月別入金確認済み金額の集計 */
export function mapPaymentRecords(
  rows: SheetRow[],
): Record<string, number> {
  // 確認済みと見なす値のセット（厳密判定 — 空白・未確認・ヘッダー行を除外）
  const CONFIRMED = new Set([
    '○', '◯', '✓', '✔', '済', '完了', '確認済', '入金済',
    'TRUE', 'true', '1', 'yes', 'YES', '✅',
  ])
  const result: Record<string, number> = {}

  console.group('[mapPaymentRecords] 入金確認タブ 行別解析')
  console.log(`総行数: ${rows.length}`)

  let confirmedCount = 0
  for (const row of rows) {
    const dateStr = g(row, '日付', '入金日', '年月', '対象月', '月', '決済日')
    if (!dateStr) {
      console.log(`  [SKIP] 日付なし row:`, JSON.stringify(row).slice(0, 120))
      continue
    }

    // "2026/04/05", "2026-04-05", "2026年4月5日", "2026年4月" → "2026-04"
    const clean = dateStr
      .replace(/年/g, '-').replace(/月\d*日?/g, '').replace(/月/g, '')
      .replace(/\//g, '-').trim()
    const parts = clean.split('-').filter(p => p.length > 0)
    if (parts.length < 2) {
      console.log(`  [SKIP] 日付パース失敗 dateStr="${dateStr}" clean="${clean}"`)
      continue
    }
    const monthKey = `${parts[0]}-${parts[1].padStart(2, '0')}`  // "2026-04"

    const confirmVal = g(row, '入金確認', '確認', 'ステータス', '状態', '入金').trim()
    const isConfirmed = CONFIRMED.has(confirmVal)

    // どの列から金額を取得するか特定してログ
    const AMOUNT_COLS = ['入金額', '金額', '仲介手数料（税込）', '仲介手数料', '手数料', '売上'] as const
    let amountCol = ''
    let amountRaw = ''
    for (const col of AMOUNT_COLS) {
      const v = row[col]
      if (v !== undefined && v !== '') { amountCol = col; amountRaw = v; break }
    }
    const amount = parseNum(amountRaw)

    console.log(
      `  ${isConfirmed ? '✅' : '❌'} month=${monthKey} confirm="${confirmVal}" ` +
      `col="${amountCol}" raw="${amountRaw}" parsed=${amount.toLocaleString()}円 ` +
      `物件="${g(row, '物件名', '件名', '案件名') || '—'}"`,
    )

    if (!isConfirmed) continue
    if (amount > 0) {
      result[monthKey] = (result[monthKey] || 0) + amount
      confirmedCount++
    }
  }

  console.log('\n[mapPaymentRecords] 月別集計:')
  Object.entries(result).sort().forEach(([m, v]) =>
    console.log(`  ${m}: ${v.toLocaleString()}円`),
  )
  console.log(`確認済み合計: ${confirmedCount}件`)
  console.groupEnd()

  return result
}

/** タブ名 "26年4月" → "2026年4月" */
function tabToMonth(tab: string): string {
  const m = tab.match(/^(\d{2})年(\d{1,2})月$/)
  return m ? `20${m[1]}年${m[2]}月` : tab
}

/** 問い合わせ数シート（売却・購入）から月別統計を生成 */
export function mapInquiryStats(
  sellInq: InquiryData,
  buyInq:  InquiryData,
): Record<string, { newInquiries: number; closedSell: number; closedBuy: number }> {
  const result: Record<string, { newInquiries: number; closedSell: number; closedBuy: number }> = {}

  const allTabs = Array.from(new Set([...Object.keys(sellInq), ...Object.keys(buyInq)]))

  for (const tab of allTabs) {
    const month   = tabToMonth(tab)
    const sTab    = sellInq[tab] || {}
    const bTab    = buyInq[tab]  || {}
    const sum     = (arr: number[]) => arr.reduce((a, b) => a + b, 0)

    result[month] = {
      newInquiries: sum(sTab['新規問い合わせ'] || []) + sum(bTab['新規問い合わせ'] || []),
      closedSell:   sum(sTab['成約'] || []),
      closedBuy:    sum(bTab['成約'] || []),
    }
  }

  return result
}
