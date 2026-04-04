/**
 * sheetMapper.ts
 *
 * /api/sheets-data が返す Record<string, string>[] を
 * アプリ内型（SellCase / BuyCase）にマッピングする。
 *
 * 列名はシートのヘッダー行をそのまま使うため、
 * 複数の候補名を試して最初にヒットした値を採用する。
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

/** ステージ名の表記ゆれを正規化 */
function normalizeStage(raw: string, validStages: readonly string[]): string {
  if (validStages.includes(raw)) return raw
  const aliases: Record<string, string> = {
    '問合わせ': '問い合わせ',
    '問合せ': '問い合わせ',
    '内覧': '内見',
    '買付': '購入申し込み',
    '買付申込': '購入申し込み',
    '申込': '購入申し込み',
    'ローン': 'ローン審査',
    'ローン確認': 'ローン審査',
  }
  return aliases[raw] || raw
}

export function mapSellCase(row: SheetRow, idx: number): SellCase {
  const priceStr = g(row, '物件価格', '希望価格', '売価', '価格', '販売価格')
  const price    = parseNum(priceStr)
  const feeStr   = g(row, '仲介手数料', '手数料', '報酬額')
  const fee      = parseNum(feeStr) || calcBrokerageFee(price)
  const stageRaw = g(row, '進捗', 'ステージ', 'ステータス', '状況', '進捗状況')
  const stage    = normalizeStage(stageRaw, [...SELL_STAGES, '相談終了']) as SellStage

  return {
    id:                 g(row, 'No', 'ID', '番号', 'No.', '管理番号') || `S${String(idx + 1).padStart(3, '0')}`,
    clientName:         g(row, '顧客名', 'お客様名', '氏名', '顧客', 'お客様', '売主名'),
    propertyName:       g(row, '物件名', '物件', '名称', '物件名称') || `物件${idx + 1}`,
    propertyAddress:    g(row, '住所', '物件住所', '所在地', '物件所在地', '所在'),
    propertyType:       g(row, '物件種別', '種別', '種類', 'タイプ', '物件タイプ'),
    prefecture:         g(row, '都道府県', '県', '府', '都'),
    askingPrice:        price,
    brokerageFee:       fee,
    stage,
    staff:              (g(row, '担当', '担当者', '担当スタッフ', '担当名') || '—') as Staff,
    startDate:          g(row, '開始日', '受付日', '問い合わせ日', '登録日', '初回日'),
    lastContactDate:    g(row, '最終連絡日', '最終対応日', '最終日', '更新日', '最終連絡'),
    notes:              g(row, 'メモ', '備考', '特記事項', 'コメント', '備考欄'),
    daysInStage:        parseInt(g(row, '経過日数', '滞在日数', 'ステージ経過')) || 0,
    counterpartyBroker: g(row, '買側業者', '対応業者', '相手業者', '仲介業者', '購入側業者') || '—',
  }
}

export function mapBuyCase(row: SheetRow, idx: number): BuyCase {
  const budgetStr = g(row, '予算', '購入予算', '物件価格', '価格', '希望価格')
  const budget    = parseNum(budgetStr)
  const feeStr    = g(row, '仲介手数料', '手数料', '報酬額')
  const fee       = parseNum(feeStr) || calcBrokerageFee(budget)
  const stageRaw  = g(row, '進捗', 'ステージ', 'ステータス', '状況', '進捗状況')
  const stage     = normalizeStage(stageRaw, [...BUY_STAGES, '相談終了']) as BuyStage

  return {
    id:                 g(row, 'No', 'ID', '番号', 'No.', '管理番号') || `B${String(idx + 1).padStart(3, '0')}`,
    clientName:         g(row, '顧客名', 'お客様名', '氏名', '顧客', 'お客様', '買主名'),
    propertyName:       g(row, '物件名', '物件', '名称', '希望物件', '物件名称') || `物件${idx + 1}`,
    desiredArea:        g(row, '希望エリア', 'エリア', '希望地域', '地域', '希望地区'),
    propertyType:       g(row, '物件種別', '種別', '種類', 'タイプ', '物件タイプ'),
    prefecture:         g(row, '都道府県', '県', '府', '都'),
    budget,
    brokerageFee:       fee,
    stage,
    staff:              (g(row, '担当', '担当者', '担当スタッフ', '担当名') || '—') as Staff,
    startDate:          g(row, '開始日', '受付日', '問い合わせ日', '登録日', '初回日'),
    lastContactDate:    g(row, '最終連絡日', '最終対応日', '最終日', '更新日', '最終連絡'),
    notes:              g(row, 'メモ', '備考', '特記事項', 'コメント', '備考欄'),
    daysInStage:        parseInt(g(row, '経過日数', '滞在日数', 'ステージ経過')) || 0,
    counterpartyBroker: g(row, '売側業者', '対応業者', '相手業者', '仲介業者', '売却側業者') || '—',
  }
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
