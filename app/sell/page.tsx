'use client'

export const dynamic = 'force-static'

import { useState } from 'react'
import { TrendingDown, LayoutGrid, List, Filter } from 'lucide-react'
import PipelineBoard from '@/components/PipelineBoard'
import CaseTable from '@/components/CaseTable'
import { SELL_STAGES, type SellCase, type SellStage, type Staff } from '@/lib/mockData'
import { useSheetData } from '@/lib/useSheetData'

const SELL_STAGE_COLORS: Record<string, string> = {
  '問い合わせ': '#6b7280',
  '査定': '#3b82f6',
  '媒介契約': '#8b5cf6',
  '販売活動': '#f97316',
  '売買契約': '#eab308',
  '決済': '#22c55e',
}

function formatPrice(price: number): string {
  if (price >= 100000000) {
    return `${(price / 100000000).toFixed(1)}億円`
  }
  return `${(price / 10000).toLocaleString()}万円`
}

function StageBadge({ stage }: { stage: string }) {
  const color = SELL_STAGE_COLORS[stage] || '#6b7280'
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
      style={{ backgroundColor: color }}
    >
      {stage}
    </span>
  )
}

export default function SellPage() {
  const { sellCases } = useSheetData()
  const [view, setView] = useState<'board' | 'table'>('board')
  const [filterStage, setFilterStage] = useState<SellStage | 'すべて'>('すべて')
  const [filterStaff, setFilterStaff] = useState<Staff | 'すべて'>('すべて')

  const filtered = sellCases.filter((c) => {
    if (filterStage !== 'すべて' && c.stage !== filterStage) return false
    if (filterStaff !== 'すべて' && c.staff !== filterStaff) return false
    return true
  })

  const pipelineCases = filtered.map((c) => ({
    ...c,
    price: c.askingPrice,
  }))

  const columns = [
    {
      key: 'id' as keyof SellCase,
      label: 'ID',
      sortable: true,
      width: 'w-16',
      render: (v: SellCase[keyof SellCase]) => (
        <span className="font-mono text-xs text-gray-400">{String(v)}</span>
      ),
    },
    {
      key: 'clientName' as keyof SellCase,
      label: '顧客名',
      sortable: true,
      render: (v: SellCase[keyof SellCase]) => (
        <span className="font-medium text-gray-800">{String(v)}</span>
      ),
    },
    {
      key: 'propertyAddress' as keyof SellCase,
      label: '物件住所',
      render: (v: SellCase[keyof SellCase]) => (
        <span className="text-gray-600 text-xs">{String(v)}</span>
      ),
    },
    {
      key: 'propertyType' as keyof SellCase,
      label: '種別',
      render: (v: SellCase[keyof SellCase]) => (
        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">{String(v)}</span>
      ),
    },
    {
      key: 'askingPrice' as keyof SellCase,
      label: '希望価格',
      sortable: true,
      render: (v: SellCase[keyof SellCase]) => (
        <span className="font-semibold text-blue-600">{Number(v) > 0 ? formatPrice(Number(v)) : '—'}</span>
      ),
    },
    {
      key: 'stage' as keyof SellCase,
      label: 'ステージ',
      sortable: true,
      render: (v: SellCase[keyof SellCase]) => <StageBadge stage={String(v)} />,
    },
    {
      key: 'staff' as keyof SellCase,
      label: '担当',
      render: (v: SellCase[keyof SellCase]) => (
        <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-xs font-medium">{String(v)}</span>
      ),
    },
    {
      key: 'daysInStage' as keyof SellCase,
      label: 'ステージ経過',
      sortable: true,
      render: (v: SellCase[keyof SellCase]) => {
        const days = Number(v)
        return (
          <span
            className={`text-xs font-medium ${days > 30 ? 'text-orange-600 font-bold' : 'text-gray-500'}`}
          >
            {days}日{days > 30 ? ' ⚠' : ''}
          </span>
        )
      },
    },
    {
      key: 'lastContactDate' as keyof SellCase,
      label: '最終連絡',
      sortable: true,
      render: (v: SellCase[keyof SellCase]) => (
        <span className="text-xs text-gray-500">{String(v)}</span>
      ),
    },
    {
      key: 'notes' as keyof SellCase,
      label: 'メモ',
      render: (v: SellCase[keyof SellCase]) => (
        <span className="text-xs text-gray-500 max-w-xs truncate block">{String(v)}</span>
      ),
    },
  ]

  const stageStats = SELL_STAGES.map((s) => ({
    stage: s,
    count: sellCases.filter((c) => c.stage === s).length,
    color: SELL_STAGE_COLORS[s],
  }))

  return (
    <div className="p-6 max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <TrendingDown size={22} className="text-red-400" />
            <h1 className="text-2xl font-bold text-gray-900">売却仲介</h1>
          </div>
          <p className="text-gray-500 text-sm mt-0.5">全{sellCases.length}件 — 売却案件の管理</p>
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
      <div className="bg-white border border-gray-100 rounded-xl p-3 mb-5 flex items-center gap-4 shadow-sm">
        <div className="flex items-center gap-2 text-gray-400">
          <Filter size={15} />
          <span className="text-sm text-gray-500 font-medium">絞り込み</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">ステージ</label>
          <select
            value={filterStage}
            onChange={(e) => setFilterStage(e.target.value as SellStage | 'すべて')}
            className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            <option value="すべて">すべて</option>
            {SELL_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">担当</label>
          <select
            value={filterStaff}
            onChange={(e) => setFilterStaff(e.target.value as Staff | 'すべて')}
            className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            <option value="すべて">すべて</option>
            {Array.from(new Set(sellCases.map(c => c.staff as string).filter(s => s && s !== '—'))).sort().map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <span className="text-xs text-gray-400 ml-auto">{filtered.length}件表示中</span>
      </div>

      {/* Content */}
      {view === 'board' ? (
        <PipelineBoard
          stages={SELL_STAGES}
          cases={pipelineCases}
          stageColors={SELL_STAGE_COLORS}
        />
      ) : (
        <CaseTable data={filtered} columns={columns} />
      )}
    </div>
  )
}
