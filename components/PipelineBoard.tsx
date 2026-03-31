'use client'

import { AlertCircle } from 'lucide-react'

interface Case {
  id: string
  clientName: string
  stage: string
  staff: string
  daysInStage: number
  price?: number
  budget?: number
  propertyType?: string
  propertyAddress?: string
  desiredArea?: string
}

interface PipelineBoardProps {
  stages: string[]
  cases: Case[]
  stageColors: Record<string, string>
}

function formatPrice(price: number): string {
  if (price >= 100000000) {
    return `${(price / 100000000).toFixed(1)}億円`
  }
  return `${(price / 10000).toLocaleString()}万円`
}

function getStageBadgeClass(stage: string): string {
  const map: Record<string, string> = {
    '問い合わせ': 'badge-inquiry',
    '査定': 'badge-assessment',
    '媒介契約': 'badge-contract',
    '販売活動': 'badge-sales',
    '売買契約': 'badge-purchase-contract',
    '決済': 'badge-settlement',
    '内見': 'badge-viewing',
    '購入申し込み': 'badge-application',
    'ローン審査': 'badge-loan',
  }
  return map[stage] || 'badge-inquiry'
}

export default function PipelineBoard({ stages, cases, stageColors }: PipelineBoardProps) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: '500px' }}>
      {stages.map((stage) => {
        const stageCases = cases.filter((c) => c.stage === stage)
        const color = stageColors[stage] || '#6b7280'
        const hasStalled = stageCases.some((c) => c.daysInStage > 30)

        return (
          <div
            key={stage}
            className="flex-shrink-0 w-56 flex flex-col"
          >
            {/* Column header */}
            <div
              className="rounded-t-xl px-3 py-2.5 flex items-center justify-between"
              style={{ backgroundColor: color + '20', borderTop: `3px solid ${color}` }}
            >
              <span className="text-sm font-semibold" style={{ color }}>
                {stage}
              </span>
              <div className="flex items-center gap-1.5">
                {hasStalled && (
                  <AlertCircle size={14} className="text-orange-400" />
                )}
                <span
                  className="text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center text-white"
                  style={{ backgroundColor: color }}
                >
                  {stageCases.length}
                </span>
              </div>
            </div>

            {/* Cards */}
            <div
              className="flex-1 rounded-b-xl p-2 space-y-2"
              style={{ backgroundColor: color + '08', border: `1px solid ${color}20`, borderTop: 'none' }}
            >
              {stageCases.length === 0 ? (
                <div className="text-center py-8 text-gray-300 text-xs">
                  案件なし
                </div>
              ) : (
                stageCases.map((c) => (
                  <div key={c.id} className="kanban-card">
                    <div className="flex items-start justify-between mb-1.5">
                      <span className="text-xs text-gray-400 font-mono">{c.id}</span>
                      {c.daysInStage > 30 && (
                        <span className="text-xs bg-orange-50 text-orange-500 border border-orange-200 px-1.5 py-0.5 rounded-full font-medium">
                          {c.daysInStage}日
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-gray-800 mb-1 leading-tight">
                      {c.clientName}
                    </p>
                    {c.propertyAddress && (
                      <p className="text-xs text-gray-500 mb-1.5 leading-snug truncate" title={c.propertyAddress}>
                        {c.propertyAddress}
                      </p>
                    )}
                    {c.desiredArea && (
                      <p className="text-xs text-gray-500 mb-1.5 leading-snug truncate" title={c.desiredArea}>
                        {c.desiredArea}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                      <span className="text-xs text-blue-600 font-semibold">
                        {c.price ? formatPrice(c.price) : c.budget ? formatPrice(c.budget) : '—'}
                      </span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium">
                        {c.staff}
                      </span>
                    </div>
                    {c.daysInStage <= 30 && (
                      <p className="text-xs text-gray-300 mt-1">{c.daysInStage}日経過</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
