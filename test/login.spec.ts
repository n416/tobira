import { describe, it, expect } from 'vitest'
import { SELF, env } from 'cloudflare:test'
import {
  BASE,
  TEST_PASSWORD,
  createUser,
  createSession,
  makeAdmin,
  form,
  formHeaders,
  cookieHeader,
  getSetCookieValue,
  now,
} from './helpers'
import { generateToken as generateTotp, generateSecret } from '../src/utils/totp'

describe('ログイン', () => {
  it('GET /login はログインページを返す', async () => {
    const res = await SELF.fetch(`${BASE}/login`)
    expect(res.status).toBe(200)
    expect(await res.text()).toContain('form')
  })

  it('正しい認証情報でログインするとセッションが発行されダッシュボードへ', async () => {
    const user = await createUser()
    const res = await SELF.fetch(`${BASE}/login`, {
      method: 'POST',
      headers: formHeaders(),
      body: form({ email: user.email, password: TEST_PASSWORD }),
      redirect: 'manual',
    })
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe('/')

    const sessionId = getSetCookieValue(res, '__Host-idp_session')
    expect(sessionId).toBeTruthy()

    const session = await env.DB.prepare('SELECT * FROM sessions WHERE id = ?')
      .bind(sessionId)
      .first<{ user_id: string; expires_at: number }>()
    expect(session?.user_id).toBe(user.id)
    expect(session!.expires_at).toBeGreaterThan(now())
  })

  it('管理者がログインすると /admin へリダイレクトされる', async () => {
    const user = await createUser()
    await makeAdmin(user.email)
    const res = await SELF.fetch(`${BASE}/login`, {
      method: 'POST',
      headers: formHeaders(),
      body: form({ email: user.email, password: TEST_PASSWORD }),
      redirect: 'manual',
    })
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe('/admin')
  })

  it('パスワードが違うとセッションを発行しない', async () => {
    const user = await createUser()
    const res = await SELF.fetch(`${BASE}/login`, {
      method: 'POST',
      headers: formHeaders(),
      body: form({ email: user.email, password: 'wrong-password' }),
      redirect: 'manual',
    })
    expect(res.status).toBe(200) // エラー付きログインページを再表示
    expect(getSetCookieValue(res, '__Host-idp_session')).toBeNull()
  })

  it('存在しないユーザーではログインできない', async () => {
    const res = await SELF.fetch(`${BASE}/login`, {
      method: 'POST',
      headers: formHeaders(),
      body: form({ email: 'nobody@test.example', password: TEST_PASSWORD }),
      redirect: 'manual',
    })
    expect(res.status).toBe(200)
    expect(getSetCookieValue(res, '__Host-idp_session')).toBeNull()
  })

  it('Originヘッダーのないフォーム送信はCSRF対策で拒否される', async () => {
    const user = await createUser()
    const res = await SELF.fetch(`${BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form({ email: user.email, password: TEST_PASSWORD }),
      redirect: 'manual',
    })
    expect(res.status).toBe(403)
  })

  it('ログイン成功時に監査ログが記録される', async () => {
    const user = await createUser()
    await SELF.fetch(`${BASE}/login`, {
      method: 'POST',
      headers: formHeaders(),
      body: form({ email: user.email, password: TEST_PASSWORD }),
      redirect: 'manual',
    })
    const log = await env.DB.prepare(
      "SELECT * FROM audit_logs WHERE event_type = 'LOGIN' ORDER BY id DESC LIMIT 1"
    ).first<{ details: string }>()
    expect(log?.details).toContain(user.email)
  })
})

describe('2FAログイン', () => {
  it('2FA有効ユーザーはパスワードだけではセッションが発行されない', async () => {
    const secret = generateSecret()
    const user = await createUser({ twoFactorSecret: secret })
    const res = await SELF.fetch(`${BASE}/login`, {
      method: 'POST',
      headers: formHeaders(),
      body: form({ email: user.email, password: TEST_PASSWORD }),
      redirect: 'manual',
    })
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe('/login/2fa')
    expect(getSetCookieValue(res, '__Host-idp_session')).toBeNull()
    expect(getSetCookieValue(res, 'pre_2fa_token')).toBeTruthy()
  })

  it('正しいTOTPコードでログインが完了する', async () => {
    const secret = generateSecret()
    const user = await createUser({ twoFactorSecret: secret })
    const loginRes = await SELF.fetch(`${BASE}/login`, {
      method: 'POST',
      headers: formHeaders(),
      body: form({ email: user.email, password: TEST_PASSWORD }),
      redirect: 'manual',
    })
    const preToken = getSetCookieValue(loginRes, 'pre_2fa_token')!

    const res = await SELF.fetch(`${BASE}/login/2fa`, {
      method: 'POST',
      headers: formHeaders({ pre_2fa_token: preToken }),
      body: form({ token: generateTotp(secret) }),
      redirect: 'manual',
    })
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe('/')
    const sessionId = getSetCookieValue(res, '__Host-idp_session')
    expect(sessionId).toBeTruthy()
    const session = await env.DB.prepare('SELECT user_id FROM sessions WHERE id = ?')
      .bind(sessionId)
      .first<{ user_id: string }>()
    expect(session?.user_id).toBe(user.id)
  })

  it('間違ったTOTPコードではセッションが発行されない', async () => {
    const secret = generateSecret()
    const user = await createUser({ twoFactorSecret: secret })
    const loginRes = await SELF.fetch(`${BASE}/login`, {
      method: 'POST',
      headers: formHeaders(),
      body: form({ email: user.email, password: TEST_PASSWORD }),
      redirect: 'manual',
    })
    const preToken = getSetCookieValue(loginRes, 'pre_2fa_token')!

    const res = await SELF.fetch(`${BASE}/login/2fa`, {
      method: 'POST',
      headers: formHeaders({ pre_2fa_token: preToken }),
      body: form({ token: '000000' }),
      redirect: 'manual',
    })
    expect(res.status).toBe(200)
    expect(getSetCookieValue(res, '__Host-idp_session')).toBeNull()
  })

  it('pre_2fa_token なしで /login/2fa へPOSTすると /login へ戻される', async () => {
    const res = await SELF.fetch(`${BASE}/login/2fa`, {
      method: 'POST',
      headers: formHeaders(),
      body: form({ token: '123456' }),
      redirect: 'manual',
    })
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe('/login')
  })
})

describe('セッション', () => {
  it('未ログインで / にアクセスすると /login へリダイレクト', async () => {
    const res = await SELF.fetch(`${BASE}/`, { redirect: 'manual' })
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe('/login')
  })

  it('有効なセッションがあればダッシュボードが表示される', async () => {
    const user = await createUser()
    const sessionId = await createSession(user.id)
    const res = await SELF.fetch(`${BASE}/`, {
      headers: { Cookie: cookieHeader({ '__Host-idp_session': sessionId }) },
      redirect: 'manual',
    })
    expect(res.status).toBe(200)
    expect(await res.text()).toContain(user.email)
  })

  it('期限切れセッションではログインページへ戻される', async () => {
    const user = await createUser()
    const sessionId = await createSession(user.id, now() - 60)
    const res = await SELF.fetch(`${BASE}/`, {
      headers: { Cookie: cookieHeader({ '__Host-idp_session': sessionId }) },
      redirect: 'manual',
    })
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe('/login')
  })

  it('ログアウトでIdPセッションとアプリセッションが削除される', async () => {
    const user = await createUser()
    const sessionId = await createSession(user.id)
    await env.DB.prepare(
      'INSERT INTO app_sessions (token, refresh_token, user_id, app_id, expires_at) VALUES (?, ?, ?, ?, ?)'
    )
      .bind('tok-1', 'ref-1', user.id, 'some-app', now() + 3600)
      .run()

    const res = await SELF.fetch(`${BASE}/logout`, {
      headers: { Cookie: cookieHeader({ '__Host-idp_session': sessionId }) },
      redirect: 'manual',
    })
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe('/login')

    const session = await env.DB.prepare('SELECT * FROM sessions WHERE id = ?').bind(sessionId).first()
    expect(session).toBeNull()
    const appSession = await env.DB.prepare('SELECT * FROM app_sessions WHERE user_id = ?')
      .bind(user.id)
      .first()
    expect(appSession).toBeNull()
  })
})
