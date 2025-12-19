# Tobira 🚪

> **OIDC？そんな面倒なことはしません。**

**Tobira** は、**Cloudflare Workers** と **D1** で動作する、個人のための「俺用」認証基盤です。

---

## 🛠️ クイックスタート (ローカル開発)

### 1. インストール
```bash
git clone https://github.com/n416/tobira.git
cd tobira
npm install
```

### 2. データベース作成
```bash
wrangler d1 create tobira-db
wrangler d1 execute tobira-db --file=./schema.sql
```

### 3. 管理者の作成・更新 (Upsert)
付属の対話型ツールを使用します。
**新規作成** も **パスワード変更** も、このコマンド一つで行えます。

```bash
npx tsx scripts/manage-admin.ts create admin@example.com mypassword
```

**対話モード:**
実行すると適用先を聞かれます。
* `[1] Local`: ローカル環境に適用します。
* `[2] Remote`: 本番環境 (Cloudflare) に適用します。

### 4. 起動
```bash
npm run dev
```
`http://localhost:8787/login` からログインしてください。

---

## 🚀 本番デプロイ

1. **DB作成**: `wrangler d1 create tobira-db` (出力IDを `wrangler.toml` へ)
2. **スキーマ適用**: `wrangler d1 execute tobira-db --remote --file=./schema.sql`
3. **管理者作成**: 上記と同じコマンドを実行します。
   ```bash
   npx tsx scripts/manage-admin.ts create admin@example.com mypassword
   ```
   プロンプトで **`[2] Remote`** を選べば、本番環境に反映されます。
4. **デプロイ**: `npm run deploy`

---

## 🗑️ 管理者の削除
ユーザーを完全に消去する場合：
```bash
npx tsx scripts/manage-admin.ts delete admin@example.com
```

---

## 🔐 クライアントアプリ連携

専用ミドルウェア **[tobira-kagi](https://github.com/n416/tobira-kagi)** を使用してください。

```bash
npm install git+https://github.com/n416/tobira-kagi.git
```

## License
MIT
