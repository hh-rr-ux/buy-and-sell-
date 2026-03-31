#!/usr/bin/env node
/**
 * fetch-data.js
 *
 * GitHub Actions から実行されるデータ取得スクリプト。
 * Chatwork API と Google Sheets API からデータを取得し、
 * data/ ディレクトリに JSON ファイルとして書き出します。
 *
 * 出力ファイル:
 *   data/cases.json          — 案件管理シートのデータ
 *   data/line-inquiries.json — LINE問い合わせシートのデータ
 *   data/chatwork.json       — Chatwork ルーム＆メッセージデータ
 *
 * 必要な環境変数 (GitHub Secrets に設定):
 *   CHATWORK_API_TOKEN
 *   CHATWORK_ROOM_OPERATIONS
 *   CHATWORK_ROOM_HP_LINE
 *   CHATWORK_ROOM_RECRUITMENT
 *   CHATWORK_ROOM_NOTIFICATION
 *   CHATWORK_ROOM_CUSTOMER
 *   GOOGLE_SHEETS_API_KEY
 *   GOOGLE_SHEETS_ID
 *   GOOGLE_SHEETS_CASES_RANGE   (例: "案件管理!A2:F100")
 *   GOOGLE_SHEETS_LINE_RANGE    (例: "LINE問い合わせ!A2:B100")
 */

const fs = require('fs')
const path = require('path')
const https = require('https')

// ── 環境変数 ────────────────────────────────────────────────────────────────
const CHATWORK_API_TOKEN         = process.env.CHATWORK_API_TOKEN         || ''
const CHATWORK_ROOM_OPERATIONS   = process.env.CHATWORK_ROOM_OPERATIONS   || ''
const CHATWORK_ROOM_HP_LINE      = process.env.CHATWORK_ROOM_HP_LINE      || ''
const CHATWORK_ROOM_RECRUITMENT  = process.env.CHATWORK_ROOM_RECRUITMENT  || ''
const CHATWORK_ROOM_NOTIFICATION = process.env.CHATWORK_ROOM_NOTIFICATION || ''
const CHATWORK_ROOM_CUSTOMER     = process.env.CHATWORK_ROOM_CUSTOMER     || ''
const GOOGLE_SHEETS_API_KEY      = process.env.GOOGLE_SHEETS_API_KEY      || ''
const GOOGLE_SHEETS_ID           = process.env.GOOGLE_SHEETS_ID           || ''
const GOOGLE_SHEETS_CASES_RANGE  = process.env.GOOGLE_SHEETS_CASES_RANGE  || '案件管理!A2:F100'
const GOOGLE_SHEETS_LINE_RANGE   = process.env.GOOGLE_SHEETS_LINE_RANGE   || 'LINE問い合わせ!A2:B100'

const DATA_DIR = path.join(__dirname, '..', 'data')

// ── ユーティリティ: HTTPSリクエスト ──────────────────────────────────────────
function fetchJson(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = { headers: { 'Accept': 'application/json', ...headers } }
    https.get(url, options, (res) => {
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => {
        try { resolve(JSON.parse(data)) }
        catch (e) { reject(new Error(`JSON parse error: ${data.slice(0, 200)}`)) }
      })
    }).on('error', reject)
  })
}

function writeJson(filename, data) {
  const filepath = path.join(DATA_DIR, filename)
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf8')
  console.log(`[OK] wrote ${filepath}`)
}

