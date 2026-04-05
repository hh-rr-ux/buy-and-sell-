'use client'

export const dynamic = 'force-static'

import { useState, useEffect } from 'react'
import { ShoppingCart, LayoutGrid, List, Filter } from 'lucide-react'
import PipelineBoard from '@/components/PipelineBoard'
import CaseTable from '@/components/CaseTable'
import { BUY_STAGES, getBestBuyPrice, type BuyCase, type BuyStage, type Staff } from '@/lib/mockData'
import { useSheetData } from '@/lib/useSheetData'

const BUY_STAGE_COLORS: Record<string, string> = {
  '問い合わせ': '#6b7280',
  '内見': '#06b6d4',
  '購入申し込み': '#6366f1',
  '売買契約': '#eab308',
  'ローン審査': '#ec4899',
  '決済': '#22c55e',
}

function formatPrice(price: number): string {
  if (price >= 100000000) {
    return `${(price / 100000000).toFixed(1)}億円`
  }
  return `${(price / 10000).toLocaleString()}万円`
}

function StageBadge({ stage }: { stage: string }) {
  const color = BUY_STAGE_COLORS[stage] || '#6b7280'
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
      style={{ backgroundColor: color }}
    >
      {stage}
    </span>
  )
}

function BuyPageSkeleton() {
  return (
    <div className="p-6 max-w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-7 w-32 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-4 w-48 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="h-9 w-36 bg-gray-100 rounded-xl animate-pulse" />
      </div>
      <div className="flex gap-3 mb-5">
        {[0,1,2,3,4,5].map(i => (
          <div key={i} className="h-10 w-24 bg-white border border-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
      <div className="h-12 bg-white border border-gray-100 rounded-xl animate-pulse mb-5" />
      <div className="grid grid-cols-3 gap-4">
        {[0,1,2,3,4,5].map(i => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 animate-pulse">
            <div className="h-4 w-24 bg-gray-200 rounded mb-3" />
            {[0,1,2].map(j => (
              <div key={j} className="h-16 bg-gray-50 rounded-lg mb-2" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function BuyPage() {
  const [mounted, setMounted] = useState(false)
  const { buyCases } = useSheetData()
  const [view, setView] = useState<'board' | 'table'>('board')
  const [filterStage, setFilterStage] = useState<BuyStage | 'すべて'>('すべて')
  const [filterStaff, setFilterStaff] = useState<Staff | 'すべて'>('すべて')

  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return <BuyPageSkeleton />

  const filtered = buyCases.filter((c) => {
    if (filterStage !== 'すべて' && c.stage !== filterStage) return false
    if (filterStaff !== 'すべて' && c.staff !== filterStaff) return false
    return true
  })

  const pipelineCases = filtered.map((c) => ({
    ...c,
    budget: getBestBuyPrice(c),
  }))

  const columns = [
    {
      key: 'id' as keyof BuyCase,
      label: '管理No',
      sortable: true,
      width: 'w-16',
      render: (v: BuyCase[keyof BuyCase]) => (
        <span className="font-mono text-xs text-gray-400">{String(v)}</span>
      ),
    },
    {
      key: 'clientName' as keyof BuyCase,
      label: '顧客名',
      sortable: true,
      render: (v: BuyCase[keyof BuyCase]) => (
        <span className="font-medium text-gray-800">{String(v)}</span>
      ),
    },
    {
      key: 'desiredArea' as keyof BuyCase,
      label: '所在地（市区名）',
      render: (v: BuyCase[keyof BuyCase]) => (
        <span className="text-gray-600 text-xs">{String(v)}</span>
      ),
    },
    {
      key: 'propertyType' as keyof BuyCase,
      label: '物件種別',
      render: (v: BuyCase[keyof BuyCase]) => (
        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">{String(v)}</span>
      ),
    },
    {
      key: 'budget' as keyof BuyCase,
      label: '価格',
      sortable: true,
      render: (_v: BuyCase[keyof BuyCase], row: BuyCase) => {
        const best = getBestBuyPrice(row)
        const label = row.contractPrice > 0 ? '成約' : '買付'
        return (
          <span className="font-semibold text-blue-600">
            {best > 0 ? <>{formatPrice(best)}<span className="text-[10px] text-gray-400 ml-1">{label}</span></> : '—'}
          </span>
        )
      },
    },
    {
      key: 'stage' as keyof BuyCase,
      label: 'ステータス',
      sortable: true,
      render: (v: BuyCase[keyof BuyCase]) => <StageBadge stage={String(v)} />,
    },
    {
      key: 'staff' as keyof BuyCase,
      label: '担当者',
      render: (v: BuyCase[keyof BuyCase]) => (
        <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-xs font-medium">{String(v)}</span>
      ),
    },
    {
      key: 'daysInStage' as keyof BuyCase,
      label: '面談からの日数',
      sortable: true,
      render: (v: BuyCase[keyof BuyCase]) => {
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
      key: 'lastContactDate' as keyof BuyCase,
      label: '決済日',
      sortable: true,
      render: (v: BuyCase[keyof BuyCase]) => (
        <span className="text-xs text-gray-500">{String(v)}</span>
      ),
    },
    {
      key: 'notes' as keyof BuyCase,
      label: 'メモ',
      render: (v: BuyCase[keyof BuyCase]) => (
        <span className="text-xs text-gray-500 max-w-xs truncate block">{String(v)}</span>
      ),
    },
  ]

  const stageStats = BUY_STAGES.map((s) => ({
    stage: s,
    count: buyCases.filter((c) => c.stage === s).length,
    color: BUY_STAGE_COLORS[s],
  }))

  return (
    <div className="p-6 max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <ShoppingCart size={22} className="text-blue-400" />
            <h1 className="text-2xl font-bold text-gray-900">購入仲介</h1>
          </div>
          <p className="text-gray-500 text-sm mt-0.5">全{buyCases.length}件 — 購入案件の管理</p>
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
          <label className="text-xs text-gray-500">ステータス</label>
          <select
            value={filterStage}
            onChange={(e) => setFilterStage(e.target.value as BuyStage | 'すべて')}
            className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            <option value="すべて">すべて</option>
            {BUY_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">担当者</label>
          <select
            value={filterStaff}
            onChange={(e) => setFilterStaff(e.target.value as Staff | 'すべて')}
            className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            <option value="すべて">すべて</option>
            {Array.from(new Set(buyCases.map(c => c.staff as string).filter(s => s && s !== '—'))).sort().map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <span className="text-xs text-gray-400 ml-auto">{filtered.length}件表示中</span>
      </div>

      {/* Content */}
      {view === 'board' ? (
        <PipelineBoard
          stages={BUY_STAGES}
          cases={pipelineCases}
          stageColors={BUY_STAGE_COLORS}
        />
      ) : (
        <CaseTable data={filtered} columns={columns} />
      )}
    </div>
  )
}
