// ── セッション管理 ────────────────────────────────────────────────────────────
const SESSION_COOKIE = 'la_session';
const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30日

function getSecret(env) {
  return env.SESSION_SECRET || (env.BASIC_AUTH_PASS + env.BASIC_AUTH_ADMIN_PASS);
}

async function signPayload(payload, secret) {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

async function createSession(role, env) {
  const payload = `${role}:${Date.now()}`;
  const sig = await signPayload(payload, getSecret(env));
  return btoa(payload) + '.' + sig;
}

async function getSession(request, env) {
  const cookieHeader = request.headers.get('Cookie') || '';
  const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
  if (!match) return null;
  try {
    const [payloadB64, sig] = match[1].split('.');
    if (!payloadB64 || !sig) return null;
    const payload = atob(payloadB64);
    const [role, ts] = payload.split(':');
    if (!role || !ts) return null;
    if (Date.now() - parseInt(ts) > SESSION_MAX_AGE * 1000) return null;
    const expected = await signPayload(payload, getSecret(env));
    if (expected !== sig) return null;
    return role; // 'member' or 'admin'
  } catch {
    return null;
  }
}

function sessionCookie(value, maxAge) {
  return `${SESSION_COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
}

function roleCookie(role, maxAge) {
  return `la_role=${role}; Path=/; Secure; SameSite=Strict; Max-Age=${maxAge}`;
}

// ── ログイン画面 HTML ─────────────────────────────────────────────────────────
function loginHtml(error = '') {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ログイン — LA Estate</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #1a1a2e 0%, #0f3460 60%, #16213e 100%);
    font-family: -apple-system, BlinkMacSystemFont, 'Hiragino Sans', sans-serif;
  }
  .card {
    background: rgba(255,255,255,0.04);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.10);
    border-radius: 20px;
    padding: 44px 40px 40px;
    width: 100%;
    max-width: 400px;
    box-shadow: 0 24px 64px rgba(0,0,0,0.4);
  }
  .logo {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 32px;
  }
  .logo-icon {
    width: 42px;
    height: 42px;
    background: #e94560;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .logo-icon svg { width: 22px; height: 22px; fill: white; }
  .logo-text h1 { color: white; font-size: 16px; font-weight: 700; line-height: 1.2; }
  .logo-text p  { color: rgba(255,255,255,0.4); font-size: 11px; margin-top: 2px; }
  .field {
    margin-bottom: 16px;
    position: relative;
  }
  .field label {
    display: block;
    color: rgba(255,255,255,0.55);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    margin-bottom: 8px;
  }
  .input-wrap { position: relative; }
  .field input {
    width: 100%;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 10px;
    padding: 13px 16px;
    color: white;
    font-size: 14px;
    outline: none;
    transition: border-color 0.2s, background 0.2s;
  }
  .field input:focus {
    border-color: #e94560;
    background: rgba(255,255,255,0.09);
  }
  .field input::placeholder { color: rgba(255,255,255,0.2); }
  .field input.has-toggle { padding-right: 48px; }
  .toggle-btn {
    position: absolute;
    right: 14px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    color: rgba(255,255,255,0.35);
    padding: 4px;
    display: flex;
    align-items: center;
    transition: color 0.2s;
  }
  .toggle-btn:hover { color: rgba(255,255,255,0.7); }
  .toggle-btn svg { width: 18px; height: 18px; }
  .error {
    background: rgba(233,69,96,0.15);
    border: 1px solid rgba(233,69,96,0.35);
    border-radius: 10px;
    padding: 11px 14px;
    color: #ff8fa3;
    font-size: 13px;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .btn {
    width: 100%;
    background: #e94560;
    color: white;
    border: none;
    border-radius: 10px;
    padding: 14px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    margin-top: 8px;
    transition: background 0.2s, transform 0.1s;
    letter-spacing: 0.03em;
  }
  .btn:hover  { background: #d63651; }
  .btn:active { transform: scale(0.98); }
  .footer {
    text-align: center;
    margin-top: 24px;
    color: rgba(255,255,255,0.2);
    font-size: 11px;
  }
</style>
</head>
<body>
<div class="card">
  <div class="logo">
    <div class="logo-icon">
      <svg viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
    </div>
    <div class="logo-text">
      <h1>不動産｜売買</h1>
      <p>LA Estate Dashboard</p>
    </div>
  </div>

  ${error ? `<div class="error"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>${error}</div>` : ''}

  <form method="POST" action="/login">
    <div class="field">
      <label>ユーザーID</label>
      <div class="input-wrap">
        <input type="text" name="user" placeholder="IDを入力" autocomplete="username" required />
      </div>
    </div>
    <div class="field">
      <label>パスワード</label>
      <div class="input-wrap">
        <input type="password" name="pass" id="pass" placeholder="パスワードを入力" autocomplete="current-password" class="has-toggle" required />
        <button type="button" class="toggle-btn" onclick="togglePass()" id="toggleBtn" aria-label="パスワードを表示">
          <svg id="eyeIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </button>
      </div>
    </div>
    <button type="submit" class="btn">ログイン</button>
  </form>

  <div class="footer">LA Estate © 2026</div>
</div>
<script>
function togglePass() {
  const input = document.getElementById('pass');
  const icon  = document.getElementById('eyeIcon');
  if (input.type === 'password') {
    input.type = 'text';
    icon.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23" stroke-width="2"/>';
  } else {
    input.type = 'password';
    icon.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
  }
}
</script>
</body>
</html>`;
}

// ── 設定管理（KV） ────────────────────────────────────────────────────────────
const SETTINGS_KEYS = [
  { key: 'CHATWORK_API_TOKEN',         label: 'Chatwork APIトークン',          sensitive: true,  group: 'chatwork' },
  { key: 'CHATWORK_ROOM_OPERATIONS',   label: '運用チャット ルームID',          sensitive: false, group: 'chatwork' },
  { key: 'CHATWORK_ROOM_HP_LINE',      label: 'HP/LINE チャット ルームID',      sensitive: false, group: 'chatwork' },
  { key: 'CHATWORK_ROOM_RECRUITMENT',  label: '求人チャット ルームID',          sensitive: false, group: 'chatwork' },
  { key: 'CHATWORK_ROOM_NOTIFICATION', label: '通知チャット ルームID',          sensitive: false, group: 'chatwork' },
  { key: 'CHATWORK_ROOM_CUSTOMER',     label: 'メッセージチャット ルームID',    sensitive: false, group: 'chatwork' },
  { key: 'GOOGLE_SERVICE_ACCOUNT_KEY',        label: 'サービスアカウントJSON',               sensitive: true,  group: 'sheets' },
  { key: 'GOOGLE_SHEETS_SELL_CASES_ID',       label: '【売却】案件管理 スプシID',             sensitive: false, group: 'sheets' },
  { key: 'GOOGLE_SHEETS_SELL_CASES_RANGE',    label: '【売却】案件管理 範囲（例: シート1!A:Z）', sensitive: false, group: 'sheets' },
  { key: 'GOOGLE_SHEETS_BUY_CASES_ID',        label: '【購入】案件管理 スプシID',             sensitive: false, group: 'sheets' },
  { key: 'GOOGLE_SHEETS_BUY_CASES_RANGE',     label: '【購入】案件管理 範囲',                 sensitive: false, group: 'sheets' },
  { key: 'GOOGLE_SHEETS_SELL_INQUIRIES_ID',   label: '【売却】問い合わせ数 スプシID',         sensitive: false, group: 'sheets' },
  { key: 'GOOGLE_SHEETS_SELL_INQUIRIES_RANGE',label: '【売却】問い合わせ数 範囲',             sensitive: false, group: 'sheets' },
  { key: 'GOOGLE_SHEETS_BUY_INQUIRIES_ID',    label: '【購入】問い合わせ数 スプシID',         sensitive: false, group: 'sheets' },
  { key: 'GOOGLE_SHEETS_BUY_INQUIRIES_RANGE', label: '【購入】問い合わせ数 範囲',             sensitive: false, group: 'sheets' },
  { key: 'ANTHROPIC_API_KEY',          label: 'Anthropic APIキー',             sensitive: true,  group: 'ai' },
];

async function getRawValue(env, key) {
  const kvVal = env.SETTINGS_KV ? await env.SETTINGS_KV.get(key) : null;
  return kvVal ?? (env[key] || '');
}

async function getSettings(env) {
  const result = [];
  for (const def of SETTINGS_KEYS) {
    const kvVal = env.SETTINGS_KV ? await env.SETTINGS_KV.get(def.key) : null;
    const envVal = env[def.key] || '';
    const raw = kvVal ?? envVal;
    result.push({
      key: def.key,
      label: def.label,
      group: def.group,
      sensitive: def.sensitive,
      configured: !!raw,
      source: kvVal !== null ? 'kv' : (envVal ? 'env' : 'none'),
      value: def.sensitive && raw
        ? raw.slice(0, 4) + '••••' + raw.slice(-4)
        : raw,
    });
  }
  return { settings: result, kvAvailable: !!env.SETTINGS_KV };
}

async function saveSettings(env, updates) {
  if (!env.SETTINGS_KV) throw new Error('KV ストレージが設定されていません。');
  const validKeys = SETTINGS_KEYS.map(d => d.key);
  for (const [key, value] of Object.entries(updates)) {
    if (!validKeys.includes(key)) continue;
    if (value === null || value === '') {
      await env.SETTINGS_KV.delete(key);
    } else {
      await env.SETTINGS_KV.put(key, String(value));
    }
  }
}

// ── 担当者評価 ────────────────────────────────────────────────────────────────
const STAFF_LIST = ['しも', 'まさ', 'ケン', 'のぶ', 'アキ'];

async function generateEvaluation(env) {
  const chatworkToken = await getRawValue(env, 'CHATWORK_API_TOKEN');
  const anthropicKey  = await getRawValue(env, 'ANTHROPIC_API_KEY');

  if (!chatworkToken) throw new Error('CHATWORK_API_TOKEN が未設定です');
  if (!anthropicKey)  throw new Error('ANTHROPIC_API_KEY が未設定です');

  const messages = [];
  const rooms = [
    { key: 'CHATWORK_ROOM_OPERATIONS',  name: '運用' },
    { key: 'CHATWORK_ROOM_HP_LINE',     name: 'HP/LINE' },
    { key: 'CHATWORK_ROOM_RECRUITMENT', name: '求人' },
  ];

  for (const room of rooms) {
    const roomId = await getRawValue(env, room.key);
    if (!roomId) continue;
    try {
      const resp = await fetch(
        `https://api.chatwork.com/v2/rooms/${roomId}/messages?force=1`,
        { headers: { 'X-ChatWorkToken': chatworkToken } }
      );
      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data)) {
          messages.push(...data.slice(-30).map(m => ({
            name: m.account?.name || '',
            body: m.body || '',
            room: room.name,
          })));
        }
      }
    } catch {}
  }

  const staffData = STAFF_LIST.map(name => {
    const msgs = messages.filter(m => m.name.includes(name));
    return {
      name,
      messageCount: msgs.length,
      sample: msgs.map(m => `[${m.room}] ${m.body}`).join('\n').slice(0, 600),
    };
  });

  const prompt = `あなたは不動産会社の第三者評価コンサルタントです。以下の担当者のChatwork活動データを基に、客観的な評価を行ってください。

${staffData.map(s =>
  `【${s.name}】メッセージ数: ${s.messageCount}件\n${s.sample || '（取得データなし）'}`
).join('\n\n')}

各担当者について以下のJSON形式で評価してください:
{
  "evaluations": [
    {
      "name": "担当者名",
      "score": 評価スコア（1〜5）,
      "summary": "総評（100文字以内）",
      "strengths": ["強み1", "強み2"],
      "improvements": ["改善点1"],
      "ownerMessage": "オーナーはるからのコメント（100文字以内、具体的で前向きな内容）"
    }
  ]
}

JSONのみ返答してください。`;

  const aiResp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': anthropicKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!aiResp.ok) throw new Error(`Anthropic API エラー: ${aiResp.status}`);
  const aiData = await aiResp.json();
  const content = aiData.content?.[0]?.text || '';
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('AI レスポンスのパースに失敗しました');
  return JSON.parse(jsonMatch[0]);
}

