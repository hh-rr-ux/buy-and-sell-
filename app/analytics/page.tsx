'use client'

export const dynamic = 'force-static'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  FunnelChart,
  Funnel,
  LabelList,
  LineChart,
  Line,
} from 'recharts'
import { BarChart3, TrendingUp, Users, Target, MessageCircle } from 'lucide-react'
import { monthlyStats, staffStats, conversionFunnel, sellCases, buyCases, lineInquiries } from '@/lib/mockData'

const COLORS = ['#6b7280', '#3b82f6', '#8b5cf6', '#f97316', '#eab308', '#22c55e']
const STAFF_COLORS = ['#3b82f6', '#8b5cf6', '#22c55e', '#f97316', '#ec4899']

const stageDistribution = [
  { name: '問い合わせ', value: sellCases.filter(c => c.stage === '問い合わせ').length + buyCases.filter(c => c.stage === '問い合わせ').length },
  { name: '査定/内見', value: sellCases.filter(c => c.stage === '査定').length + buyCases.filter(c => c.stage === '内見').length },
  { name: '媒介契約/申込', value: sellCases.filter(c => c.stage === '媒介契約').length + buyCases.filter(c => c.stage === '購入申し込み').length },
  { name: '販売活動/審査', value: sellCases.filter(c => c.stage === '販売活動').length + buyCases.filter(c => c.stage === 'ローン審査').length },
  { name: '売買契約', value: sellCases.filter(c => c.stage === '売買契約').length + buyCases.filter(c => c.stage === '売買契約').length },
  { name: '決済', value: sellCases.filter(c => c.stage === '決済').length + buyCases.filter(c => c.stage === '決済').length },
]

const revenueData = monthlyStats.map((m) => ({
  ...m,
  revenueM: Math.round(m.revenue / 10000),
}))

