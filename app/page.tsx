export const dynamic = 'force-static'

import {
  TrendingDown,
  ShoppingCart,
  Users,
  MessageSquare,
  Target,
  Clock,
  Activity,
  CheckCircle,
  Eye,
  FileText,
  CreditCard,
  AlertCircle,
} from 'lucide-react'
import KPICard from '@/components/KPICard'
import {
  sellCases,
  buyCases,
  monthlyStats,
  recentActivities,
} from '@/lib/mockData'
import { calculateKPIs } from '@/lib/dataLoader'

function formatPrice(price: number): string {
  if (price >= 100000000) {
    return `${(price / 100000000).toFixed(1)}億円`
  }
  return `${(price / 10000).toLocaleString()}万円`
}

const activityIcons: Record<string, React.ReactNode> = {
  contract: <FileText size={16} className="text-purple-500" />,
  inquiry: <MessageSquare size={16} className="text-blue-500" />,
  viewing: <Eye size={16} className="text-cyan-500" />,
  loan: <CreditCard size={16} className="text-pink-500" />,
  settlement: <CheckCircle size={16} className="text-green-500" />,
  application: <FileText size={16} className="text-orange-500" />,
}

const activityBg: Record<string, string> = {
  contract: 'bg-purple-50',
  inquiry: 'bg-blue-50',
  viewing: 'bg-cyan-50',
  loan: 'bg-pink-50',
  settlement: 'bg-green-50',
  application: 'bg-orange-50',
}

const stageColors: Record<string, string> = {
  '問い合わせ': '#6b7280',
  '査定': '#3b82f6',
  '媒介契約': '#8b5cf6',
  '販売活動': '#f97316',
  '売買契約': '#eab308',
  '決済': '#22c55e',
  '内見': '#06b6d4',
  '購入申し込み': '#6366f1',
  'ローン審査': '#ec4899',
}

