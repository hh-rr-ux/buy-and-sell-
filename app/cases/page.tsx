'use client'

export const dynamic = 'force-static'

import { useState } from 'react'
import { ClipboardList, LayoutGrid, List, Filter } from 'lucide-react'
import PipelineBoard from '@/components/PipelineBoard'
import CaseTable from '@/components/CaseTable'
import {
  SELL_STAGES, BUY_STAGES,
  calcBrokerageFee, formatPrice,
  type SellCase, type BuyCase, type Staff,
} from '@/lib/mockData'
import { useSheetData } from '@/lib/useSheetData'

const STAGE_COLORS: Record<string, string> = {
  '問い合わせ':    '#6b7280',
  '査定':         '#3b82f6',
  '媒介契約':     '#8b5cf6',
  '販売活動':     '#f97316',
  '内見':         '#06b6d4',
  '購入申し込み':  '#6366f1',
  '売買契約':     '#eab308',
  'ローン審査':   '#ec4899',
  '決済':         '#22c55e',
  '相談終了':     '#9ca3af',
}

// 全ステージ（売却→購入の順で重複排除 + 相談終了）
const ALL_STAGES = [
  ...SELL_STAGES,
  ...BUY_STAGES.filter(s => !SELL_STAGES.includes(s as typeof SELL_STAGES[number])),
  '相談終了',
]

type TypeFilter = 'すべて' | '売却' | '購入'

// 統合型
type UnifiedCase = {
  id: string
  type: '売却' | '購入'
  clientName: string
  propertyName: string
  propertyAddress?: string
  desiredArea?: string
  propertyType: string
  price: number
  fee: number
  stage: string
  staff: Staff
  startDate: string
  lastContactDate: string
  notes: string
  daysInStage: number
  counterpartyBroker: string
}

function buildAllCases(sells: SellCase[], buys: BuyCase[]): UnifiedCase[] {
  return [
    ...sells.map(c => ({
      id: c.id, type: '売却' as const,
      clientName: c.clientName, propertyName: c.propertyName,
      propertyAddress: c.propertyAddress, propertyType: c.propertyType,
      price: c.askingPrice, fee: calcBrokerageFee(c.askingPrice),
      stage: c.stage, staff: c.staff,
      startDate: c.startDate, lastContactDate: c.lastContactDate,
      notes: c.notes, daysInStage: c.daysInStage,
      counterpartyBroker: c.counterpartyBroker,
    })),
    ...buys.map(c => ({
      id: c.id, type: '購入' as const,
      clientName: c.clientName, propertyName: c.propertyName,
      desiredArea: c.desiredArea, propertyType: c.propertyType,
      price: c.budget, fee: calcBrokerageFee(c.budget),
      stage: c.stage, staff: c.staff,
      startDate: c.startDate, lastContactDate: c.lastContactDate,
      notes: c.notes, daysInStage: c.daysInStage,
      counterpartyBroker: c.counterpartyBroker,
    })),
  ]
}

function StageBadge({ stage }: { stage: string }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
      style={{ backgroundColor: STAGE_COLORS[stage] ?? '#6b7280' }}
    >
      {stage}
    </span>
  )
}

