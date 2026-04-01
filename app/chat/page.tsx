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
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from 'lucide-react'

// ── 専門家定義 ────────────────────────────────────────────────────────────
const EXPERTS = [
  {
    key: 'finance',
    label: '財務責任者',
    name: '田村 誠一',
    role: 'CFO',
    color: '#e94560',
    bg: '#fff0f2',
    border: '#ffd0d8',
    icon: TrendingUp,
  },
  {
    key: 'marketing',
    label: 'マーケティング責任者',
    name: '松本 さやか',
    role: 'CMO',
    color: '#3b82f6',
    bg: '#eff6ff',
    border: '#bfdbfe',
    icon: Megaphone,
  },
  {
    key: 'sales',
    label: '売買営業マン',
    name: '佐々木 健太',
    role: 'Sr. Agent',
    color: '#16a34a',
    bg: '#f0fdf4',
    border: '#bbf7d0',
    icon: Building2,
  },
  {
    key: 'legal',
    label: '法務・コンプライアンス責任者',
    name: '中村 律子',
    role: 'CLO',
    color: '#7c3aed',
    bg: '#f5f3ff',
    border: '#ddd6fe',
    icon: Shield,
  },
  {
    key: 'strategy',
    label: '事業・企画責任者',
    name: '高橋 雄介',
    role: 'CSO',
    color: '#d97706',
    bg: '#fffbeb',
    border: '#fde68a',
    icon: Lightbulb,
  },
  {
    key: 'hr',
    label: '人事・総務責任者',
    name: '伊藤 恵子',
    role: 'CHRO',
    color: '#0891b2',
    bg: '#ecfeff',
    border: '#a5f3fc',
    icon: Users,
  },
]

