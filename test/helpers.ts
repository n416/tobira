import { env } from 'cloudflare:test'
import { hashPassword } from '../src/utils/auth'

export const BASE = 'https://example.com'
export const TEST_PASSWORD = 'correct-horse-battery'

// bcrypt は遅いのでテスト全体で同じハッシュを使い回す
let cachedHash: string | null = null
export async function testPasswordHash(): Promise<string> {
  if (!cachedHash) cachedHash = await hashPassword(TEST_PASSWORD)
  return cachedHash
}

export function now(): number {
  return Math.floor(Date.now() / 1000)
}

let seq = 0
function uid(prefix: string): string {
  return `${prefix}-${++seq}-${crypto.randomUUID().slice(0, 8)}`
}

export async function createUser(opts: {
  email?: string
  twoFactorSecret?: string
  groupId?: string
} = {}) {
  const id = uid('user')
  const email = opts.email ?? `${id}@test.example`
  await env.DB.prepare(
    'INSERT INTO users (id, email, password_hash, group_id, created_at, updated_at, two_factor_secret) VALUES (?, ?, ?, ?, ?, ?, ?)'
  )
    .bind(id, email, await testPasswordHash(), opts.groupId ?? null, now(), now(), opts.twoFactorSecret ?? null)
    .run()
  return { id, email }
}

export async function makeAdmin(email: string) {
  await env.DB.prepare('INSERT INTO admins (email) VALUES (?)').bind(email).run()
}

export async function createSession(userId: string, expiresAt = now() + 86400): Promise<string> {
  const sessionId = crypto.randomUUID()
  await env.DB.prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)')
    .bind(sessionId, userId, expiresAt)
    .run()
  return sessionId
}

export async function createApp(opts: { baseUrl?: string; status?: string; name?: string } = {}) {
  const id = uid('app')
  const baseUrl = opts.baseUrl ?? `https://${id}.test.example`
  await env.DB.prepare(
    'INSERT INTO apps (id, name, base_url, status, created_at) VALUES (?, ?, ?, ?, ?)'
  )
    .bind(id, opts.name ?? `App ${id}`, baseUrl, opts.status ?? 'active', now())
    .run()
  return { id, baseUrl }
}

export async function grantUserPermission(
  userId: string,
  appId: string,
  validFrom = now() - 3600,
  validTo = now() + 3600
) {
  await env.DB.prepare(
    'INSERT INTO permissions (user_id, app_id, valid_from, valid_to, created_at) VALUES (?, ?, ?, ?, ?)'
  )
    .bind(userId, appId, validFrom, validTo, now())
    .run()
}

export async function createGroup(name = 'Test Group'): Promise<string> {
  const id = uid('group')
  await env.DB.prepare('INSERT INTO groups (id, name, created_at) VALUES (?, ?, ?)')
    .bind(id, name, now())
    .run()
  return id
}

export async function grantGroupPermission(
  groupId: string,
  appId: string,
  validFrom = now() - 3600,
  validTo = now() + 3600
) {
  await env.DB.prepare(
    'INSERT INTO group_permissions (group_id, app_id, valid_from, valid_to, created_at) VALUES (?, ?, ?, ?, ?)'
  )
    .bind(groupId, appId, validFrom, validTo, now())
    .run()
}

// --- HTTPリクエスト補助 ---

export function formHeaders(cookies?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
    // hono/csrf はフォームPOSTのOriginを検証する
    Origin: BASE,
  }
  if (cookies) headers.Cookie = cookieHeader(cookies)
  return headers
}

export function cookieHeader(cookies: Record<string, string>): string {
  return Object.entries(cookies)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ')
}

export function form(fields: Record<string, string>): string {
  return new URLSearchParams(fields).toString()
}

/** Set-Cookieヘッダーから指定クッキーの値を取り出す(なければ null) */
export function getSetCookieValue(res: Response, name: string): string | null {
  // getSetCookie は workerd 実行環境には存在するが、依存中の workers-types が古く型に無い
  const lines = (res.headers as Headers & { getSetCookie(): string[] }).getSetCookie()
  for (const line of lines) {
    if (line.startsWith(`${name}=`)) {
      return line.slice(name.length + 1).split(';')[0]
    }
  }
  return null
}
