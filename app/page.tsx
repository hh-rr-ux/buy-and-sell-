export const dynamic = 'force-static'

import {
  TrendingUp, TrendingDown, AlertCircle, CheckCircle2,
  Banknote, Activity,
} from 'lucide-react'
import {
  sellCases, buyCases, monthlyStats,
  lineInquiries, chatworkRooms,
  calcBrokerageFee, formatPrice,
} from '@/lib/mockData'
import { calculateKPIs } from '@/lib/dataLoader'

const STAGE_COLORS: Record<string, string> = {
  '問い合わせ': '#6b7280', '査定': '#3b82f6', '媒介契約': '#8b5cf6',
  '販売活動': '#f97316', '内見': '#06b6d4', '購入申し込み': '#6366f1',
  '売買契約': '#eab308', 'ローン審査': '#ec4899', '決済': '#22c55e',
}

const SELL_STAGES = ['問い合わせ','査定','媒介契約','販売活動','売買契約','決済']
const BUY_STAGES  = ['問い合わせ','内見','購入申し込み','売買契約','ローン審査','決済']

export default function DashboardPage() {
  const kpis = calculateKPIs(sellCases, buyCases, monthlyStats)

  // パイプライン総額（全進行中案件の手数料合計）
  const pipelineValue = [
    ...sellCases.filter(c => c.stage !== '決済').map(c => calcBrokerageFee(c.askingPrice)),
    ...buyCases.filter(c => c.stage !== '決済').map(c => calcBrokerageFee(c.budget)),
  ].reduce((a, b) => a + b, 0)

  // 決済間近（売買契約・ローン審査）
  const nearClosing = [
    ...sellCases.filter(c => c.stage === '売買契約' || c.stage === '決済').map(c => ({
      id: c.id, name: c.propertyName, clientName: c.clientName,
      stage: c.stage, staff: c.staff, fee: calcBrokerageFee(c.askingPrice), type: '売却',
    })),
    ...buyCases.filter(c => c.stage === 'ローン審査' || c.stage === '売買契約' || c.stage === '決済').map(c => ({
      id: c.id, name: c.propertyName, clientName: c.clientName,
      stage: c.stage, staff: c.staff, fee: calcBrokerageFee(c.budget), type: '購入',
    })),
  ]

  // 滞留案件（30日超）
  const stalledCases = [
    ...sellCases.filter(c => c.daysInStage > 30).map(c => ({
      id: c.id, name: c.propertyName, clientName: c.clientName,
      stage: c.stage, staff: c.staff, days: c.daysInStage, type: '売却',
    })),
    ...buyCases.filter(c => c.daysInStage > 30).map(c => ({
      id: c.id, name: c.propertyName, clientName: c.clientName,
      stage: c.stage, staff: c.staff, days: c.daysInStage, type: '購入',
    })),
  ]

  // 先月比
  const revenueUp = kpis.revenueTrend >= 0
  const closedUp  = kpis.closedDealsTrend >= 0

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ━━━ Hero Banner ━━━ */}
      <div className="px-6 py-6" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-white/50 text-xs font-medium uppercase tracking-widest mb-0.5">不動産売買 経営ダッシュボード</p>
              <h1 className="text-white text-xl font-bold">2026年3月 — リアルタイム概況</h1>
            </div>
            <span className="text-white/40 text-xs">最終更新: 2026-03-31</span>
          </div>

          {/* 3大指標 */}
          <div className="grid grid-cols-3 gap-4">
            {/* 今月売上 */}
            <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <p className="text-white/50 text-xs mb-1">今月の売上（確定）</p>
              <p className="text-white text-3xl font-black tracking-tight">{formatPrice(kpis.monthlyRevenue)}</p>
              <div className={`flex items-center gap-1 mt-2 text-xs font-semibold ${revenueUp ? 'text-green-400' : 'text-red-400'}`}>
                {revenueUp ? <TrendingUp size={13}/> : <TrendingDown size={13}/>}
                先月比 {revenueUp ? '+' : ''}{kpis.revenueTrend}%
              </div>
            </div>

            {/* パイプライン総額 */}
            <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <p className="text-white/50 text-xs mb-1">パイプライン総額（見込手数料）</p>
              <p className="text-white text-3xl font-black tracking-tight">{formatPrice(pipelineValue)}</p>
              <p className="text-white/40 text-xs mt-2">進行中 {kpis.activeCases}件 の合計</p>
            </div>

            {/* 今月成約数 */}
            <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <p className="text-white/50 text-xs mb-1">今月の成約数</p>
              <p className="text-white text-3xl font-black tracking-tight">{kpis.monthlyClosedDeals}<span className="text-lg font-medium text-white/60 ml-1">件</span></p>
              <div className={`flex items-center gap-1 mt-2 text-xs font-semibold ${closedUp ? 'text-green-400' : 'text-red-400'}`}>
                {closedUp ? <TrendingUp size={13}/> : <TrendingDown size={13}/>}
                先月比 {closedUp ? '+' : ''}{kpis.closedDealsTrend}%
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-5">

        {/* ━━━ 4ステータスカード ━━━ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Activity size={20} className="text-blue-500"/>
            </div>
            <div>
              <p className="text-gray-500 text-xs">進行中案件</p>
              <p className="text-2xl font-black text-gray-900">{kpis.activeCases}<span className="text-sm font-normal text-gray-400 ml-1">件</span></p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 size={20} className="text-green-500"/>
            </div>
            <div>
              <p className="text-gray-500 text-xs">決済間近</p>
              <p className="text-2xl font-black text-gray-900">{nearClosing.length}<span className="text-sm font-normal text-gray-400 ml-1">件</span></p>
              <p className="text-green-600 text-xs font-medium">{formatPrice(nearClosing.reduce((s,c)=>s+c.fee,0))}</p>
            </div>
          </div>

          <div className={`rounded-xl border shadow-sm p-4 flex items-center gap-4 ${stalledCases.length > 0 ? 'bg-red-50 border-red-100' : 'bg-white border-gray-100'}`}>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${stalledCases.length > 0 ? 'bg-red-100' : 'bg-gray-50'}`}>
              <AlertCircle size={20} className={stalledCases.length > 0 ? 'text-red-500' : 'text-gray-400'}/>
            </div>
            <div>
              <p className={`text-xs ${stalledCases.length > 0 ? 'text-red-500' : 'text-gray-500'}`}>要対応（滞留30日超）</p>
              <p className={`text-2xl font-black ${stalledCases.length > 0 ? 'text-red-600' : 'text-gray-900'}`}>{stalledCases.length}<span className="text-sm font-normal text-gray-400 ml-1">件</span></p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
              <Banknote size={20} className="text-purple-500"/>
            </div>
            <div>
              <p className="text-gray-500 text-xs">今月問い合わせ</p>
              <p className="text-2xl font-black text-gray-900">{kpis.monthlyInquiries}<span className="text-sm font-normal text-gray-400 ml-1">件</span></p>
              <p className="text-purple-600 text-xs font-medium">成約率 {kpis.conversionRate}%</p>
            </div>
          </div>
        </div>

        {/* ━━━ パイプライン進捗 ━━━ */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <span className="w-1 h-4 rounded-full bg-indigo-500 inline-block"/>
            パイプライン進捗
          </h2>
          <div className="space-y-4">
            {/* 売却 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-red-500 uppercase tracking-wide">売却仲介</span>
                <span className="text-xs text-gray-400">{sellCases.length}件</span>
              </div>
              <div className="flex gap-1.5">
                {SELL_STAGES.map(stage => {
                  const count = sellCases.filter(c => c.stage === stage).length
                  const color = STAGE_COLORS[stage]
                  return (
                    <div key={stage} className="flex-1">
                      <div className="h-8 rounded-lg flex items-center justify-center relative overflow-hidden"
                        style={{ backgroundColor: color + '18', border: `1px solid ${color}30` }}>
                        {count > 0 && (
                          <span className="text-sm font-black" style={{ color }}>{count}</span>
                        )}
                      </div>
                      <p className="text-center mt-1 text-gray-400 leading-tight" style={{ fontSize: '9px' }}>{stage}</p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 購入 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-blue-500 uppercase tracking-wide">購入仲介</span>
                <span className="text-xs text-gray-400">{buyCases.length}件</span>
              </div>
              <div className="flex gap-1.5">
                {BUY_STAGES.map(stage => {
                  const count = buyCases.filter(c => c.stage === stage).length
                  const color = STAGE_COLORS[stage]
                  return (
                    <div key={stage} className="flex-1">
                      <div className="h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: color + '18', border: `1px solid ${color}30` }}>
                        {count > 0 && (
                          <span className="text-sm font-black" style={{ color }}>{count}</span>
                        )}
                      </div>
                      <p className="text-center mt-1 text-gray-400 leading-tight" style={{ fontSize: '9px' }}>{stage}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

          {/* ━━━ 決済間近案件 ━━━ */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <span className="w-1 h-4 rounded-full bg-green-500 inline-block"/>
              決済間近 — 直近の売上予定
              <span className="ml-auto text-green-600 text-xs font-bold">{formatPrice(nearClosing.reduce((s,c)=>s+c.fee,0))}</span>
            </h2>
            {nearClosing.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">該当案件なし</p>
            ) : (
              <div className="space-y-2">
                {nearClosing.map(c => (
                  <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-100">
                    <span className={`text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${c.type === '売却' ? 'bg-red-500' : 'bg-blue-500'}`}>{c.type}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{c.name}</p>
                      <p className="text-xs text-gray-500">{c.clientName}</p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full text-white flex-shrink-0" style={{ backgroundColor: STAGE_COLORS[c.stage] }}>{c.stage}</span>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-green-600">{formatPrice(c.fee)}</p>
                      <p className="text-xs text-gray-400">{c.staff}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ━━━ 要対応・滞留案件 ━━━ */}
          <div className={`rounded-xl border shadow-sm p-5 ${stalledCases.length > 0 ? 'bg-white border-red-100' : 'bg-white border-gray-100'}`}>
            <h2 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <span className="w-1 h-4 rounded-full bg-red-500 inline-block"/>
              要対応 — 30日以上同ステージで滞留
              {stalledCases.length > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{stalledCases.length}件</span>
              )}
            </h2>
            {stalledCases.length === 0 ? (
              <div className="text-center py-4">
                <CheckCircle2 size={28} className="text-green-400 mx-auto mb-1"/>
                <p className="text-green-600 text-sm font-medium">滞留案件なし</p>
              </div>
            ) : (
              <div className="space-y-2">
                {stalledCases.map(c => (
                  <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-100">
                    <span className={`text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${c.type === '売却' ? 'bg-red-500' : 'bg-blue-500'}`}>{c.type}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{c.name}</p>
                      <p className="text-xs text-gray-500">{c.clientName}</p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full text-white flex-shrink-0" style={{ backgroundColor: STAGE_COLORS[c.stage] }}>{c.stage}</span>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-red-600">{c.days}日経過</p>
                      <p className="text-xs text-gray-400">{c.staff}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ━━━ 月次トレンド ━━━ */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <span className="w-1 h-4 rounded-full bg-blue-500 inline-block"/>
            月次売上トレンド（過去6ヶ月）
          </h2>
          <div className="flex items-end gap-3 h-28">
            {monthlyStats.map((m, i) => {
              const maxRevenue = Math.max(...monthlyStats.map(s => s.revenue))
              const heightPct  = (m.revenue / maxRevenue) * 100
              const isCurrent  = i === monthlyStats.length - 1
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
        </div>

        {/* ━━━ Chatworkチャット状況 ━━━ */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <span className="w-1 h-4 rounded-full bg-teal-500 inline-block"/>
            Chatworkチャット状況
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {chatworkRooms.map(room => {
              const isCustomerFacing = room.type === 'notification' || room.type === 'customer'
              return (
                <div
                  key={room.roomId}
                  className={`rounded-xl border p-4 flex flex-col gap-2 ${
                    isCustomerFacing
                      ? 'border-teal-200 bg-teal-50'
                      : 'border-gray-100 bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isCustomerFacing ? 'bg-teal-100' : 'bg-gray-200'
                      }`}>
                        <Activity size={14} className={isCustomerFacing ? 'text-teal-600' : 'text-gray-500'} />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-xs font-bold truncate ${isCustomerFacing ? 'text-teal-800' : 'text-gray-700'}`}>
                          {room.name}
                        </p>
                        <p className="text-gray-400 text-[10px] truncate">{room.description}</p>
                      </div>
                    </div>
                    {room.unreadCount > 0 && (
                      <span className={`text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                        isCustomerFacing ? 'bg-teal-500' : 'bg-gray-400'
                      }`}>
                        {room.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed bg-white rounded-lg px-3 py-2 border border-gray-100">
                    {room.latestMessage}
                  </p>
                  <p className="text-[10px] text-gray-400 text-right">{room.latestTime}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* ━━━ LINE問い合わせ推移 ━━━ */}
        {(() => {
          const last7 = lineInquiries.slice(-7)
          const thisMonth = lineInquiries.filter(d => d.date.startsWith('2026-03'))
          const lastMonth = lineInquiries.filter(d => d.date.startsWith('2026-02'))
          const thisMonthTotal = thisMonth.reduce((s, d) => s + d.count, 0)
          const lastMonthTotal = lastMonth.reduce((s, d) => s + d.count, 0)
          const maxCount = Math.max(...last7.map(d => d.count), 1)
          const trend = lastMonthTotal > 0
            ? Math.round(((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100)
            : 0
          const trendUp = trend >= 0
          return (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                <span className="w-1 h-4 rounded-full bg-green-500 inline-block"/>
                LINE問い合わせ推移（直近7日）
                <span className={`ml-auto flex items-center gap-1 text-xs font-semibold ${trendUp ? 'text-green-600' : 'text-red-500'}`}>
                  {trendUp ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
                  今月 {trendUp ? '+' : ''}{trend}%（先月比）
                </span>
              </h2>

              {/* 今月 vs 先月サマリー */}
              <div className="flex gap-3 mb-5">
                <div className="flex-1 rounded-xl bg-green-50 border border-green-100 px-4 py-3 text-center">
                  <p className="text-[10px] text-green-600 font-semibold mb-0.5">今月合計</p>
                  <p className="text-2xl font-black text-green-700">{thisMonthTotal}<span className="text-sm font-normal ml-0.5">件</span></p>
                </div>
                <div className="flex-1 rounded-xl bg-gray-50 border border-gray-100 px-4 py-3 text-center">
                  <p className="text-[10px] text-gray-500 font-semibold mb-0.5">先月合計</p>
                  <p className="text-2xl font-black text-gray-600">{lastMonthTotal}<span className="text-sm font-normal ml-0.5">件</span></p>
                </div>
              </div>

              {/* 棒グラフ（純CSS） */}
              <div className="flex items-end gap-2 h-24">
                {last7.map((d) => {
                  const heightPct = (d.count / maxCount) * 100
                  const dayLabel = d.date.slice(5).replace('-', '/')
                  return (
                    <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] font-bold text-green-600">{d.count}</span>
                      <div
                        className="w-full rounded-t-md bg-green-400"
                        style={{ height: `${heightPct}%`, minHeight: '4px' }}
                      />
                      <span className="text-gray-400 text-[9px]">{dayLabel}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })()}

      </div>
    </div>
  )
}
