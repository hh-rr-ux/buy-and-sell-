'use client'

export const dynamic = 'force-static'

import { TrendingUp, TrendingDown, Users, MapPin } from 'lucide-react'
import { useSheetData } from '@/lib/useSheetData'

// 売上対象月 "26/2/26" "26/02" "1/30" "26/9" などを "2026年2月" 形式に正規化
function parseMonth(raw: string): string | null {
  if (!raw) return null
  const m3 = raw.match(/^(\d{2})\/(\d{1,2})\/\d/)
  if (m3) return `20${m3[1]}年${parseInt(m3[2])}月`
  const m2 = raw.match(/^(\d{2})\/(\d{1,2})$/)
  if (m2) return `20${m2[1]}年${parseInt(m2[2])}月`
  const mAmbig = raw.match(/^(\d{1,2})\/\d{1,2}$/)
  if (mAmbig) return `2026年${parseInt(mAmbig[1])}月`
  return null
}

/** エリア名の表記揺れを正規化 */
function normalizeArea(raw: string): string {
  if (!raw || raw === '—' || raw.trim() === '') return '不明'
  return raw
    .trim()
    .replace(/\s+/g, '')            // 全角・半角スペース除去
    .replace(/　/g, '')             // 全角スペース
    .replace(/市$/, '市')           // 末尾正規化（念のため）
    // 都道府県名だけの場合はそのまま維持
}

function formatFee(yen: number): string {
  if (!yen || yen <= 0) return '—'
  return `${Math.round(yen / 10000).toLocaleString()}万円`
}

