'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  TrendingDown,
  ShoppingCart,
  BarChart3,
  Lightbulb,
  Building2,
} from 'lucide-react'

const navItems = [
  { href: '/', label: 'ダッシュボード', icon: LayoutDashboard },
  { href: '/sell', label: '売却仲介', icon: TrendingDown },
  { href: '/buy', label: '購入仲介', icon: ShoppingCart },
  { href: '/analytics', label: '分析', icon: BarChart3 },
  { href: '/suggestions', label: 'AI改善提案', icon: Lightbulb },
]

export default function Sidebar() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <aside
      className="fixed left-0 top-0 h-screen flex flex-col z-40"
      style={{ width: 'var(--sidebar-width)', backgroundColor: '#1a1a2e' }}
    >
      {/* Logo */}
      <div className="px-5 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#e94560' }}>
            <Building2 size={20} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">不動産売買</p>
            <p className="text-white/50 text-xs leading-tight">管理ダッシュボード</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <p className="text-white/30 text-xs font-semibold uppercase tracking-wider px-3 mb-2">
          メニュー
        </p>
        <ul className="space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive(href)
                    ? 'text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
                style={
                  isActive(href)
                    ? { backgroundColor: '#0f3460' }
                    : {}
                }
              >
                <Icon size={18} className={isActive(href) ? 'text-[#e94560]' : ''} />
                {label}
                {isActive(href) && (
                  <span
                    className="ml-auto w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: '#e94560' }}
                  />
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold">
            管
          </div>
          <div>
            <p className="text-white/80 text-xs font-medium">管理者</p>
            <p className="text-white/40 text-xs">2026年3月</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
