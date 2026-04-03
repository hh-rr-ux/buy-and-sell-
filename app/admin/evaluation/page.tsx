'use client'

import { useState } from 'react'
import { Star, RefreshCw, TrendingUp, AlertTriangle, MessageSquare, Crown } from 'lucide-react'

interface StaffEval {
  name: string
  score: number
  summary: string
  strengths: string[]
  improvements: string[]
  ownerMessage: string
}

interface EvalResult {
  evaluations: StaffEval[]
  error?: string
}

const SCORE_COLORS: Record<number, string> = {
  5: '#22c55e',
  4: '#86efac',
  3: '#facc15',
  2: '#fb923c',
  1: '#ef4444',
}

function ScoreStars({ score }: { score: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={16}
          fill={i <= score ? SCORE_COLORS[score] : 'transparent'}
          color={i <= score ? SCORE_COLORS[score] : '#d1d5db'}
        />
      ))}
    </div>
  )
}

export default function EvaluationPage() {
  const [result, setResult] = useState<EvalResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function fetchEvaluation() {
    setLoading(true)
    setError('')
    try {
      const resp = await fetch('/api/evaluation')
      const data = await resp.json()
      if (data.error) {
        setError(data.error)
      } else {
        setResult(data)
      }
    } catch (e) {
      setError('通信エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="px-6 py-6" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Crown size={16} className="text-yellow-400" />
                <p className="text-yellow-400 text-xs font-semibold uppercase tracking-widest">管理者専用</p>
              </div>
              <h1 className="text-white text-xl font-bold">担当者評価</h1>
              <p className="text-white/50 text-xs mt-1">Chatworkの活動データをAIが第三者として客観的に評価します</p>
            </div>
            <button
              onClick={fetchEvaluation}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                backgroundColor: loading ? 'rgba(255,255,255,0.1)' : '#e94560',
                color: 'white',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              {loading ? '評価中...' : result ? '再評価する' : '評価を開始する'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6">
        {/* エラー */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-700">評価の取得に失敗しました</p>
              <p className="text-xs text-red-600 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* ローディング */}
        {loading && (
          <div className="text-center py-16">
            <div className="inline-block w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
            <p className="text-gray-500 text-sm">Chatworkのデータを取得してAIが評価しています...</p>
            <p className="text-gray-400 text-xs mt-1">30〜60秒かかる場合があります</p>
          </div>
        )}

        {/* 未実行 */}
        {!loading && !result && !error && (
          <div className="text-center py-16 text-gray-400">
            <Star size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">「評価を開始する」ボタンを押すと、担当者の評価を生成します</p>
          </div>
        )}

        {/* 評価結果 */}
        {result?.evaluations && (
          <div className="space-y-4">
            {result.evaluations.map(ev => (
              <div key={ev.name} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {/* カードヘッダー */}
                <div className="px-5 py-4 flex items-center justify-between border-b border-gray-50">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                      style={{ backgroundColor: SCORE_COLORS[ev.score] || '#6b7280' }}
                    >
                      {ev.name.slice(0, 1)}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{ev.name}</p>
                      <ScoreStars score={ev.score} />
                    </div>
                  </div>
                  <div
                    className="text-3xl font-black"
                    style={{ color: SCORE_COLORS[ev.score] || '#6b7280' }}
                  >
                    {ev.score}<span className="text-sm font-normal text-gray-400">/5</span>
                  </div>
                </div>

                <div className="px-5 py-4 space-y-3">
                  {/* 総評 */}
                  <p className="text-sm text-gray-700">{ev.summary}</p>

                  <div className="grid grid-cols-2 gap-3">
                    {/* 強み */}
                    <div className="bg-green-50 rounded-lg p-3">
                      <div className="flex items-center gap-1.5 mb-2">
                        <TrendingUp size={13} className="text-green-600" />
                        <p className="text-xs font-semibold text-green-700">強み</p>
                      </div>
                      <ul className="space-y-1">
                        {ev.strengths.map((s, i) => (
                          <li key={i} className="text-xs text-green-800 flex items-start gap-1">
                            <span className="text-green-500 mt-0.5">•</span>{s}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* 改善点 */}
                    <div className="bg-orange-50 rounded-lg p-3">
                      <div className="flex items-center gap-1.5 mb-2">
                        <AlertTriangle size={13} className="text-orange-500" />
                        <p className="text-xs font-semibold text-orange-700">改善点</p>
                      </div>
                      <ul className="space-y-1">
                        {ev.improvements.map((s, i) => (
                          <li key={i} className="text-xs text-orange-800 flex items-start gap-1">
                            <span className="text-orange-400 mt-0.5">•</span>{s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* オーナーコメント */}
                  <div className="bg-indigo-50 rounded-lg p-3 flex items-start gap-2.5">
                    <MessageSquare size={14} className="text-indigo-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-indigo-700 mb-0.5">はるより</p>
                      <p className="text-xs text-indigo-800">{ev.ownerMessage}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
