# Tobira 🚪

> **Forget OIDC. Forget Complexity. Just Auth.**

**Tobira** is an AI-native, "Anti-Standard" Identity Provider running on **Cloudflare Workers** and **D1**.

---

## 🛠️ Quick Start (Local)

### 1. Clone & Install
```bash
git clone https://github.com/n416/tobira.git
cd tobira
npm install
```

### 2. Setup Database
```bash
wrangler d1 create tobira-db
wrangler d1 execute tobira-db --file=./schema.sql
```

### 3. Create or Update Admin
Use the interactive tool to create an admin.
**If the user already exists, this command updates their password (Upsert).**

```bash
npx tsx scripts/manage-admin.ts create admin@example.com mypassword
```

**Interactive Mode:**
The script will ask you where to apply the changes:
* `[1] Local`: Apply to local development environment.
* `[2] Remote`: Apply to production (Cloudflare).

### 4. Start Server
```bash
npm run dev
```
Access `http://localhost:8787/login`.

---

## 🚀 Production Deployment

1. **Create DB**: `wrangler d1 create tobira-db` (Update `wrangler.toml`).
2. **Apply Schema**: `wrangler d1 execute tobira-db --remote --file=./schema.sql`
3. **Create Admin**: Run the same command as above:
   ```bash
   npx tsx scripts/manage-admin.ts create admin@example.com mypassword
   ```
   Then select **`[2] Remote`** when prompted.
4. **Deploy**: `npm run deploy`

---

## 🗑️ Delete Admin
To completely remove a user:
```bash
npx tsx scripts/manage-admin.ts delete admin@example.com
```

---

## 🔐 For Client Apps

Use **[tobira-kagi](https://github.com/n416/tobira-kagi)** middleware.

```bash
npm install git+https://github.com/n416/tobira-kagi.git
```

## License
MIT
