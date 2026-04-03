// ── 認証チェック ─────────────────────────────────────────────────────────────
function checkAuth(request, validUser, validPass) {
  if (!validUser || !validPass) return false;
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Basic ')) return false;
  const decoded = atob(authHeader.slice(6));
  const idx = decoded.indexOf(':');
  const user = decoded.slice(0, idx);
  const pass = decoded.slice(idx + 1);
  return user === validUser && pass === validPass;
}

function unauthorizedResponse(realm) {
  return new Response('認証が必要です', {
    status: 401,
    headers: {
      'WWW-Authenticate': `Basic realm="${realm}"`,
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}

// ── 設定管理（KV） ────────────────────────────────────────────────────────────
const SETTINGS_KEYS = [
  { key: 'CHATWORK_API_TOKEN',         label: 'Chatwork APIトークン',          sensitive: true,  group: 'chatwork' },
  { key: 'CHATWORK_ROOM_OPERATIONS',   label: '運用チャット ルームID',          sensitive: false, group: 'chatwork' },
  { key: 'CHATWORK_ROOM_HP_LINE',      label: 'HP/LINE チャット ルームID',      sensitive: false, group: 'chatwork' },
  { key: 'CHATWORK_ROOM_RECRUITMENT',  label: '求人チャット ルームID',          sensitive: false, group: 'chatwork' },
  { key: 'CHATWORK_ROOM_NOTIFICATION', label: '通知チャット ルームID',          sensitive: false, group: 'chatwork' },
  { key: 'CHATWORK_ROOM_CUSTOMER',     label: 'メッセージチャット ルームID',    sensitive: false, group: 'chatwork' },
  { key: 'GOOGLE_SHEETS_API_KEY',      label: 'Google Sheets APIキー',         sensitive: true,  group: 'sheets' },
  { key: 'GOOGLE_SHEETS_ID',           label: 'スプレッドシートID',             sensitive: false, group: 'sheets' },
  { key: 'GOOGLE_SHEETS_CASES_RANGE',  label: '案件管理 範囲',                 sensitive: false, group: 'sheets' },
  { key: 'GOOGLE_SHEETS_LINE_RANGE',   label: 'LINE問い合わせ 範囲',           sensitive: false, group: 'sheets' },
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
  return result;
}

async function saveSettings(env, updates) {
  if (!env.SETTINGS_KV) {
    throw new Error('KV ストレージが設定されていません。Cloudflare Pages の設定で SETTINGS_KV バインディングを追加してください。');
  }
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
  const roomOps       = await getRawValue(env, 'CHATWORK_ROOM_OPERATIONS');

  if (!chatworkToken) throw new Error('CHATWORK_API_TOKEN が未設定です');
  if (!anthropicKey)  throw new Error('ANTHROPIC_API_KEY が未設定です');

  // Chatwork から直近メッセージ取得
  const messages = [];
  const rooms = [
    { key: 'CHATWORK_ROOM_OPERATIONS',   name: '運用' },
    { key: 'CHATWORK_ROOM_HP_LINE',      name: 'HP/LINE' },
    { key: 'CHATWORK_ROOM_RECRUITMENT',  name: '求人' },
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
    } catch (e) {
      // ルーム取得失敗は無視して続行
    }
  }

  // 担当者ごとにメッセージをまとめる
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

  if (!aiResp.ok) {
    const errText = await aiResp.text();
    throw new Error(`Anthropic API エラー: ${aiResp.status}`);
  }

  const aiData = await aiResp.json();
  const content = aiData.content?.[0]?.text || '';
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('AI レスポンスのパースに失敗しました');

  return JSON.parse(jsonMatch[0]);
}

// ── API ルーティング ──────────────────────────────────────────────────────────
async function handleAPI(request, env, path) {
  const json = (data, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });

  if (path === '/api/evaluation' && request.method === 'GET') {
    try {
      const result = await generateEvaluation(env);
      return json(result);
    } catch (e) {
      return json({ error: e.message }, 500);
    }
  }

  if (path === '/api/settings') {
    if (request.method === 'GET') {
      try {
        const settings = await getSettings(env);
        return json(settings);
      } catch (e) {
        return json({ error: e.message }, 500);
      }
    }
    if (request.method === 'POST') {
      try {
        const body = await request.json();
        await saveSettings(env, body);
        return json({ ok: true });
      } catch (e) {
        return json({ error: e.message }, 500);
      }
    }
  }

  return new Response('Not Found', { status: 404 });
}

// ── メインハンドラ ─────────────────────────────────────────────────────────────
export default {
  async fetch(request, env) {
    const url  = new URL(request.url);
    const path = url.pathname;

    // APIルート（管理者のみ）
    if (path.startsWith('/api/')) {
      if (!checkAuth(request, env.BASIC_AUTH_ADMIN_USER, env.BASIC_AUTH_ADMIN_PASS)) {
        return unauthorizedResponse('LA Estate Admin');
      }
      return handleAPI(request, env, path);
    }

    // 管理者ページ（管理者のみ）
    if (path.startsWith('/admin')) {
      if (!checkAuth(request, env.BASIC_AUTH_ADMIN_USER, env.BASIC_AUTH_ADMIN_PASS)) {
        return unauthorizedResponse('LA Estate Admin');
      }
      return env.ASSETS.fetch(request);
    }

    // 通常ページ（メンバー or 管理者）
    const isMember = checkAuth(request, env.BASIC_AUTH_USER, env.BASIC_AUTH_PASS);
    const isAdmin  = checkAuth(request, env.BASIC_AUTH_ADMIN_USER, env.BASIC_AUTH_ADMIN_PASS);

    if (!isMember && !isAdmin) {
      return unauthorizedResponse('LA Estate');
    }

    return env.ASSETS.fetch(request);
  },
};