// ── Google Sheets（サービスアカウント認証） ───────────────────────────────────

function pemToDer(pem) {
  const b64 = pem.replace(/-----[^-]+-----/g, '').replace(/\s/g, '');
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function b64urlEncode(buf) {
  const bytes = new Uint8Array(buf instanceof ArrayBuffer ? buf : buf.buffer);
  let str = '';
  bytes.forEach(b => str += String.fromCharCode(b));
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function getServiceAccountToken(serviceAccountJson) {
  const sa = JSON.parse(serviceAccountJson);
  const now = Math.floor(Date.now() / 1000);
  const enc = new TextEncoder();

  const header  = b64urlEncode(enc.encode(JSON.stringify({ alg: 'RS256', typ: 'JWT' })));
  const payload = b64urlEncode(enc.encode(JSON.stringify({
    iss:   sa.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
    aud:   'https://oauth2.googleapis.com/token',
    exp:   now + 3600,
    iat:   now,
  })));

  const key = await crypto.subtle.importKey(
    'pkcs8', pemToDer(sa.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false, ['sign'],
  );
  const sig = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5', key,
    enc.encode(`${header}.${payload}`),
  );

  const jwt = `${header}.${payload}.${b64urlEncode(sig)}`;
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });
  const data = await res.json();
  if (!data.access_token) throw new Error(`トークン取得失敗: ${JSON.stringify(data)}`);
  return data.access_token;
}

