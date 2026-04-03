'use client'

import { useState, useEffect } from 'react'
import {
  Settings, CheckCircle2, XCircle, Edit3, Save, X, Plus, Trash2,
  Crown, RefreshCw, AlertTriangle, ChevronDown, ChevronUp,
} from 'lucide-react'

interface SettingItem {
  key: string
  label: string
  group: string
  sensitive: boolean
  configured: boolean
  source: 'kv' | 'env' | 'none'
  value: string
}

const GROUP_LABELS: Record<string, string> = {
  chatwork: 'Chatwork',
  sheets:   'Google Sheets',
  ai:       'AI (Anthropic)',
}

const GROUP_COLORS: Record<string, string> = {
  chatwork: '#e94560',
  sheets:   '#16a34a',
  ai:       '#7c3aed',
}

function SourceBadge({ source }: { source: string }) {
  if (source === 'kv')  return <span className="text-[10px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full font-semibold">KV</span>
  if (source === 'env') return <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-semibold">ENV</span>
  return null
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SettingItem[]>([])
  const [kvAvailable, setKvAvailable] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editKey, setEditKey] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  useEffect(() => { loadSettings() }, [])

  async function loadSettings() {
    setLoading(true)
    setError('')
    try {
      const resp = await fetch('/api/settings')
      const data = await resp.json()
      if (data.settings) {
        setSettings(data.settings)
        setKvAvailable(data.kvAvailable)
      } else {
        setError(data.error || '設定の取得に失敗しました')
      }
    } catch (e) {
      setError('通信エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(key: string, value: string) {
    setSaving(true)
    setSaveMsg('')
    try {
      const resp = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      })
      const data = await resp.json()
      if (data.ok) {
        setSaveMsg('保存しました')
        setEditKey(null)
        await loadSettings()
      } else {
        setSaveMsg(data.error || '保存に失敗しました')
      }
    } catch (e) {
      setSaveMsg('通信エラーが発生しました')
    } finally {
      setSaving(false)
      setTimeout(() => setSaveMsg(''), 3000)
    }
  }

  async function handleDelete(key: string) {
    if (!confirm(`「${key}」の設定を削除しますか？`)) return
    await handleSave(key, '')
  }

  const groups = ['chatwork', 'sheets', 'ai']

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="px-6 py-6" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)' }}>
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Crown size={16} className="text-yellow-400" />
              <p className="text-yellow-400 text-xs font-semibold uppercase tracking-widest">管理者専用</p>
            </div>
            <h1 className="text-white text-xl font-bold">連携設定</h1>
            <p className="text-white/50 text-xs mt-1">API・チャットワーク・スプレッドシートの接続情報を管理します</p>
          </div>
          <button
            onClick={loadSettings}
            className="flex items-center gap-1.5 text-white/60 hover:text-white text-xs px-3 py-1.5 rounded-lg hover:bg-white/10 transition-all"
          >
            <RefreshCw size={13} />
            更新
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-6 space-y-4">

        {/* 保存メッセージ */}
        {saveMsg && (
          <div className={`p-3 rounded-xl text-sm font-medium flex items-center gap-2 ${
            saveMsg === '保存しました' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {saveMsg === '保存しました' ? <CheckCircle2 size={16}/> : <AlertTriangle size={16}/>}
            {saveMsg}
          </div>
        )}

        {/* エラー */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* ローディング */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        )}

        {/* 設定グループ */}
        {!loading && settings.length > 0 && groups.map(group => {
          const items = settings.filter(s => s.group === group)
          const isCollapsed = collapsed[group]
          const configuredCount = items.filter(s => s.configured).length

          return (
            <div key={group} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              {/* グループヘッダー */}
              <button
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                onClick={() => setCollapsed(c => ({ ...c, [group]: !c[group] }))}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-2 h-6 rounded-full flex-shrink-0"
                    style={{ backgroundColor: GROUP_COLORS[group] }}
                  />
                  <div className="text-left">
                    <p className="font-bold text-gray-800 text-sm">{GROUP_LABELS[group]}</p>
                    <p className="text-xs text-gray-400">{configuredCount}/{items.length} 項目設定済み</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {configuredCount === items.length
                    ? <CheckCircle2 size={16} className="text-green-500" />
                    : <XCircle size={16} className="text-red-400" />
                  }
                  {isCollapsed ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronUp size={16} className="text-gray-400" />}
                </div>
              </button>

              {/* 設定項目 */}
              {!isCollapsed && (
                <div className="divide-y divide-gray-50">
                  {items.map(item => (
                    <div key={item.key} className="px-5 py-3">
                      {editKey === item.key ? (
                        /* 編集モード */
                        <div>
                          <p className="text-xs font-semibold text-gray-700 mb-2">{item.label}</p>
                          <div className="flex gap-2">
                            <input
                              type={item.sensitive ? 'password' : 'text'}
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              placeholder={item.sensitive ? '新しい値を入力（空欄で削除）' : '値を入力'}
                              className="flex-1 text-sm px-3 py-2 border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSave(item.key, editValue)}
                              disabled={saving}
                              className="flex items-center gap-1 px-3 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                            >
                              <Save size={13} />
                              保存
                            </button>
                            <button
                              onClick={() => setEditKey(null)}
                              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* 表示モード */
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="text-xs font-semibold text-gray-700">{item.label}</p>
                              <SourceBadge source={item.source} />
                            </div>
                            <p className="text-xs font-mono text-gray-400 truncate">
                              {item.configured ? item.value : '未設定'}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {item.configured
                              ? <CheckCircle2 size={15} className="text-green-500" />
                              : <XCircle size={15} className="text-red-400" />
                            }
                            <button
                              onClick={() => { setEditKey(item.key); setEditValue('') }}
                              className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                              title="編集"
                            >
                              <Edit3 size={14} />
                            </button>
                            {item.source === 'kv' && (
                              <button
                                onClick={() => handleDelete(item.key)}
                                className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                                title="削除（KVから削除してENVに戻す）"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}

        {/* KV未設定の注意 */}
        {!loading && settings.length > 0 && !kvAvailable && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-3">
            <AlertTriangle size={16} className="text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-yellow-800">KVストレージが未設定です</p>
              <p className="text-xs text-yellow-700 mt-0.5">
                設定を保存するには、Cloudflare Pages で KV ネームスペースを作成し、
                <code className="bg-yellow-100 px-1 rounded">SETTINGS_KV</code> としてバインドしてください。
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
