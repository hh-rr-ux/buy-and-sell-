'use client'

export const dynamic = 'force-static'

import { Settings } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-2 mb-6">
        <Settings size={22} className="text-gray-400" />
        <h1 className="text-2xl font-bold text-gray-900">設定</h1>
      </div>
      <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
        <p className="text-gray-500 text-sm">設定項目は準備中です。</p>
      </div>
    </div>
  )
}
