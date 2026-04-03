'use client'

import { useState, useEffect } from 'react'
import { Lock, Eye, EyeOff, LogOut } from 'lucide-react'

const MAX_ATTEMPTS = 5

export function SettingsLogoutButton() {
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.reload()
  }
  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-400 transition-colors"
    >
      <LogOut size={13} />
      ログアウト
    </button>
  )
}

export default function SettingsPinGate({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState(false)
  const [id, setId] = useState('')
  const [pw, setPw] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState(false)
  const [checked, setChecked] = useState(false)
  const [attempts, setAttempts] = useState(0)

  // Verify existing session via HttpOnly cookie (server-side check)
  useEffect(() => {
    fetch('/api/auth/check')
      .then(r => r.json())
      .then((data: { authed: boolean }) => {
        if (data.authed) setAuthed(true)
      })
      .catch(() => {})
      .finally(() => setChecked(true))
  }, [])

  const locked = attempts >= MAX_ATTEMPTS

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (locked) return

    try {
      const resp = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, pw }),
      })
      if (resp.ok) {
        setAuthed(true)
        setError(false)
      } else {
        setAttempts(v => v + 1)
        setError(true)
        setPw('')
      }
    } catch {
      setError(true)
      setPw('')
    }
  }

  if (!checked) return null
  if (authed) return <>{children}</>

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-8 w-full max-w-xs">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-3">
            <Lock size={20} className="text-gray-400" />
          </div>
          <h2 className="text-base font-bold text-gray-800">管理者ページ</h2>
          <p className="text-xs text-gray-400 mt-1">IDとパスワードを入力してください</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1 font-medium">ID</label>
            <input
              type="text"
              value={id}
              onChange={e => { setId(e.target.value); setError(false) }}
              placeholder="管理者ID"
              autoComplete="username"
              className={`w-full border rounded-lg px-3 py-2.5 text-sm outline-none transition-colors ${
                error ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-blue-300'
              }`}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1 font-medium">パスワード</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={pw}
                onChange={e => { setPw(e.target.value); setError(false) }}
                placeholder="パスワード"
                autoComplete="current-password"
                className={`w-full border rounded-lg px-3 py-2.5 text-sm outline-none transition-colors pr-10 ${
                  error ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-blue-300'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
              >
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          {error && !locked && (
            <p className="text-xs text-red-400 text-center">
              IDまたはパスワードが正しくありません（あと{MAX_ATTEMPTS - attempts}回）
            </p>
          )}
          {locked && (
            <p className="text-xs text-red-500 text-center font-medium">
              試行回数の上限に達しました。ページを再読み込みしてください。
            </p>
          )}
          <button
            type="submit"
            disabled={locked}
            className="w-full bg-gray-800 hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 rounded-lg transition-colors mt-1"
          >
            ログイン
          </button>
        </form>
      </div>
    </div>
  )
}