export default function DashboardPage() {
  const kpis = calculateKPIs(sellCases, buyCases, monthlyStats)

  const sellStageCount = ['問い合わせ', '査定', '媒介契約', '販売活動', '売買契約', '決済'].map((s) => ({
    stage: s,
    count: sellCases.filter((c) => c.stage === s).length,
  }))

  const buyStageCount = ['問い合わせ', '内見', '購入申し込み', '売買契約', 'ローン審査', '決済'].map((s) => ({
    stage: s,
    count: buyCases.filter((c) => c.stage === s).length,
  }))

  const stalledCases = [
    ...sellCases.filter((c) => c.daysInStage > 30).map((c) => ({
      ...c, type: '売却' as const
    })),
    ...buyCases.filter((c) => c.daysInStage > 30).map((c) => ({
      ...c, type: '購入' as const, price: c.budget
    })),
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
        <p className="text-gray-500 text-sm mt-1">2026年3月31日時点 — リアルタイム概況</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <KPICard
          title="今月の成約数"
          value={`${kpis.monthlyClosedDeals}件`}
          trend={kpis.closedDealsTrend}
          trendLabel="先月比"
          icon={<CheckCircle size={22} className="text-green-500" />}
          iconBg="bg-green-50"
          subtitle="売却2件・購入2件"
        />
        <KPICard
          title="今月の見込み売上"
          value={formatPrice(kpis.monthlyRevenue)}
          trend={kpis.revenueTrend}
          trendLabel="先月比"
          icon={<Target size={22} className="text-blue-500" />}
          iconBg="bg-blue-50"
        />
        <KPICard
          title="進行中案件数"
          value={`${kpis.activeCases}件`}
          trend={kpis.activeCasesTrend}
          trendLabel="先月比"
          icon={<Activity size={22} className="text-orange-500" />}
          iconBg="bg-orange-50"
          subtitle={`売却${sellCases.filter(c => c.stage !== '決済').length}件・購入${buyCases.filter(c => c.stage !== '決済').length}件`}
        />
        <KPICard
          title="今月の問い合わせ数"
          value={`${kpis.monthlyInquiries}件`}
          trend={kpis.inquiriesTrend}
          trendLabel="先月比"
          icon={<MessageSquare size={22} className="text-purple-500" />}
          iconBg="bg-purple-50"
        />
        <KPICard
          title="成約率"
          value={`${kpis.conversionRate}%`}
          icon={<TrendingDown size={22} className="text-pink-500" />}
          iconBg="bg-pink-50"
          subtitle="今月成約/問い合わせ"
        />
        <KPICard
          title="平均案件期間"
          value={`${kpis.avgDealDays}日`}
          icon={<Clock size={22} className="text-cyan-500" />}
          iconBg="bg-cyan-50"
          subtitle="全進行中案件平均"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        {/* Pipeline Overview */}
        <div className="xl:col-span-2 space-y-5">
          {/* Sell Pipeline */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingDown size={18} className="text-red-400" />
                <h2 className="text-base font-semibold text-gray-800">売却仲介パイプライン</h2>
              </div>
              <span className="text-xs text-gray-400">{sellCases.length}件</span>
            </div>
            <div className="flex gap-2">
              {sellStageCount.map(({ stage, count }) => (
                <div key={stage} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full rounded-t-sm h-1.5 mb-1"
                    style={{ backgroundColor: stageColors[stage] + '30' }}
                  >
                    <div
                      className="h-full rounded-t-sm"
                      style={{
                        width: count > 0 ? '100%' : '0%',
                        backgroundColor: stageColors[stage],
                      }}
                    />
                  </div>
                  <div
                    className="w-full py-2 rounded flex flex-col items-center gap-1"
                    style={{ backgroundColor: stageColors[stage] + '10' }}
                  >
                    <span
                      className="text-lg font-bold"
                      style={{ color: stageColors[stage] }}
                    >
                      {count}
                    </span>
                    <span className="text-xs text-gray-500 text-center leading-tight px-0.5"
                      style={{ fontSize: '10px' }}>
                      {stage}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Buy Pipeline */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShoppingCart size={18} className="text-blue-400" />
                <h2 className="text-base font-semibold text-gray-800">購入仲介パイプライン</h2>
              </div>
              <span className="text-xs text-gray-400">{buyCases.length}件</span>
            </div>
            <div className="flex gap-2">
              {buyStageCount.map(({ stage, count }) => (
                <div key={stage} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full rounded-t-sm h-1.5 mb-1"
                    style={{ backgroundColor: stageColors[stage] + '30' }}
                  >
                    <div
                      className="h-full rounded-t-sm"
                      style={{
                        width: count > 0 ? '100%' : '0%',
                        backgroundColor: stageColors[stage],
                      }}
                    />
                  </div>
                  <div
                    className="w-full py-2 rounded flex flex-col items-center gap-1"
                    style={{ backgroundColor: stageColors[stage] + '10' }}
                  >
                    <span
                      className="text-lg font-bold"
                      style={{ color: stageColors[stage] }}
                    >
                      {count}
                    </span>
                    <span className="text-xs text-gray-500 text-center leading-tight px-0.5"
                      style={{ fontSize: '10px' }}>
                      {stage}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stalled Cases Alert */}
          {stalledCases.length > 0 && (
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle size={16} className="text-orange-500" />
                <h3 className="text-sm font-semibold text-orange-700">
                  滞留注意 — 30日以上同ステージの案件
                </h3>
              </div>
              <div className="space-y-2">
                {stalledCases.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between bg-white rounded-lg px-3 py-2 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-gray-400">{c.id}</span>
                      <span className="font-medium text-gray-700">{c.clientName}</span>
                      <span
                        className="text-xs px-1.5 py-0.5 rounded-full font-medium text-white"
                        style={{ backgroundColor: stageColors[c.stage] }}
                      >
                        {c.stage}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="text-orange-600 font-semibold">{c.daysInStage}日経過</span>
                      <span>{c.staff}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={18} className="text-gray-400" />
            <h2 className="text-base font-semibold text-gray-800">最近の活動</h2>
          </div>
          <div className="space-y-3">
            {recentActivities.map((act) => (
              <div key={act.id} className="flex gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${activityBg[act.type] || 'bg-gray-50'}`}
                >
                  {activityIcons[act.type] || <Activity size={16} className="text-gray-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 leading-snug">{act.message}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                      {act.staff}
                    </span>
                    <span className="text-xs text-gray-400">{act.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Staff Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Users size={18} className="text-gray-400" />
          <h2 className="text-base font-semibold text-gray-800">担当者別 進行中案件</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {['鈴木', '田中', '佐藤', '山田', '伊藤'].map((staff) => {
            const staffSellCount = sellCases.filter((c) => c.staff === staff).length
            const staffBuyCount = buyCases.filter((c) => c.staff === staff).length
            const total = staffSellCount + staffBuyCount
            return (
              <div
                key={staff}
                className="border border-gray-100 rounded-xl p-4 text-center hover:border-blue-200 hover:shadow-sm transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center mx-auto mb-2 text-blue-700 font-bold text-sm">
                  {staff}
                </div>
                <p className="text-lg font-bold text-gray-900">{total}</p>
                <p className="text-xs text-gray-400 mb-2">担当案件</p>
                <div className="flex gap-1 justify-center text-xs">
                  <span className="bg-red-50 text-red-600 px-1.5 py-0.5 rounded">売{staffSellCount}</span>
                  <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">買{staffBuyCount}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
