# Tobira 🚪

> **OIDC不要。ベンダーロックインなし。**
> **Cloudflare Workers + D1 で動く、あなたのための認証スターターキット。**

**Tobira** は、SaaS開発における「面倒な認証実装」をスキップするためのボイラープレート（土台）です。
外部のIdPサービスに依存せず、認証ロジックをあなたのアプリケーションの一部として組み込むことができます。

---

## ✨ 特徴

* **No OIDC, No Complexity**: 複雑な標準規格に縛られず、シンプルで理解しやすいコードベース。
* **Full Control**: ユーザーデータはあなたのD1データベースに保存されます。外部サービスへの流出はありません。
* **AI-Native Friendly**: AIにコードを読ませてカスタマイズしやすい、素直な実装（Hono + D1）。
* **2FA Ready**: Google Authenticator等による2段階認証を標準装備。

---

## 🛠️ クイックスタート

### 1. リポジトリの作成
画面上部の **[Use this template]** ボタンをクリックし、新しいリポジトリを作成してください。
（Forkではなく、Template機能を使うことで、履歴をリセットしてあなたのプロジェクトとして開始できます）

### 2. クローン & インストール
作成したあなたのリポジトリをクローンします。

```bash
git clone [https://github.com/your-name/your-repo-name.git](https://github.com/your-name/your-repo-name.git)
cd your-repo-name
npm install
```

### 3. データベース作成
```bash
wrangler d1 create tobira-db
# 出力された database_id を wrangler.toml に記載してください
wrangler d1 execute tobira-db --file=./schema.sql
```

### 4. 管理者の作成 (初期セットアップ)
付属のツールを使って管理者ユーザーを作成します。

```bash
npx tsx scripts/manage-admin.ts create admin@example.com mypassword
```
* プロンプトで `[1] Local` を選ぶとローカル環境に作成されます。
* `[2] Remote` を選ぶと本番環境(Cloudflare)に作成されます。

### 5. 起動
```bash
npm run dev
```
`http://localhost:8787/login` にアクセスしてログインしてください。

---

## 🚀 本番デプロイ

1.  **環境変数の設定**: `wrangler.toml` の `JWT_SECRET` を独自の乱数に変更してください。
2.  **管理者作成**: リモート環境に対して管理者を作成します。
    ```bash
    npx tsx scripts/manage-admin.ts create admin@example.com mypassword
    # [2] Remote を選択
    ```
3.  **デプロイ**:
    ```bash
    npm run deploy
    ```

---

## 🔐 クライアントアプリ連携

この認証基盤を利用するアプリケーションには、専用ミドルウェア **[tobira-kagi](https://github.com/n416/tobira-kagi)** を使用すると便利です。

```bash
npm install git+[https://github.com/n416/tobira-kagi.git](https://github.com/n416/tobira-kagi.git)
```

## License
MIT
