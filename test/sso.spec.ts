import { describe, it, expect } from 'vitest'
import { SELF, env } from 'cloudflare:test'
import {
  BASE,
  TEST_PASSWORD,
  createUser,
  createApp,
  createGroup,
  grantUserPermission,
  grantGroupPermission,
  form,
  formHeaders,
  now,
} from './helpers'

/** redirect_to 付きログインを実行し、レスポンスを返す */
async function loginWithRedirect(email: string, redirectTo: string): Promise<Response> {
  return SELF.fetch(`${BASE}/login`, {
    method: 'POST',
    headers: formHeaders(),
    body: form({ email, password: TEST_PASSWORD, redirect_to: redirectTo }),
    redirect: 'manual',
  })
}

/** ログイン→認可コード取得までを実行し、コードを返す */
async function obtainAuthCode(email: string, redirectTo: string): Promise<string> {
  const res = await loginWithRedirect(email, redirectTo)
  expect(res.status).toBe(302)
  const location = res.headers.get('location')!
  const code = new URL(location).searchParams.get('code')
  expect(code).toBeTruthy()
  return code!
}

describe('SSO認可コードフロー', () => {
  it('権限のあるユーザーはアプリへ認可コード付きでリダイレクトされる', async () => {
    const user = await createUser()
    const app = await createApp()
    await grantUserPermission(user.id, app.id)

    const res = await loginWithRedirect(user.email, `${app.baseUrl}/callback`)
    expect(res.status).toBe(302)
    const location = res.headers.get('location')!
    expect(location.startsWith(`${app.baseUrl}/callback?code=`)).toBe(true)

    const code = new URL(location).searchParams.get('code')!
    const row = await env.DB.prepare('SELECT * FROM auth_codes WHERE code = ?')
      .bind(code)
      .first<{ user_id: string; app_id: string; expires_at: number }>()
    expect(row?.user_id).toBe(user.id)
    expect(row?.app_id).toBe(app.id)
    expect(row!.expires_at).toBeGreaterThan(now())
  })

  it('グループ権限でもアクセスできる', async () => {
    const groupId = await createGroup()
    const user = await createUser({ groupId })
    const app = await createApp()
    await grantGroupPermission(groupId, app.id)

    const res = await loginWithRedirect(user.email, `${app.baseUrl}/callback`)
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toContain('code=')
  })

  it('未登録のURLへのリダイレクトは拒否される', async () => {
    const user = await createUser()
    const res = await loginWithRedirect(user.email, 'https://evil.example/steal')
    expect(res.status).toBe(400)
  })

  it('登録ドメインを接頭辞に持つ攻撃者ドメインへは認可コードを発行しない', async () => {
    const user = await createUser()
    const app = await createApp()
    await grantUserPermission(user.id, app.id)

    // 例: base_url "https://app-1.test.example" に対する "https://app-1.test.example.evil.com"
    const res = await loginWithRedirect(user.email, `${app.baseUrl}.evil.com/callback`)
    expect(res.status).toBe(400)

    const codes = await env.DB.prepare('SELECT * FROM auth_codes WHERE user_id = ?')
      .bind(user.id)
      .first()
    expect(codes).toBeNull()
  })

  it('権限のないユーザーはアクセス拒否される', async () => {
    const user = await createUser()
    const app = await createApp()
    const res = await loginWithRedirect(user.email, `${app.baseUrl}/callback`)
    expect(res.status).toBe(403)
  })

  it('期限切れの権限ではアクセス拒否される', async () => {
    const user = await createUser()
    const app = await createApp()
    await grantUserPermission(user.id, app.id, now() - 7200, now() - 3600)
    const res = await loginWithRedirect(user.email, `${app.baseUrl}/callback`)
    expect(res.status).toBe(403)
  })

  it('停止中のアプリへはアクセスできない', async () => {
    const user = await createUser()
    const app = await createApp({ status: 'inactive' })
    await grantUserPermission(user.id, app.id)
    const res = await loginWithRedirect(user.email, `${app.baseUrl}/callback`)
    // inactive アプリは base_url マッチの対象外なので Invalid App になる
    expect([400, 403]).toContain(res.status)
  })
})