async function fetchSheetValues(accessToken, spreadsheetId, range) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;
  const res = await fetch(url, { headers: { 'Authorization': `Bearer ${accessToken}` } });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Sheets API エラー ${res.status}: ${err}`);
  }
  const data = await res.json();
  return data.values || [];
}

async function fetchAllSheets(env) {
  const saJson = await getRawValue(env, 'GOOGLE_SERVICE_ACCOUNT_KEY');
  if (!saJson) throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY が未設定です');

  const token = await getServiceAccountToken(saJson);

  const sheetDefs = [
    { idKey: 'GOOGLE_SHEETS_SELL_CASES_ID',       rangeKey: 'GOOGLE_SHEETS_SELL_CASES_RANGE',       label: '【売却】案件管理' },
    { idKey: 'GOOGLE_SHEETS_BUY_CASES_ID',        rangeKey: 'GOOGLE_SHEETS_BUY_CASES_RANGE',        label: '【購入】案件管理' },
    { idKey: 'GOOGLE_SHEETS_SELL_INQUIRIES_ID',   rangeKey: 'GOOGLE_SHEETS_SELL_INQUIRIES_RANGE',   label: '【売却】問い合わせ数' },
    { idKey: 'GOOGLE_SHEETS_BUY_INQUIRIES_ID',    rangeKey: 'GOOGLE_SHEETS_BUY_INQUIRIES_RANGE',    label: '【購入】問い合わせ数' },
  ];

  const results = {};
  await Promise.all(sheetDefs.map(async def => {
    const id    = await getRawValue(env, def.idKey);
    const range = await getRawValue(env, def.rangeKey) || 'A:Z';
    if (!id) { results[def.label] = { error: 'スプシID未設定' }; return; }
    try {
      const values = await fetchSheetValues(token, id, range);
      results[def.label] = { rows: values.length, headers: values[0] || [], sample: values.slice(1, 4) };
    } catch (e) {
      results[def.label] = { error: e.message };
    }
  }));

  return results;
}

// ── Google Sheets データ取得（案件管理・問い合わせ数） ────────────────────────

async function fetchSpreadsheetTabs(accessToken, spreadsheetId) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`;
  const res = await fetch(url, { headers: { 'Authorization': `Bearer ${accessToken}` } });
  if (!res.ok) throw new Error(`Sheets API エラー ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return (data.sheets || []).map(s => s.properties.title);
}

// 案件管理: 3行目がヘッダー、4行目以降がデータ
async function fetchCasesData(accessToken, spreadsheetId) {
  const values = await fetchSheetValues(accessToken, spreadsheetId, 'A3:Z500');
  if (values.length < 2) return [];
  const headers = values[0];
  return values.slice(1)
    .filter(row => row.some(cell => cell !== ''))
    .map(row => {
      const obj = {};
      headers.forEach((h, i) => { if (h) obj[h] = row[i] ?? ''; });
      return obj;
    });
}

// 問い合わせ数: タブごとに月データ（タブ名 = "26年4月" 形式）
// 各タブ: A列=カテゴリ名, B列以降=1日~31日の件数
async function fetchInquiriesData(accessToken, spreadsheetId) {
  const tabs = await fetchSpreadsheetTabs(accessToken, spreadsheetId);
  const monthTabs = tabs.filter(t => /^\d{2}年\d{1,2}月$/.test(t));

  const result = {};
  await Promise.all(monthTabs.map(async tab => {
    try {
      const values = await fetchSheetValues(accessToken, spreadsheetId, `${tab}!A:AF`);
      if (!values.length) return;
      const parsed = {};
      values.forEach(row => {
        const category = (row[0] || '').trim();
        if (!category) return;
        const days = row.slice(1).map(v => parseInt(v) || 0);
        parsed[category] = days;
      });
      result[tab] = parsed;
    } catch {
      // タブが取得できなくてもスキップ
    }
  }));

  return result;
}

async function fetchSheetsData(env) {
  const saJson = await getRawValue(env, 'GOOGLE_SERVICE_ACCOUNT_KEY');
  if (!saJson) throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY が未設定です');

  const token = await getServiceAccountToken(saJson);

  const [sellCasesId, buyCasesId, sellInqId, buyInqId] = await Promise.all([
    getRawValue(env, 'GOOGLE_SHEETS_SELL_CASES_ID'),
    getRawValue(env, 'GOOGLE_SHEETS_BUY_CASES_ID'),
    getRawValue(env, 'GOOGLE_SHEETS_SELL_INQUIRIES_ID'),
    getRawValue(env, 'GOOGLE_SHEETS_BUY_INQUIRIES_ID'),
  ]);

  const [sellCases, buyCases, sellInquiries, buyInquiries] = await Promise.all([
    sellCasesId ? fetchCasesData(token, sellCasesId).catch(e => ({ error: e.message }))    : [],
    buyCasesId  ? fetchCasesData(token, buyCasesId).catch(e => ({ error: e.message }))     : [],
    sellInqId   ? fetchInquiriesData(token, sellInqId).catch(e => ({ error: e.message }))  : {},
    buyInqId    ? fetchInquiriesData(token, buyInqId).catch(e => ({ error: e.message }))   : {},
  ]);

  return { sellCases, buyCases, sellInquiries, buyInquiries };
}

// ── Chatwork ルーム情報取得 ───────────────────────────────────────────────────
const ROOM_TYPES = [
  { envKey: 'CHATWORK_ROOM_OPERATIONS',   type: 'operations'   },
  { envKey: 'CHATWORK_ROOM_HP_LINE',      type: 'hp_line'      },
  { envKey: 'CHATWORK_ROOM_RECRUITMENT',  type: 'recruitment'  },
  { envKey: 'CHATWORK_ROOM_NOTIFICATION', type: 'notification' },
  { envKey: 'CHATWORK_ROOM_CUSTOMER',     type: 'customer'     },
];

async function getChatworkRooms(env) {
  const token = await getRawValue(env, 'CHATWORK_API_TOKEN');
  if (!token) return { rooms: [], lastSync: null };

  const lastSync = env.SETTINGS_KV ? await env.SETTINGS_KV.get('chatwork:last_sync') : null;
  const rooms = [];

  await Promise.all(ROOM_TYPES.map(async def => {
    const roomId = await getRawValue(env, def.envKey);
    if (!roomId) return;

    // KV蓄積データを優先
    if (env.SETTINGS_KV) {
      const stored = await env.SETTINGS_KV.get(`chatwork:room:${def.type}`);
      if (stored) {
        try { rooms.push(JSON.parse(stored)); return; } catch {}
      }
    }

    // KVになければライブAPIで取得
    try {
      const headers = { 'X-ChatWorkToken': token };
      const [roomRes, msgRes] = await Promise.all([
        fetch(`https://api.chatwork.com/v2/rooms/${roomId}`, { headers }),
        fetch(`https://api.chatwork.com/v2/rooms/${roomId}/messages?force=1`, { headers }),
      ]);
      if (!roomRes.ok) return;
      const roomData = await roomRes.json();
      const msgs = msgRes.ok ? await msgRes.json() : [];
      const msgArr = Array.isArray(msgs) ? msgs : [];
      const latest = msgArr[msgArr.length - 1];
      rooms.push({
        roomId,
        name: roomData.name || '',
        type: def.type,
        description: roomData.description || '',
        unreadCount: roomData.unread_num || 0,
        latestMessage: latest?.body || '',
        latestTime: latest
          ? new Date(latest.send_time * 1000).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
          : '',
      });
    } catch {}
  }));

  // notification/customer を先に表示
  const order = { notification: 0, customer: 1, operations: 2, hp_line: 3, recruitment: 4 };
  rooms.sort((a, b) => (order[a.type] ?? 9) - (order[b.type] ?? 9));

  return { rooms, lastSync };
}

