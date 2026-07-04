import { describe, it, expect } from 'vitest'
import { SELF, env } from 'cloudflare:test'
import {
  BASE,
  createUser,
  createSession,
  createApp,
  makeAdmin,
  form,
  formHeaders,
  cookieHeader,
} from './helpers'

async function adminSession() {
  const user = await createUser()
  await makeAdmin(user.email)
  const sessionId = await createSession(user.id)
  return { user, sessionId }
}

describe('管理画面のアクセス制御', () => {
  it('未ログインでは /admin にアクセスできない', async () => {
    const res = await SELF.fetch(`${BASE}/admin`, { redirect: 'manual' })
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe('/login')
  })

  it('一般ユーザーは /admin にアクセスできない', async () => {
    const user = await createUser()
    const sessionId = await createSession(user.id)
    const res = await SELF.fetch(`${BASE}/admin`, {
      headers: { Cookie: cookieHeader({ '__Host-idp_session': sessionId }) },
      redirect: 'manual',
    })
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe('/login')
  })

  it('管理者は /admin にアクセスできる', async () => {
    const { sessionId } = await adminSession()
    const res = await SELF.fetch(`${BASE}/admin`, {
      headers: { Cookie: cookieHeader({ '__Host-idp_session': sessionId }) },
      redirect: 'manual',
    })
    expect(res.status).toBe(200)
  })

  it('一般ユーザーはアプリを作成できない', async () => {
    const user = await createUser()
    const sessionId = await createSession(user.id)
    const res = await SELF.fetch(`${BASE}/admin/apps`, {
      method: 'POST',
      headers: formHeaders({ '__Host-idp_session': sessionId }),
      body: form({ id: 'sneaky-app', name: 'Sneaky', base_url: 'https://sneaky.example', icon_url: 'x' }),
      redirect: 'manual',
    })
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe('/login')
    const app = await env.DB.prepare('SELECT * FROM apps WHERE id = ?').bind('sneaky-app').first()
    expect(app).toBeNull()
  })
})

describe('管理画面のアプリ管理', () => {
  it('管理者はアプリを作成できる', async () => {
    const { sessionId } = await adminSession()
    const res = await SELF.fetch(`${BASE}/admin/apps`, {
      method: 'POST',
      headers: formHeaders({ '__Host-idp_session': sessionId }),
      // icon_url を指定して外部への favicon 取得を回避する
      body: form({ id: 'my-app', name: 'My App', base_url: 'https://myapp.example', description: 'desc', icon_url: 'https://myapp.example/icon.png' }),
      redirect: 'manual',
    })
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe('/admin/apps')

    const app = await env.DB.prepare('SELECT * FROM apps WHERE id = ?')
      .bind('my-app')
      .first<{ name: string; status: string }>()
    expect(app?.name).toBe('My App')
    expect(app?.status).toBe('active')
  })

  it('管理者はアプリの有効/無効を切り替えられる', async () => {
    const { sessionId } = await adminSession()
    const app = await createApp()
    const res = await SELF.fetch(`${BASE}/admin/apps/toggle`, {
      method: 'POST',
      headers: formHeaders({ '__Host-idp_session': sessionId }),
      body: form({ id: app.id, status: 'inactive' }),
      redirect: 'manual',
    })
    expect(res.status).toBe(302)
    const row = await env.DB.prepare('SELECT status FROM apps WHERE id = ?')
      .bind(app.id)
      .first<{ status: string }>()
    expect(row?.status).toBe('inactive')
  })

  it('アプリを削除すると関連する権限・セッションも削除される', async () => {
    const { sessionId } = await adminSession()
    const user = await createUser()
    const app = await createApp()
    await env.DB.prepare(
      'INSERT INTO permissions (user_id, app_id, valid_from, valid_to, created_at) VALUES (?, ?, 0, 9999999999, 0)'
    )
      .bind(user.id, app.id)
      .run()
    await env.DB.prepare(
      'INSERT INTO app_sessions (token, refresh_token, user_id, app_id, expires_at) VALUES (?, ?, ?, ?, 9999999999)'
    )
      .bind('tok-x', 'ref-x', user.id, app.id)
      .run()

    const res = await SELF.fetch(`${BASE}/admin/apps/delete`, {
      method: 'POST',
      headers: formHeaders({ '__Host-idp_session': sessionId }),
      body: form({ id: app.id }),
      redirect: 'manual',
    })
    expect(res.status).toBe(302)

    expect(await env.DB.prepare('SELECT * FROM apps WHERE id = ?').bind(app.id).first()).toBeNull()
    expect(
      await env.DB.prepare('SELECT * FROM permissions WHERE app_id = ?').bind(app.id).first()
    ).toBeNull()
    expect(
      await env.DB.prepare('SELECT * FROM app_sessions WHERE app_id = ?').bind(app.id).first()
    ).toBeNull()
  })
})
