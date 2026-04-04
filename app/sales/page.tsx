'use client'

export const dynamic = 'force-static'

import { TrendingUp, TrendingDown, Banknote, Users, MapPin } from 'lucide-react'
import {
  staffStats,
  calcBrokerageFee, formatPrice,
} from '@/lib/mockData'
import { useSheetData } from '@/lib/useSheetData'

export default function SalesPage() {
  const { sellCases, buyCases, monthlyStats } = useSheetData()

  const maxRevenue = Math.max(...monthlyStats.map(s => s.revenue))
  const current = monthlyStats[monthlyStats.length - 1]
  const prev = monthlyStats[monthlyStats.length - 2]
  const revenueTrend = prev.revenue > 0
    ? Math.round(((current.revenue - prev.revenue) / prev.revenue) * 100)
    : 0
  const trendUp = revenueTrend >= 0

  const totalRevenue = monthlyStats.reduce((s, m) => s + m.revenue, 0)
  const totalClosed = monthlyStats.reduce((s, m) => s + m.closedSell + m.closedBuy, 0)

  // エリア別 売上（決済済み案件の手数料合計）
  const closedSell = sellCases.filter(c => c.stage === '決済')
  const closedBuy = buyCases.filter(c => c.stage === '決済')

  const sellAreaMap: Record<string, { count: number; revenue: number }> = {}
  for (const c of closedSell) {
    const area = c.prefecture || '不明'
    if (!sellAreaMap[area]) sellAreaMap[area] = { count: 0, revenue: 0 }
    sellAreaMap[area].count++
    sellAreaMap[area].revenue += calcBrokerageFee(c.askingPrice)
  }
  const sellAreaRevenue = Object.entries(sellAreaMap).map(([area, v]) => ({ area, ...v })).sort((a, b) => b.revenue - a.revenue)

  const buyAreaMap: Record<string, { count: number; revenue: number }> = {}
  for (const c of closedBuy) {
    const area = c.prefecture || '不明'
    if (!buyAreaMap[area]) buyAreaMap[area] = { count: 0, revenue: 0 }
    buyAreaMap[area].count++
    buyAreaMap[area].revenue += calcBrokerageFee(c.budget)
  }
  const buyAreaRevenue = Object.entries(buyAreaMap).map(([area, v]) => ({ area, ...v })).sort((a, b) => b.revenue - a.revenue)

  // 都道府県別 成約件数
  const allClosed = [
    ...closedSell.map(c => ({ prefecture: c.prefecture, fee: calcBrokerageFee(c.askingPrice) })),
    ...closedBuy.map(c => ({ prefecture: c.prefecture, fee: calcBrokerageFee(c.budget) })),
  ]
  const prefMap: Record<string, { count: number; revenue: number }> = {}
  for (const c of allClosed) {
    if (!prefMap[c.prefecture]) prefMap[c.prefecture] = { count: 0, revenue: 0 }
    prefMap[c.prefecture].count++
    prefMap[c.prefecture].revenue += c.fee
  }
  const prefStats = Object.entries(prefMap)
    .sort((a, b) => b[1].revenue - a[1].revenue)

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ヘッダー */}
      <div className="px-6 py-6" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-white/50 text-xs font-medium uppercase tracking-widest mb-0.5">売上管理</p>
              <h1 className="text-white text-xl font-bold">売上分析ダッシュボード</h1>
            </div>
            <span className="text-white/40 text-xs">最終更新: 2026-03-31</span>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <p className="text-white/50 text-xs mb-1">今月の売上（確定）</p>
              <p className="text-white text-3xl font-black tracking-tight">{formatPrice(current.revenue)}</p>
              <div className={`flex items-center gap-1 mt-2 text-xs font-semibold ${trendUp ? 'text-green-400' : 'text-red-400'}`}>
                {trendUp ? <TrendingUp size={13}/> : <TrendingDown size={13}/>}
                先月比 {trendUp ? '+' : ''}{revenueTrend}%
              </div>
            </div>
            <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <p className="text-white/50 text-xs mb-1">6ヶ月累計売上</p>
              <p className="text-white text-3xl font-black tracking-tight">{formatPrice(totalRevenue)}</p>
              <p className="text-white/40 text-xs mt-2">2025年10月〜2026年3月</p>
            </div>
            <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <p className="text-white/50 text-xs mb-1">6ヶ月累計成約数</p>
              <p className="text-white text-3xl font-black tracking-tight">{totalClosed}<span className="text-lg font-medium text-white/60 ml-1">件</span></p>
              <p className="text-white/40 text-xs mt-2">売却 + 購入 合計</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-5">

        {/* 月次売上トレンド */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <span className="w-1 h-4 rounded-full bg-indigo-500 inline-block"/>
            月次売上トレンド（過去6ヶ月）
          </h2>
          <div className="flex items-end gap-3 h-36">
            {monthlyStats.map((m, i) => {
              const heightPct = (m.revenue / maxRevenue) * 100
              const isCurrent = i === monthlyStats.length - 1
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                  <span className={`text-xs font-bold ${isCurrent ? 'text-indigo-600' : 'text-gray-500'}`}>
                    {formatPrice(m.revenue)}
                  </span>
                  <div className="w-full rounded-t-md transition-all"
                    style={{
                      height: `${heightPct}%`,
                      minHeight: '8px',
                      backgroundColor: isCurrent ? '#4f46e5' : '#e0e7ff',
                    }}
                  />
                  <span className="text-gray-400 text-center" style={{ fontSize: '9px' }}>
                    {m.month.replace('202', '').replace('年', '/')}
                  </span>
                </div>
              )
            })}
          </div>

          {/* 月別成約件数 */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 mb-2">月別成約件数（売却 / 購入）</p>
            <div className="flex gap-3">
              {monthlyStats.map((m, i) => {
                const isCurrent = i === monthlyStats.length - 1
                return (
                  <div key={m.month} className="flex-1 text-center">
                    <div className={`rounded-lg py-2 px-1 ${isCurrent ? 'bg-indigo-50 border border-indigo-100' : 'bg-gray-50'}`}>
                      <p className={`text-xs font-bold ${isCurrent ? 'text-indigo-700' : 'text-gray-700'}`}>
                        {m.closedSell + m.closedBuy}件
                      </p>
                      <p className="text-[9px] text-gray-400 mt-0.5">
                        売{m.closedSell} / 買{m.closedBuy}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* エリア別 */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
              <span className="w-1 h-4 rounded-full bg-red-500 inline-block"/>
              エリア別売上（売却仲介）
            </h2>
            {sellAreaRevenue.every(a => a.count === 0) ? (
              <p className="text-gray-400 text-sm text-center py-4">決済済み案件なし</p>
            ) : (
              <div className="space-y-3">
                {sellAreaRevenue.map(a => {
                  const total = sellAreaRevenue.reduce((s, x) => s + x.revenue, 0)
                  const pct = total > 0 ? Math.round((a.revenue / total) * 100) : 0
                  return (
                    <div key={a.area}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <MapPin size={12} className="text-red-400"/>
                          <span className="text-sm font-semibold text-gray-700">{a.area}</span>
                          <span className="text-xs text-gray-400">{a.count}件</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-gray-800">{formatPrice(a.revenue)}</span>
                          <span className="text-xs text-gray-400 ml-1">{pct}%</span>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-red-400" style={{ width: `${pct}%` }}/>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
              <span className="w-1 h-4 rounded-full bg-blue-500 inline-block"/>
              エリア別売上（購入仲介）
            </h2>
            {buyAreaRevenue.every(a => a.count === 0) ? (
              <p className="text-gray-400 text-sm text-center py-4">決済済み案件なし</p>
            ) : (
              <div className="space-y-3">
                {buyAreaRevenue.map(a => {
                  const total = buyAreaRevenue.reduce((s, x) => s + x.revenue, 0)
                  const pct = total > 0 ? Math.round((a.revenue / total) * 100) : 0
                  return (
                    <div key={a.area}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <MapPin size={12} className="text-blue-400"/>
                          <span className="text-sm font-semibold text-gray-700">{a.area}</span>
                          <span className="text-xs text-gray-400">{a.count}件</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-gray-800">{formatPrice(a.revenue)}</span>
                          <span className="text-xs text-gray-400 ml-1">{pct}%</span>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-blue-400" style={{ width: `${pct}%` }}/>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* 都道府県別 */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <span className="w-1 h-4 rounded-full bg-purple-500 inline-block"/>
            都道府県別 成約実績
          </h2>
          {prefStats.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">決済済み案件なし</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {prefStats.map(([pref, stat]) => (
                <div key={pref} className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <MapPin size={12} className="text-purple-400 flex-shrink-0"/>
                    <span className="text-xs font-bold text-gray-700 truncate">{pref}</span>
                  </div>
                  <p className="text-lg font-black text-gray-800">{stat.count}<span className="text-xs font-normal text-gray-400 ml-1">件</span></p>
                  <p className="text-xs font-semibold text-purple-600 mt-0.5">{formatPrice(stat.revenue)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 担当者別 */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <span className="w-1 h-4 rounded-full bg-green-500 inline-block"/>
            担当者別 今月実績
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
            {staffStats.map(s => (
              <div key={s.name} className="rounded-xl bg-gray-50 border border-gray-100 p-4 text-center">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-2">
                  <Users size={16} className="text-indigo-600"/>
                </div>
                <p className="text-sm font-bold text-gray-800 mb-2">{s.name}</p>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">進行中</span>
                    <span className="font-semibold text-gray-700">{s.activeCases}件</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">今月成約</span>
                    <span className="font-semibold text-green-600">{s.closedThisMonth}件</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