describe('トークンAPI', () => {
  async function setupUserWithCode() {
    const user = await createUser()
    const app = await createApp()
    await grantUserPermission(user.id, app.id)
    const code = await obtainAuthCode(user.email, `${app.baseUrl}/cb`)
    return { user, app, code }
  }

  it('認可コードをアクセストークンに交換できる', async () => {
    const { user, code } = await setupUserWithCode()
    const res = await SELF.fetch(`${BASE}/api/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
    expect(res.status).toBe(200)
    const body = await res.json<{ access_token: string; refresh_token: string; expires_in: number }>()
    expect(body.access_token).toBeTruthy()
    expect(body.refresh_token).toBeTruthy()
    expect(body.expires_in).toBe(3600)

    // トークンで /api/me からユーザー情報を取得できる
    const meRes = await SELF.fetch(`${BASE}/api/me`, {
      headers: { Authorization: `Bearer ${body.access_token}` },
    })
    expect(meRes.status).toBe(200)
    const me = await meRes.json<Record<string, unknown>>()
    expect(me.email).toBe(user.email)
    expect(me.password_hash).toBeUndefined() // ハッシュは返さない
  })

  it('認可コードは一度しか使えない', async () => {
    const { code } = await setupUserWithCode()
    const first = await SELF.fetch(`${BASE}/api/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
    expect(first.status).toBe(200)

    const second = await SELF.fetch(`${BASE}/api/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
    expect(second.status).toBe(400)
  })

  it('期限切れの認可コードは拒否される', async () => {
    const user = await createUser()
    const app = await createApp()
    await env.DB.prepare('INSERT INTO auth_codes (code, user_id, app_id, expires_at) VALUES (?, ?, ?, ?)')
      .bind('expired-code', user.id, app.id, now() - 60)
      .run()
    const res = await SELF.fetch(`${BASE}/api/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'expired-code' }),
    })
    expect(res.status).toBe(400)
  })

  it('存在しないコード・コード未指定は拒否される', async () => {
    const noCode = await SELF.fetch(`${BASE}/api/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    expect(noCode.status).toBe(400)

    const badCode = await SELF.fetch(`${BASE}/api/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'no-such-code' }),
    })
    expect(badCode.status).toBe(400)
  })

  it('無効なトークンでは /api/me にアクセスできない', async () => {
    const noAuth = await SELF.fetch(`${BASE}/api/me`)
    expect(noAuth.status).toBe(401)

    const badToken = await SELF.fetch(`${BASE}/api/me`, {
      headers: { Authorization: 'Bearer bogus-token' },
    })
    expect(badToken.status).toBe(401)
  })

  it('リフレッシュトークンでトークンをローテーションできる', async () => {
    const { code } = await setupUserWithCode()
    const tokenRes = await SELF.fetch(`${BASE}/api/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
    const { access_token, refresh_token } = await tokenRes.json<{
      access_token: string
      refresh_token: string
    }>()

    const refreshRes = await SELF.fetch(`${BASE}/api/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token }),
    })
    expect(refreshRes.status).toBe(200)
    const rotated = await refreshRes.json<{ access_token: string; refresh_token: string }>()
    expect(rotated.access_token).not.toBe(access_token)
    expect(rotated.refresh_token).not.toBe(refresh_token)

    // 旧リフレッシュトークンは無効化されている
    const reuse = await SELF.fetch(`${BASE}/api/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token }),
    })
    expect(reuse.status).toBe(400)
  })

  it('権限が失効しているとリフレッシュできずセッションが削除される', async () => {
    const { user, app, code } = await setupUserWithCode()
    const tokenRes = await SELF.fetch(`${BASE}/api/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
    const { refresh_token } = await tokenRes.json<{ refresh_token: string }>()

    // 権限を剥奪
    await env.DB.prepare('DELETE FROM permissions WHERE user_id = ? AND app_id = ?')
      .bind(user.id, app.id)
      .run()

    const res = await SELF.fetch(`${BASE}/api/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token }),
    })
    expect(res.status).toBe(403)

    const session = await env.DB.prepare('SELECT * FROM app_sessions WHERE refresh_token = ?')
      .bind(refresh_token)
      .first()
    expect(session).toBeNull()
  })
})