export default function SalesPage() {
  const { sellCases, buyCases, monthlyStats } = useSheetData()

  // ── 月別成約数（決済ステージ・決済日ベース）─────────────────────
  const monthlyClosedMap: Record<string, { sell: number; buy: number }> = {}
  for (const c of sellCases) {
    if (c.stage !== '決済') continue
    const month = parseMonth(c.lastContactDate)
    const key = month || '不明'
    if (!monthlyClosedMap[key]) monthlyClosedMap[key] = { sell: 0, buy: 0 }
    monthlyClosedMap[key].sell++
  }
  for (const c of buyCases) {
    if (c.stage !== '決済') continue
    const month = parseMonth(c.lastContactDate)
    const key = month || '不明'
    if (!monthlyClosedMap[key]) monthlyClosedMap[key] = { sell: 0, buy: 0 }
    monthlyClosedMap[key].buy++
  }

  // monthlyStats の成約数を実データで上書き（売上金額は売上集計タブの値をそのまま使用）
  const mergedStats = monthlyStats.map(m => ({
    ...m,
    closedSell: monthlyClosedMap[m.month]?.sell ?? m.closedSell,
    closedBuy:  monthlyClosedMap[m.month]?.buy  ?? m.closedBuy,
  }))

  const totalRevenue  = mergedStats.reduce((s, m) => s + (m.revenue ?? 0), 0)
  const current       = mergedStats[mergedStats.length - 1]
  const prev          = mergedStats[mergedStats.length - 2]
  const revenueTrend  = prev?.revenue > 0
    ? Math.round(((current.revenue - prev.revenue) / prev.revenue) * 100)
    : 0
  const trendUp  = revenueTrend >= 0
  const maxClosed = Math.max(1, ...mergedStats.map(m => m.closedSell + m.closedBuy))
  const maxRevenue = Math.max(1, ...mergedStats.map(m => m.revenue ?? 0))

  // ── エリア別 成約件数＋仲介手数料（売却・購入 各集計）────────────
  type AreaStat = { count: number; fee: number }

  const sellAreaMap: Record<string, AreaStat> = {}
  for (const c of sellCases.filter(c => c.stage === '決済')) {
    const area = normalizeArea(c.prefecture || c.propertyAddress)
    if (!sellAreaMap[area]) sellAreaMap[area] = { count: 0, fee: 0 }
    sellAreaMap[area].count++
    sellAreaMap[area].fee += c.brokerageFee ?? 0
  }
  const sellAreaData  = Object.entries(sellAreaMap).sort((a, b) => b[1].count - a[1].count)
  const sellAreaTotal = sellAreaData.reduce((s, [, v]) => s + v.count, 0)
  const sellFeeTotal  = sellAreaData.reduce((s, [, v]) => s + v.fee, 0)

  const buyAreaMap: Record<string, AreaStat> = {}
  for (const c of buyCases.filter(c => c.stage === '決済')) {
    const area = normalizeArea(c.prefecture || c.desiredArea)
    if (!buyAreaMap[area]) buyAreaMap[area] = { count: 0, fee: 0 }
    buyAreaMap[area].count++
    buyAreaMap[area].fee += c.brokerageFee ?? 0
  }
  const buyAreaData  = Object.entries(buyAreaMap).sort((a, b) => b[1].count - a[1].count)
  const buyAreaTotal = buyAreaData.reduce((s, [, v]) => s + v.count, 0)
  const buyFeeTotal  = buyAreaData.reduce((s, [, v]) => s + v.fee, 0)

  // ── 担当者別（実データ）─────────────────────────────────────────
  const staffMap: Record<string, { active: number; closed: number; sell: number; buy: number; fee: number }> = {}
  const allCases = [
    ...sellCases.map(c => ({ ...c, caseType: '売却' as const })),
    ...buyCases.map(c => ({ ...c, caseType: '購入' as const })),
  ]
  for (const c of allCases) {
    const staffList = String(c.staff).split(/[/／]/).map(s => s.trim()).filter(s => s && s !== '—')
    for (const name of staffList) {
      if (!staffMap[name]) staffMap[name] = { active: 0, closed: 0, sell: 0, buy: 0, fee: 0 }
      if (c.stage === '決済') {
        staffMap[name].closed++
        staffMap[name].fee += c.brokerageFee ?? 0
        if (c.caseType === '売却') staffMap[name].sell++
        else staffMap[name].buy++
      } else if (c.stage !== '相談終了') {
        staffMap[name].active++
      }
    }
  }
  const staffData = Object.entries(staffMap)
    .sort((a, b) => (b[1].closed + b[1].active) - (a[1].closed + a[1].active))

  // ── KPI（実データ）──────────────────────────────────────────────
  const realClosedSell  = sellCases.filter(c => c.stage === '決済').length
  const realClosedBuy   = buyCases.filter(c => c.stage === '決済').length
  const realTotalClosed = realClosedSell + realClosedBuy
  const activeSell      = sellCases.filter(c => c.stage !== '決済' && c.stage !== '相談終了').length
  const activeBuy       = buyCases.filter(c => c.stage !== '決済' && c.stage !== '相談終了').length

  const today = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-')

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
            <span className="text-white/40 text-xs">最終更新: {today}</span>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <p className="text-white/50 text-xs mb-1">累計成約数（全期間）</p>
              <p className="text-white text-3xl font-black tracking-tight">
                {realTotalClosed}<span className="text-lg font-medium text-white/60 ml-1">件</span>
              </p>
              <p className="text-white/40 text-xs mt-2">売却 {realClosedSell}件 / 購入 {realClosedBuy}件</p>
            </div>
            <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <p className="text-white/50 text-xs mb-1">進行中案件数</p>
              <p className="text-white text-3xl font-black tracking-tight">
                {activeSell + activeBuy}<span className="text-lg font-medium text-white/60 ml-1">件</span>
              </p>
              <p className="text-white/40 text-xs mt-2">売却 {activeSell}件 / 購入 {activeBuy}件</p>
            </div>
            <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <p className="text-white/50 text-xs mb-1">今月の売上（売上集計シート）</p>
              {current?.revenue > 0 ? (
                <>
                  <p className="text-white text-3xl font-black tracking-tight">
                    {(current.revenue / 10000).toLocaleString()}<span className="text-lg font-medium text-white/60 ml-1">万円</span>
                  </p>
                  <div className={`flex items-center gap-1 mt-2 text-xs font-semibold ${trendUp ? 'text-green-400' : 'text-red-400'}`}>
                    {trendUp ? <TrendingUp size={13}/> : <TrendingDown size={13}/>}
                    先月比 {trendUp ? '+' : ''}{revenueTrend}%
                  </div>
                </>
              ) : (
                <p className="text-white/40 text-sm mt-2">売上集計シートから取得</p>
              )}
            </div>
            <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <p className="text-white/50 text-xs mb-1">累計売上（売上集計シート）</p>
              {totalRevenue > 0 ? (
                <p className="text-white text-3xl font-black tracking-tight">
                  {(totalRevenue / 10000).toLocaleString()}<span className="text-lg font-medium text-white/60 ml-1">万円</span>
                </p>
              ) : (
                <p className="text-white/40 text-sm mt-2">売上集計シートから取得</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-5">

        {/* 月別成約件数＋売上推移 */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <span className="w-1 h-4 rounded-full bg-indigo-500 inline-block"/>
            月別成約件数・売上推移
          </h2>
          <div className="flex items-end gap-3 h-32">
            {mergedStats.map((m, i) => {
              const total      = m.closedSell + m.closedBuy
              const heightPct  = (total / maxClosed) * 100
              const revPct     = ((m.revenue ?? 0) / maxRevenue) * 100
              const isCurrent  = i === mergedStats.length - 1
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                  <span className={`text-xs font-bold ${isCurrent ? 'text-indigo-600' : 'text-gray-500'}`}>
                    {total > 0 ? `${total}件` : '—'}
                  </span>
                  <div className="w-full flex gap-0.5 items-end" style={{ height: '80%' }}>
                    {/* 成約件数バー */}
                    <div className="flex-1 rounded-t-sm transition-all"
                      style={{
                        height: `${Math.max(heightPct, total > 0 ? 6 : 0)}%`,
                        backgroundColor: isCurrent ? '#4f46e5' : '#e0e7ff',
                      }}
                    />
                    {/* 売上バー */}
                    {(m.revenue ?? 0) > 0 && (
                      <div className="flex-1 rounded-t-sm transition-all"
                        style={{
                          height: `${Math.max(revPct, 4)}%`,
                          backgroundColor: isCurrent ? '#10b981' : '#d1fae5',
                        }}
                      />
                    )}
                  </div>
                  <span className="text-gray-400 text-center" style={{ fontSize: '9px' }}>
                    {m.month.replace('202', '').replace('年', '/')}
                  </span>
                </div>
              )
            })}
          </div>
          <div className="flex items-center gap-4 mt-2 mb-3">
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm inline-block bg-indigo-500"/><span className="text-xs text-gray-500">成約件数</span></div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm inline-block bg-emerald-500"/><span className="text-xs text-gray-500">売上（売上集計シート）</span></div>
          </div>
          <div className="mt-2 pt-3 border-t border-gray-100">
            <div className="flex gap-3">
              {mergedStats.map((m, i) => {
                const isCurrent = i === mergedStats.length - 1
                return (
                  <div key={m.month} className="flex-1 text-center">
                    <div className={`rounded-lg py-2 px-1 ${isCurrent ? 'bg-indigo-50 border border-indigo-100' : 'bg-gray-50'}`}>
                      <p className={`text-xs font-bold ${isCurrent ? 'text-indigo-700' : 'text-gray-700'}`}>
                        {m.closedSell + m.closedBuy}件
                      </p>
                      <p className="text-[9px] text-gray-400 mt-0.5">
                        売{m.closedSell} / 買{m.closedBuy}
                      </p>
                      {(m.revenue ?? 0) > 0 && (
                        <p className="text-[9px] text-emerald-600 font-semibold mt-0.5">
                          {(m.revenue / 10000).toLocaleString()}万
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* エリア別 成約件数・仲介手数料合計 */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

          {/* 売却 */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <span className="w-1 h-4 rounded-full bg-red-500 inline-block"/>
                エリア別 成約（売却）
              </h2>
              <div className="text-right">
                <span className="text-xs text-gray-400">計 {sellAreaTotal}件</span>
                {sellFeeTotal > 0 && (
                  <span className="text-xs text-red-500 font-semibold ml-2">{formatFee(sellFeeTotal)}</span>
                )}
              </div>
            </div>
            {sellAreaData.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">決済済み案件なし</p>
            ) : (
              <div className="space-y-3">
                {sellAreaData.map(([area, stat]) => {
                  const pct = sellAreaTotal > 0 ? Math.round((stat.count / sellAreaTotal) * 100) : 0
                  return (
                    <div key={area}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <MapPin size={12} className="text-red-400"/>
                          <span className="text-sm font-semibold text-gray-700">{area}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-800">{stat.count}件</span>
                          {stat.fee > 0 && (
                            <span className="text-xs font-semibold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">
                              {formatFee(stat.fee)}
                            </span>
                          )}
                          <span className="text-xs text-gray-400">{pct}%</span>
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

          {/* 購入 */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <span className="w-1 h-4 rounded-full bg-blue-500 inline-block"/>
                エリア別 成約（購入）
              </h2>
              <div className="text-right">
                <span className="text-xs text-gray-400">計 {buyAreaTotal}件</span>
                {buyFeeTotal > 0 && (
                  <span className="text-xs text-blue-500 font-semibold ml-2">{formatFee(buyFeeTotal)}</span>
                )}
              </div>
            </div>
            {buyAreaData.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">決済済み案件なし</p>
            ) : (
              <div className="space-y-3">
                {buyAreaData.map(([area, stat]) => {
                  const pct = buyAreaTotal > 0 ? Math.round((stat.count / buyAreaTotal) * 100) : 0
                  return (
                    <div key={area}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <MapPin size={12} className="text-blue-400"/>
                          <span className="text-sm font-semibold text-gray-700">{area}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-800">{stat.count}件</span>
                          {stat.fee > 0 && (
                            <span className="text-xs font-semibold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">
                              {formatFee(stat.fee)}
                            </span>
                          )}
                          <span className="text-xs text-gray-400">{pct}%</span>
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

        {/* 担当者別 実績 */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <span className="w-1 h-4 rounded-full bg-green-500 inline-block"/>
            担当者別 実績
          </h2>
          {staffData.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">データなし</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
              {staffData.map(([name, stat]) => (
                <div key={name} className="rounded-xl bg-gray-50 border border-gray-100 p-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-2">
                    <Users size={16} className="text-indigo-600"/>
                  </div>
                  <p className="text-sm font-bold text-gray-800 mb-2">{name}</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">進行中</span>
                      <span className="font-semibold text-gray-700">{stat.active}件</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">累計成約</span>
                      <span className="font-semibold text-green-600">{stat.closed}件</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">売却/購入</span>
                      <span className="font-semibold text-gray-500">{stat.sell}/{stat.buy}</span>
                    </div>
                    {stat.fee > 0 && (
                      <div className="flex justify-between text-xs pt-1 border-t border-gray-200 mt-1">
                        <span className="text-gray-400">手数料計</span>
                        <span className="font-semibold text-indigo-600">{formatFee(stat.fee)}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
