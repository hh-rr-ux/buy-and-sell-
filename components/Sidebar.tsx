'use client'

import { useMemo, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import {
  LayoutDashboard,
  BarChart3,
  Lightbulb,
  Building2,
  ClipboardList,
  MessageSquare,
  TrendingUp,
  MessageCircle,
  Star,
  Settings,
  LogOut,
} from 'lucide-react'

const navItems = [
  { href: '/',            label: 'ダッシュボード', icon: LayoutDashboard },
  { href: '/cases',       label: '案件一覧',       icon: ClipboardList },
  { href: '/sales',       label: '売上',           icon: TrendingUp },
  { href: '/inquiries',   label: 'お問合せ',       icon: MessageCircle },
  { href: '/analytics',  label: '分析',           icon: BarChart3 },
  { href: '/suggestions', label: 'AI改善',         icon: Lightbulb },
  { href: '/chat',        label: 'AI改善チャット',  icon: MessageSquare },
]

const adminItems = [
  { href: '/admin/evaluation', label: '担当者評価',   icon: Star },
  { href: '/admin/settings',   label: '連携設定',     icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const match = document.cookie.match(/la_role=([^;]+)/)
    setIsAdmin(match?.[1] === 'admin')
  }, [])

  const currentDate = useMemo(() => {
    const now = new Date()
    return `${String(now.getFullYear()).slice(-2)}/${now.getMonth() + 1}`
  }, [])

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

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

        </ul>

        {isAdmin && <p className="text-white/30 text-[10px] font-semibold uppercase tracking-wider px-2 mt-4 mb-1.5">
          管理者
        </p>}
        {isAdmin && (
          <ul className="space-y-0.5">
            {adminItems.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={`flex items-center gap-2.5 px-2 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                    isActive(href)
                      ? 'text-white'
                      : 'text-yellow-400/60 hover:text-yellow-300 hover:bg-white/5'
                  }`}
                  style={isActive(href) ? { backgroundColor: '#0f3460' } : {}}
                >
                  <Icon size={15} className={isActive(href) ? 'text-yellow-400' : ''} />
                  {label}
                  {isActive(href) && (
                    <span
                      className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: '#facc15' }}
                    />
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </nav>

      {/* フッター */}
      <div className="px-4 py-3 border-t border-white/10 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
            {isAdmin ? '管' : '員'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white/80 text-xs font-medium">{isAdmin ? '管理者' : 'メンバー'}</p>
            <p className="text-white/40 text-[10px]">{currentDate}</p>
          </div>
          <a
            href="/logout"
            className="p-1.5 text-white/30 hover:text-white/80 rounded-lg hover:bg-white/10 transition-all flex-shrink-0"
            title="ログアウト"
          >
            <LogOut size={14} />
          </a>
        </div>
      </div>
    </aside>
  )
}
