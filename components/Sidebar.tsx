'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard,
  TrendingDown,
  ShoppingCart,
  BarChart3,
  Lightbulb,
  Building2,
  List,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { sellCases, buyCases, calcBrokerageFee, formatPrice } from '@/lib/mockData'

const stageColor: Record<string, string> = {
  '問い合わせ':    'bg-gray-500',
  '査定':         'bg-blue-500',
  '媒介契約':     'bg-purple-500',
  '販売活動':     'bg-orange-500',
  '内見':         'bg-cyan-500',
  '購入申し込み':  'bg-indigo-500',
  '売買契約':     'bg-yellow-500',
  'ローン審査':   'bg-pink-500',
  '決済':         'bg-green-500',
}

type FilterType = '全て' | '売却' | '購入'

export default function Sidebar() {
  const pathname = usePathname()
  const [caseListOpen, setCaseListOpen] = useState(false)
  const [filter, setFilter] = useState<FilterType>('全て')

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  // TODO: スプシ連携後は dataLoader.ts の fetchAllCases() に差し替え
  const allCases = [
    ...sellCases.map(c => ({
      id: c.id, type: '売却' as const,
      propertyName: c.propertyName, stage: c.stage,
      staff: c.staff, price: c.askingPrice,
      fee: calcBrokerageFee(c.askingPrice),
    })),
    ...buyCases.map(c => ({
      id: c.id, type: '購入' as const,
      propertyName: c.propertyName, stage: c.stage,
      staff: c.staff, price: c.budget,
      fee: calcBrokerageFee(c.budget),
    })),
  ]

  const filtered = allCases.filter(c =>
    filter === '全て' ? true : c.type === filter
  )

  const navItems = [
    { href: '/',            label: 'ダッシュボード', icon: LayoutDashboard },
    { href: '/sell',        label: '売却仲介',       icon: TrendingDown },
    { href: '/buy',         label: '購入仲介',       icon: ShoppingCart },
    { href: '/analytics',  label: '分析',           icon: BarChart3 },
    { href: '/suggestions', label: 'AI改善提案',     icon: Lightbulb },
  ]

  return (
    <aside
      className="fixed left-0 top-0 h-screen flex flex-col z-40"
      style={{ width: 'var(--sidebar-width)', backgroundColor: '#1a1a2e' }}
    >
      {/* ロゴ */}
      <div className="px-4 py-5 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#e94560' }}
          >
            <Building2 size={18} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">不動産売買</p>
            <p className="text-white/50 text-xs leading-tight">管理ダッシュボード</p>
          </div>
        </div>
      </div>

      {/* ナビゲーション */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <p className="text-white/30 text-[10px] font-semibold uppercase tracking-wider px-2 mb-1.5">
          メニュー
        </p>
        <ul className="space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className={`flex items-center gap-2.5 px-2 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                  isActive(href)
                    ? 'text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
                style={isActive(href) ? { backgroundColor: '#0f3460' } : {}}
              >
                <Icon size={15} className={isActive(href) ? 'text-[#e94560]' : ''} />
                {label}
                {isActive(href) && (
                  <span
                    className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: '#e94560' }}
                  />
                )}
              </Link>
            </li>
          ))}

          {/* 案件一覧（アコーディオン） */}
          <li>
            <button
              onClick={() => setCaseListOpen(v => !v)}
              className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                caseListOpen
                  ? 'text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
              style={caseListOpen ? { backgroundColor: '#0f3460' } : {}}
            >
              <List size={15} className={caseListOpen ? 'text-[#e94560]' : ''} />
              案件一覧
              <span className="ml-auto">
                {caseListOpen
                  ? <ChevronDown size={12} />
                  : <ChevronRight size={12} />
                }
              </span>
            </button>

            {/* 展開パネル */}
            {caseListOpen && (
              <div className="mt-1 ml-2 border-l border-white/10 pl-3">
                {/* フィルタ */}
                <div className="flex gap-1 mb-2 mt-1">
                  {(['全て', '売却', '購入'] as FilterType[]).map(f => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`flex-1 text-[10px] py-1 rounded font-medium transition-colors ${
                        filter === f
                          ? 'text-white'
                          : 'text-white/40 hover:text-white/70'
                      }`}
                      style={filter === f ? { backgroundColor: '#0f3460' } : {}}
                    >
                      {f}
                    </button>
                  ))}
                </div>

                {/* 案件リスト */}
                <ul className="space-y-1 max-h-80 overflow-y-auto pr-1">
                  {filtered.map(c => (
                    <li
                      key={c.id}
                      className="px-2 py-2 rounded-lg hover:bg-white/5 transition-colors cursor-default"
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span
                          className={`flex-shrink-0 text-white text-[9px] font-bold px-1 py-0.5 rounded ${
                            c.type === '売却' ? 'bg-red-600' : 'bg-blue-600'
                          }`}
                        >
                          {c.type}
                        </span>
                        <p className="text-white/90 text-[11px] font-medium leading-tight truncate">
                          {c.propertyName}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className={`inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 ${stageColor[c.stage] ?? 'bg-gray-500'}`} />
                        <span className="text-white/50 text-[10px] truncate">{c.stage}</span>
                        <span className="text-white/30 text-[10px] ml-auto flex-shrink-0">{c.staff}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/40 text-[10px]">{formatPrice(c.price)}</span>
                        <span className="text-[10px] font-medium" style={{ color: '#e94560' }}>
                          手数料 {formatPrice(c.fee)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        </ul>
      </nav>

      {/* フッター */}
      <div className="px-4 py-3 border-t border-white/10 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
            管
          </div>
          <div>
            <p className="text-white/80 text-xs font-medium">管理者</p>
            <p className="text-white/40 text-[10px]">2026年3月</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