// ── Chatwork メッセージ蓄積（12時間おきにGitHub Actionsから呼び出し） ──────────
const MIN_SYNC_MS = 30 * 60 * 1000;

async function syncChatwork(env) {
  const kv = env.SETTINGS_KV;
  if (!kv) return { error: 'SETTINGS_KV が未設定です' };

  const lastSync = await kv.get('chatwork:last_sync');
  if (lastSync && Date.now() - new Date(lastSync).getTime() < MIN_SYNC_MS) {
    return { skipped: true, lastSync };
  }

  const token = await getRawValue(env, 'CHATWORK_API_TOKEN');
  if (!token) return { error: 'CHATWORK_API_TOKEN が未設定です' };

  const summary = {};

  await Promise.all(ROOM_TYPES.map(async def => {
    const roomId = await getRawValue(env, def.envKey);
    if (!roomId) { summary[def.type] = { skipped: true }; return; }

    try {
      const headers = { 'X-ChatWorkToken': token };
      const [roomRes, msgRes] = await Promise.all([
        fetch(`https://api.chatwork.com/v2/rooms/${roomId}`, { headers }),
        fetch(`https://api.chatwork.com/v2/rooms/${roomId}/messages?force=1`, { headers }),
      ]);
      if (!roomRes.ok) { summary[def.type] = { error: `room API ${roomRes.status}` }; return; }

      const roomData = await roomRes.json();
      const newMsgs = msgRes.ok ? (await msgRes.json()) : [];
      const msgArr = Array.isArray(newMsgs) ? newMsgs : [];
      const latest = msgArr[msgArr.length - 1];

      const room = {
        roomId, name: roomData.name || '', type: def.type,
        description: roomData.description || '',
        unreadCount: roomData.unread_num || 0,
        latestMessage: latest?.body || '',
        latestTime: latest
          ? new Date(latest.send_time * 1000).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
          : '',
        syncedAt: new Date().toISOString(),
      };

      // メッセージ蓄積（重複排除）
      let existing = [];
      const raw = await kv.get(`chatwork:messages:${def.type}`);
      if (raw) { try { existing = JSON.parse(raw); } catch {} }
      const existingIds = new Set(existing.map(m => m.messageId));
      const newStored = msgArr
        .filter(m => !existingIds.has(String(m.message_id)))
        .map(m => ({
          messageId: String(m.message_id),
          roomId, roomName: roomData.name || '', roomType: def.type,
          account: { name: m.account?.name || '' },
          body: m.body || '', sendTime: m.send_time || 0,
        }));
      const merged = [...existing, ...newStored].sort((a, b) => a.sendTime - b.sendTime);

      await Promise.all([
        kv.put(`chatwork:room:${def.type}`, JSON.stringify(room)),
        kv.put(`chatwork:messages:${def.type}`, JSON.stringify(merged)),
      ]);

      summary[def.type] = { roomName: room.name, newMessages: newStored.length, total: merged.length };
    } catch (e) {
      summary[def.type] = { error: e.message };
    }
  }));

  await kv.put('chatwork:last_sync', new Date().toISOString());
  return { ok: true, syncedAt: new Date().toISOString(), summary };
}

