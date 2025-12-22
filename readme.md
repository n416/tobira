# Tobira 🚪

> **No OIDC. No Vendor Lock-in.**
> **The Auth Starter Kit running on Cloudflare Workers + D1.**

**Tobira** is a boilerplate designed to let you skip the tedious implementation of authentication in your SaaS development.
Instead of relying on external IdP services, you can embed the authentication logic directly as part of your application.

---

## ✨ Features

* **No OIDC, No Complexity**: Free from complex standards. Simple, readable code base.
* **Full Control**: User data lives in YOUR D1 database. No third-party data lock-in.
* **AI-Native Friendly**: Clean implementation (Hono + D1) that is easy for AI to read and customize.
* **2FA Ready**: Built-in Two-Factor Authentication (TOTP).

---

## 🛠️ Quick Start

### 1. Create Repository
Click the **[Use this template]** button at the top of the page to create a new repository.
(Using the Template feature instead of Fork allows you to start fresh with no history.)

### 2. Clone & Install
Clone your newly created repository.

```bash
git clone [https://github.com/your-name/your-repo-name.git](https://github.com/your-name/your-repo-name.git)
cd your-repo-name
npm install
```

### 3. Setup Database
```bash
wrangler d1 create tobira-db
# Update wrangler.toml with the output database_id
wrangler d1 execute tobira-db --file=./schema.sql
```

### 4. Create Admin (Initial Setup)
Use the included tool to create an admin user.

```bash
npx tsx scripts/manage-admin.ts create admin@example.com mypassword
```
* Select `[1] Local` to create in the local environment.
* Select `[2] Remote` to create in the production environment (Cloudflare).

### 5. Start Server
```bash
npm run dev
```
Access `http://localhost:8787/login` and log in.

---

## 🚀 Production Deployment

1.  **Config**: Change `JWT_SECRET` in `wrangler.toml` to your own random string.
2.  **Create Admin**: Create an admin for the remote environment.
    ```bash
    npx tsx scripts/manage-admin.ts create admin@example.com mypassword
    # Select [2] Remote
    ```
3.  **Deploy**:
    ```bash
    npm run deploy
    ```

---

## 🔐 For Client Apps

Use the **[tobira-kagi](https://github.com/n416/tobira-kagi)** middleware to integrate easily.

```bash
npm install git+[https://github.com/n416/tobira-kagi.git](https://github.com/n416/tobira-kagi.git)
```

## License
MIT
