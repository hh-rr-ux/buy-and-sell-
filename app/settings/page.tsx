'use client'

import { useState } from 'react'
import {
  Settings, CheckCircle2, XCircle, Calendar,
  TrendingUp, Users, Star, MessageSquare, AlertCircle,
} from 'lucide-react'
import { getEnvStatus } from '@/lib/config'
import {
  sellCases, buyCases, STAFF_LIST,
  mockStaffEvaluations, type Staff,
} from '@/lib/mockData'
import SettingsPinGate, { SettingsLogoutButton } from '@/components/SettingsPinGate'

// ─── API設定タブ ──────────────────────────────────────────────────────

function StatusRow({ label, configured, varName }: { label: string; configured: boolean; varName: string }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
      {configured
        ? <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
        : <XCircle size={16} className="text-red-400 flex-shrink-0" />
      }
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800">{label}</p>
        <p className="text-xs text-gray-400 font-mono">{varName}</p>
      </div>
      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
        configured ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
      }`}>
        {configured ? '設定済み' : '未設定'}
      </span>
    </div>
  )
}

function ApiTab() {
  const status = getEnvStatus()

  const chatworkItems = [
    { label: 'Chatwork APIトークン',       configured: status.chatworkToken,        varName: 'CHATWORK_API_TOKEN' },
    { label: '運用チャット ルームID',       configured: status.chatworkOperations,   varName: 'CHATWORK_ROOM_OPERATIONS' },
    { label: 'HP,LINEチャット ルームID',   configured: status.chatworkHpLine,       varName: 'CHATWORK_ROOM_HP_LINE' },
    { label: '求人チャット ルームID',       configured: status.chatworkRecruitment,  varName: 'CHATWORK_ROOM_RECRUITMENT' },
    { label: '通知チャット ルームID',       configured: status.chatworkNotification, varName: 'CHATWORK_ROOM_NOTIFICATION' },
    { label: 'メッセージチャット ルームID', configured: status.chatworkCustomer,     varName: 'CHATWORK_ROOM_CUSTOMER' },
  ]
  const sheetsItems = [
    { label: 'スプレッドシートID',          configured: status.googleSheetsId,          varName: 'GOOGLE_SHEETS_ID' },
    { label: 'Google Sheets APIキー',       configured: status.googleSheetsApiKey,       varName: 'GOOGLE_SHEETS_API_KEY' },
    { label: '案件管理シート範囲',           configured: status.googleSheetsCasesRange,   varName: 'GOOGLE_SHEETS_CASES_RANGE' },
    { label: 'LINE問い合わせシート範囲',     configured: status.googleSheetsLineRange,    varName: 'GOOGLE_SHEETS_LINE_RANGE' },
  ]
  const calendarItems = [
    { label: 'カレンダーID',                                    configured: status.googleCalendarId,   varName: 'GOOGLE_CALENDAR_ID' },
    { label: '認証情報（サービスアカウント or OAuth）',           configured: status.googleCalendarAuth, varName: 'GOOGLE_SERVICE_ACCOUNT_KEY または GOOGLE_OAUTH_*' },
  ]

  const cw = chatworkItems.filter(i => i.configured).length
  const sh = sheetsItems.filter(i => i.configured).length
  const ca = calendarItems.filter(i => i.configured).length

  const Section = ({ title, icon, items, configured, total }: {
    title: string; icon: React.ReactNode; items: typeof chatworkItems; configured: number; total: number
  }) => (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">{icon}<h2 className="text-sm font-bold text-gray-700">{title}</h2></div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
          configured === total ? 'bg-green-50 text-green-600' : configured > 0 ? 'bg-yellow-50 text-yellow-600' : 'bg-red-50 text-red-500'
        }`}>{configured} / {total} 設定済み</span>
      </div>
      <div>{items.map(item => <StatusRow key={item.varName} {...item} />)}</div>
    </div>
  )

  return (
    <div>
      <p className="text-sm text-gray-500 mb-5">
        未設定の変数は GitHub リポジトリの{' '}
        <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">Settings &gt; Secrets and variables &gt; Actions</span>{' '}
        から登録してください。
      </p>
      <Section title="Chatwork API" icon={<MessageSquare size={13} className="text-orange-400" />} items={chatworkItems} configured={cw} total={chatworkItems.length} />
      <Section title="Google Sheets API" icon={<CheckCircle2 size={13} className="text-green-500" />} items={sheetsItems} configured={sh} total={sheetsItems.length} />
      <Section title="Google Calendar API" icon={<Calendar size={13} className="text-blue-500" />} items={calendarItems} configured={ca} total={calendarItems.length} />

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
        <h2 className="text-sm font-bold text-blue-700 mb-2">スプレッドシート構成</h2>
        <div className="space-y-2 text-xs text-blue-700">
          <div>
            <p className="font-semibold">案件管理シート（GOOGLE_SHEETS_CASES_RANGE）</p>
            <p className="text-blue-500 font-mono mt-0.5">物件名 / 進捗 / 担当 / 物件価格 / 仲介手数料 / 全体売上</p>
          </div>
          <div>
            <p className="font-semibold">LINE問い合わせシート（GOOGLE_SHEETS_LINE_RANGE）</p>
            <p className="text-blue-500 font-mono mt-0.5">日付 / 問い合わせ数</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── 担当者別売上・リソースタブ ───────────────────────────────────────

function ResourceTab() {
  // 担当者別集計
  const staffStats = STAFF_LIST.map(name => {
    const sells = sellCases.filter(c => c.staff === name)
    const buys  = buyCases.filter(c => c.staff === name)
    const allCases = [...sells, ...buys]

    const closedSell = sells.filter(c => c.stage === '決済')
    const closedBuy  = buys.filter(c => c.stage === '決済')
    const activeCases = allCases.filter(c => c.stage !== '決済' && c.stage !== '相談終了')

    const sellRevenue = closedSell.reduce((s, c) => s + c.brokerageFee, 0)
    const buyRevenue  = closedBuy.reduce((s, c) => s + c.brokerageFee, 0)
    const totalRevenue = sellRevenue + buyRevenue

    // 稼働率: 担当案件数 / 全担当者平均案件数を元にした相対値
    const capacity = 5  // 1人あたり適正担当案件数（TODO: スプシ連携後に更新）

    return {
      name,
      activeCases: activeCases.length,
      closedCount: closedSell.length + closedBuy.length,
      totalRevenue,
      sellRevenue,
      buyRevenue,
      capacity,
      utilizationPct: Math.min(100, Math.round((activeCases.length / capacity) * 100)),
    }
  })

  const maxRevenue = Math.max(...staffStats.map(s => s.totalRevenue), 1)

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        <AlertCircle size={13} className="text-amber-400" />
        <p className="text-xs text-amber-600 font-medium">
          売上は決済済み案件の仲介手数料合計。リソース欄の適正件数はスプシ連携後に更新されます。
        </p>
      </div>

      {/* 担当者別売上 */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5 mb-4 mt-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={15} className="text-blue-500" />
          <h2 className="text-sm font-bold text-gray-800">担当者別売上（決済済み案件）</h2>
        </div>
        <div className="space-y-3">
          {[...staffStats].sort((a, b) => b.totalRevenue - a.totalRevenue).map(s => (
            <div key={s.name}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[11px] font-bold text-gray-600">{s.name[0]}</span>
                  <span className="text-sm font-medium text-gray-800">{s.name}</span>
                  <span className="text-xs text-gray-400">{s.closedCount}件成約</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-gray-900">
                    {s.totalRevenue === 0 ? '—' : `${Math.round(s.totalRevenue / 10000).toLocaleString()}万円`}
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full bg-blue-400 transition-all"
                  style={{ width: `${maxRevenue > 0 ? (s.totalRevenue / maxRevenue) * 100 : 0}%` }}
                />
              </div>
              {s.totalRevenue > 0 && (
                <div className="flex gap-3 mt-0.5">
                  <span className="text-[10px] text-gray-400">売却: {Math.round(s.sellRevenue / 10000).toLocaleString()}万円</span>
                  <span className="text-[10px] text-gray-400">購入: {Math.round(s.buyRevenue / 10000).toLocaleString()}万円</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* リソース状況 */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Users size={15} className="text-purple-500" />
          <h2 className="text-sm font-bold text-gray-800">リソース状況（進行中案件数）</h2>
        </div>
        <div className="space-y-3">
          {[...staffStats].sort((a, b) => b.activeCases - a.activeCases).map(s => {
            const color = s.utilizationPct >= 100 ? 'bg-red-400' : s.utilizationPct >= 80 ? 'bg-amber-400' : 'bg-green-400'
            const label = s.utilizationPct >= 100 ? '高負荷' : s.utilizationPct >= 80 ? '要注意' : '適正'
            const labelColor = s.utilizationPct >= 100 ? 'text-red-500 bg-red-50' : s.utilizationPct >= 80 ? 'text-amber-600 bg-amber-50' : 'text-green-600 bg-green-50'
            return (
              <div key={s.name}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[11px] font-bold text-gray-600">{s.name[0]}</span>
                    <span className="text-sm font-medium text-gray-800">{s.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{s.activeCases} / {s.capacity}件</span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${labelColor}`}>{label}</span>
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div className={`h-1.5 rounded-full transition-all ${color}`} style={{ width: `${s.utilizationPct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
        <p className="text-[11px] text-gray-400 mt-3">※ 適正件数（{staffStats[0]?.capacity}件）はスプレッドシート連携後に実績値に更新されます。</p>
      </div>
    </div>
  )
}

// ─── スタッフ評価タブ ─────────────────────────────────────────────────

const RANK_COLOR: Record<string, string> = {
  S: 'bg-yellow-50 text-yellow-600 border-yellow-200',
  A: 'bg-blue-50 text-blue-600 border-blue-200',
  B: 'bg-gray-50 text-gray-600 border-gray-200',
  C: 'bg-red-50 text-red-500 border-red-100',
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between mb-0.5">
        <span className="text-[11px] text-gray-500">{label}</span>
        <span className="text-[11px] font-semibold text-gray-700">{value}/5</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-1.5">
        <div className="h-1.5 rounded-full bg-indigo-400" style={{ width: `${(value / 5) * 100}%` }} />
      </div>
    </div>
  )
}

function EvalTab() {
  const [open, setOpen] = useState<Staff | null>(null)

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-4">
        <AlertCircle size={13} className="text-amber-400" />
        <p className="text-xs text-amber-600 font-medium">
          現在はモックデータによる評価です。Chatwork API連携後、実メッセージから自動算出されます。
        </p>
      </div>

      <div className="space-y-3">
        {mockStaffEvaluations.map(ev => (
          <div key={ev.staff} className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
            {/* ヘッダー行 */}
            <button
              className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition-colors"
              onClick={() => setOpen(open === ev.staff ? null : ev.staff)}
            >
              <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600 flex-shrink-0">
                {ev.staff[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-800">{ev.staff}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded border ${RANK_COLOR[ev.rank]}`}>
                    ランク {ev.rank}
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} size={11} className={i <= Math.round(ev.score / 20) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'} />
                  ))}
                  <span className="text-xs text-gray-500 ml-1">{ev.score}点</span>
                </div>
              </div>
              <span className="text-gray-300 text-sm">{open === ev.staff ? '▲' : '▼'}</span>
            </button>

            {/* 詳細（展開） */}
            {open === ev.staff && (
              <div className="border-t border-gray-50 px-4 pb-4 pt-3 space-y-4">
                {/* スコアバー */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                  <ScoreBar label="対応速度・即応性" value={ev.responseSpeed} />
                  <ScoreBar label="お客様対応" value={ev.customerHandling} />
                  <ScoreBar label="案件推進力" value={ev.caseProgress} />
                  <ScoreBar label="チーム連携・情報共有" value={ev.teamContrib} />
                </div>

                {/* 評価根拠 */}
                <div>
                  <p className="text-[11px] font-semibold text-gray-500 mb-1.5 flex items-center gap-1">
                    <MessageSquare size={11} />
                    チャット分析・評価根拠
                  </p>
                  <div className="space-y-1.5">
                    {ev.chatEvidence.map((e, i) => (
                      <div key={i} className="bg-gray-50 rounded-lg p-2.5 text-xs text-gray-600 leading-relaxed border-l-2 border-indigo-200">
                        {e}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 改善提案 */}
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-2.5">
                  <p className="text-[11px] font-semibold text-amber-700 mb-1">改善提案</p>
                  <p className="text-xs text-amber-700 leading-relaxed">{ev.improvementPoint}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── メインページ ─────────────────────────────────────────────────────

type Tab = 'api' | 'resource' | 'eval'

function SettingsContent() {
  const [tab, setTab] = useState<Tab>('api')

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'api',      label: 'API設定',          icon: <Settings size={13} /> },
    { id: 'resource', label: '売上・リソース',     icon: <TrendingUp size={13} /> },
    { id: 'eval',     label: 'スタッフ評価',       icon: <Star size={13} /> },
  ]

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Settings size={22} className="text-gray-400" />
          <h1 className="text-2xl font-bold text-gray-900">管理者設定</h1>
        </div>
        <SettingsLogoutButton />
      </div>

      {/* タブ */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-all ${
              tab === t.id ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {tab === 'api'      && <ApiTab />}
      {tab === 'resource' && <ResourceTab />}
      {tab === 'eval'     && <EvalTab />}
    </div>
  )
}

export default function SettingsPage() {
  return (
    <SettingsPinGate>
      <SettingsContent />
    </SettingsPinGate>
  )
}