// ── モックレスポンス ──────────────────────────────────────────────────────
function generateMockResponse(question: string): Record<string, string> {
  const q = question

  // キーワード判定
  const isSales = /加藤|S007|滞留|販売活動|価格|売れない|成約/.test(q)
  const isMarketing = /問い合わせ|集客|spring|春|シーズン|広告|LINE|SNS|ポータル/.test(q)
  const isLoan = /ローン|岡田|B004|審査|金融|フラット/.test(q)
  const isStaff = /担当|偏在|伊藤|人材|育成|負荷|分配/.test(q)
  const isRevenue = /収益|売上|多様化|拡大|高額|富裕/.test(q)
  const isResponse = /返答|対応|速度|初回|レスポンス|連絡/.test(q)

  if (isSales) {
    return {
      finance: `S007（加藤様）の45日超滞留は財務的に深刻なリスクです。現在の販売価格2,200万円に対し、弊社の見込み手数料は約79万円ですが、このまま滞留が続けば機会コストが膨らみます。価格を5%引き下げると2,090万円となり手数料は約74万円になりますが、早期成約で他の案件にリソースを集中できるため、会社全体の収益改善につながります。今月の問い合わせが14件（先月比+27%）と好調な今こそ、価格調整で動かす好機です。`,
      marketing: `45日間販売活動をしているということは、ポータルサイトでの掲載が「古い情報」に見られている可能性が高いです。まず写真を全面リニューアルし、掲載日を更新することで新着感を演出するのが有効です。また千葉ニュータウンエリアは現在ファミリー層の需要が高まっているため、「春の転勤・入学シーズンに間に合う」というメッセージで訴求するべきです。LINE公式アカウントでのターゲット広告も組み合わせると、問い合わせ層を一気に広げられます。`,
      sales: `正直に言うと、45日は長すぎます。私の経験上、30日を超えた物件は何か根本的な問題があることが多い。加藤様の場合、価格設定か、写真・説明文のどちらかが絶対にネックになっています。今週中に加藤様と直接お会いして、近隣の最新成約事例を3件ほど持参し、数字で納得していただく商談をするべきです。「今下げれば春シーズンに間に合う」という時間的プレッシャーも効果的に使えます。`,
      legal: `価格変更の際は専任媒介契約の内容を再確認してください。特に広告費用の負担や、変更後の販売条件が契約書に明記されているかどうかを確認する必要があります。また、価格引き下げの提案は書面で行い、加藤様の署名・押印をもらうことで、後のトラブルを防げます。宅建業法上、価格変更時には重要事項説明書の更新が必要になるケースもありますので、担当者に確認を徹底させてください。`,
      strategy: `S007の問題を個別案件として処理するだけでなく、「30日超滞留案件の定期レビュー制度」として仕組み化することを提案します。毎週月曜に滞留案件をリスト化し、担当者が具体的アクションを報告する場を設けることで、組織全体のパイプライン健全性が向上します。また、春シーズン（3〜4月）に間に合わせることができれば、年間売上目標への大きな貢献になります。この事例を組織の学習材料にしましょう。`,
      hr: `加藤様の案件を担当しているスタッフへのサポートが重要です。45日滞留が続くと担当者のモチベーションも下がります。上長が定期的に1on1で進捗確認をし、「責める」のではなく「一緒に考える」姿勢で関わることが大切です。また、今後は案件の「引き継ぎや共同担当」の仕組みも検討に値します。一人で抱え込まず、チームとして対処できる文化を作ることが離職防止にもつながります。`,
    }
  }

  if (isMarketing) {
    return {
      finance: `3〜4月の問い合わせが14件（先月比+27%）と急増しており、これを最大限活用することが今期の収益目標達成に直結します。広告予算を春シーズンに集中投資し、ROIを測定しながら運用することを推奨します。現在の成約率63%を70%に引き上げれば、14件の問い合わせから約2件の追加成約が見込め、手数料収入として推計100〜150万円の上積みが期待できます。`,
      marketing: `春の引越しシーズンは年間で最もコンバージョンしやすい時期です。具体的には①LINE公式アカウントでの「春の転勤・新生活物件特集」配信、②スーモ・アットホームのトップ掲載枠の確保、③「4月末入居可能物件」を前面に出したランディングページの作成、の3つを今週中に着手すべきです。特にLINEは問い合わせ経路として伸びているので、フォロワーへのプッシュ通知が効果的です。`,
      sales: `春シーズンはとにかく初速が命です。問い合わせが来たらその日中に電話して、翌日には内見の日程を取る。これだけで成約率が全然変わります。今の14件の問い合わせは全部追えていますか？私が経験した限り、春に8〜9割を次のステージに進めた年は年間の成績が別物でした。今週の行動計画を担当者と一緒に確認することを強くお勧めします。`,
      legal: `繁忙期は特にトラブルが増えます。内見の際の物件説明は記録を残し、後から「聞いていない」と言われないよう、重要事項を書面で渡す習慣をつけてください。また、春シーズンは複数の顧客が同じ物件を同時に検討するケースも増えますので、申し込み順位の管理と顧客への説明を丁寧に行うことが重要です。`,
      strategy: `春シーズンを最大活用するために、今すぐできることと中期施策を分けて考えましょう。即時：問い合わせ全14件へのフォローアップ計画作成、今月中：法人顧客向け「転勤需要」向け相談会の企画。法人・転勤需要は個人よりも決断が早く成約率が高い傾向があります。また、このシーズンの実績データを蓄積し、来年の戦略立案に活かす仕組みも今から準備しておくべきです。`,
      hr: `繁忙期は担当者の業務負荷が急増します。現在5名のスタッフで15件の案件を抱えており、春にさらに問い合わせが増えると一人当たりの負荷が限界を超えます。緊急対応として、週次の進捗共有ミーティングを30分設けて情報を可視化し、過負荷になっているスタッフを早期に発見する仕組みを作りましょう。また、アルバイトや業務委託の活用も視野に入れてください。`,
    }
  }

  if (isLoan) {
    return {
      finance: `B004（岡田様）のローン審査が21日経過しており、財務的にはこの案件のリスクが高まっています。見込み手数料は約139万円と大きく、離脱した場合の損失は深刻です。審査が長期化する場合はフラット35等の別銀行への並行申請を強くお勧めします。ローン審査の平均は14〜21日が標準なので、今が判断の分岐点です。`,
      marketing: `ローン審査中の顧客は不安を感じやすく、他社への比較検討を始めることがあります。週1回の「進捗報告メール」テンプレートを用意し、「私たちがしっかり伴走しています」という安心感を届けることがLTV向上に直結します。こういった丁寧な対応は口コミ・紹介につながる最大のマーケティングです。`,
      sales: `岡田様への連絡は今日中にしてください。ローン審査中に連絡が途絶えると、お客様は不安になって他の業者に声をかけることがあります。私の場合は審査中でも週1回必ず電話し、「私たちは一緒に取り組んでいます」という姿勢を伝え続けます。それだけで離脱率が全然違います。`,
      legal: `ローン審査が否決された場合に備えて、売買契約書のローン特約の内容を再確認してください。ローン特約の期限が迫っている場合は、売主・買主双方と協議の上、期限延長の覚書を締結することを検討してください。また、並行申請を行う場合は顧客の同意を得た上で進める必要があります。`,
      strategy: `ローン審査の長期化は業界全体の課題です。この案件を機に「ローン審査サポートフロー」を標準化することを提案します。①審査申し込み→②週1報告→③14日経過で並行申請検討→④21日経過でエスカレーション、という基準を作ることで組織全体の対応品質が上がります。`,
      hr: `ローン審査中の顧客対応は担当者にとっても精神的負荷が高い業務です。「自分の力ではどうにもならない」という無力感からモチベーションが下がることがあります。上長は「担当者を責める」のではなく、並行申請の手配など具体的な支援をしてあげることが重要です。`,
    }
  }

  if (isStaff) {
    return {
      finance: `担当者間の案件偏在は生産性損失に直結します。現在、鈴木・田中が各3件を担当している一方、山田は2件です。もし過負荷で対応品質が落ちて1件でも失注すれば、手数料100万円超の損失になります。案件割り振りの最適化は追加コストゼロで実行できる、最もコスパの高い改善施策です。`,
      marketing: `担当者の満足度と顧客体験は直結しています。過負荷のスタッフが対応した顧客は満足度が低く、紹介・口コミが生まれにくい。逆に余裕があるスタッフは丁寧な対応ができ、成約後も関係が続きます。適切な負荷分散は顧客満足度向上のための「隠れたマーケティング施策」です。`,
      sales: `正直、案件3件と2件の差は今は大きくないですが、春シーズンで問い合わせが増えると一気に崩れます。私は担当5件が限界だと感じています。今のうちに「新規問い合わせは担当件数の少ない順に自動割り振り」というルールを決めておかないと、繁忙期に大変なことになります。伊藤さんには今すぐOJT案件を1件つけて経験を積ませてあげてほしいです。`,
      legal: `担当者の過負荷は法令遵守リスクにもつながります。宅建業務は重要事項説明など法定義務が多く、業務が詰まっていると漏れが生じやすくなります。1担当者あたりの上限案件数を内部ルールとして文書化し、遵守することを推奨します。`,
      strategy: `案件割り振りの最適化は、単なる「公平性」の問題ではなく、組織の成長戦略と連動させるべきです。中長期的には、得意エリアや物件種別に応じた専門特化（例：高額物件専門担当、エリア担当制）を導入することで、組織全体の成約率と単価を向上させることができます。`,
      hr: `伊藤担当者の今月成約ゼロは要注意サインです。業務経験の蓄積が不均一になると、将来的な戦力として育たない可能性があります。今すぐ佐藤担当者との共同担当（OJT案件）を1件設定し、成功体験を積ませてください。また、全員参加の週次ミーティングで案件状況を共有することで、属人化を防ぎチームの学習機会を増やせます。`,
    }
  }

  if (isRevenue) {
    return {
      finance: `現在の収益は仲介手数料（成約時のみ）に集中しており、成約がなければ収益ゼロになるリスクがあります。B001（山本様・麻布高台9,200万円）のような高額物件1件の手数料は約317万円と、中価格帯3〜4件分に相当します。高額物件比率を現在の推定30%から45%に高めることが、最も効率的な収益改善策です。`,
      marketing: `収益多様化の観点では、既存顧客（過去の取引客）へのアプローチが最もコスパが高いです。新規顧客獲得コストに対し、既存顧客の紹介・リピートは費用が10分の1以下。CRMを整備し、1〜2年ごとに「相続・買替え・賃貸転換」の提案を送ることで安定収益が見込めます。また、LinkedInを活用した富裕層向けSNSマーケティングも検討価値があります。`,
      sales: `高額物件の開拓は、正直、紹介ネットワークがすべてです。税理士・弁護士・FPとの連携を強化して、相続や資産整理のタイミングで声をかけてもらえる関係性を作ることが大切です。私の経験では、高額物件のお客様は「信頼できる人から紹介された」という経緯がないとなかなか動きません。今すぐ既存のネットワークを棚卸しして、連絡をとっていない士業の方にアプローチすることをお勧めします。`,
      legal: `収益多様化として任意売却や相続コンサルへ参入する場合、宅地建物取引業法の範囲外の業務（法律・税務アドバイス）を行わないよう注意が必要です。弁護士法・税理士法との抵触リスクがありますので、連携する士業との役割分担を明確に文書化することをお勧めします。また、紹介料の授受については宅建業法の規制を確認してください。`,
      strategy: `収益多様化の優先順位は①高額物件比率の向上→②既存顧客リピート強化→③周辺サービス（賃貸管理・相続コンサル）の順が現実的です。特に賃貸管理は安定した月次収益をもたらし、景気変動に強いビジネスモデルです。5年後のビジョンとして「売買仲介＋賃貸管理＋資産コンサルの3本柱」を描き、今から段階的に布石を打つことを提案します。`,
      hr: `高額物件・富裕層対応には、担当者のスキルアップが不可欠です。高額物件の顧客は要求水準が高く、対応の質が成約を左右します。外部セミナーへの参加支援や、高額物件の成功事例を社内共有する「事例勉強会」を月1回設けることをお勧めします。また、富裕層対応に適した担当者を見極め、中長期的に育てていく人材戦略が必要です。`,
    }
  }

  if (isResponse) {
    return {
      finance: `初回問い合わせの返答速度は、費用ゼロで最も高いROIを生む改善施策の一つです。業界調査では1時間以内の返答は24時間後の7倍の成約率と言われており、現状の返答速度が改善されれば、今月14件の問い合わせから追加で2〜3件の成約が見込めます。これは推定200万円以上の手数料増収に相当します。`,
      marketing: `ブランド体験は最初の接触から始まっています。「問い合わせしたらすぐ返ってきた」という体験は、競合他社との差別化に直結します。まず自動返信メール（受付確認）を今日中に設定し、「○時間以内に担当者から連絡します」という約束を明示することで、顧客の不安を解消できます。また、問い合わせ経路別の返答時間をKPIとして可視化することが重要です。`,
      sales: `問い合わせが来てから1時間以内に電話できるかどうかで、本当に成約率が変わります。私は昼休みでも問い合わせ通知を確認して、すぐに折り返すようにしています。夜間・週末の問い合わせ対応ローテーションを作って、誰かが必ず30分以内に確認できる体制を作ることを強くお勧めします。`,
      legal: `自動返信メールに「受付確認」以外の情報（物件詳細・価格など）を含める場合、正確な情報のみを記載し、誤解を招く表現を避けてください。宅建業法上、広告に該当する情報の取り扱いには注意が必要です。また、問い合わせ対応の記録を残しておくことで、後のトラブル防止になります。`,
      strategy: `返答速度の改善は「人力でがんばる」だけでなく、仕組みで解決すべきです。ChatGPT等を活用した「よくある質問への自動回答bot」をLINEやWebサイトに実装することで、夜間・休日でも初期情報提供が可能になります。将来的にはChatwork APIと連携して、問い合わせ→担当者通知→自動返信のフローを全自動化することを目指すべきです。`,
      hr: `夜間・週末の問い合わせ対応ローテーションを作る際は、労働時間の管理に注意してください。「常に返答しなければならない」というプレッシャーはバーンアウトの原因になります。当番制を明確にし、当番外のスタッフは返答義務がないというルールを作ることで、全員が安心して働けます。当番手当の支給も検討してください。`,
    }
  }

  // デフォルトレスポンス
  return {
    finance: `ご質問の内容を財務的観点から分析します。現在の当社のKPIを確認すると、今月売上620万円（先月比+7%）、パイプライン総額1,850万円と堅調です。ただし、成約率63%はまだ改善余地があり、70%を目標とすることで月間で追加100〜150万円の収益増が見込めます。具体的な数値目標を設定し、進捗をモニタリングする仕組みを整えることが第一優先事項です。`,
    marketing: `マーケティングの観点から申し上げると、現在最も注目すべき点は問い合わせ数が14件（前月比+27%）と急増していることです。この勢いを維持・加速するために、問い合わせの経路別分析（LINE・ポータル・紹介）を行い、最も効果の高いチャネルにリソースを集中すべきです。また、成約した顧客からの紹介獲得を仕組み化することで、低コストで新規顧客を獲得できます。`,
    sales: `現場目線で言うと、今の状況で一番大事なのは今ある案件をしっかり前に進めることです。特にS007（加藤様）の45日滞留とB004（岡田様）のローン審査21日は今週中に何か動かさないといけない。問い合わせが増えているのは良いことですが、既存案件がボトルネックになっていると全体が回らなくなります。まず「今週やること」を3つに絞って動きましょう。`,
    legal: `法務的な観点から、現在の案件管理で最も重要なのはリスク管理の記録化です。各案件の対応履歴、顧客との合意事項を書面で残すことで、トラブル発生時の証拠となります。特に価格交渉や条件変更の際は必ず覚書を作成し、双方の署名をもらうことを徹底してください。また、重要事項説明は必ずチェックリストで漏れを防ぎましょう。`,
    strategy: `事業全体の方向性として、現在の課題は「今の案件をいかに効率よく成約に結びつけるか」と「次の成長に向けた土台作り」の両方を同時に進めることです。短期：S007・B004等の滞留案件の解消と春シーズンの最大活用。中期：初回対応速度の改善と業務の仕組み化。長期：高額物件比率向上と収益多様化。この3つを並行して進めることが重要です。`,
    hr: `組織の観点から重要なのは、スタッフが「安心して相談できる環境」を作ることです。現在5名のスタッフが15件の案件を抱えており、春シーズンでさらに負荷が増える見込みです。定期的な1on1ミーティングで各担当者の状況を把握し、困っていることを早期に発見・解決する仕組みを整えましょう。また、成功事例を共有する場を設けることで、チーム全体のスキルアップが図れます。`,
  }
}

