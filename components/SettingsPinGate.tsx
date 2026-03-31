'use client'

import { useState, useEffect } from 'react'
import { Lock, Eye, EyeOff } from 'lucide-react'

const CORRECT_PIN = process.env.NEXT_PUBLIC_SETTINGS_PIN || '1234'
const STORAGE_KEY = 'settings_auth'

export default function SettingsPinGate({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState(false)
  const [pin, setPin] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState(false)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY) === 'ok') {
      setAuthed(true)
    }
    setChecked(true)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (pin === CORRECT_PIN) {
      sessionStorage.setItem(STORAGE_KEY, 'ok')
      setAuthed(true)
      setError(false)
    } else {
      setError(true)
      setPin('')
    }
  }

  if (!checked) return null

  if (authed) return <>{children}</>

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-8 w-full max-w-xs text-center">
        <div className="w-12 h-12 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-4">
          <Lock size={20} className="text-gray-400" />
        </div>
        <h2 className="text-base font-bold text-gray-800 mb-1">設定ページ</h2>
        <p className="text-xs text-gray-400 mb-6">PINコードを入力してください</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <input
              type={show ? 'text' : 'password'}
              inputMode="numeric"
              value={pin}
              onChange={e => { setPin(e.target.value); setError(false) }}
              placeholder="PIN"
              className={`w-full border rounded-lg px-4 py-2.5 text-center text-sm font-mono tracking-widest outline-none transition-colors ${
                error ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-blue-300'
              }`}
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShow(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
            >
              {show ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          {error && <p className="text-xs text-red-400">PINが正しくありません</p>}
          <button
            type="submit"
            className="w-full bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
          >
            確認
          </button>
        </form>
      </div>
    </div>
  )
}