export default function CasesPage() {
  const { sellCases, buyCases } = useSheetData()
  const allCases = buildAllCases(sellCases, buyCases)

  const [view, setView]             = useState<'board' | 'table'>('board')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('すべて')
  const [filterStage, setFilterStage] = useState<string>('すべて')
  const [filterStaff, setFilterStaff] = useState<string>('すべて')

  const filtered = allCases.filter(c => {
    if (typeFilter   !== 'すべて' && c.type  !== typeFilter)   return false
    if (filterStage  !== 'すべて' && c.stage !== filterStage)  return false
    if (filterStaff  !== 'すべて' && c.staff !== filterStaff)  return false
    return true
  })

  // ボード表示用のステージ一覧（フィルタに応じて切替、相談終了も含む）
  const boardStages =
    typeFilter === '売却' ? [...SELL_STAGES, '相談終了'] :
    typeFilter === '購入' ? [...BUY_STAGES, '相談終了'] :
    ALL_STAGES

  const stageStats = boardStages.map(s => ({
    stage: s,
    count: allCases.filter(c =>
      c.stage === s &&
      (typeFilter === 'すべて' || c.type === typeFilter)
    ).length,
    color: STAGE_COLORS[s],
  }))

  const columns = [
    {
      key: 'id' as keyof UnifiedCase,
      label: 'ID',
      sortable: true,
      width: 'w-16',
      render: (v: UnifiedCase[keyof UnifiedCase]) => (
        <span className="font-mono text-xs text-gray-400">{String(v)}</span>
      ),
    },
    {
      key: 'type' as keyof UnifiedCase,
      label: '種別',
      render: (v: UnifiedCase[keyof UnifiedCase]) => (
        <span className={`inline-block text-white text-xs font-bold px-2 py-0.5 rounded ${v === '売却' ? 'bg-red-500' : 'bg-blue-500'}`}>
          {String(v)}
        </span>
      ),
    },
    {
      key: 'propertyName' as keyof UnifiedCase,
      label: '物件名',
      sortable: true,
      render: (v: UnifiedCase[keyof UnifiedCase]) => (
        <span className="font-medium text-gray-800">{String(v)}</span>
      ),
    },
    {
      key: 'stage' as keyof UnifiedCase,
      label: 'ステータス',
      sortable: true,
      render: (v: UnifiedCase[keyof UnifiedCase]) => <StageBadge stage={String(v)} />,
    },
    {
      key: 'counterpartyBroker' as keyof UnifiedCase,
      label: '仲介',
      render: (v: UnifiedCase[keyof UnifiedCase], row: UnifiedCase) => {
        const isBothHands = String(v) === 'リベ'
        const counterparty = String(v)
        return (
          <div className="text-xs space-y-0.5 min-w-[120px]">
            {isBothHands ? (
              <span className="inline-block bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">両手</span>
            ) : (
              <span className="inline-block bg-gray-100 text-gray-500 font-semibold px-2 py-0.5 rounded-full">片手</span>
            )}
            <div className="text-gray-500 leading-tight">
              <span className={row.type === '売却' ? 'text-red-500 font-semibold' : 'text-gray-400'}>売</span>
              <span className="text-gray-300 mx-0.5">:</span>
              <span>{row.type === '売却' ? 'リベ' : (isBothHands ? 'リベ' : counterparty)}</span>
            </div>
            <div className="text-gray-500 leading-tight">
              <span className={row.type === '購入' ? 'text-blue-500 font-semibold' : 'text-gray-400'}>買</span>
              <span className="text-gray-300 mx-0.5">:</span>
              <span>{row.type === '購入' ? 'リベ' : (isBothHands ? 'リベ' : counterparty)}</span>
            </div>
          </div>
        )
      },
    },
    {
      key: 'staff' as keyof UnifiedCase,
      label: '担当者',
      render: (v: UnifiedCase[keyof UnifiedCase]) => (
        <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-xs font-medium">{String(v)}</span>
      ),
    },
    {
      key: 'price' as keyof UnifiedCase,
      label: '販売価格',
      sortable: true,
      render: (v: UnifiedCase[keyof UnifiedCase]) => (
        <span className="font-semibold text-blue-600">{Number(v) > 0 ? formatPrice(Number(v)) : '—'}</span>
      ),
    },
    {
      key: 'fee' as keyof UnifiedCase,
      label: '仲介手数料',
      sortable: true,
      render: (v: UnifiedCase[keyof UnifiedCase]) => (
        <span className="font-semibold text-indigo-600">{Number(v) > 0 ? formatPrice(Number(v)) : '—'}</span>
      ),
    },
    {
      key: 'daysInStage' as keyof UnifiedCase,
      label: 'ステージ経過',
      sortable: true,
      render: (v: UnifiedCase[keyof UnifiedCase]) => {
        const days = Number(v)
        return (
          <span className={`text-xs font-medium ${days > 30 ? 'text-orange-600 font-bold' : 'text-gray-500'}`}>
            {days}日{days > 30 ? ' ⚠' : ''}
          </span>
        )
      },
    },
    {
      key: 'lastContactDate' as keyof UnifiedCase,
      label: '最終連絡',
      sortable: true,
      render: (v: UnifiedCase[keyof UnifiedCase]) => (
        <span className="text-xs text-gray-500">{String(v)}</span>
      ),
    },
    {
      key: 'notes' as keyof UnifiedCase,
      label: 'メモ',
      render: (v: UnifiedCase[keyof UnifiedCase]) => (
        <span className="text-xs text-gray-500 max-w-xs truncate block">{String(v)}</span>
      ),
    },
  ]

  return (
    <div className="p-6 max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList size={22} className="text-indigo-400" />
            <h1 className="text-2xl font-bold text-gray-900">案件一覧</h1>
          </div>
          <p className="text-gray-500 text-sm mt-0.5">
            全{allCases.length}件 — 売却 {sellCases.length}件 / 購入 {buyCases.length}件
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl p-1">
          <button
            onClick={() => setView('board')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              view === 'board' ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <LayoutGrid size={15} />
            ボード
          </button>
          <button
            onClick={() => setView('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              view === 'table' ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <List size={15} />
            一覧
          </button>
        </div>
      </div>

      {/* Stage Stats */}
      <div className="flex gap-3 mb-5 overflow-x-auto pb-1">
        {stageStats.map(({ stage, count, color }) => (
          <div
            key={stage}
            className="flex-shrink-0 flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-4 py-2.5 shadow-sm"
          >
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-xs text-gray-500">{stage}</span>
            <span className="text-sm font-bold" style={{ color }}>{count}件</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-100 rounded-xl p-3 mb-5 flex flex-wrap items-center gap-4 shadow-sm">
        <div className="flex items-center gap-2 text-gray-400">
          <Filter size={15} />
          <span className="text-sm text-gray-500 font-medium">絞り込み</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">種別</label>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value as TypeFilter)}
            className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <option value="すべて">すべて</option>
            <option value="売却">売却</option>
            <option value="購入">購入</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">ステージ</label>
          <select
            value={filterStage}
            onChange={e => setFilterStage(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <option value="すべて">すべて</option>
            {ALL_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">担当</label>
          <select
            value={filterStaff}
            onChange={e => setFilterStaff(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <option value="すべて">すべて</option>
            {Array.from(new Set(allCases.map(c => c.staff as string).filter(s => s && s !== '—'))).sort().map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <span className="text-xs text-gray-400 ml-auto">{filtered.length}件表示中</span>
      </div>

      {/* Content */}
      {view === 'board' ? (
        <PipelineBoard
          stages={boardStages}
          cases={filtered.map(c => ({ ...c, price: c.price }))}
          stageColors={STAGE_COLORS}
        />
      ) : (
        <CaseTable data={filtered} columns={columns} />
      )}
    </div>
  )
}
