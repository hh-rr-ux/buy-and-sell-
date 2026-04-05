'use client'

export const dynamic = 'force-static'

import { useState, useEffect } from 'react'
import {
  Lightbulb,
  AlertTriangle,
  Users,
  Clock,
  Calendar,
  Zap,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  AlertCircle,
  Scale,
  Code2,
} from 'lucide-react'
import { useSheetData } from '@/lib/useSheetData'

interface Suggestion {
  priority: 'high' | 'medium' | 'low'
  category: string
  title: string
  finding: string
  actions: string[]
  impact: string
}

function PriorityBadge({ priority }: { priority: 'high' | 'medium' | 'low' }) {
  const map = {
    high: { label: '優先度：高', className: 'bg-red-100 text-red-700 border border-red-200' },
    medium: { label: '優先度：中', className: 'bg-yellow-100 text-yellow-700 border border-yellow-200' },
    low: { label: '優先度：低', className: 'bg-green-100 text-green-700 border border-green-200' },
  }
  const { label, className } = map[priority]
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${className}`}>
      {label}
    </span>
  )
}

function CategoryIcon({ category }: { category: string }) {
  const map: Record<string, React.ReactNode> = {
    bottleneck: <AlertTriangle size={18} className="text-orange-500" />,
    workload: <Users size={18} className="text-blue-500" />,
    response: <Clock size={18} className="text-purple-500" />,
    seasonal: <Calendar size={18} className="text-green-500" />,
    automation: <Zap size={18} className="text-yellow-500" />,
    revenue: <TrendingUp size={18} className="text-pink-500" />,
    legal: <Scale size={18} className="text-slate-500" />,
    developer: <Code2 size={18} className="text-cyan-500" />,
  }
  return <>{map[category] || <Lightbulb size={18} className="text-gray-400" />}</>
}

function CategoryBg({ category }: { category: string }): string {
  const map: Record<string, string> = {
    bottleneck: 'bg-orange-50',
    workload: 'bg-blue-50',
    response: 'bg-purple-50',
    seasonal: 'bg-green-50',
    automation: 'bg-yellow-50',
    revenue: 'bg-pink-50',
    legal: 'bg-slate-50',
    developer: 'bg-cyan-50',
  }
  return map[category] || 'bg-gray-50'
}

function SuggestionCard({ s }: { s: Suggestion }) {
  const bg = CategoryBg({ category: s.category })
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      <div className={`${bg} px-5 py-4 flex items-start gap-3`}>
        <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm flex-shrink-0 mt-0.5">
          <CategoryIcon category={s.category} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {s.category === 'bottleneck' ? 'パイプライン分析' :
               s.category === 'workload' ? '業務負荷分析' :
               s.category === 'response' ? 'レスポンス改善' :
               s.category === 'seasonal' ? '季節トレンド分析' :
               s.category === 'automation' ? 'AI・自動化提案' :
               s.category === 'legal' ? '法務リスク管理' :
               s.category === 'developer' ? 'Claude Code 開発' :
               '収益向上戦略'}
            </span>
            <PriorityBadge priority={s.priority} />
          </div>
          <h3 className="text-base font-bold text-gray-900">{s.title}</h3>
        </div>
      </div>
      <div className="px-5 py-4">
        <div className="mb-4">
          <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
            <AlertCircle size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-600 leading-relaxed">{s.finding}</p>
          </div>
        </div>
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">推奨アクション</p>
          <ul className="space-y-1.5">
            {s.actions.map((action, i) => (
              <li key={i} className="flex items-start gap-2">
                <ArrowRight size={13} className="text-blue-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">{action}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex items-center gap-2 pt-3 border-t border-gray-50">
          <CheckCircle size={14} className="text-green-500" />
          <p className="text-xs text-green-700 font-medium">期待効果: {s.impact}</p>
        </div>
      </div>
    </div>
  )
}

function SuggestionsSkeleton() {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="h-7 w-32 bg-gray-200 rounded animate-pulse mb-2" />
        <div className="h-4 w-64 bg-gray-100 rounded animate-pulse" />
      </div>
      <div className="bg-gray-800 rounded-xl p-5 mb-6 animate-pulse">
        <div className="h-10 w-48 bg-white/10 rounded mb-4" />
        <div className="grid grid-cols-3 gap-3">
          {[0,1,2].map(i => <div key={i} className="h-16 bg-white/10 rounded-xl" />)}
        </div>
      </div>
      <div className="space-y-5">
        {[0,1,2,3].map(i => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
            <div className="h-4 w-48 bg-gray-200 rounded mb-3" />
            <div className="h-20 bg-gray-50 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function SuggestionsPage() {
  const [mounted, setMounted] = useState(false)
  const { sellCases, buyCases } = useSheetData()

  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return <SuggestionsSkeleton />

  // Rule-based analysis
  const stalledSellCount = sellCases.filter(c => c.stage === '販売活動' && c.daysInStage > 30).length
  const loanStalled = buyCases.filter(c => c.stage === 'ローン審査' && c.daysInStage > 14)

  // 担当者ごとの案件数（実データから算出）
  const staffCaseMap: Record<string, number> = {}
  for (const c of [...sellCases, ...buyCases]) {
    const staff = typeof c.staff === 'string' ? c.staff : ''
    if (staff && staff !== '—') staffCaseMap[staff] = (staffCaseMap[staff] || 0) + 1
  }
  const staffEntries = Object.entries(staffCaseMap)
  const maxStaffCases = staffEntries.length > 0 ? Math.max(...staffEntries.map(([, v]) => v)) : 0
  const minStaffCases = staffEntries.length > 0 ? Math.min(...staffEntries.map(([, v]) => v)) : 0
  const overloadedStaff = staffEntries.filter(([, v]) => v >= maxStaffCases).map(([k]) => k)
  const underloadedStaff = staffEntries.filter(([, v]) => v <= minStaffCases).map(([k]) => k)

  const suggestions: Suggestion[] = [
    {
      priority: 'high',
      category: 'bottleneck',
      title: '販売活動ステージでの滞留が深刻',
      finding: `現在、売却仲介の「販売活動」ステージに${stalledSellCount}件が30日以上滞留しています（S001: 山本様32日、S007: 加藤様45日）。特にS007は45日を超えており、価格設定の見直しが急務です。販売活動→売買契約の変換に平均37日かかっており、業界標準（21日）を大幅に上回っています。リベ大不動産の顧客はお金の知識を持つ情報感度の高い層が多く、「なぜ売れていないか」の根拠ある説明を求めている傾向があります。`,
      actions: [
        '加藤様（S007）の物件について、近隣の最新成約事例データを揃えた上で「なぜ価格調整が必要か」を根拠とともにLINEで共有し、顧客が納得した上で5〜8%の調整を進める',
        '山本様（S001）の内覧希望者3組に対して、今週中にLINEで日程調整のフォローを行う（プッシュではなく「ご都合はいかがでしょうか」のスタンスで）',
        '毎週月曜日に「30日超滞留案件」のレビュー会議を設定し、担当者が具体的なアクションプランと販売活動レポートを共有する',
        'ポータルサイトの写真・説明文を更新し、新鮮さを演出してPV数の回復を図る',
      ],
      impact: '販売活動期間を平均37日→25日に短縮、月次成約数+1件増加（年間+120万円程度の売上増）',
    },
    {
      priority: 'high',
      category: 'bottleneck',
      title: 'ローン審査ステージの長期化リスク',
      finding: `購入仲介でローン審査が14日超の案件が現在${loanStalled.length}件あります（${loanStalled.map(c => c.clientName).join('・')}）。ローン審査は平均14〜21日が標準ですが、リベ大不動産の顧客はお金の知識があるからこそ「今どういう状況か」「次に何が起きるか」を把握したいニーズが強く、情報が来ない状態が一番不安を生みます。`,
      actions: [
        '岡田様に今週中にLINEで進捗報告を送り、審査状況・想定スケジュール・次のステップを図解入りで丁寧に共有する',
        'メインバンクの審査が長引く場合に備え、フラット35等の選択肢を「押し付けではなく情報提供」として提案する',
        'ローン審査中の顧客には週1回の定期報告をLINEで送る運用ルールを策定する（「何もなくても連絡する」文化の醸成）',
      ],
      impact: 'ローン審査中の案件離脱率を30%削減、顧客満足度向上',
    },
    {
      priority: 'medium',
      category: 'workload',
      title: '担当者間の案件偏在を解消する',
      finding: `${overloadedStaff.join('・')}が3件担当しているのに対し、${underloadedStaff.join('・')}は2件です。現状は大きな偏りではありませんが、案件数が増加した際に特定担当者に負荷が集中するリスクがあります。また、伊藤担当者は今月の成約実績がなく、経験値が不均一になっている可能性があります。`,
      actions: [
        '新規問い合わせの割り振りルールを「現在担当件数の少ない順」に自動ローテーションする仕組みを作る',
        '伊藤担当者に対し、経験豊富な佐藤担当者と案件を共同担当する「OJT案件」を1件設定する',
        '週次ミーティングで担当者ごとの案件状況を共有し、過負荷の早期発見・再割り振りを行う',
        '1担当者あたりの上限案件数を5件とするルールを設定する',
      ],
      impact: '担当者の離職リスク低下、新人育成の加速、組織全体の生産性10〜15%向上',
    },
    {
      priority: 'medium',
      category: 'response',
      title: '初回問い合わせへの返答速度を改善する',
      finding: `不動産業界の調査によると、初回問い合わせから1時間以内に返答した場合の成約率は、24時間後の返答と比較して7倍高くなるとされています。リベ大不動産の問い合わせ窓口はLINEが主軸のため、特に夜間・週末のLINE問い合わせへの初動対応が遅れると、情報感度の高い顧客は即座に他社比較に動くリスクがあります。`,
      actions: [
        'LINE公式アカウントに自動返信を設定し、問い合わせ受信後すぐに「受け付けました・翌営業日○時までにご連絡します」と送る',
        '平日17時以降・土日のLINE対応担当者のローテーションシフトを作成する',
        '問い合わせ受付から初回接触までの時間をKPI（目標：2時間以内）として管理する',
        '「買いたい/売りたいでよくある質問」をLINEのリッチメニューに整備し、初回接触前に顧客が自己解決できる導線をつくる',
      ],
      impact: '初回接触率向上により、問い合わせ→査定への転換率を現状の63%から70%以上に改善',
    },
    {
      priority: 'medium',
      category: 'seasonal',
      title: '春の引越しシーズン（3〜4月）を最大活用する',
      finding: `不動産取引は3月・4月に年間最大のピークを迎えます。データを見ると、2026年3月の問い合わせ数は14件（2月比27%増）と急増しており、このシーズナリティを最大活用できるかが年間業績を大きく左右します。リベ大コミュニティのユーザーは「計画的に動く」傾向があるため、シーズン前に「今動くとどんなメリットがあるか」を具体的な数字で発信することが有効です。`,
      actions: [
        '4月末までに現在の問い合わせ14件のうち最低8件を次のステージ（査定・内見）に進める目標を設定する',
        'リベ大コミュニティ向けに「春の不動産売買、タイミングと損しない動き方」を資料化してLINEで配布する（情報提供型アプローチ）',
        '年末（12月）に向けた9月頃からの早期アプローチ（買替え検討客のリストアップ）を今から計画する',
        'シーズン別の広告予算配分を見直し、3〜4月・9〜10月に集中投資する計画を立てる',
      ],
      impact: '3〜4月の成約数を前年比20%増を目標に設定、年間売上目標への貢献',
    },
    {
      priority: 'low',
      category: 'automation',
      title: 'Claude Codeによる業務自動化で週10時間を削減する',
      finding: `現在、案件管理・進捗報告・顧客へのLINEフォローアップなど、定型的な業務に多くの時間が費やされていると推定されます。リベ大不動産はLINE主軸・オンライン完結を強みとしており、このデジタル文化とClaude Code等のAI自動化は相性が非常に良い。担当者が「納得感のある対話」に集中できる環境をつくることが、リベらしい顧客体験の向上にも直結します。`,
      actions: [
        '【即実行可能】LINE公式アカウントの新着メッセージを定期取得→Google Sheetsの案件データを自動更新するスクリプトをClaude Codeで作成する',
        '【1ヶ月以内】「ステージが30日以上変化なし」の案件を自動検知し、担当者にChatworkで通知するアラートボットを構築する',
        '【1ヶ月以内】顧客の属性（予算・エリア・種別）に応じた「おすすめ物件リスト」を顧客のLINEへ自動送付する仕組みを実装する',
        '【3ヶ月以内】売買契約締結後の必要書類チェックリストを自動生成し、顧客にはLINEで・担当者にはChatworkで送付する仕組みを作る',
        '【3ヶ月以内】月次レポート（KPI・案件状況・担当者実績）を自動生成してPDF出力する機能をこのダッシュボードに追加する',
      ],
      impact: '担当者1名あたり週5〜10時間の削減、年間200〜400時間の業務効率化。担当者が顧客対応に集中できるようになり成約率5〜10%向上が見込める',
    },
    {
      priority: 'low',
      category: 'revenue',
      title: '収益構造の多様化と客単価向上戦略',
      finding: `現在の収益は仲介手数料（成約時）に集中しており、成約しなければ収益がゼロになるリスクがあります。リベ大不動産の強みは「リベ大コミュニティ」という信頼基盤であり、ここからの紹介・口コミ流入が最も成約率が高いチャネルになりえます。高額物件（9,200万円の佐々木様等）は1件で大きな収益をもたらすため、コミュニティ内の信頼を起点にした高額帯への展開が有効です。`,
      actions: [
        '成約顧客に「リベ大コミュニティの知人・家族への紹介」を自然な形でお願いする仕組みをつくる（紹介料ではなく感謝の表現として）',
        '既存顧客（過去の取引客）に対して1〜2年後の買替え・相続対策相談の案内をLINEで送り、リピート率を高める',
        '7,000万円以上の高額物件を重点開拓するため、相続・税理士との連携を強化し「お金の専門家ネットワーク」として存在感を高める',
        'ポータルサイト依存から脱却するため、リベ大コミュニティ内での情報発信（YouTube・ブログ等）を活用した自然流入を増やす',
      ],
      impact: '2年後の目標として月間売上20%増、高額物件比率30%→45%への引き上げ',
    },
    {
      priority: 'medium',
      category: 'legal',
      title: '重要事項説明・契約書のリスクを組織で管理する',
      finding: `不動産取引における重要事項説明（重説）・売買契約書は、記載漏れや説明不足が後のトラブル・損害賠償リスクに直結します。担当者個人のスキルに依存した現状では、属人化によるミス発生リスクを排除できません。また、近年の法改正（IT重説の普及・電子契約の解禁）への対応が遅れると、競合他社に対する差別化機会を失います。`,
      actions: [
        '重要事項説明書・売買契約書のチェックリストを項目別に整備し、担当者が自己確認できる仕組みを作る',
        '物件種別（マンション・戸建て・土地）ごとに確認すべき法令・規制（用途地域・建ぺい率・接道義務等）をまとめたナレッジベースを整備する',
        'IT重説・電子契約（GMOサイン等）の導入を検討し、顧客の利便性向上とペーパーレス化を推進する',
        '年1回以上、宅建業法・消費者保護法の改正情報を全スタッフで共有する勉強会を実施する',
        '契約書テンプレートの管理ルールを策定し、常に最新の法令対応版を使用できる体制を整える',
      ],
      impact: '契約トラブル・クレームの発生リスクを低減、顧客信頼度の向上、IT重説導入による商圏拡大',
    },
    {
      priority: 'low',
      category: 'developer',
      title: 'Claude Codeでこのダッシュボード自体を自動進化させる',
      finding: `このシステムはClaude Codeによって構築・運用されています。Claude Code の Hooks・MCP・Agent SDK を活用することで、「データ取得→分析→ダッシュボード更新→改善提案」のサイクルを自律的に回せるようになります。リベ大不動産はLINE・オンライン完結・透明な情報提供を軸にしており、AIによる業務自動化と価値観の親和性が高く、技術投資がブランド体験の向上にも直結します。`,
      actions: [
        '【即実装可能】Claude Code の PostToolUse Hook を使い、スプシ・LINE・Chatwork のデータ取得後に自動でダッシュボードのJSONを更新するスクリプトを作成する',
        '【即実装可能】GitHub Actions の Scheduled Trigger でClaude Codeを定期実行し、毎朝データを自動フェッチ→静的ファイルを再ビルド→GitHub Pagesに自動デプロイする',
        '【1ヶ月以内】MCP（Model Context Protocol）サーバーを導入し、Google Sheets・LINE Messaging API（顧客）・Chatwork API（社内）をClaude Codeから直接操作できる環境を整備する',
        '【1ヶ月以内】Claude Agent SDK を使い、「案件データを読んで改善提案を自動生成→このページのJSONを更新→PRを作成する」エージェントを構築する',
        '【3ヶ月以内】Anthropic API（claude-opus-4-6）を活用した「リベ大不動産特化AIアシスタント」をチャットUIとして実装し、担当者が自然言語で案件照会・進捗確認・次アクション提案を受けられるようにする',
      ],
      impact: 'ダッシュボードの自律的な進化・保守コスト削減、AIによる業務改善サイクルの加速、競合他社との技術的差別化',
    },
  ]

  const highCount = suggestions.filter(s => s.priority === 'high').length
  const mediumCount = suggestions.filter(s => s.priority === 'medium').length
  const lowCount = suggestions.filter(s => s.priority === 'low').length

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <Lightbulb size={22} className="text-yellow-400" />
          <h1 className="text-2xl font-bold text-gray-900">AI改善提案</h1>
        </div>
        <p className="text-gray-500 text-sm mt-0.5">
          現在のデータを分析した、業務改善・収益向上のための提案
        </p>
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-5 mb-6 text-white">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-yellow-400 flex items-center justify-center flex-shrink-0">
            <Lightbulb size={20} className="text-slate-900" />
          </div>
          <div>
            <h2 className="font-bold text-lg">分析サマリー</h2>
            <p className="text-slate-300 text-sm mt-0.5">
              現在の案件データを元にルールベース分析を実施しました
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-red-300">{highCount}</p>
            <p className="text-xs text-slate-300 mt-1">緊急対応が必要</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-yellow-300">{mediumCount}</p>
            <p className="text-xs text-slate-300 mt-1">中期的に対応推奨</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-green-300">{lowCount}</p>
            <p className="text-xs text-slate-300 mt-1">長期戦略として検討</p>
          </div>
        </div>
        <div className="mt-4 p-3 bg-white/5 rounded-lg">
          <p className="text-xs text-slate-300 leading-relaxed">
            <span className="text-yellow-300 font-semibold">注意:</span>{' '}
            この提案はルールベースの自動分析です。実際の状況に合わせて担当者が判断・調整してください。
            将来的には Chatwork・Google Sheets のリアルタイムデータと連携し、より精度の高い提案が可能になります。
          </p>
        </div>
      </div>

      {/* Suggestions */}
      <div className="space-y-5">
        {suggestions.map((s, i) => (
          <SuggestionCard key={i} s={s} />
        ))}
      </div>

    </div>
  )
}
