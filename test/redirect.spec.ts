import { describe, it, expect } from 'vitest'
import { matchesAppBaseUrl, findAppByRedirect } from '../src/utils/redirect'

describe('matchesAppBaseUrl', () => {
  const base = 'https://app.example.com'

  it('base_url 配下のURLを許可する', () => {
    expect(matchesAppBaseUrl('https://app.example.com', base)).toBe(true)
    expect(matchesAppBaseUrl('https://app.example.com/', base)).toBe(true)
    expect(matchesAppBaseUrl('https://app.example.com/callback', base)).toBe(true)
    expect(matchesAppBaseUrl('https://app.example.com/cb?state=x', base)).toBe(true)
  })

  it('登録ドメインを接頭辞に持つ別ドメインを拒否する(startsWith脆弱性の回帰テスト)', () => {
    expect(matchesAppBaseUrl('https://app.example.com.evil.com/cb', base)).toBe(false)
    expect(matchesAppBaseUrl('https://app.example.company/cb', base)).toBe(false)
  })

  it('別オリジンを拒否する', () => {
    expect(matchesAppBaseUrl('https://evil.com/cb', base)).toBe(false)
    expect(matchesAppBaseUrl('http://app.example.com/cb', base)).toBe(false) // スキーム違い
    expect(matchesAppBaseUrl('https://app.example.com:8443/cb', base)).toBe(false) // ポート違い
  })

  it('base_url にパスがある場合、パス境界を守る', () => {
    const withPath = 'https://host.example.com/app'
    expect(matchesAppBaseUrl('https://host.example.com/app', withPath)).toBe(true)
    expect(matchesAppBaseUrl('https://host.example.com/app/cb', withPath)).toBe(true)
    expect(matchesAppBaseUrl('https://host.example.com/app2', withPath)).toBe(false)
    expect(matchesAppBaseUrl('https://host.example.com/', withPath)).toBe(false)
  })

  it('URLとして不正な入力を拒否する', () => {
    expect(matchesAppBaseUrl('not-a-url', base)).toBe(false)
    expect(matchesAppBaseUrl('//app.example.com/cb', base)).toBe(false)
    expect(matchesAppBaseUrl('javascript:alert(1)', base)).toBe(false)
    expect(matchesAppBaseUrl('https://app.example.com/cb', 'broken base')).toBe(false)
  })
})

describe('findAppByRedirect', () => {
  it('マッチするアプリを返し、なければ undefined', () => {
    const apps = [
      { id: 'a', base_url: 'https://a.example.com' },
      { id: 'b', base_url: 'https://b.example.com' },
    ]
    expect(findAppByRedirect(apps, 'https://b.example.com/cb')?.id).toBe('b')
    expect(findAppByRedirect(apps, 'https://c.example.com/cb')).toBeUndefined()
  })
})
