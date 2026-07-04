import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword, generateToken, getCookieOptions } from '../src/utils/auth'
import { generateSecret, generateToken as generateTotp, verifyToken } from '../src/utils/totp'

describe('utils/auth', () => {
  it('ハッシュ化したパスワードを正しく検証できる', async () => {
    const hash = await hashPassword('my-secret')
    expect(hash).not.toBe('my-secret')
    expect(await verifyPassword('my-secret', hash)).toBe(true)
  })

  it('間違ったパスワードは検証に失敗する', async () => {
    const hash = await hashPassword('my-secret')
    expect(await verifyPassword('wrong-password', hash)).toBe(false)
  })

  it('generateToken は毎回異なるUUIDを返す', () => {
    const a = generateToken()
    const b = generateToken()
    expect(a).not.toBe(b)
    expect(a).toMatch(/^[0-9a-f-]{36}$/)
  })

  it('getCookieOptions は Secure/HttpOnly な設定を返す', () => {
    const expires = Math.floor(Date.now() / 1000) + 3600
    const opts = getCookieOptions(expires)
    expect(opts.secure).toBe(true)
    expect(opts.httpOnly).toBe(true)
    expect(opts.sameSite).toBe('Lax')
    expect(opts.expires.getTime()).toBe(expires * 1000)
  })
})

describe('utils/totp', () => {
  it('生成したTOTPコードを検証できる', () => {
    const secret = generateSecret()
    const token = generateTotp(secret)
    expect(verifyToken(token, secret)).toBe(true)
  })

  it('不正なコードは拒否される', () => {
    const secret = generateSecret()
    expect(verifyToken('000000', secret) && verifyToken('999999', secret)).toBe(false)
  })

  it('別のシークレットで生成したコードは拒否される', () => {
    const token = generateTotp(generateSecret())
    expect(verifyToken(token, generateSecret())).toBe(false)
  })

  it('壊れたシークレットでも例外を投げず false を返す', () => {
    expect(verifyToken('123456', '')).toBe(false)
  })
})
