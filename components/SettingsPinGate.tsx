'use client'

import { useState, useEffect } from 'react'
import { LogOut } from 'lucide-react'

// ログアウトボタンを他コンポーネントから呼べるよう export
export function SettingsLogoutButton() {
  return (
    <a
      href="/logout"
      className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-400 transition-colors"
    >
      <LogOut size={13} />
      ログアウト
    </a>
  )
}

export default function SettingsPinGate({ children }: { children: React.ReactNode }) {
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    // _worker.js の /api/auth/check でセッションを確認
    // 管理者セッションが有効なら表示、切れていたらログインへ
    fetch('/api/auth/check')
      .then(r => r.json())
      .then((data: { authed: boolean; role?: string }) => {
        if (!data.authed || data.role !== 'admin') {
          window.location.href = '/login?next=/settings/'
        }
      })
      .catch(() => {
        window.location.href = '/login?next=/settings/'
      })
      .finally(() => setChecked(true))
  }, [])

  if (!checked) return null
  return <>{children}</>
}
