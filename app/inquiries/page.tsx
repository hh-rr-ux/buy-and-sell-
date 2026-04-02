export const dynamic = 'force-static'

import { TrendingUp, TrendingDown, MessageCircle, Bell } from 'lucide-react'
import {
  lineInquiries, chatworkRooms,
} from '@/lib/mockData'

// デモ用 問い合わせ一覧
const demoInquiries = [
  { id: 1, date: '2026-03-31', source: 'LINE', name: '田中 誠', content: '3LDKマンションを探しています。予算は6000万円前後です。', status: '未対応', staff: '' },
  { id: 2, date: '2026-03-31', source: 'LINE', name: '山田 花子', content: '戸建ての売却を検討しています。査定をお願いしたいです。', status: '対応中', staff: '鈴木' },
  { id: 3, date: '2026-03-30', source: 'LINE', name: '中村 健一', content: '川崎市内でファミリー向けマンションを購入したいです。', status: '対応中', staff: '田中' },
  { id: 4, date: '2026-03-30', source: 'LINE', name: '佐藤 美香', content: '相続した土地の売却について相談したいです。', status: '未対応', staff: '' },
  { id: 5, date: '2026-03-29', source: 'HP', name: '渡辺 次郎', content: '大阪市内の投資用マンションを探しています。', status: '対応済', staff: '佐藤' },
  { id: 6, date: '2026-03-29', source: 'HP', name: '伊藤 愛', content: '東京都内で予算4000万円以内の戸建てを探しています。', status: '対応済', staff: '山田' },
  { id: 7, date: '2026-03-28', source: 'LINE', name: '小林 博', content: '埼玉の自宅マンションの売却時期について相談したい。', status: '対応済', staff: '伊藤' },
]

const STATUS_COLORS: Record<string, string> = {
  '未対応': 'bg-red-100 text-red-700',
  '対応中': 'bg-yellow-100 text-yellow-700',
  '対応済': 'bg-green-100 text-green-700',
}

const SOURCE_COLORS: Record<string, string> = {
  'LINE': 'bg-green-500',
  'HP': 'bg-blue-500',
}

