# 不動産売買管理ダッシュボード

不動産売買案件を管理・分析するための Next.js ダッシュボードアプリです。

## 機能

- **ダッシュボード**: KPIカード・パイプライン概要・最近の活動
- **売却仲介**: 売却案件のカンバンボード・テーブル管理
- **購入仲介**: 購入案件のカンバンボード・テーブル管理
- **分析**: 月別成約数・ステージ分布・担当者別実績・売上推移グラフ
- **AI改善提案**: パイプライン分析・業務改善提案・自動化アイデア

## 技術スタック

- Next.js 14 (Static Export)
- TypeScript
- Tailwind CSS
- Recharts（グラフ）
- Lucide React（アイコン）

## ローカル開発

```bash
# 依存関係をインストール
npm install

# 開発サーバーを起動
npm run dev
```

ブラウザで http://localhost:3000 を開いてください。

## GitHub Pages へのデプロイ

### 1. GitHub リポジトリの設定

1. GitHub でリポジトリを作成する
2. **Settings > Pages** を開く
3. **Source** を `GitHub Actions` に設定する

### 2. コードをプッシュ

```bash
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/your-username/your-repo-name.git
git push -u origin main
```

3. GitHub Actions が自動的にビルド・デプロイを実行します
4. デプロイ完了後、`https://your-username.github.io/your-repo-name/` でアクセスできます

## Chatwork・Google Sheets 連携（将来実装）

### 必要な Secret の設定

**Settings > Secrets and variables > Actions** に以下を追加:

| Secret 名 | 説明 |
|-----------|------|
| `CHATWORK_API_TOKEN` | Chatwork の API トークン |
| `CHATWORK_ROOM_ID` | 対象のルーム ID |
| `GOOGLE_SHEETS_API_KEY` | Google Sheets API キー |
| `GOOGLE_SHEETS_ID` | スプレッドシートの ID |

### データ取得フローの実装

`.github/workflows/fetch-data.yml` の TODO コメントを参照し、以下を実装してください:

1. **Chatwork API**: 問い合わせメッセージの取得・パース
2. **Google Sheets API**: 案件データの取得
3. **変換スクリプト**: `scripts/transform-data.js` を作成し、API レスポンスを `lib/mockData.ts` の形式に変換する

`lib/dataLoader.ts` にも TODO コメントがあります。APIクライアントの実装はここに追加してください。

## ファイル構成

```
├── app/
│   ├── layout.tsx          # ルートレイアウト（サイドバー含む）
│   ├── globals.css         # グローバルスタイル
│   ├── page.tsx            # ダッシュボード
│   ├── sell/page.tsx       # 売却仲介
│   ├── buy/page.tsx        # 購入仲介
│   ├── analytics/page.tsx  # 分析
│   └── suggestions/page.tsx # AI改善提案
├── components/
│   ├── Sidebar.tsx         # サイドバーナビゲーション
│   ├── KPICard.tsx         # KPIカードコンポーネント
│   ├── PipelineBoard.tsx   # カンバンボード
│   └── CaseTable.tsx       # 案件テーブル
├── lib/
│   ├── mockData.ts         # モックデータ（将来APIに置き換え）
│   └── dataLoader.ts       # データ読み込み（API統合用）
├── public/
│   └── .nojekyll           # GitHub Pages 用（Jekyll 無効化）
└── .github/workflows/
    ├── deploy.yml          # GitHub Pages デプロイ
    └── fetch-data.yml      # データ取得（要実装）
```
