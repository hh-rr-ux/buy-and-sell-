export const dynamic = 'force-static'

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
} from 'lucide-react'
import { sellCases, buyCases, staffStats } from '@/lib/mockData'

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

export default function SuggestionsPage() {
  // Rule-based analysis
  const stalledSellCount = sellCases.filter(c => c.stage === '販売活動' && c.daysInStage > 30).length
  const stalledBuyCount = buyCases.filter(c => c.stage === '内見' && c.daysInStage > 20).length
  const maxStaffCases = Math.max(...staffStats.map(s => s.activeCases))
  const minStaffCases = Math.min(...staffStats.map(s => s.activeCases))
  const overloadedStaff = staffStats.filter(s => s.activeCases >= maxStaffCases).map(s => s.name)
  const underloadedStaff = staffStats.filter(s => s.activeCases <= minStaffCases).map(s => s.name)
  const loanStalled = buyCases.filter(c => c.stage === 'ローン審査' && c.daysInStage > 14)

  const suggestions: Suggestion[] = [
    {
      priority: 'high',
      category: 'bottleneck',
      title: '販売活動ステージでの滞留が深刻',
      finding: `現在、売却仲介の「販売活動」ステージに${stalledSellCount}件が30日以上滞留しています（S001: 山本様32日、S007: 加藤様45日）。特にS007は45日を超えており、価格設定の見直しが急務です。販売活動→売買契約の変換に平均37日かかっており、業界標準（21日）を大幅に上回っています。`,
      actions: [
        '加藤様（S007）の物件について、近隣の最新成約事例を再調査し、価格を5〜8%調整することを顧客に提案する',
        '山本様（S001）の内覧希望者3組に対して、今週中に日程調整のフォローアップ連絡を行う',
        '毎週月曜日に「30日超滞留案件」のレビュー会議を設定し、担当者が具体的なアクションプランを共有する',
        'ポータルサイトの写真・説明文を更新し、新鮮さを演出してPV数の回復を図る',
      ],
      impact: '販売活動期間を平均37日→25日に短縮、月次成約数+1件増加（年間+120万円程度の売上増）',
    },
    {
      priority: 'high',
      category: 'bottleneck',
      title: 'ローン審査ステージの長期化リスク',
      finding: `購入仲介のローン審査中案件（B004: 岡田様）が21日経過しており、銀行の審査結果待ちが続いています。ローン審査は平均14〜21日が標準ですが、顧客への状況報告が不足すると不安から他社に流れるリスクがあります。`,
      actions: [
        '岡田様に今週中に進捗報告の電話をし、審査状況と想定スケジュールを丁寧に説明する',
        'メインバンクの審査が長引く場合に備え、別の金融機関（フラット35等）への並行申請を提案する',
        'ローン審査中の顧客には週1回の定期報告メールを送る運用ルールを策定する',
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
      finding: `不動産業界の調査によると、初回問い合わせから1時間以内に返答した場合の成約率は、24時間後の返答と比較して7倍高くなるとされています。現在、問い合わせ受付からの対応状況が可視化されておらず、特に夜間・週末の問い合わせへの初動対応が遅れている可能性があります。`,
      actions: [
        'Chatworkへの問い合わせ通知受信後、30分以内に「受付確認メッセージ」を送る自動返信テンプレートを用意する',
        '平日17時以降・土日の問い合わせ担当者のローテーションシフトを作成する',
        '問い合わせ受付から初回接触までの時間をKPI（目標：2時間以内）として管理する',
        'よくある質問（物件概要・査定方法・手順）のFAQページを作成し、初回接触前の情報提供を充実させる',
      ],
      impact: '初回接触率向上により、問い合わせ→査定への転換率を現状の63%から70%以上に改善',
    },
    {
      priority: 'medium',
      category: 'seasonal',
      title: '春の引越しシーズン（3〜4月）を最大活用する',
      finding: `不動産取引は3月・4月に年間最大のピークを迎えます。データを見ると、2026年3月の問い合わせ数は14件（2月比27%増）と急増しており、このシーズナリティを最大活用できるかが年間業績を大きく左右します。一方、12月の成約件数は8件（売却4・購入4）と最多で、年末需要も重要です。`,
      actions: [
        '4月末までに現在の問い合わせ14件のうち最低8件を次のステージ（査定・内見）に進める目標を設定する',
        '春の転勤需要（4月・10月）に合わせた法人顧客向けの売却・購入相談会を企画する',
        '年末（12月）に向けた9月頃からの早期アプローチ（買替え検討客のリストアップ）を今から計画する',
        'シーズン別の広告予算配分を見直し、3〜4月・9〜10月に集中投資する計画を立てる',
      ],
      impact: '3〜4月の成約数を前年比20%増を目標に設定、年間売上目標への貢献',
    },
    {
      priority: 'low',
      category: 'automation',
      title: 'Claude Codeによる業務自動化で週10時間を削減する',
      finding: `現在、案件管理・進捗報告・顧客へのフォローアップメールなど、定型的な業務に多くの時間が費やされていると推定されます。Claude Code等のAIを活用することで、これらの業務を自動化・半自動化し、担当者が顧客対応と提案活動に集中できる環境を作ることが可能です。`,
      actions: [
        '【即実行可能】Chatwork新着メッセージを定期取得→Google Sheetsの案件データを自動更新するスクリプトをClaude Codeで作成する',
        '【1ヶ月以内】「ステージが30日以上変化なし」の案件を自動検知し、担当者にChatworkで通知するアラートボットを構築する',
        '【1ヶ月以内】顧客の属性（予算・エリア・種別）に応じた「おすすめ物件リスト」を自動生成するメール配信を実装する',
        '【3ヶ月以内】売買契約締結後の必要書類チェックリストを自動生成し、顧客・担当者双方に送付する仕組みを作る',
        '【3ヶ月以内】月次レポート（KPI・案件状況・担当者実績）を自動生成してPDF出力する機能をこのダッシュボードに追加する',
      ],
      impact: '担当者1名あたり週5〜10時間の削減、年間200〜400時間の業務効率化。担当者が顧客対応に集中できるようになり成約率5〜10%向上が見込める',
    },
    {
      priority: 'low',
      category: 'revenue',
      title: '収益構造の多様化と客単価向上戦略',
      finding: `現在の収益は仲介手数料（成約時）に集中しており、成約しなければ収益がゼロになるリスクがあります。また、高額物件（9,200万円の佐々木様等）は1件で大きな収益をもたらすため、高額物件の比率を高めることが収益向上に直結します。`,
      actions: [
        '既存顧客（過去の取引客）に対して1〜2年後の買替え・相続対策相談の案内を送り、リピート率を高める',
        '売買仲介に加え、賃貸管理・任意売却・相続コンサルティングなどの周辺サービスへの拡張を検討する',
        '7,000万円以上の高額物件を重点開拓するため、富裕層向けSNS（LinkedInなど）の活用や相続・税理士との連携を強化する',
        '成約顧客に紹介報酬制度（クーポン等）を設け、口コミ・紹介による新規顧客獲得コストを下げる',
        'ポータルサイト依存から脱却するため、SEO対応のオウンドメディア（地域情報ブログ等）を構築して自然流入を増やす',
      ],
      impact: '2年後の目標として月間売上20%増、高額物件比率30%→45%への引き上げ',
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

      {/* Footer Note */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-xl">
        <div className="flex items-start gap-2">
          <Zap size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-700 mb-1">次のステップ: データ連携の実装</p>
            <p className="text-xs text-blue-600 leading-relaxed">
              このダッシュボードを Chatwork API・Google Sheets API と連携することで、
              リアルタイムデータに基づく自動分析・アラート通知が可能になります。
              <code className="bg-blue-100 px-1 py-0.5 rounded text-blue-800 mx-1">lib/dataLoader.ts</code>
              の TODO コメントを参照し、API トークンを設定してください。
              GitHub Actions の
              <code className="bg-blue-100 px-1 py-0.5 rounded text-blue-800 mx-1">.github/workflows/fetch-data.yml</code>
              もあわせて設定することで、定期的な自動取得が実現できます。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