// ── JSON レスポンスヘルパー（全スコープで使用）─────────────────────────────────
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

// ── API ルーティング ──────────────────────────────────────────────────────────
async function handleAPI(request, env, path) {

  if (path === '/api/evaluation' && request.method === 'GET') {
    try { return json(await generateEvaluation(env)); }
    catch (e) { return json({ error: e.message }, 500); }
  }

  if (path === '/api/settings') {
    if (request.method === 'GET') {
      try { return json(await getSettings(env)); }
      catch (e) { return json({ error: e.message }, 500); }
    }
    if (request.method === 'POST') {
      try {
        await saveSettings(env, await request.json());
        return json({ ok: true });
      } catch (e) { return json({ error: e.message }, 500); }
    }
  }

  if (path === '/api/chatwork-rooms' && request.method === 'GET') {
    try { return json(await getChatworkRooms(env)); }
    catch (e) { return json({ error: e.message }, 500); }
  }

  // スプシのヘッダー行＋サンプルデータを返す（列構造確認用）
  if (path === '/api/sheets-preview' && request.method === 'GET') {
    try { return json(await fetchAllSheets(env)); }
    catch (e) { return json({ error: e.message }, 500); }
  }

  return new Response('Not Found', { status: 404 });
}

// ── メインハンドラ ─────────────────────────────────────────────────────────────
export default {
  async fetch(request, env) {
    const url  = new URL(request.url);
    const path = url.pathname;

    // ── ログアウト ──
    if (path === '/logout') {
      const headers = new Headers();
      headers.append('Location', '/login');
      headers.append('Set-Cookie', sessionCookie('', 0));
      headers.append('Set-Cookie', roleCookie('', 0));
      return new Response(null, { status: 302, headers });
    }

    // ── ログイン画面 ──
    if (path === '/login') {
      if (request.method === 'POST') {
        const body = await request.formData();
        const user = body.get('user') || '';
        const pass = body.get('pass') || '';

        let role = null;
        if (user === env.BASIC_AUTH_ADMIN_USER && pass === env.BASIC_AUTH_ADMIN_PASS) {
          role = 'admin';
        } else if (user === env.BASIC_AUTH_USER && pass === env.BASIC_AUTH_PASS) {
          role = 'member';
        }

        if (!role) {
          return new Response(loginHtml('IDまたはパスワードが正しくありません'), {
            status: 401,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
          });
        }

        const token = await createSession(role, env);
        const rawNext = url.searchParams.get('next') || '/';
        // 相対パス（/始まり、//始まりでない）のみ許可してオープンリダイレクトを防止
        const redirect = /^\/(?!\/)/.test(rawNext) ? rawNext : '/';
        const headers = new Headers();
        headers.append('Location', redirect);
        headers.append('Set-Cookie', sessionCookie(token, SESSION_MAX_AGE));
        headers.append('Set-Cookie', roleCookie(role, SESSION_MAX_AGE));
        return new Response(null, { status: 302, headers });
      }

      // GET /login
      return new Response(loginHtml(), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    // ── セッション確認 ──
    const role = await getSession(request, env);
    const loginRedirect = `/login?next=${encodeURIComponent(path)}`;

    // Chatwork同期（GitHub Actionsから呼び出し、認証不要）
    if (path === '/api/sync-chatwork' && request.method === 'POST') {
      try {
        const result = await syncChatwork(env);
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // セッション確認API（ログイン済みなら誰でも利用可）
    if (path === '/api/auth/check') {
      const data = role ? { authed: true, role } : { authed: false };
      return new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // スプシデータ（ログイン済みなら誰でも利用可 — 案件・問い合わせ閲覧）
    if (path === '/api/sheets-data' && request.method === 'GET') {
      if (!role) {
        return new Response(JSON.stringify({ error: 'ログインが必要です' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      try { return json(await fetchSheetsData(env)); }
      catch (e) { return json({ error: e.message }, 500); }
    }

    // API（管理者のみ）
    if (path.startsWith('/api/')) {
      if (role !== 'admin') {
        return new Response(JSON.stringify({ error: '管理者権限が必要です' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return handleAPI(request, env, path);
    }

    // 管理者ページ・設定ページ（管理者のみ）
    if (path.startsWith('/admin') || path.startsWith('/settings')) {
      if (role !== 'admin') {
        return new Response(null, { status: 302, headers: { 'Location': loginRedirect } });
      }
      return env.ASSETS.fetch(request);
    }

    // 通常ページ（ログイン済みなら誰でも）
    if (!role) {
      return new Response(null, { status: 302, headers: { 'Location': loginRedirect } });
    }

    return env.ASSETS.fetch(request);
  },
};