export default function InquiriesPage() {
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

  const totalUnread = chatworkRooms.reduce((s, r) => s + r.unreadCount, 0)
  const notificationRooms = chatworkRooms.filter(r => r.type === 'notification' || r.type === 'customer')
  const otherRooms = chatworkRooms.filter(r => r.type !== 'notification' && r.type !== 'customer')

  const unanswered = demoInquiries.filter(i => i.status === '未対応').length

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ヘッダー */}
      <div className="px-6 py-6" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-white/50 text-xs font-medium uppercase tracking-widest mb-0.5">お問合せ管理</p>
              <h1 className="text-white text-xl font-bold">問合せ・チャット概況</h1>
            </div>
            <span className="text-white/40 text-xs">最終更新: 2026-03-31</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <p className="text-white/50 text-xs mb-1">今月の問い合わせ数（LINE）</p>
              <p className="text-white text-3xl font-black tracking-tight">{thisMonthTotal}<span className="text-lg font-medium text-white/60 ml-1">件</span></p>
              <div className={`flex items-center gap-1 mt-2 text-xs font-semibold ${trendUp ? 'text-green-400' : 'text-red-400'}`}>
                {trendUp ? <TrendingUp size={13}/> : <TrendingDown size={13}/>}
                先月比 {trendUp ? '+' : ''}{trend}%
              </div>
            </div>
            <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <p className="text-white/50 text-xs mb-1">Chatwork 未読</p>
              <p className="text-white text-3xl font-black tracking-tight">{totalUnread}<span className="text-lg font-medium text-white/60 ml-1">件</span></p>
              <p className="text-white/40 text-xs mt-2">全ルーム合計</p>
            </div>
            <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <p className="text-white/50 text-xs mb-1">未対応の問い合わせ</p>
              <p className={`text-3xl font-black tracking-tight ${unanswered > 0 ? 'text-red-400' : 'text-white'}`}>
                {unanswered}<span className="text-lg font-medium text-white/60 ml-1">件</span>
              </p>
              <p className="text-white/40 text-xs mt-2">要対応</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-5">

        {/* 問い合わせ一覧（デモ） */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <span className="w-1 h-4 rounded-full bg-purple-500 inline-block"/>
            問い合わせ一覧
            <span className="ml-auto text-xs text-gray-400 font-normal">※スプシ・LINE連携後に実データに切り替え</span>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-gray-400 pb-2 pr-4">日時</th>
                  <th className="text-left text-xs font-semibold text-gray-400 pb-2 pr-4">流入元</th>
                  <th className="text-left text-xs font-semibold text-gray-400 pb-2 pr-4">お名前</th>
                  <th className="text-left text-xs font-semibold text-gray-400 pb-2 pr-4">内容</th>
                  <th className="text-left text-xs font-semibold text-gray-400 pb-2 pr-4">担当</th>
                  <th className="text-left text-xs font-semibold text-gray-400 pb-2">ステータス</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {demoInquiries.map(inq => (
                  <tr key={inq.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 pr-4 text-xs text-gray-500 whitespace-nowrap">{inq.date}</td>
                    <td className="py-3 pr-4">
                      <span className={`text-white text-[10px] font-bold px-2 py-0.5 rounded-full ${SOURCE_COLORS[inq.source] ?? 'bg-gray-400'}`}>
                        {inq.source}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-xs font-semibold text-gray-700 whitespace-nowrap">{inq.name}</td>
                    <td className="py-3 pr-4 text-xs text-gray-600 max-w-xs truncate">{inq.content}</td>
                    <td className="py-3 pr-4 text-xs text-gray-500">{inq.staff || '—'}</td>
                    <td className="py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[inq.status]}`}>
                        {inq.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* LINE問い合わせ推移 */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <span className="w-1 h-4 rounded-full bg-green-500 inline-block"/>
            LINE問い合わせ推移（直近7日）
            <span className={`ml-auto flex items-center gap-1 text-xs font-semibold ${trendUp ? 'text-green-600' : 'text-red-500'}`}>
              {trendUp ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
              今月 {trendUp ? '+' : ''}{trend}%（先月比）
            </span>
          </h2>
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
          <div className="flex items-end gap-2 h-24">
            {last7.map((d) => {
              const heightPct = (d.count / maxCount) * 100
              const dayLabel = d.date.slice(5).replace('-', '/')
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] font-bold text-green-600">{d.count}</span>
                  <div className="w-full rounded-t-md bg-green-400" style={{ height: `${heightPct}%`, minHeight: '4px' }}/>
                  <span className="text-gray-400 text-[9px]">{dayLabel}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Chatwork チャット状況 */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <span className="w-1 h-4 rounded-full bg-teal-500 inline-block"/>
            通知チャット（Chatwork）
          </h2>

          {/* 問い合わせ通知系 */}
          <p className="text-[10px] font-semibold text-teal-600 uppercase tracking-wider mb-2">お客様・通知</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {notificationRooms.map(room => (
              <div key={room.roomId} className="rounded-xl border border-teal-200 bg-teal-50 p-4 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0">
                      <Bell size={14} className="text-teal-600"/>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-teal-800 truncate">{room.name}</p>
                      <p className="text-gray-400 text-[10px] truncate">{room.description}</p>
                    </div>
                  </div>
                  {room.unreadCount > 0 && (
                    <span className="text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 bg-teal-500">
                      {room.unreadCount}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed bg-white rounded-lg px-3 py-2 border border-gray-100">
                  {room.latestMessage}
                </p>
                <p className="text-[10px] text-gray-400 text-right">{room.latestTime}</p>
              </div>
            ))}
          </div>

          {/* その他チャット */}
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">その他</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {otherRooms.map(room => (
              <div key={room.roomId} className="rounded-xl border border-gray-100 bg-gray-50 p-4 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <MessageCircle size={14} className="text-gray-500"/>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-700 truncate">{room.name}</p>
                      <p className="text-gray-400 text-[10px] truncate">{room.description}</p>
                    </div>
                  </div>
                  {room.unreadCount > 0 && (
                    <span className="text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 bg-gray-400">
                      {room.unreadCount}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed bg-white rounded-lg px-3 py-2 border border-gray-100">
                  {room.latestMessage}
                </p>
                <p className="text-[10px] text-gray-400 text-right">{room.latestTime}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