// ── 型定義 ────────────────────────────────────────────────────────────
interface ExpertOpinion {
  expertKey: string
  content: string
}

interface ChatMessage {
  id: string
  role: 'user' | 'expert'
  content: string
  expertOpinions?: ExpertOpinion[]
  timestamp: Date
}

// ── 専門家カード ─────────────────────────────────────────────────────
function ExpertCard({ opinion }: { opinion: ExpertOpinion }) {
  const expert = EXPERTS.find(e => e.key === opinion.expertKey)
  if (!expert) return null
  const Icon = expert.icon

  return (
    <div
      className="rounded-xl border p-4 mb-3"
      style={{ backgroundColor: expert.bg, borderColor: expert.border }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: expert.color }}
        >
          <Icon size={14} className="text-white" />
        </div>
        <div>
          <span className="text-xs font-bold" style={{ color: expert.color }}>
            {expert.label}
          </span>
          <span className="text-xs text-gray-400 ml-1.5">
            {expert.name}（{expert.role}）
          </span>
        </div>
      </div>
      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
        {opinion.content}
      </p>
    </div>
  )
}

// ── メインページ ──────────────────────────────────────────────────────
export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [collapsedMessages, setCollapsedMessages] = useState<Set<string>>(new Set())
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const toggleCollapse = (id: string) => {
    setCollapsedMessages(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

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

    // モック: 1.5秒後にレスポンス
    await new Promise(resolve => setTimeout(resolve, 1500))

    const mockResponses = generateMockResponse(question)
    const expertOpinions: ExpertOpinion[] = EXPERTS.map(e => ({
      expertKey: e.key,
      content: mockResponses[e.key] || '現在データを分析中です。',
    }))

    const expertMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'expert',
      content: '',
      expertOpinions,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, expertMessage])
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
              <p className="text-white/50 text-xs">6名の専門家チームが協議します</p>
            </div>
          </div>
          {/* 専門家アバター */}
          <div className="flex -space-x-2">
            {EXPERTS.map(e => {
              const Icon = e.icon
              return (
                <div
                  key={e.key}
                  title={`${e.label}（${e.name}）`}
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
                財務・マーケティング・営業・法務・企画・人事の6名が<br />
                現在のデータを踏まえて協議し、多角的な意見を提供します
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
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <div className="flex -space-x-1.5">
                          {EXPERTS.map(e => {
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
                        <span className="text-xs text-gray-500 font-medium">専門家チーム</span>
                        <span className="text-xs text-gray-400">
                          {msg.timestamp.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <button
                        onClick={() => toggleCollapse(msg.id)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {collapsedMessages.has(msg.id) ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                      </button>
                    </div>
                    {!collapsedMessages.has(msg.id) && (
                      <div>
                        {msg.expertOpinions?.map((opinion, i) => (
                          <ExpertCard key={i} opinion={opinion} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* ローディング */}
          {loading && (
            <div className="flex justify-start">
              <div className="w-full max-w-3xl">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex -space-x-1.5">
                    {EXPERTS.map(e => {
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
                <div className="space-y-3">
                  {EXPERTS.map(e => (
                    <div
                      key={e.key}
                      className="rounded-xl border p-4 animate-pulse"
                      style={{ backgroundColor: e.bg, borderColor: e.border }}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 rounded-lg" style={{ backgroundColor: e.color + '40' }} />
                        <div className="h-3 rounded w-28" style={{ backgroundColor: e.color + '30' }} />
                      </div>
                      <div className="space-y-2">
                        <div className="h-2.5 rounded bg-gray-200 w-full" />
                        <div className="h-2.5 rounded bg-gray-200 w-5/6" />
                        <div className="h-2.5 rounded bg-gray-200 w-3/4" />
                      </div>
                    </div>
                  ))}
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
