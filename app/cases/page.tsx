'use client'

export const dynamic = 'force-static'

import { useState } from 'react'
import { ClipboardList, Filter } from 'lucide-react'
import { sellCases, buyCases, calcBrokerageFee, formatPrice, type Staff } from '@/lib/mockData'

const stageColors: Record<string, string> = {
  '問い合わせ':    '#6b7280',
  '査定':         '#3b82f6',
  '媒介契約':     '#8b5cf6',
  '販売活動':     '#f97316',
  '内見':         '#06b6d4',
  '購入申し込み':  '#6366f1',
  '売買契約':     '#eab308',
  'ローン審査':   '#ec4899',
  '決済':         '#22c55e',
}

// 売却・購入を統合した案件リスト
const allCases = [
  ...sellCases.map(c => ({
    id: c.id,
    type: '売却' as const,
    propertyName: c.propertyName,
    stage: c.stage,
    staff: c.staff,
    price: c.askingPrice,
    fee: calcBrokerageFee(c.askingPrice),
    daysInStage: c.daysInStage,
    lastContactDate: c.lastContactDate,
  })),
  ...buyCases.map(c => ({
    id: c.id,
    type: '購入' as const,
    propertyName: c.propertyName,
    stage: c.stage,
    staff: c.staff,
    price: c.budget,
    fee: calcBrokerageFee(c.budget),
    daysInStage: c.daysInStage,
    lastContactDate: c.lastContactDate,
  })),
]

const ALL_STAGES = Array.from(new Set(allCases.map(c => c.stage)))
const ALL_STAFF: Staff[] = ['鈴木', '田中', '佐藤', '山田', '伊藤']

type TypeFilter = '全て' | '売却' | '購入'

export default function CasesPage() {
  const [typeFilter, setTypeFilter]   = useState<TypeFilter>('全て')
  const [stageFilter, setStageFilter] = useState<string>('全て')
  const [staffFilter, setStaffFilter] = useState<string>('全て')

  const filtered = allCases.filter(c => {
    if (typeFilter  !== '全て' && c.type  !== typeFilter)  return false
    if (stageFilter !== '全て' && c.stage !== stageFilter) return false
    if (staffFilter !== '全て' && c.staff !== staffFilter) return false
    return true
  })

  const totalFee = filtered.reduce((sum, c) => sum + c.fee, 0)

  return (
    <div className="p-6 max-w-full">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList size={22} className="text-indigo-400" />
            <h1 className="text-2xl font-bold text-gray-900">案件一覧</h1>
          </div>
          <p className="text-gray-500 text-sm mt-0.5">
            全{allCases.length}件（売却 {sellCases.length}件 / 購入 {buyCases.length}件）
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">表示中の仲介手数料合計</p>
          <p className="text-xl font-bold text-indigo-600">{formatPrice(totalFee)}</p>
        </div>
      </div>

      {/* フィルター */}
      <div className="bg-white border border-gray-100 rounded-xl p-3 mb-5 flex flex-wrap items-center gap-4 shadow-sm">
        <div className="flex items-center gap-2 text-gray-400">
          <Filter size={15} />
          <span className="text-sm text-gray-500 font-medium">絞り込み</span>
        </div>

        {/* 種別タブ */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {(['全て', '売却', '購入'] as TypeFilter[]).map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                typeFilter === t
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">ステージ</label>
          <select
            value={stageFilter}
            onChange={e => setStageFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <option value="全て">全て</option>
            {ALL_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">担当</label>
          <select
            value={staffFilter}
            onChange={e => setStaffFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <option value="全て">全て</option>
            {ALL_STAFF.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <span className="text-xs text-gray-400 ml-auto">{filtered.length}件表示中</span>
      </div>

      {/* テーブル */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-16">ID</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">種別</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">物件名</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">ステータス</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">担当者</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">物件価格</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">仲介手数料</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c, i) => (
              <tr
                key={c.id}
                className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                  i % 2 === 0 ? '' : 'bg-gray-50/30'
                }`}
              >
                <td className="px-4 py-3">
                  <span className="font-mono text-xs text-gray-400">{c.id}</span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block text-white text-xs font-bold px-2 py-0.5 rounded ${
                      c.type === '売却' ? 'bg-red-500' : 'bg-blue-500'
                    }`}
                  >
                    {c.type}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="font-medium text-gray-800">{c.propertyName}</span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white"
                    style={{ backgroundColor: stageColors[c.stage] ?? '#6b7280' }}
                  >
                    {c.stage}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-xs font-medium">
                    {c.staff}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="font-semibold text-blue-600">{formatPrice(c.price)}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="font-semibold text-indigo-600">{formatPrice(c.fee)}</span>
                </td>
              </tr>
            ))}
          </tbody>
          {/* 合計行 */}
          <tfoot>
            <tr className="border-t-2 border-gray-200 bg-gray-50">
              <td colSpan={5} className="px-4 py-3 text-xs font-semibold text-gray-500">
                合計 {filtered.length}件
              </td>
              <td className="px-4 py-3 text-right">
                <span className="font-bold text-blue-700">{formatPrice(filtered.reduce((s, c) => s + c.price, 0))}</span>
              </td>
              <td className="px-4 py-3 text-right">
                <span className="font-bold text-indigo-700">{formatPrice(totalFee)}</span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