// ── Google Sheets: 案件管理シート ────────────────────────────────────────────
async function fetchCases() {
  // TODO: GOOGLE_SHEETS_ID と GOOGLE_SHEETS_API_KEY が設定されたら有効化する
  if (!GOOGLE_SHEETS_ID || !GOOGLE_SHEETS_API_KEY) {
    console.warn('[SKIP] Google Sheets 案件管理: 環境変数が未設定のためスキップします')
    return null
  }

  // TODO: 以下のURLでシートデータを取得する
  // 列順: 物件名(A), 進捗(B), 担当(C), 物件価格(D), 仲介手数料(E), 全体売上(F)
  const range = encodeURIComponent(GOOGLE_SHEETS_CASES_RANGE)
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_ID}/values/${range}?key=${GOOGLE_SHEETS_API_KEY}`

  const json = await fetchJson(url)
  if (!json.values || !Array.isArray(json.values)) {
    console.warn('[WARN] 案件管理シート: データが空か形式が不正です')
    return []
  }

  // TODO: 行データを Case 型にマッピングする
  // 進捗列（B列）の値から売却/購入を判別するロジックを実装してください
  // 例: '媒介契約', '販売活動' → 売却 / '内見', '購入申し込み' → 購入
  const SELL_STAGES = ['問い合わせ（売却）', '査定', '媒介契約', '販売活動', '売買契約（売却）', '決済（売却）']
  const cases = json.values.map((row, i) => ({
    id: `SHEET-${i + 1}`,
    propertyName:  row[0] || '',
    type:          SELL_STAGES.includes(row[1]) ? 'sell' : 'buy',
    stage:         row[1] || '',
    staff:         row[2] || '',
    propertyPrice: Number(String(row[3] || '0').replace(/,/g, '')) || 0,
    brokerageFee:  Number(String(row[4] || '0').replace(/,/g, '')) || 0,
    totalRevenue:  Number(String(row[5] || '0').replace(/,/g, '')) || 0,
  }))

  return cases
}

// ── Google Sheets: LINE問い合わせシート ──────────────────────────────────────
async function fetchLineInquiries() {
  // TODO: GOOGLE_SHEETS_ID と GOOGLE_SHEETS_API_KEY が設定されたら有効化する
  if (!GOOGLE_SHEETS_ID || !GOOGLE_SHEETS_API_KEY) {
    console.warn('[SKIP] Google Sheets LINE問い合わせ: 環境変数が未設定のためスキップします')
    return null
  }

  // 列順: 日付(A), 問い合わせ数(B)
  const range = encodeURIComponent(GOOGLE_SHEETS_LINE_RANGE)
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_ID}/values/${range}?key=${GOOGLE_SHEETS_API_KEY}`

  const json = await fetchJson(url)
  if (!json.values || !Array.isArray(json.values)) {
    console.warn('[WARN] LINE問い合わせシート: データが空か形式が不正です')
    return []
  }

  // TODO: 日付フォーマットがシートによって異なる場合（例: "2026/03/01" vs "2026-03-01"）は
  // 正規化処理を追加してください
  const inquiries = json.values.map(row => ({
    date:  String(row[0] || '').replace(/\//g, '-'),  // YYYY/MM/DD → YYYY-MM-DD
    count: Number(row[1]) || 0,
  })).filter(d => d.date)

  return inquiries
}

