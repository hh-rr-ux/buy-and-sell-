'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Send,
  MessageSquare,
  TrendingUp,
  Megaphone,
  Building2,
  Shield,
  Lightbulb,
  Users,
  RefreshCw,
} from 'lucide-react'

// ── 専門家アイコン（表示用のみ） ────────────────────────────────────────
const EXPERT_ICONS = [
  { key: 'finance',  color: '#e94560', icon: TrendingUp },
  { key: 'marketing', color: '#3b82f6', icon: Megaphone },
  { key: 'sales',    color: '#16a34a', icon: Building2 },
  { key: 'legal',    color: '#7c3aed', icon: Shield },
  { key: 'strategy', color: '#d97706', icon: Lightbulb },
  { key: 'hr',       color: '#0891b2', icon: Users },
]

// ── モックレスポンス（チーム協議の結論として1本化） ─────────────────────
function generateMockResponse(question: string): string {
  const q = question

  const isSales     = /加藤|S007|滞留|販売活動|価格|売れない|成約/.test(q)
  const isMarketing = /問い合わせ|集客|春|シーズン|広告|LINE|SNS|ポータル/.test(q)
  const isLoan      = /ローン|岡田|B004|審査|金融|フラット/.test(q)
  const isStaff     = /担当|偏在|伊藤|人材|育成|負荷|分配/.test(q)
  const isRevenue   = /収益|売上|多様化|拡大|高額|富裕/.test(q)
  const isResponse  = /返答|対応|速度|初回|レスポンス|連絡/.test(q)

  if (isSales) return `S007（加藤様）の45日超滞留は、チームで協議した結果、以下の対応が必要という結論になりました。

**■ 今週中に着手すること**
- 加藤様と直接面談し、近隣の最新成約事例を3件持参して価格の5〜8%調整を提案する
- 現在の販売写真・説明文を全面リニューアルし、ポータルサイト上の掲載を「新着扱い」に更新する
- 内覧希望者3組への日程調整フォローを本日中に実施する

**■ 価格調整の根拠**
現在の2,200万円に対し、5%引き下げると2,090万円。手数料は約5万円の減少ですが、早期成約で他の案件にリソースを集中でき、会社全体の収益には貢献します。春シーズン（3〜4月）の需要ピーク前に動かすことが年間目標への最大の貢献になります。

**■ リスク管理として**
価格変更は必ず書面（覚書）で加藤様の署名・押印をもらい、媒介契約の条件変更として記録してください。口頭合意のみはトラブルの原因になります。

**■ 仕組みとして残すこと**
この案件を機に「30日超滞留案件の週次レビュー」を制度化することを推奨します。毎週月曜に滞留リストを共有し、担当者が具体的アクションを報告する場を設けることで、組織全体のパイプライン健全性が向上します。`

  if (isMarketing) return `春の引越しシーズン（3〜4月）の最大活用について、チームで協議した結論をお伝えします。

**■ 今すぐ動くこと（今週中）**
- LINE公式アカウントで「春の転勤・新生活物件特集」を配信する
- スーモ・アットホームのトップ掲載枠を確保する
- 現在の問い合わせ14件に対して、今週中に全件フォローアップの計画を立てる

**■ 数値目標の設定**
今月14件の問い合わせのうち最低8件を査定・内見へ進める、を今月の目標にしてください。現在の成約率63%を70%に引き上げるだけで、月間100〜150万円の手数料増収が見込めます。

**■ 法人需要も取りにいく**
4月・10月は転勤需要があるため、法人顧客（企業の総務担当）向けに「転勤社員向け売却・購入相談会」を企画する価値があります。法人は決断が早く成約率が高い傾向があります。

**■ 注意点**
繁忙期は担当者の業務負荷が急増します。問い合わせが増えた際の割り振りルールを事前に決めておき、特定の担当者に集中しない体制を整えておくことが重要です。`

  if (isLoan) return `B004（岡田様）のローン審査21日経過について、チームで協議した結論です。

**■ 今日中にやること**
岡田様に電話し、審査の現状と今後のスケジュールを丁寧に説明してください。「連絡がない＝見捨てられた」と感じた顧客が他社に流れるケースが非常に多いです。見込み手数料は約139万円と大きく、離脱リスクを最優先で対処すべきです。

**■ 並行申請の検討**
審査が長引く場合はフラット35など別の金融機関への並行申請を提案してください。ただし、並行申請を行う場合は必ず岡田様の同意を書面で得てから進めること。

**■ 運用ルールとして定める**
ローン審査中の顧客には週1回の定期報告を送る仕組みを作ってください。テンプレートを1つ用意するだけで、担当者の負担も最小限に抑えられます。

**■ 審査否決に備えて**
売買契約書のローン特約の期限を今一度確認し、期限が迫っている場合は売主・買主双方と協議の上、延長の覚書を締結することを検討してください。`

  if (isStaff) return `担当者間の案件偏在の解消について、チームで協議した結論です。

**■ 今すぐ決めるルール**
新規問い合わせの割り振りは「現在の担当件数が少ない順」を原則とします。このルールを口頭ではなく文書化し、全員に共有してください。

**■ 伊藤担当者のフォロー**
今月の成約ゼロが続いていることを踏まえ、経験豊富な担当者との共同担当（OJT案件）を1件設定することを強く推奨します。責める場ではなく、一緒に成功体験を作る機会として設計してください。

**■ 上限ルールの設定**
1担当者あたりの上限案件数を5件とする内部ルールを設けることを推奨します。過負荷は対応品質の低下だけでなく、法定義務（重要事項説明等）の漏れにもつながります。

**■ 週次ミーティングの活用**
毎週全員で案件状況を共有する場を30分設けてください。属人化を防ぎ、困っている担当者を早期に発見できます。将来的には得意エリア・物件種別に応じた専門特化（例：高額物件専門担当）も視野に入れてください。`

  if (isRevenue) return `収益の多様化・向上について、チームで協議した結論です。

**■ 優先順位**
①高額物件比率の向上 → ②既存顧客リピート強化 → ③周辺サービス展開、の順で着手することを推奨します。

**■ 高額物件比率の向上（最優先）**
B001（山本様・麻布高台9,200万円）の手数料は約317万円で中価格帯3〜4件分に相当します。高額物件比率を現在の約30%から45%に高めることが最も効率的な収益改善策です。税理士・弁護士・FPとの連携強化で、相続や資産整理のタイミングで紹介してもらえる関係を今から作っていくことが重要です。

**■ 既存顧客へのアプローチ**
過去の取引客に1〜2年ごとに「相続・買替え・賃貸転換」の提案を送る仕組みを作ってください。新規顧客獲得コストの10分の1以下で成約につながります。

**■ 周辺サービスへの展開（中長期）**
賃貸管理・任意売却・相続コンサルへの参入は安定収益に直結しますが、弁護士法・税理士法との役割分担を明確にした上で進めてください。士業との連携協定を書面で整備することが前提条件です。`

  if (isResponse) return `初回問い合わせへの返答速度改善について、チームで協議した結論です。

**■ なぜ重要か**
業界調査では、1時間以内に返答した場合の成約率は24時間後の7倍。現在14件の問い合わせがあり、返答速度を改善するだけで追加で2〜3件の成約が生まれる可能性があります（推計100〜200万円の手数料増収）。

**■ 今すぐできること**
- 自動返信メール（受付確認＋「○時間以内に担当者からご連絡します」という一文）を設定する
- 夜間・週末の問い合わせ担当ローテーションを当番制で作成し、文書化する

**■ 運用ルール**
問い合わせ受付から初回接触までの時間を「目標2時間以内」としてKPI管理してください。問い合わせ経路別（LINE・ポータル・電話）に分けて計測すると、どこがボトルネックか明確になります。

**■ 担当者への配慮**
「常に返答しなければならない」プレッシャーはバーンアウトの原因になります。当番以外のスタッフは返答義務がないというルールを明確にし、当番手当の支給も検討してください。仕組みで解決することが長期的に機能します。`

  // デフォルト
  return `ご質問について、財務・マーケティング・営業・法務・企画・人事の観点でチームで協議しました。

**■ 現状の整理**
現在、進行中案件15件・今月売上620万円（先月比+7%）・問い合わせ14件（先月比+27%増）と数字は堅調です。一方でS007（加藤様）の45日超滞留とB004（岡田様）のローン審査21日経過という2つの緊急課題があります。

**■ 今週の最優先アクション**
- S007（加藤様）に価格調整の商談を実施する
- B004（岡田様）に進捗報告の電話をする
- 現在の問い合わせ14件への今週中のフォローアップ計画を立てる

**■ 中期的に整備すること**
- 初回問い合わせの返答速度（目標：2時間以内）をKPI化する
- 担当者間の案件割り振りルールを文書化する
- ローン審査中顧客への週1回定期報告を習慣化する

何か特定のテーマについてさらに深掘りしたい場合は、具体的にお聞かせください。`
}