const staffPerformance = staffStats.map((s, i) => ({
  name: s.name,
  進行中: s.activeCases,
  今月成約: s.closedThisMonth,
  平均日数: s.avgDays,
  fill: STAFF_COLORS[i],
}))

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-3 text-sm">
        <p className="font-semibold text-gray-700 mb-2">{label}</p>
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-gray-500">{p.name}:</span>
            <span className="font-medium text-gray-700">{p.value}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export default function AnalyticsPage() {
  const totalClosed = monthlyStats.reduce((sum, m) => sum + m.closedSell + m.closedBuy, 0)
  const totalInquiries = monthlyStats.reduce((sum, m) => sum + m.newInquiries, 0)
  const totalRevenue = monthlyStats.reduce((sum, m) => sum + m.revenue, 0)
  const overallConversionRate = Math.round((totalClosed / totalInquiries) * 100)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <BarChart3 size={22} className="text-indigo-400" />
          <h1 className="text-2xl font-bold text-gray-900">分析</h1>
        </div>
        <p className="text-gray-500 text-sm mt-0.5">過去6ヶ月のパフォーマンス分析</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
          <p className="text-3xl font-bold text-blue-600">{totalClosed}</p>
          <p className="text-xs text-gray-500 mt-1">6ヶ月合計成約数</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
          <p className="text-3xl font-bold text-purple-600">{totalInquiries}</p>
          <p className="text-xs text-gray-500 mt-1">6ヶ月合計問い合わせ</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
          <p className="text-3xl font-bold text-green-600">{overallConversionRate}%</p>
          <p className="text-xs text-gray-500 mt-1">総合成約率</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
          <p className="text-3xl font-bold text-orange-500">
            {Math.round(totalRevenue / 10000 / 100) / 10}百万
          </p>
          <p className="text-xs text-gray-500 mt-1">6ヶ月合計売上</p>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Monthly Closed Deals */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-blue-400" />
            <h2 className="text-base font-semibold text-gray-800">月別成約数推移</h2>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyStats} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                tickFormatter={(v) => v.replace('年', '/').replace('月', '')}
              />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
              />
              <Bar dataKey="closedSell" name="売却成約" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="closedBuy" name="購入成約" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Stage Distribution Pie */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Target size={16} className="text-purple-400" />
            <h2 className="text-base font-semibold text-gray-800">ステージ別案件分布</h2>
          </div>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="60%" height={220}>
              <PieChart>
                <Pie
                  data={stageDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {stageDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [`${value}件`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {stageDistribution.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: COLORS[i] }}
                  />
                  <span className="text-xs text-gray-600 flex-1">{d.name}</span>
                  <span className="text-xs font-bold text-gray-800">{d.value}件</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Staff Performance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users size={16} className="text-green-400" />
            <h2 className="text-base font-semibold text-gray-800">担当者別パフォーマンス</h2>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={staffPerformance}
              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 12, fill: '#374151' }}
                width={35}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
              <Bar dataKey="進行中" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              <Bar dataKey="今月成約" fill="#22c55e" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Trend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-orange-400" />
            <h2 className="text-base font-semibold text-gray-800">月別売上推移（万円）</h2>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={revenueData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                tickFormatter={(v) => v.replace('年', '/').replace('月', '')}
              />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <Tooltip
                formatter={(value: number) => [`${value.toLocaleString()}万円`, '売上']}
                labelFormatter={(label) => label}
              />
              <Line
                type="monotone"
                dataKey="revenueM"
                name="売上(万円)"
                stroke="#f97316"
                strokeWidth={3}
                dot={{ fill: '#f97316', strokeWidth: 2, r: 5 }}
                activeDot={{ r: 7, fill: '#ea580c' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Conversion Funnel */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Target size={16} className="text-indigo-400" />
          <h2 className="text-base font-semibold text-gray-800">成約率ファネル（過去6ヶ月累計）</h2>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {conversionFunnel.map((item, i) => (
            <div key={item.stage} className="flex flex-col items-center">
              <div
                className="w-full rounded-xl flex flex-col items-center justify-center py-5 mb-2 transition-all"
                style={{
                  backgroundColor: COLORS[i] + '20',
                  border: `2px solid ${COLORS[i]}40`,
                  minHeight: `${Math.max(60, item.percentage * 1.2)}px`,
                }}
              >
                <span className="text-2xl font-bold" style={{ color: COLORS[i] }}>
                  {item.count}
                </span>
                <span className="text-xs font-semibold mt-1" style={{ color: COLORS[i] }}>
                  {item.percentage}%
                </span>
              </div>
              <p className="text-xs text-gray-600 text-center leading-tight font-medium">
                {item.stage}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 text-center">
            問い合わせから決済までの変換率: <span className="font-bold text-green-600">14.3%</span>
            　|　　査定・内見到達率: <span className="font-bold text-blue-600">62.9%</span>
            　|　　契約到達率: <span className="font-bold text-purple-600">40.0%</span>
          </p>
        </div>
      </div>

      {/* Monthly Inquiry vs Closed */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={16} className="text-cyan-400" />
          <h2 className="text-base font-semibold text-gray-800">問い合わせ数 vs 成約数</h2>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={monthlyStats} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              tickFormatter={(v) => v.replace('年', '/').replace('月', '')}
            />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
            <Bar dataKey="newInquiries" name="新規問い合わせ" fill="#06b6d4" radius={[4, 4, 0, 0]} opacity={0.8} />
            <Bar
              dataKey={(d) => d.closedSell + d.closedBuy}
              name="成約数"
              fill="#22c55e"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ━━━ LINE問い合わせ分析 ━━━ */}
      <LineAnalysisSection />
    </div>
  )
}

function LineAnalysisSection() {
  // 月別集計（仮値 ※スプシ連携後に実データへ置換）
  const monthlyLine = [
    { month: '10月', count: 38, converted: 3 },
    { month: '11月', count: 42, converted: 4 },
    { month: '12月', count: 35, converted: 5 },
    { month: '1月',  count: 51, converted: 4 },
    { month: '2月',  count: 47, converted: 4 },
    { month: '3月',  count: 58, converted: 5 },
  ]

  // 曜日別（仮値）
  const weekdayData = [
    { day: '月', count: 18 },
    { day: '火', count: 14 },
    { day: '水', count: 16 },
    { day: '木', count: 12 },
    { day: '金', count: 22 },
    { day: '土', count: 42 },
    { day: '日', count: 38 },
  ]

  // 時間帯別（仮値）
  const hourData = [
    { hour: '〜9時',  count: 8 },
    { hour: '9〜12時', count: 24 },
    { hour: '12〜15時', count: 31 },
    { hour: '15〜18時', count: 28 },
    { hour: '18〜21時', count: 52 },
    { hour: '21時〜',  count: 19 },
  ]

  const thisMonth   = lineInquiries.filter(d => d.date.startsWith('2026-03'))
  const lastMonth   = lineInquiries.filter(d => d.date.startsWith('2026-02'))
  const thisTotal   = thisMonth.reduce((s, d) => s + d.count, 0)
  const lastTotal   = lastMonth.reduce((s, d) => s + d.count, 0)
  const trend       = lastTotal > 0 ? Math.round(((thisTotal - lastTotal) / lastTotal) * 100) : 0
  const avgPerDay   = (thisTotal / thisMonth.length).toFixed(1)
  const totalClosed = monthlyStats[monthlyStats.length - 1].closedSell + monthlyStats[monthlyStats.length - 1].closedBuy
  const convRate    = thisTotal > 0 ? ((totalClosed / thisTotal) * 100).toFixed(1) : '0'

  const maxWeekday  = Math.max(...weekdayData.map(d => d.count))
  const maxHour     = Math.max(...hourData.map(d => d.count))

  return (
    <div className="space-y-5">
      {/* セクションヘッダー */}
      <div className="flex items-center gap-3 pt-2">
        <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
          <MessageCircle size={18} className="text-green-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">公式LINE 問い合わせ分析</h2>
          <p className="text-xs text-gray-400">※ 仮値表示中 — スプシ連携後に実データへ自動更新</p>
        </div>
      </div>

      {/* KPIカード */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center">
          <p className="text-3xl font-black text-green-600">{thisTotal}</p>
          <p className="text-xs text-green-700 font-medium mt-1">今月の問い合わせ数</p>
          <p className={`text-xs mt-1 font-semibold ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            先月比 {trend >= 0 ? '+' : ''}{trend}%
          </p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4 text-center shadow-sm">
          <p className="text-3xl font-black text-gray-800">{avgPerDay}</p>
          <p className="text-xs text-gray-500 mt-1">1日平均件数</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4 text-center shadow-sm">
          <p className="text-3xl font-black text-indigo-600">{convRate}%</p>
          <p className="text-xs text-gray-500 mt-1">LINE→成約率（今月）</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4 text-center shadow-sm">
          <p className="text-3xl font-black text-orange-500">{lastTotal}</p>
          <p className="text-xs text-gray-500 mt-1">先月の問い合わせ数</p>
        </div>
      </div>

      {/* 月別推移 + 成約数 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
          <span className="w-1 h-4 rounded-full bg-green-500 inline-block"/>
          月別LINE問い合わせ数 &amp; 成約数
        </h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={monthlyLine} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
            <Bar dataKey="count"     name="LINE問い合わせ" fill="#22c55e" radius={[4,4,0,0]} opacity={0.85} />
            <Bar dataKey="converted" name="成約数"         fill="#4f46e5" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 曜日別 + 時間帯別 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* 曜日別 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <span className="w-1 h-4 rounded-full bg-green-500 inline-block"/>
            曜日別 問い合わせ分布
            <span className="ml-auto text-xs text-gray-400 font-normal">土日が多い傾向</span>
          </h3>
          <div className="flex items-end gap-2 h-32">
            {weekdayData.map(d => {
              const pct = (d.count / maxWeekday) * 100
              const isWeekend = d.day === '土' || d.day === '日'
              return (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-bold text-gray-600">{d.count}</span>
                  <div
                    className="w-full rounded-t-md"
                    style={{
                      height: `${pct}%`,
                      minHeight: '6px',
                      backgroundColor: isWeekend ? '#22c55e' : '#bbf7d0',
                    }}
                  />
                  <span className={`text-xs font-semibold ${isWeekend ? 'text-green-600' : 'text-gray-400'}`}>{d.day}</span>
                </div>
              )
            })}
          </div>
          <p className="text-xs text-gray-400 mt-3 text-center">土日合計: {weekdayData.filter(d=>d.day==='土'||d.day==='日').reduce((s,d)=>s+d.count,0)}件 / 平日合計: {weekdayData.filter(d=>d.day!=='土'&&d.day!=='日').reduce((s,d)=>s+d.count,0)}件</p>
        </div>

        {/* 時間帯別 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <span className="w-1 h-4 rounded-full bg-indigo-500 inline-block"/>
            時間帯別 問い合わせ分布
            <span className="ml-auto text-xs text-gray-400 font-normal">夜間が最多</span>
          </h3>
          <div className="flex items-end gap-2 h-32">
            {hourData.map(d => {
              const pct = (d.count / maxHour) * 100
              const isPeak = d.hour === '18〜21時'
              return (
                <div key={d.hour} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-bold text-gray-600">{d.count}</span>
                  <div
                    className="w-full rounded-t-md"
                    style={{
                      height: `${pct}%`,
                      minHeight: '6px',
                      backgroundColor: isPeak ? '#4f46e5' : '#c7d2fe',
                    }}
                  />
                  <span className={`text-[9px] font-medium text-center leading-tight ${isPeak ? 'text-indigo-600' : 'text-gray-400'}`}>{d.hour}</span>
                </div>
              )
            })}
          </div>
          <p className="text-xs text-gray-400 mt-3 text-center">ピーク: 18〜21時（仕事終わりの時間帯）</p>
        </div>
      </div>

      {/* インサイト */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-xl p-5">
        <h3 className="text-sm font-bold text-green-800 mb-3 flex items-center gap-2">
          <MessageCircle size={15} className="text-green-600"/>
          LINE問い合わせ インサイト
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-white rounded-lg p-3 border border-green-100">
            <p className="text-xs font-bold text-gray-700 mb-1">土日の対応強化</p>
            <p className="text-xs text-gray-500">土日の問い合わせが全体の約50%。週末の初動対応スピードが成約率に直結します。</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-green-100">
            <p className="text-xs font-bold text-gray-700 mb-1">夜間通知の仕組み化</p>
            <p className="text-xs text-gray-500">18〜21時が最多。自動返信＋翌朝のフォローアップをルール化すると取りこぼしが減ります。</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-green-100">
            <p className="text-xs font-bold text-gray-700 mb-1">問い合わせ増加中</p>
            <p className="text-xs text-gray-500">前月比 +{trend}% と増加傾向。対応キャパシティの見直しを検討してください。</p>
          </div>
        </div>
      </div>
    </div>
  )
}
