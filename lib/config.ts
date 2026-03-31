/**
 * config.ts
 *
 * 外部API連携の設定
 * 実際の値は GitHub Secrets に設定してください。
 * ローカル開発時は .env.local に記載することで利用できます。
 *
 * 設定方法:
 *   GitHub リポジトリ > Settings > Secrets and variables > Actions
 *   > New repository secret で以下を登録してください。
 */

// ── Chatwork ルームID設定 ─────────────────────────────────────────────
export const CHATWORK_ROOMS = {
  OPERATIONS:   process.env.CHATWORK_ROOM_OPERATIONS   || '',  // 運用チャット（事業進捗）
  HP_LINE:      process.env.CHATWORK_ROOM_HP_LINE      || '',  // HP,LINEチャット（専門家とのやりとり）
  RECRUITMENT:  process.env.CHATWORK_ROOM_RECRUITMENT  || '',  // 求人チャット
  NOTIFICATION: process.env.CHATWORK_ROOM_NOTIFICATION || '',  // 通知チャット（LINE問い合わせ自動転送）
  CUSTOMER:     process.env.CHATWORK_ROOM_CUSTOMER     || '',  // メッセージチャット（お客様メッセージ転送）
}

// ── Google Sheets 設定 ────────────────────────────────────────────────
export const GOOGLE_SHEETS = {
  ID:           process.env.GOOGLE_SHEETS_ID           || '',
  API_KEY:      process.env.GOOGLE_SHEETS_API_KEY      || '',
  CASES_RANGE:  process.env.GOOGLE_SHEETS_CASES_RANGE  || '案件管理!A2:F100',   // 物件名,進捗,担当,物件価格,仲介手数料,全体売上
  LINE_RANGE:   process.env.GOOGLE_SHEETS_LINE_RANGE   || 'LINE問い合わせ!A2:B100', // 日付,問い合わせ数
}

// ── Chatwork API エンドポイント ───────────────────────────────────────
export const CHATWORK_API_BASE = 'https://api.chatwork.com/v2'

// ── Google Sheets API エンドポイント ─────────────────────────────────
export const GOOGLE_SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets'

// ── Google Calendar 設定 ──────────────────────────────────────────────
// 連携対象のカレンダーIDを環境変数で管理します。
// 複数カレンダーを使い分ける場合はカンマ区切りで設定してください。
//   例: GOOGLE_CALENDAR_ID=primary,xxxxx@group.calendar.google.com
//
// 認証方法:
//   サービスアカウント（推奨）: GOOGLE_SERVICE_ACCOUNT_KEY に JSON をセット
//   OAuth2: GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET / GOOGLE_OAUTH_REFRESH_TOKEN
export const GOOGLE_CALENDAR = {
  CALENDAR_ID:          process.env.GOOGLE_CALENDAR_ID           || 'primary',
  API_KEY:              process.env.GOOGLE_CALENDAR_API_KEY       || '',  // 公開カレンダー向け
  SERVICE_ACCOUNT_KEY:  process.env.GOOGLE_SERVICE_ACCOUNT_KEY   || '',  // JSON文字列
  OAUTH_CLIENT_ID:      process.env.GOOGLE_OAUTH_CLIENT_ID        || '',
  OAUTH_CLIENT_SECRET:  process.env.GOOGLE_OAUTH_CLIENT_SECRET    || '',
  OAUTH_REFRESH_TOKEN:  process.env.GOOGLE_OAUTH_REFRESH_TOKEN    || '',
}

// ── Google Calendar API エンドポイント ────────────────────────────────
export const GOOGLE_CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3'

// ── 設定済み状態チェック ──────────────────────────────────────────────
export function getEnvStatus() {
  return {
    chatworkToken:        !!process.env.CHATWORK_API_TOKEN,
    chatworkOperations:   !!process.env.CHATWORK_ROOM_OPERATIONS,
    chatworkHpLine:       !!process.env.CHATWORK_ROOM_HP_LINE,
    chatworkRecruitment:  !!process.env.CHATWORK_ROOM_RECRUITMENT,
    chatworkNotification: !!process.env.CHATWORK_ROOM_NOTIFICATION,
    chatworkCustomer:     !!process.env.CHATWORK_ROOM_CUSTOMER,
    googleSheetsId:       !!process.env.GOOGLE_SHEETS_ID,
    googleSheetsApiKey:   !!process.env.GOOGLE_SHEETS_API_KEY,
    googleSheetsCasesRange: !!process.env.GOOGLE_SHEETS_CASES_RANGE,
    googleSheetsLineRange:  !!process.env.GOOGLE_SHEETS_LINE_RANGE,
    googleCalendarId:       !!process.env.GOOGLE_CALENDAR_ID,
    googleCalendarAuth:     !!(
      process.env.GOOGLE_SERVICE_ACCOUNT_KEY ||
      (process.env.GOOGLE_OAUTH_CLIENT_ID && process.env.GOOGLE_OAUTH_REFRESH_TOKEN)
    ),
  }
}
