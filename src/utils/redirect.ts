/**
 * redirect_to が登録アプリの base_url に属するか検証する。
 *
 * 単純な startsWith 比較だと base_url が "https://app.example" のとき
 * "https://app.example.evil.com" のような別ドメインにもマッチしてしまうため、
 * URLとしてパースした上で以下を要求する:
 *   - オリジン(スキーム+ホスト+ポート)の完全一致
 *   - パスが base_url のパスと一致、またはその配下("/app" に対し "/app2" は不可)
 */
export function matchesAppBaseUrl(redirectTo: string, baseUrl: string): boolean {
  let target: URL
  let base: URL
  try {
    target = new URL(redirectTo)
    base = new URL(baseUrl)
  } catch {
    return false
  }

  if (target.origin !== base.origin) return false

  const basePath = base.pathname.endsWith('/') ? base.pathname : base.pathname + '/'
  return target.pathname === base.pathname || target.pathname.startsWith(basePath)
}

/** redirect_to にマッチする登録アプリを返す */
export function findAppByRedirect<T extends { base_url: string }>(
  apps: T[],
  redirectTo: string
): T | undefined {
  return apps.find((a) => matchesAppBaseUrl(redirectTo, a.base_url))
}
