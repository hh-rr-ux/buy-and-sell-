export const dynamic = 'force-static'

import { Settings, CheckCircle2, XCircle } from 'lucide-react'
import { getEnvStatus } from '@/lib/config'

function StatusRow({ label, configured, varName }: { label: string; configured: boolean; varName: string }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
      {configured
        ? <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
        : <XCircle size={16} className="text-red-400 flex-shrink-0" />
      }
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800">{label}</p>
        <p className="text-xs text-gray-400 font-mono">{varName}</p>
      </div>
      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
        configured ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
      }`}>
        {configured ? '設定済み' : '未設定'}
      </span>
    </div>
  )
}

export default function SettingsPage() {
  const status = getEnvStatus()

  const chatworkItems = [
    { label: 'Chatwork APIトークン',  configured: status.chatworkToken,        varName: 'CHATWORK_API_TOKEN' },
    { label: '運用チャット ルームID', configured: status.chatworkOperations,   varName: 'CHATWORK_ROOM_OPERATIONS' },
    { label: 'HP,LINEチャット ルームID', configured: status.chatworkHpLine,    varName: 'CHATWORK_ROOM_HP_LINE' },
    { label: '求人チャット ルームID', configured: status.chatworkRecruitment,  varName: 'CHATWORK_ROOM_RECRUITMENT' },
    { label: '通知チャット ルームID', configured: status.chatworkNotification, varName: 'CHATWORK_ROOM_NOTIFICATION' },
    { label: 'メッセージチャット ルームID', configured: status.chatworkCustomer, varName: 'CHATWORK_ROOM_CUSTOMER' },
  ]

  const sheetsItems = [
    { label: 'スプレッドシートID',      configured: status.googleSheetsId,       varName: 'GOOGLE_SHEETS_ID' },
    { label: 'Google Sheets APIキー',   configured: status.googleSheetsApiKey,   varName: 'GOOGLE_SHEETS_API_KEY' },
    { label: '案件管理シート範囲',       configured: status.googleSheetsCasesRange, varName: 'GOOGLE_SHEETS_CASES_RANGE' },
    { label: 'LINE問い合わせシート範囲', configured: status.googleSheetsLineRange,  varName: 'GOOGLE_SHEETS_LINE_RANGE' },
  ]

  const chatworkConfigured = chatworkItems.filter(i => i.configured).length
  const sheetsConfigured = sheetsItems.filter(i => i.configured).length

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-2 mb-6">
        <Settings size={22} className="text-gray-400" />
        <h1 className="text-2xl font-bold text-gray-900">設定</h1>
      </div>

      <p className="text-sm text-gray-500 mb-6">
        外部API連携に必要な環境変数の設定状況です。<br/>
        未設定の変数は GitHub リポジトリの{' '}
        <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">
          Settings &gt; Secrets and variables &gt; Actions
        </span>{' '}
        から登録してください。
      </p>

      {/* Chatwork */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-700">Chatwork API</h2>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            chatworkConfigured === chatworkItems.length
              ? 'bg-green-50 text-green-600'
              : chatworkConfigured > 0
              ? 'bg-yellow-50 text-yellow-600'
              : 'bg-red-50 text-red-500'
          }`}>
            {chatworkConfigured} / {chatworkItems.length} 設定済み
          </span>
        </div>
        <div>
          {chatworkItems.map(item => (
            <StatusRow key={item.varName} {...item} />
          ))}
        </div>
      </div>

      {/* Google Sheets */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-700">Google Sheets API</h2>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            sheetsConfigured === sheetsItems.length
              ? 'bg-green-50 text-green-600'
              : sheetsConfigured > 0
              ? 'bg-yellow-50 text-yellow-600'
              : 'bg-red-50 text-red-500'
          }`}>
            {sheetsConfigured} / {sheetsItems.length} 設定済み
          </span>
        </div>
        <div>
          {sheetsItems.map(item => (
            <StatusRow key={item.varName} {...item} />
          ))}
        </div>
      </div>

      {/* スプレッドシート構成メモ */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
        <h2 className="text-sm font-bold text-blue-700 mb-2">スプレッドシート構成</h2>
        <div className="space-y-2 text-xs text-blue-700">
          <div>
            <p className="font-semibold">案件管理シート（GOOGLE_SHEETS_CASES_RANGE）</p>
            <p className="text-blue-500 font-mono mt-0.5">物件名 / 進捗 / 担当 / 物件価格 / 仲介手数料 / 全体売上</p>
          </div>
          <div>
            <p className="font-semibold">LINE問い合わせシート（GOOGLE_SHEETS_LINE_RANGE）</p>
            <p className="text-blue-500 font-mono mt-0.5">日付 / 問い合わせ数</p>
          </div>
        </div>
      </div>
    </div>
  )
}
