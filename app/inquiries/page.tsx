'use client'

import { useState, useEffect, useMemo } from 'react'
import { TrendingUp, TrendingDown, MessageCircle, Bell, RefreshCw } from 'lucide-react'
import { chatworkRooms as mockChatworkRooms } from '@/lib/mockData'
import { useSheetData } from '@/lib/useSheetData'

interface ChatworkRoom {
  roomId: string
  name: string
  type: string
  description: string
  unreadCount: number
  latestMessage: string
  latestTime: string
}

function InquiriesSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-6 py-6 animate-pulse" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="h-6 w-48 bg-white/20 rounded mb-5" />
          <div className="grid grid-cols-3 gap-4">
            {[0,1,2].map(i => (
              <div key={i} className="rounded-2xl p-5 h-24" style={{ background: 'rgba(255,255,255,0.07)' }} />
            ))}
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-5">
        {[0,1,2].map(i => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 animate-pulse">
            <div className="h-4 w-40 bg-gray-200 rounded mb-4" />
            <div className="h-32 bg-gray-50 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function InquiriesPage() {
  const [mounted, setMounted] = useState(false)
  const { inquirySummary, loaded } = useSheetData()

  // 月別問い合わせ数（シート実データ）を新しい月順にソート
  const monthlyInquiries = useMemo(() => {
    return Object.entries(inquirySummary)
      .map(([month, d]) => ({ month, ...d }))
      .sort((a, b) => a.month.localeCompare(b.month))
  }, [inquirySummary])

  // 直近2ヶ月を今月・先月として扱う
  const recentMonths = monthlyInquiries.slice(-2)
  const thisMonthData = recentMonths[recentMonths.length - 1]
  const lastMonthData = recentMonths[recentMonths.length - 2]
  const thisMonthTotal = thisMonthData?.newInquiries ?? 0
  const lastMonthTotal = lastMonthData?.newInquiries ?? 0

  // データがなければグラフ用に過去6ヶ月分を表示
  const chartData = monthlyInquiries.slice(-6)
  const maxCount = Math.max(...chartData.map(d => d.newInquiries), 1)

  const trend = lastMonthTotal > 0
    ? Math.round(((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100)
    : 0
  const trendUp = trend >= 0

  const [chatworkRooms, setChatworkRooms] = useState<ChatworkRoom[]>(mockChatworkRooms)
  const [chatworkLoading, setChatworkLoading] = useState(true)
  const [chatworkError, setChatworkError] = useState('')

  useEffect(() => {
    async function loadRooms() {
      setChatworkLoading(true)
      setChatworkError('')
      try {
        const res = await fetch('/api/chatwork-rooms')
        const data = await res.json() as { rooms?: ChatworkRoom[]; error?: string }
        if (data.rooms && data.rooms.length > 0) {
          setChatworkRooms(data.rooms)
        } else if (data.error) {
          setChatworkError(data.error)
        }
      } catch {
        setChatworkError('Chatwork データの取得に失敗しました')
      } finally {
        setChatworkLoading(false)
      }
    }
    loadRooms()
  }, [])

  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return <InquiriesSkeleton />

  const totalUnread = chatworkRooms.reduce((s, r) => s + r.unreadCount, 0)
  const notificationRooms = chatworkRooms.filter(r => r.type === 'notification' || r.type === 'customer')
  const otherRooms = chatworkRooms.filter(r => r.type !== 'notification' && r.type !== 'customer')

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
            <span className="text-white/40 text-xs">{loaded ? `最終月: ${thisMonthData?.month ?? '—'}` : '読み込み中...'}</span>
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
              <p className="text-white text-3xl font-black tracking-tight">
                {chatworkLoading ? '—' : totalUnread}
                <span className="text-lg font-medium text-white/60 ml-1">件</span>
              </p>
              <p className="text-white/40 text-xs mt-2">全ルーム合計</p>
            </div>
            <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <p className="text-white/50 text-xs mb-1">今月成約数（LINE経由）</p>
              <p className="text-white text-3xl font-black tracking-tight">
                {thisMonthData?.closedSell ?? 0 + (thisMonthData?.closedBuy ?? 0)}<span className="text-lg font-medium text-white/60 ml-1">件</span>
              </p>
              <p className="text-white/40 text-xs mt-2">売却 + 購入</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-5">

        {/* 問い合わせ数推移 */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <span className="w-1 h-4 rounded-full bg-green-500 inline-block"/>
            新規問い合わせ推移（月別・スプシ実データ）
            <span className={`ml-auto flex items-center gap-1 text-xs font-semibold ${trendUp ? 'text-green-600' : 'text-red-500'}`}>
              {trendUp ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
              今月 {trendUp ? '+' : ''}{trend}%（先月比）
            </span>
          </h2>
          <div className="flex gap-3 mb-5">
            <div className="flex-1 rounded-xl bg-green-50 border border-green-100 px-4 py-3 text-center">
              <p className="text-[10px] text-green-600 font-semibold mb-0.5">今月合計（{thisMonthData?.month ?? '—'}）</p>
              <p className="text-2xl font-black text-green-700">{thisMonthTotal}<span className="text-sm font-normal ml-0.5">件</span></p>
            </div>
            <div className="flex-1 rounded-xl bg-gray-50 border border-gray-100 px-4 py-3 text-center">
              <p className="text-[10px] text-gray-500 font-semibold mb-0.5">先月合計（{lastMonthData?.month ?? '—'}）</p>
              <p className="text-2xl font-black text-gray-600">{lastMonthTotal}<span className="text-sm font-normal ml-0.5">件</span></p>
            </div>
          </div>
          {chartData.length > 0 ? (
            <div className="flex items-end gap-2 h-24">
              {chartData.map((d) => {
                const heightPct = (d.newInquiries / maxCount) * 100
                const label = d.month.replace('2026年', '').replace('2025年', '')
                return (
                  <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] font-bold text-green-600">{d.newInquiries}</span>
                    <div className="w-full rounded-t-md bg-green-400" style={{ height: `${heightPct}%`, minHeight: '4px' }}/>
                    <span className="text-gray-400 text-[9px]">{label}</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-4">データ読み込み中...</p>
          )}
        </div>

        {/* Chatwork チャット状況 */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <span className="w-1 h-4 rounded-full bg-teal-500 inline-block"/>
            通知チャット（Chatwork）
            {chatworkLoading && <RefreshCw size={12} className="text-gray-400 animate-spin ml-1" />}
            {!chatworkLoading && !chatworkError && (
              <span className="ml-auto text-[10px] text-teal-600 font-semibold bg-teal-50 px-2 py-0.5 rounded-full">
                リアルタイム
              </span>
            )}
            {!chatworkLoading && chatworkError && (
              <span className="ml-auto text-[10px] text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded-full">
                モックデータ
              </span>
            )}
          </h2>

          {/* 問い合わせ通知系 */}
          {notificationRooms.length > 0 && (
            <>
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
            </>
          )}

          {/* その他チャット */}
          {otherRooms.length > 0 && (
            <>
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
            </>
          )}

          {/* 全ルーム未取得 */}
          {!chatworkLoading && chatworkError && (
            <p className="text-xs text-amber-600 mt-3">
              ※ {chatworkError}。モックデータを表示しています。
            </p>
          )}
        </div>

      </div>
    </div>
  )
}
