'use client'

export const dynamic = 'force-static'

import { useState, useEffect } from 'react'
import {
  TrendingUp, TrendingDown, AlertCircle, CheckCircle2,
  Banknote, Activity,
} from 'lucide-react'
import {
  getBestSellPrice, getBestBuyPrice,
  calcBrokerageFee, formatPrice,
  SELL_AREAS, BUY_AREAS,
} from '@/lib/mockData'
import { calculateKPIs } from '@/lib/dataLoader'
import { useSheetData } from '@/lib/useSheetData'

const STAGE_COLORS: Record<string, string> = {
  '問い合わせ': '#6b7280', '査定': '#3b82f6', '媒介契約': '#8b5cf6',
  '販売活動': '#f97316', '内見': '#06b6d4', '購入申し込み': '#6366f1',
  '売買契約': '#eab308', 'ローン審査': '#ec4899', '決済': '#22c55e',
}

const SELL_STAGES = ['問い合わせ','査定','媒介契約','販売活動','売買契約','決済']
const BUY_STAGES  = ['問い合わせ','内見','購入申し込み','売買契約','ローン審査','決済']

// ─── ローディングスケルトン ────────────────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="px-6 py-6" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="h-2.5 w-36 bg-white/20 rounded mb-2 animate-pulse" />
              <div className="h-6 w-52 bg-white/25 rounded animate-pulse" />
            </div>
            <div className="h-2.5 w-24 bg-white/10 rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[0, 1].map(i => (
              <div key={i} className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.07)' }}>
                <div className="h-2.5 w-20 bg-white/20 rounded mb-3 animate-pulse" />
                <div className="h-9 w-28 bg-white/25 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Body */}
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-gray-100 animate-pulse flex-shrink-0" />
              <div className="flex-1">
                <div className="h-2.5 w-16 bg-gray-200 rounded mb-2 animate-pulse" />
                <div className="h-7 w-10 bg-gray-300 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="h-3.5 w-40 bg-gray-200 rounded mb-5 animate-pulse" />
          <div className="space-y-4">
            {[0, 1].map(i => (
              <div key={i}>
                <div className="h-2.5 w-16 bg-gray-200 rounded mb-2 animate-pulse" />
                <div className="flex gap-1.5">
                  {[0,1,2,3,4,5].map(j => (
                    <div key={j} className="flex-1 h-8 bg-gray-100 rounded-lg animate-pulse" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {[0, 1].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="h-3.5 w-32 bg-gray-200 rounded mb-4 animate-pulse" />
              <div className="space-y-2">
                {[0, 1, 2].map(j => (
                  <div key={j} className="h-16 bg-gray-50 rounded-lg border border-gray-100 animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
// ─────────────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false)
  const sheetData = useSheetData()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <DashboardSkeleton />
  }

  const { sellCases, buyCases, monthlyStats, confirmedRevenue, loadedAt, dataSource, errorMessage } = sheetData
  const kpis = calculateKPIs(sellCases, buyCases, monthlyStats)

  // ── 決済間近案件（修正2・3: 価格表示 + 物件名ペアリング） ──────────────────────
  type NearCase = {
    id: string; name: string; clientName: string
    stage: string; staff: string; type: '売却' | '購入'
    counterpartyBroker: string
    price: number   // 優先価格（成約価格 > 販売価格 > 査定価格）
    fee: number
  }

  const nearClosing: NearCase[] = [
    ...sellCases
      .filter(c => c.stage === '売買契約' || c.stage === '決済')
      .map(c => {
        const price = getBestSellPrice(c)
        return { id: c.id, name: c.propertyName, clientName: c.clientName,
          stage: c.stage, staff: c.staff, type: '売却' as const,
          counterpartyBroker: c.counterpartyBroker,
          price, fee: c.brokerageFee || calcBrokerageFee(price) }
      }),
    ...buyCases
      .filter(c => c.stage === 'ローン審査' || c.stage === '売買契約' || c.stage === '決済')
      .map(c => {
        const price = getBestBuyPrice(c)
        return { id: c.id, name: c.propertyName, clientName: c.clientName,
          stage: c.stage, staff: c.staff, type: '購入' as const,
          counterpartyBroker: c.counterpartyBroker,
          price, fee: c.brokerageFee || calcBrokerageFee(price) }
      }),
  ]

  // 物件名ペアリング（修正3）
  const pairedNames = new Set<string>()
  type Pair = { sell?: NearCase; buy?: NearCase }
  const pairs: Pair[] = []
  const unpaired: NearCase[] = []

  for (const c of nearClosing) {
    if (pairedNames.has(c.name)) continue
    const partner = nearClosing.find(p => p.name === c.name && p.type !== c.type)
    if (partner) {
      pairedNames.add(c.name)
      pairs.push({
        sell: c.type === '売却' ? c : partner,
        buy:  c.type === '購入' ? c : partner,
      })
    } else {
      unpaired.push(c)
    }
  }
  // ペア済みのunpairedからも除外
  const unpairedFiltered = unpaired.filter(c => !pairedNames.has(c.name))

  // ── 滞留案件（修正8: 修正済みdaysInStageを使用） ──────────────────────────────
  const stalledCases = [
    ...sellCases
      .filter(c => c.stage !== '決済' && c.stage !== '相談終了' && c.daysInStage > 30)
      .map(c => ({
        id: c.id, name: c.propertyName, clientName: c.clientName,
        stage: c.stage, staff: c.staff, days: c.daysInStage, type: '売却' as const,
        counterpartyBroker: c.counterpartyBroker,
      })),
    ...buyCases
      .filter(c => c.stage !== '決済' && c.stage !== '相談終了' && c.daysInStage > 30)
      .map(c => ({
        id: c.id, name: c.propertyName, clientName: c.clientName,
        stage: c.stage, staff: c.staff, days: c.daysInStage, type: '購入' as const,
        counterpartyBroker: c.counterpartyBroker,
      })),
  ]

  const nearClosingFee = nearClosing.reduce((s, c) => s + c.fee, 0)
  const revenueUp  = kpis.revenueTrend >= 0
  const closedUp   = kpis.closedDealsTrend >= 0

  function CaseRow({ c, bg }: { c: NearCase; bg: 'green' | 'red' }) {
    const isBothHands = c.counterpartyBroker === 'リベ'
    const sellBroker  = c.type === '売却' ? 'リベ' : (isBothHands ? 'リベ' : c.counterpartyBroker)
    const buyBroker   = c.type === '購入' ? 'リベ' : (isBothHands ? 'リベ' : c.counterpartyBroker)
    const bgClass     = bg === 'green' ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'
    return (
      <div className={`flex items-center gap-3 p-3 rounded-lg border ${bgClass}`}>
        <span className={`text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${c.type === '売却' ? 'bg-red-500' : 'bg-blue-500'}`}>
          {c.type}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-gray-800 truncate">{c.name}</p>
            {c.price > 0 && (
              <span className="text-xs text-gray-500 flex-shrink-0">
                {formatPrice(c.price)}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500">{c.clientName}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {isBothHands
              ? <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-full">両手</span>
              : <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">片手</span>
            }
            <span className="text-[10px] text-gray-400">
              売:<span className="text-gray-600">{sellBroker}</span>{' '}
              買:<span className="text-gray-600">{buyBroker}</span>
            </span>
          </div>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full text-white flex-shrink-0"
          style={{ backgroundColor: STAGE_COLORS[c.stage] }}>{c.stage}</span>
        <div className="text-right flex-shrink-0">
          <p className={`text-sm font-bold ${bg === 'green' ? 'text-green-600' : 'text-red-600'}`}>
            {formatPrice(c.fee)}
          </p>
          <p className="text-xs text-gray-400">{c.staff}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ━━━ データソースバナー ━━━ */}
      {dataSource === 'error' && (
        <div className="px-6 py-3 bg-red-50 border-b border-red-200 flex items-center gap-2">
          <span className="text-red-500 font-bold text-sm">❌</span>
          <span className="text-red-700 text-sm">
            データ取得に失敗しました: <span className="font-mono text-xs">{errorMessage}</span>
          </span>
        </div>
      )}
      {dataSource === 'mock_fallback' && (
        <div className="px-6 py-3 bg-yellow-50 border-b border-yellow-200 flex items-center gap-2">
          <span className="text-yellow-500 font-bold text-sm">⚠</span>
          <span className="text-yellow-800 text-sm">
            APIからデータが取得できなかったため、デモデータを表示しています
            {errorMessage && <span className="ml-2 text-yellow-600 text-xs font-mono">({errorMessage})</span>}
          </span>
        </div>
      )}

      {/* ━━━ Hero Banner ━━━ */}
      <div className="px-6 py-6" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-white/50 text-xs font-medium uppercase tracking-widest mb-0.5">不動産売買 経営ダッシュボード</p>
              {/* 修正4: 固定月文字列を削除、最終更新日時を表示 */}
              <h1 className="text-white text-xl font-bold">リアルタイム概況</h1>
            </div>
            <span className="text-white/40 text-xs">
              {loadedAt ? `最終更新: ${loadedAt}` : '読み込み中...'}
            </span>
          </div>

          {/* 修正6: パイプライン総額を削除 → 2指標のみ */}
          <div className="grid grid-cols-2 gap-4">
            {/* 修正5: 入金確認タブの今月売上 */}
            <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <p className="text-white/50 text-xs mb-1">今月の売上（確定）</p>
              <p className="text-white text-3xl font-black tracking-tight">
                {confirmedRevenue > 0 ? formatPrice(confirmedRevenue) : formatPrice(kpis.monthlyRevenue)}
              </p>
              <div className={`flex items-center gap-1 mt-2 text-xs font-semibold ${revenueUp ? 'text-green-400' : 'text-red-400'}`}>
                {revenueUp ? <TrendingUp size={13}/> : <TrendingDown size={13}/>}
                先月比 {revenueUp ? '+' : ''}{kpis.revenueTrend}%
              </div>
              {confirmedRevenue > 0 && (
                <p className="text-white/30 text-[10px] mt-0.5">入金確認タブより</p>
              )}
            </div>

            {/* 修正7: 今月の成約数（monthlyStatsの実データ） */}
            <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <p className="text-white/50 text-xs mb-1">今月の成約数</p>
              <p className="text-white text-3xl font-black tracking-tight">
                {kpis.monthlyClosedDeals}<span className="text-lg font-medium text-white/60 ml-1">件</span>
              </p>
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
              <p className="text-green-600 text-xs font-medium">{formatPrice(nearClosingFee)}</p>
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

        {/* ━━━ ステータス（お客様の進捗） ━━━ */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <span className="w-1 h-4 rounded-full bg-indigo-500 inline-block"/>
            ステータス（お客様の進捗）
          </h2>
          <div className="space-y-4">
            {/* 売却 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-red-500 uppercase tracking-wide">売却仲介</span>
                <div className="flex items-center gap-3">
                  {sellCases.filter(c => c.stage === '相談終了').length > 0 && (
                    <span className="text-xs text-gray-400">
                      相談終了: <span className="font-semibold text-gray-500">{sellCases.filter(c => c.stage === '相談終了').length}件</span>
                    </span>
                  )}
                  <span className="text-xs text-gray-400">{sellCases.filter(c => c.stage !== '相談終了').length}件</span>
                </div>
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
                <div className="flex items-center gap-3">
                  {buyCases.filter(c => c.stage === '相談終了').length > 0 && (
                    <span className="text-xs text-gray-400">
                      相談終了: <span className="font-semibold text-gray-500">{buyCases.filter(c => c.stage === '相談終了').length}件</span>
                    </span>
                  )}
                  <span className="text-xs text-gray-400">{buyCases.filter(c => c.stage !== '相談終了').length}件</span>
                </div>
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

            {/* エリア別件数サマリー */}
            <div className="pt-3 border-t border-gray-100 space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-semibold text-red-500 w-8 flex-shrink-0">売却:</span>
                {Object.entries(SELL_AREAS).map(([area, prefs], i) => {
                  const count = sellCases.filter(c => prefs.includes(c.prefecture) && c.stage !== '相談終了').length
                  return (
                    <span key={area} className="text-[10px] text-gray-600">
                      <span className="font-semibold text-gray-700">{area}</span> {count}件
                      {i < Object.keys(SELL_AREAS).length - 1 && <span className="text-gray-300 ml-2">|</span>}
                    </span>
                  )
                })}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-semibold text-blue-500 w-8 flex-shrink-0">購入:</span>
                {Object.entries(BUY_AREAS).map(([area, prefs], i) => {
                  const count = buyCases.filter(c => prefs.includes(c.prefecture) && c.stage !== '相談終了').length
                  return (
                    <span key={area} className="text-[10px] text-gray-600">
                      <span className="font-semibold text-gray-700">{area}</span> {count}件
                      {i < Object.keys(BUY_AREAS).length - 1 && <span className="text-gray-300 ml-2">|</span>}
                    </span>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

          {/* ━━━ 決済間近案件（修正2・3） ━━━ */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <span className="w-1 h-4 rounded-full bg-green-500 inline-block"/>
              決済間近 — 直近の売上予定
              <span className="ml-auto text-green-600 text-xs font-bold">{formatPrice(nearClosingFee)}</span>
            </h2>
            {nearClosing.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">該当案件なし</p>
            ) : (
              <div className="space-y-2">
                {/* ペア案件（同一物件名の売却＋購入） */}
                {pairs.map((pair, i) => (
                  <div key={`pair-${i}`} className="rounded-xl border-2 border-indigo-100 bg-indigo-50/30 overflow-hidden">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-indigo-100 bg-indigo-50">
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded-full">両手ペア</span>
                      <span className="text-xs font-semibold text-indigo-700 truncate">{pair.sell?.name ?? pair.buy?.name}</span>
                    </div>
                    <div className="p-2 space-y-1.5">
                      {pair.sell && <CaseRow c={pair.sell} bg="green" />}
                      {pair.buy  && <CaseRow c={pair.buy}  bg="green" />}
                    </div>
                  </div>
                ))}
                {/* 単独案件 */}
                {unpairedFiltered.map(c => <CaseRow key={c.id} c={c} bg="green" />)}
              </div>
            )}
          </div>

          {/* ━━━ 要対応・滞留案件（修正8） ━━━ */}
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
                {stalledCases.map(c => {
                  const isBothHands = c.counterpartyBroker === 'リベ'
                  const sellBroker = c.type === '売却' ? 'リベ' : (isBothHands ? 'リベ' : c.counterpartyBroker)
                  const buyBroker  = c.type === '購入' ? 'リベ' : (isBothHands ? 'リベ' : c.counterpartyBroker)
                  return (
                    <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-100">
                      <span className={`text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${c.type === '売却' ? 'bg-red-500' : 'bg-blue-500'}`}>{c.type}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{c.name}</p>
                        <p className="text-xs text-gray-500">{c.clientName}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {isBothHands
                            ? <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-full">両手</span>
                            : <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">片手</span>
                          }
                          <span className="text-[10px] text-gray-400">売:<span className="text-gray-600">{sellBroker}</span> 買:<span className="text-gray-600">{buyBroker}</span></span>
                        </div>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full text-white flex-shrink-0" style={{ backgroundColor: STAGE_COLORS[c.stage] }}>{c.stage}</span>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-red-600">{c.days}日経過</p>
                        <p className="text-xs text-gray-400">{c.staff}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