// ── Chatwork API: ルーム情報＆メッセージ ─────────────────────────────────────
async function fetchChatwork() {
  if (!CHATWORK_API_TOKEN) {
    console.warn('[SKIP] Chatwork API: CHATWORK_API_TOKEN が未設定のためスキップします')
    return null
  }

  const headers = { 'X-ChatWorkToken': CHATWORK_API_TOKEN }

  const roomDefs = [
    { id: CHATWORK_ROOM_OPERATIONS,   type: 'operations',   name: '運用チャット',         description: '事業進捗の報告・共有' },
    { id: CHATWORK_ROOM_HP_LINE,      type: 'hp_line',      name: 'HP,LINEチャット',       description: 'HPやLINEの専門家とのやりとり' },
    { id: CHATWORK_ROOM_RECRUITMENT,  type: 'recruitment',  name: '求人チャット',           description: '求人関連' },
    { id: CHATWORK_ROOM_NOTIFICATION, type: 'notification', name: '通知チャット',           description: '公式LINEからの問い合わせ通知（自動転送）' },
    { id: CHATWORK_ROOM_CUSTOMER,     type: 'customer',     name: 'メッセージチャット',     description: 'お客様からのメッセージ転送' },
  ].filter(r => r.id)

  if (roomDefs.length === 0) {
    console.warn('[WARN] Chatwork: ルームIDが1件も設定されていません')
    return { rooms: [], messages: [] }
  }

  const rooms = []
  const allMessages = []

  for (const room of roomDefs) {
    try {
      // TODO: GET /rooms/:room_id でルーム情報を取得
      // レスポンス例: { room_id, name, description, unread_num, ... }
      const roomInfo = await fetchJson(
        `https://api.chatwork.com/v2/rooms/${room.id}`,
        headers
      )

      // TODO: GET /rooms/:room_id/messages でメッセージを取得（最大40件）
      // force=1 で既読状態を無視して取得する
      const messages = await fetchJson(
        `https://api.chatwork.com/v2/rooms/${room.id}/messages?force=1`,
        headers
      )

      const msgArray = Array.isArray(messages) ? messages : []
      const latest = msgArray[msgArray.length - 1]

      rooms.push({
        roomId:        String(room.id),
        name:          room.name,
        type:          room.type,
        description:   room.description,
        unreadCount:   roomInfo.unread_num || 0,
        latestMessage: latest?.body || '',
        latestTime:    latest
          ? new Date(latest.send_time * 1000).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
          : '',
      })

      // 直近10件のメッセージを収集
      const recentMsgs = msgArray.slice(-10).map(m => ({
        messageId: String(m.message_id),
        roomId:    String(room.id),
        roomName:  room.name,
        roomType:  room.type,
        account:   { name: m.account?.name || '' },
        body:      m.body || '',
        sendTime:  m.send_time || 0,
      }))
      allMessages.push(...recentMsgs)

    } catch (err) {
      console.error(`[ERROR] Chatwork ルーム ${room.id} (${room.name}) の取得に失敗:`, err.message)
    }
  }

  // 全メッセージを送信時刻の降順で並べて最新50件
  allMessages.sort((a, b) => b.sendTime - a.sendTime)

  return { rooms, messages: allMessages.slice(0, 50) }
}

// ── メイン処理 ───────────────────────────────────────────────────────────────
async function main() {
  console.log('=== fetch-data.js 開始 ===')
  console.log(`実行時刻: ${new Date().toISOString()}`)

  // data/ ディレクトリが存在しない場合は作成
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
    console.log(`[OK] created ${DATA_DIR}`)
  }

  let hasUpdates = false

  // ── Google Sheets: 案件管理 ──────────────────────────────────────────
  try {
    const cases = await fetchCases()
    if (cases !== null) {
      writeJson('cases.json', cases)
      hasUpdates = true
    }
  } catch (err) {
    console.error('[ERROR] 案件管理シートの取得に失敗:', err.message)
  }

  // ── Google Sheets: LINE問い合わせ ────────────────────────────────────
  try {
    const lineInquiries = await fetchLineInquiries()
    if (lineInquiries !== null) {
      writeJson('line-inquiries.json', lineInquiries)
      hasUpdates = true
    }
  } catch (err) {
    console.error('[ERROR] LINE問い合わせシートの取得に失敗:', err.message)
  }

  // ── Chatwork ─────────────────────────────────────────────────────────
  try {
    const chatwork = await fetchChatwork()
    if (chatwork !== null) {
      writeJson('chatwork.json', chatwork)
      hasUpdates = true
    }
  } catch (err) {
    console.error('[ERROR] Chatwork APIの取得に失敗:', err.message)
  }

  if (!hasUpdates) {
    console.log('[INFO] 環境変数が未設定のためデータ取得をスキップしました。')
    console.log('[INFO] GitHub Secrets に必要な値を設定してください。')
  }

  console.log('=== fetch-data.js 完了 ===')
}

main().catch(err => {
  console.error('[FATAL]', err)
  process.exit(1)
})