// ── 型定義 ────────────────────────────────────────────────────────────
interface ChatMessage {
  id: string
  role: 'user' | 'team'
  content: string
  timestamp: Date
}

// ── マークダウン風テキストのレンダリング ──────────────────────────────
function renderContent(text: string) {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let key = 0

  for (const line of lines) {
    if (line.startsWith('**■ ') && line.endsWith('**')) {
      elements.push(
        <p key={key++} className="text-sm font-bold text-gray-800 mt-4 mb-1.5 first:mt-0">
          {line.replace(/\*\*/g, '')}
        </p>
      )
    } else if (line.startsWith('- ')) {
      elements.push(
        <div key={key++} className="flex items-start gap-2 mb-1">
          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
          <span className="text-sm text-gray-700 leading-relaxed">{line.slice(2)}</span>
        </div>
      )
    } else if (line.trim() === '') {
      elements.push(<div key={key++} className="h-1" />)
    } else {
      elements.push(
        <p key={key++} className="text-sm text-gray-700 leading-relaxed mb-1">
          {line}
        </p>
      )
    }
  }

  return elements
}

// ── メインページ ──────────────────────────────────────────────────────
export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    const question = input.trim()
    setInput('')
    setLoading(true)

    await new Promise(resolve => setTimeout(resolve, 1500))

    const teamMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'team',
      content: generateMockResponse(question),
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, teamMessage])
    setLoading(false)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const SUGGEST_QUESTIONS = [
    '加藤様（S007）の販売活動が45日超滞留しています。どう対応すべきですか？',
    '春の引越しシーズンに問い合わせを最大化するにはどうすればいいですか？',
    '初回問い合わせへの返答速度を改善する具体的な方法を教えてください',
    '収益を多様化するために今すぐ着手すべきことは何ですか？',
    '担当者間の案件偏在をどう解消すればいいですか？',
    'ローン審査中の岡田様（B004）の離脱を防ぐにはどうすればいいですか？',
  ]

  return (
    <div className="flex flex-col h-screen bg-gray-50">

      {/* ── ヘッダー ── */}
      <div
        className="flex-shrink-0 px-6 py-4 border-b border-white/10"
        style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)' }}
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: '#e94560' }}
            >
              <MessageSquare size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-base">AI改善チャット</h1>
              <p className="text-white/50 text-xs">6つの専門領域チームが協議して回答します</p>
            </div>
          </div>
          <div className="flex -space-x-2">
            {EXPERT_ICONS.map(e => {
              const Icon = e.icon
              return (
                <div
                  key={e.key}
                  className="w-7 h-7 rounded-full border-2 border-slate-800 flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: e.color }}
                >
                  <Icon size={12} className="text-white" />
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── チャット本文 ── */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* 初回ガイド */}
          {messages.length === 0 && !loading && (
            <div className="text-center py-10">
              <div
                className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
                style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)' }}
              >
                <MessageSquare size={28} className="text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">専門家チームとの壁打ちを始めよう</h2>
              <p className="text-gray-500 text-sm mb-8 max-w-md mx-auto leading-relaxed">
                財務・マーケティング・営業・法務・企画・人事の6領域が協議し、<br />
                チームとしての結論をまとめてお伝えします
              </p>
              <div className="grid grid-cols-2 gap-3 max-w-2xl mx-auto text-left">
                {SUGGEST_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(q)}
                    className="text-left p-3 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all text-sm text-gray-700 leading-snug"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* メッセージ一覧 */}
          {messages.map(msg => (
            <div key={msg.id}>
              {msg.role === 'user' ? (
                <div className="flex justify-end">
                  <div className="max-w-lg">
                    <div
                      className="rounded-2xl rounded-tr-sm px-4 py-3 text-white text-sm leading-relaxed"
                      style={{ backgroundColor: '#0f3460' }}
                    >
                      {msg.content}
                    </div>
                    <p className="text-xs text-gray-400 text-right mt-1">
                      {msg.timestamp.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex justify-start">
                  <div className="w-full max-w-3xl">
                    {/* 送信者ラベル */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex -space-x-1.5">
                        {EXPERT_ICONS.map(e => {
                          const Icon = e.icon
                          return (
                            <div
                              key={e.key}
                              className="w-5 h-5 rounded-full border border-white flex items-center justify-center"
                              style={{ backgroundColor: e.color }}
                            >
                              <Icon size={9} className="text-white" />
                            </div>
                          )
                        })}
                      </div>
                      <span className="text-xs text-gray-500 font-medium">専門家チームの協議結果</span>
                      <span className="text-xs text-gray-400">
                        {msg.timestamp.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {/* 回答カード */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
                      {renderContent(msg.content)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* ローディング */}
          {loading && (
            <div className="flex justify-start">
              <div className="w-full max-w-3xl">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex -space-x-1.5">
                    {EXPERT_ICONS.map(e => {
                      const Icon = e.icon
                      return (
                        <div
                          key={e.key}
                          className="w-5 h-5 rounded-full border border-white flex items-center justify-center animate-pulse"
                          style={{ backgroundColor: e.color }}
                        >
                          <Icon size={9} className="text-white" />
                        </div>
                      )
                    })}
                  </div>
                  <span className="text-xs text-gray-500">専門家チームが協議中...</span>
                  <RefreshCw size={12} className="text-gray-400 animate-spin" />
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-5 animate-pulse space-y-3">
                  <div className="h-3 rounded bg-gray-200 w-1/3" />
                  <div className="h-2.5 rounded bg-gray-100 w-full" />
                  <div className="h-2.5 rounded bg-gray-100 w-5/6" />
                  <div className="h-2.5 rounded bg-gray-100 w-4/5" />
                  <div className="h-3 rounded bg-gray-200 w-1/4 mt-4" />
                  <div className="h-2.5 rounded bg-gray-100 w-full" />
                  <div className="h-2.5 rounded bg-gray-100 w-3/4" />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* ── 入力エリア ── */}
      <div className="flex-shrink-0 border-t border-gray-200 bg-white px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="質問・相談・テーマを入力（Shift+Enterで改行、Enterで送信）"
              rows={2}
              disabled={loading}
              className="flex-1 border border-gray-200 rounded-2xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent disabled:bg-gray-50 leading-relaxed"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 disabled:opacity-40 transition-all hover:scale-105 active:scale-95"
              style={{ backgroundColor: '#e94560' }}
            >
              <Send size={18} className="text-white" />
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            現在の案件データ・KPI・改善分析を学習済み ·
            <span className="ml-1 text-amber-500 font-medium">デモモード（API連携は後ほど設定）</span>
          </p>
        </div>
      </div>
    </div>
  )
}
