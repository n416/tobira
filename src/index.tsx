import { sign, verify } from 'hono/jwt'
import { Hono } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { csrf } from 'hono/csrf'
import { html } from 'hono/html'
import { Env, User, App, Session, Permission, Group, AuthCode, SystemConfig, LocalizedText } from './types'
import { verifyPassword, hashPassword, generateToken, getCookieOptions } from './utils/auth'
import { generateSecret, generateQRCode, verifyToken } from './utils/totp'
import { sendEmail } from './utils/mail'
import { fetchAppIcon } from './utils/icon'
import { Login } from './views/Login'
import { UserDashboard } from './views/UserDashboard'
import { Invite } from './views/Invite'
import { ForgotPassword } from './views/ForgotPassword'
import { ResetPassword } from './views/ResetPassword'
import { ChangePassword } from './views/ChangePassword'
import { Setup2FA } from './views/Setup2FA'
import { Login2FA } from './views/Login2FA'

import { AdminHome } from './views/admin/AdminHome'
import { AppsPage } from './views/admin/AppsPage'
import { GroupsPage } from './views/admin/GroupsPage'
import { UsersPage } from './views/admin/UsersPage'
import { LogsPage } from './views/admin/LogsPage'

import { dict } from './i18n'

const app = new Hono<{ Bindings: Env }>()

app.use(csrf())

const getLang = (c: any) => {
    const accept = c.req.header('Accept-Language') || ''
    return accept.includes('ja') ? dict.ja : dict.en
}

async function getSystemConfig(db: D1Database): Promise<SystemConfig> {
    const config: SystemConfig = {
        appName: { ja: 'Tobira', en: 'Tobira' },
        appSubtitle: { ja: 'Secure Identity Provider', en: 'Secure Identity Provider' }
    };
    try {
        const { results } = await db.prepare('SELECT * FROM system_config').all<{ key: string, value: string }>();
        if (results) {
            results.forEach(r => {
                if (r.key === 'app_name_ja') config.appName.ja = r.value;
                if (r.key === 'app_name_en') config.appName.en = r.value;
                if (r.key === 'app_subtitle_ja') config.appSubtitle.ja = r.value;
                if (r.key === 'app_subtitle_en') config.appSubtitle.en = r.value;
            });
        }
    } catch (e) {
        console.error('Config fetch failed:', e);
    }
    return config;
}

function getLocalizedValue(c: any, text: LocalizedText): string {
    const accept = c.req.header('Accept-Language') || ''
    return accept.includes('ja') ? text.ja : text.en
}

// Helper for Icon Upload
async function handleIconUpload(body: any): Promise<string | null> {
    const file = body['icon_file'];
    if (file && file instanceof File && file.size > 0) {
        // D1 limit check (safe margin)
        if (file.size > 1024 * 150) {
            console.warn('Icon file too large:', file.size);
            return null; 
        }
        const buf = await file.arrayBuffer();
        let binary = '';
        const bytes = new Uint8Array(buf);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return `data:${file.type};base64,${btoa(binary)}`;
    }
    return null;
}

// ------------------------------------------------------------------
// Permissions Logic
// ------------------------------------------------------------------
async function checkPermission(c: any, userId: string, appId: string): Promise<{ allowed: boolean, reason?: string }> {
    const now = Math.floor(Date.now() / 1000)

    const app = await c.env.DB.prepare('SELECT status FROM apps WHERE id = ?').bind(appId).first<App>()
    if (app && app.status === 'inactive') {
        return { allowed: false, reason: 'App is paused' }
    }

    const userPerm = await c.env.DB.prepare('SELECT * FROM permissions WHERE user_id = ? AND app_id = ?')
        .bind(userId, appId).first<Permission>()

    if (userPerm) {
        if (userPerm.valid_from <= now && userPerm.valid_to >= now) return { allowed: true }
        else return { allowed: false, reason: 'User permission expired/invalid' }
    }

    const user = await c.env.DB.prepare('SELECT group_id FROM users WHERE id = ?').bind(userId).first<User>()
    if (user && user.group_id) {
        const groupPerm = await c.env.DB.prepare('SELECT * FROM group_permissions WHERE group_id = ? AND app_id = ?')
            .bind(user.group_id, appId).first<Permission>()
        if (groupPerm && groupPerm.valid_from <= now && groupPerm.valid_to >= now) return { allowed: true }
    }

    return { allowed: false, reason: 'No permission found' }
}

async function getAdmin(c: any) {
    const sessionId = getCookie(c, '__Host-idp_session')
    if (!sessionId) return null
    const session = await c.env.DB.prepare('SELECT user_id FROM sessions WHERE id = ?').bind(sessionId).first<Session>()
    if (!session) return null
    const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(session.user_id).first<User>()
    const admin = await c.env.DB.prepare('SELECT * FROM admins WHERE email = ?').bind(user?.email).first()
    return admin ? user : null
}

async function getUser(c: any) {
    const sessionId = getCookie(c, '__Host-idp_session')
    if (!sessionId) return null
    const session = await c.env.DB.prepare('SELECT user_id FROM sessions WHERE id = ? AND expires_at > ?').bind(sessionId, Math.floor(Date.now() / 1000)).first<Session>()
    if (!session) return null
    return await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(session.user_id).first<User>()
}

// ------------------------------------------------------------------
// Routes
// ------------------------------------------------------------------

app.get('/', async (c) => {
    try {
        const t = getLang(c)
        const user = await getUser(c)
        const config = await getSystemConfig(c.env.DB)
        const siteName = getLocalizedValue(c, config.appName)

        if (!user) return c.redirect('/login')

        const now = Math.floor(Date.now() / 1000)
        const { results: apps } = await c.env.DB.prepare(`
        SELECT DISTINCT a.* FROM apps a
        LEFT JOIN permissions up ON a.id = up.app_id AND up.user_id = ?
        LEFT JOIN group_permissions gp ON a.id = gp.app_id AND gp.group_id = ?
        WHERE 
          (a.status IS NULL OR a.status = 'active') AND
          ((up.valid_from <= ? AND up.valid_to >= ?) OR (up.id IS NULL AND gp.valid_from <= ? AND gp.valid_to >= ?))
      `).bind(user.id, user.group_id || null, now, now, now, now).all()

        return c.html(<UserDashboard t={t} userEmail={user.email} apps={apps as any} siteName={siteName} has2FA={!!user.two_factor_secret} />)
    } catch (e: any) {
        return c.json({ error: e.message, stack: e.stack }, 500)
    }
})

app.get('/login', async (c) => {
    const t = getLang(c)
    const config = await getSystemConfig(c.env.DB)
    const siteName = getLocalizedValue(c, config.appName)
    const siteSubtitle = getLocalizedValue(c, config.appSubtitle)
    const redirectTo = c.req.query('redirect_to')
    const msgKey = c.req.query('msg')
    // @ts-ignore
    const message = msgKey && t[msgKey] ? t[msgKey] : undefined

    const user = await getUser(c)
    if (user) {
        if (redirectTo) return issueCodeAndRedirect(c, user.id, redirectTo)
        const admin = await c.env.DB.prepare('SELECT * FROM admins WHERE email = ?').bind(user.email).first()
        return c.redirect(admin ? '/admin' : '/')
    }

    return c.html(<Login t={t} redirectTo={redirectTo} message={message} siteName={siteName} siteSubtitle={siteSubtitle} />)
})

app.post('/login', async (c) => {
    const t = getLang(c)
    const config = await getSystemConfig(c.env.DB)
    const siteName = getLocalizedValue(c, config.appName)
    const siteSubtitle = getLocalizedValue(c, config.appSubtitle)
    const body = await c.req.parseBody()
    const email = body['email'] as string
    const password = body['password'] as string
    const redirectTo = body['redirect_to'] as string

    const user = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first<User>()
    if (!user || !(await verifyPassword(password, user.password_hash))) {
        return c.html(<Login t={t} redirectTo={redirectTo} error={t.error_credentials} siteName={siteName} siteSubtitle={siteSubtitle} />)
    }

    // 2FA Check
    if (user.two_factor_secret) {
        const secret = c.env.JWT_SECRET || 'dev_secret'
        const token = await sign({ sub: user.id, role: 'pre_2fa', exp: Math.floor(Date.now() / 1000) + 300 }, secret)
        setCookie(c, 'pre_2fa_token', token, { path: '/', secure: true, httpOnly: true, maxAge: 300, sameSite: 'Lax' })

        let target = '/login/2fa'
        if (redirectTo) target += '?redirect_to=' + encodeURIComponent(redirectTo)
        return c.redirect(target)
    }

    const sessionId = generateToken()
    const expires = Math.floor(Date.now() / 1000) + 86400
    await c.env.DB.prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)').bind(sessionId, user.id, expires).run()
    setCookie(c, '__Host-idp_session', sessionId, getCookieOptions(expires))

    const details = JSON.stringify({ key: 'log_login', params: { email } });
    await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)').bind('LOGIN', details).run()

    if (redirectTo) return issueCodeAndRedirect(c, user.id, redirectTo)

    const admin = await c.env.DB.prepare('SELECT * FROM admins WHERE email = ?').bind(email).first()
    return c.redirect(admin ? '/admin' : '/')
})

async function issueCodeAndRedirect(c: any, userId: string, redirectTo: string) {
    const { results } = await c.env.DB.prepare('SELECT * FROM apps WHERE status = ?').bind('active').all<App>()
    const app = (results as App[]).find(a => redirectTo.startsWith(a.base_url))

    if (!app) {
        console.error(`[Auth] No app matches redirect_to: ${redirectTo}`);
        return c.text('Invalid App: Redirect URL not registered', 400)
    }

    const check = await checkPermission(c, userId, app.id)
    if (!check.allowed) return c.text('Access Denied: ' + (check.reason || ''), 403)

    const code = generateToken()
    const expires = Math.floor(Date.now() / 1000) + 300
    await c.env.DB.prepare('INSERT INTO auth_codes (code, user_id, app_id, expires_at) VALUES (?, ?, ?, ?)').bind(code, userId, app.id, expires).run()

    const separator = redirectTo.includes('?') ? '&' : '?'
    return c.redirect(`${redirectTo}${separator}code=${code}`)
}

app.get('/logout', async (c) => {
    const sessionId = getCookie(c, '__Host-idp_session')
    if (sessionId) {
        const session = await c.env.DB.prepare('SELECT user_id FROM sessions WHERE id = ?').bind(sessionId).first<Session>()
        if (session) {
            await c.env.DB.prepare('DELETE FROM app_sessions WHERE user_id = ?').bind(session.user_id).run()
        }
        try { await c.env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run() } catch (e) { }
    }
    setCookie(c, '__Host-idp_session', '', { path: '/', secure: true, httpOnly: true, expires: new Date(0) })
    return c.redirect('/login')
})

// ... (2FA, Password Reset routes omitted for brevity but should be here. Assuming they are standard) ...
// NOTE: For full restore, we include all standard routes.

app.get('/user/2fa/setup', async (c) => {
    const user = await getUser(c)
    if (!user) return c.redirect('/login')
    const t = getLang(c)
    const secret = generateSecret()
    const qrCode = await generateQRCode(secret, user.email, 'Tobira')
    return c.html(<Setup2FA t={t} qrCodeDataUrl={qrCode} secret={secret} />)
})
app.post('/user/2fa/setup', async (c) => {
    const user = await getUser(c)
    if (!user) return c.redirect('/login')
    const t = getLang(c)
    const body = await c.req.parseBody()
    const token = (body['token'] as string).replace(/\s+/g, '')
    const secret = body['secret'] as string 
    if (verifyToken(token, secret)) {
        await c.env.DB.prepare('UPDATE users SET two_factor_secret = ? WHERE id = ?').bind(secret, user.id).run()
        const details = JSON.stringify({ key: 'log_2fa_enable', params: { email: user.email } });
        await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)').bind('2FA_ENABLE', details).run()
        return c.redirect('/?msg=msg_2fa_enabled')
    } else {
        const qrCode = await generateQRCode(secret, user.email, 'Tobira')
        return c.html(<Setup2FA t={t} qrCodeDataUrl={qrCode} secret={secret} error={t.err_invalid_code} />)
    }
})
app.post('/user/2fa/disable', async (c) => {
    const user = await getUser(c)
    if (!user) return c.redirect('/login')
    await c.env.DB.prepare('UPDATE users SET two_factor_secret = NULL WHERE id = ?').bind(user.id).run()
    const details = JSON.stringify({ key: 'log_2fa_disable', params: { email: user.email } });
    await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)').bind('2FA_DISABLE', details).run()
    return c.redirect('/?msg=msg_2fa_disabled')
})
app.get('/change-password', async (c) => {
    const user = await getUser(c)
    if (!user) return c.redirect('/login')
    return c.html(<ChangePassword t={getLang(c)} />)
})
app.post('/change-password', async (c) => {
    const user = await getUser(c)
    if (!user) return c.redirect('/login')
    const body = await c.req.parseBody()
    const password = body['password'] as string
    const pwHash = await hashPassword(password)
    await c.env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(pwHash, user.id).run()
    const details = JSON.stringify({ key: 'log_password_change', params: { email: user.email } });
    await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)').bind('PASSWORD_CHANGE', details).run()
    return c.html(<ChangePassword t={getLang(c)} message={getLang(c).msg_password_changed} />)
})

// --- API Token ---
app.get('/api/me', async (c) => {
    const authHeader = c.req.header('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401)
    const token = authHeader.split(' ')[1]
    const session = await c.env.DB.prepare('SELECT * FROM app_sessions WHERE token = ? AND expires_at > ?').bind(token, Math.floor(Date.now() / 1000)).first()
    if (!session) return c.json({ error: 'Invalid Token' }, 401)
    const user = await c.env.DB.prepare('SELECT id, email, group_id, created_at FROM users WHERE id = ?').bind(session.user_id).first()
    if (!user) return c.json({ error: 'User not found' }, 404)
    return c.json(user)
})
app.post('/api/token', async (c) => {
    const body = await c.req.json().catch(() => { })
    const code = body['code']
    if (!code) return c.json({ error: 'Missing code' }, 400)
    const authCode = await c.env.DB.prepare('SELECT * FROM auth_codes WHERE code = ?').bind(code).first<AuthCode>()
    if (!authCode || authCode.expires_at < Date.now() / 1000 || authCode.used_at) return c.json({ error: 'Invalid code' }, 400)
    await c.env.DB.prepare('UPDATE auth_codes SET used_at = ? WHERE code = ?').bind(Date.now() / 1000, code).run()
    const token = generateToken()
    const refreshToken = generateToken()
    const expiresAt = Math.floor(Date.now() / 1000) + 3600
    await c.env.DB.prepare('INSERT INTO app_sessions (token, refresh_token, user_id, app_id, expires_at) VALUES (?, ?, ?, ?, ?)')
        .bind(token, refreshToken, authCode.user_id, authCode.app_id, expiresAt).run()
    return c.json({ access_token: token, refresh_token: refreshToken, expires_in: 3600 })
})
app.post('/api/refresh', async (c) => {
    const body = await c.req.json().catch(() => { })
    const refreshToken = body['refresh_token']
    if (!refreshToken) return c.json({ error: 'Missing refresh_token' }, 400)
    const session = await c.env.DB.prepare('SELECT * FROM app_sessions WHERE refresh_token = ?').bind(refreshToken).first<Session & { app_id: string }>()
    if (!session) return c.json({ error: 'Invalid refresh token' }, 400)
    const check = await checkPermission(c, session.user_id, session.app_id)
    if (!check.allowed) {
        await c.env.DB.prepare('DELETE FROM app_sessions WHERE refresh_token = ?').bind(refreshToken).run()
        return c.json({ error: 'Access Denied', details: check.reason }, 403)
    }
    const newToken = generateToken()
    const newRefreshToken = generateToken()
    const newExpiresAt = Math.floor(Date.now() / 1000) + 3600
    await c.env.DB.prepare('UPDATE app_sessions SET token=?, refresh_token=?, expires_at=? WHERE refresh_token=?')
        .bind(newToken, newRefreshToken, newExpiresAt, refreshToken).run()
    return c.json({ access_token: newToken, refresh_token: newRefreshToken, expires_in: 3600 })
})

// --- Admin ---
app.get('/admin', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const t = getLang(c)
    const config = await getSystemConfig(c.env.DB)
    const siteName = getLocalizedValue(c, config.appName)
    const stats = {
        apps: await c.env.DB.prepare('SELECT COUNT(*) as c FROM apps').first('c'),
        users: await c.env.DB.prepare('SELECT COUNT(*) as c FROM users').first('c'),
        logs: await c.env.DB.prepare('SELECT COUNT(*) as c FROM audit_logs').first('c'),
    }
    return c.html(<AdminHome t={t} userEmail={user.email} stats={stats as any} siteName={siteName} appConfig={config} />)
})
app.get('/admin/apps', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const config = await getSystemConfig(c.env.DB)
    const siteName = getLocalizedValue(c, config.appName)
    const { results } = await c.env.DB.prepare('SELECT * FROM apps ORDER BY created_at DESC').all()
    return c.html(<AppsPage t={getLang(c)} userEmail={user.email} apps={results as any} siteName={siteName} appConfig={config} />)
})

// === MODIFIED CREATE APP ===
app.post('/admin/apps', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const body = await c.req.parseBody()
    const now = Math.floor(Date.now() / 1000)
    
    // Icon Upload
    const iconData = await handleIconUpload(body)
    const iconUrl = iconData || (body['icon_url'] as string) || await fetchAppIcon(body['base_url'] as string)
    
    await c.env.DB.prepare('INSERT INTO apps (id, name, base_url, status, created_at, description, icon_url) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .bind(body['id'], body['name'], body['base_url'], 'active', now, body['description'], iconUrl).run()
    
    const details = JSON.stringify({ key: 'log_app_created', params: { appName: body['name'], id: body['id'], admin: user.email } });
    await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)').bind('APP_CREATED', details).run()
    return c.redirect('/admin/apps')
})

// === MODIFIED UPDATE APP ===
app.post('/admin/apps/update', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const body = await c.req.parseBody()
    const id = body['id']
    
    // Icon Upload Logic:
    // 1. Uploaded file? -> Use it.
    // 2. Hidden field (existing url) or Text input? -> Use it.
    // 3. Fallback -> Auto fetch or keep old? (Here we use form inputs primarily)
    const iconData = await handleIconUpload(body)
    const iconUrl = iconData || (body['icon_url'] as string) || await fetchAppIcon(body['base_url'] as string)

    await c.env.DB.prepare('UPDATE apps SET name = ?, base_url = ?, description = ?, icon_url = ? WHERE id = ?')
        .bind(body['name'], body['base_url'], body['description'], iconUrl, id).run()
        
    const details = JSON.stringify({ key: 'log_app_updated', params: { appName: body['name'], status: 'Updated', admin: user.email } });
    await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)').bind('APP_UPDATED', details).run()
    return c.redirect('/admin/apps')
})

app.post('/admin/apps/toggle', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const body = await c.req.parseBody()
    const id = body['id']
    const status = body['status']
    await c.env.DB.prepare('UPDATE apps SET status = ? WHERE id = ?').bind(status, id).run()
    const details = JSON.stringify({ key: 'log_app_updated', params: { appName: id, status: status, admin: user.email } });
    await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)').bind('APP_UPDATED', details).run()
    return c.redirect('/admin/apps')
})
app.post('/admin/apps/delete', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const body = await c.req.parseBody()
    const id = body['id']
    await c.env.DB.batch([
        c.env.DB.prepare('DELETE FROM permissions WHERE app_id = ?').bind(id),
        c.env.DB.prepare('DELETE FROM group_permissions WHERE app_id = ?').bind(id),
        c.env.DB.prepare('DELETE FROM auth_codes WHERE app_id = ?').bind(id),
        c.env.DB.prepare('DELETE FROM app_sessions WHERE app_id = ?').bind(id),
        c.env.DB.prepare('DELETE FROM apps WHERE id = ?').bind(id)
    ])
    const details = JSON.stringify({ key: 'log_app_deleted', params: { id: id, admin: user.email } });
    await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)').bind('APP_DELETED', details).run()
    return c.redirect('/admin/apps')
})

// Groups, Users, etc... are same as original but included for integrity
app.get('/admin/groups', async (c) => {
    try {
        const user = await getAdmin(c)
        if (!user) return c.redirect('/login')
        const config = await getSystemConfig(c.env.DB)
        const siteName = getLocalizedValue(c, config.appName)
        const groups = await c.env.DB.prepare('SELECT * FROM groups ORDER BY created_at DESC').all()
        const apps = await c.env.DB.prepare('SELECT * FROM apps').all()
        if (!groups.success) throw new Error('Groups DB Error: ' + groups.error)
        if (!apps.success) throw new Error('Apps DB Error: ' + apps.error)
        return c.html(<GroupsPage t={getLang(c)} userEmail={user.email} groups={groups.results as any} apps={apps.results as any} siteName={siteName} appConfig={config} />)
    } catch (e: any) {
        return c.text('Error: ' + e.message + '\n' + e.stack, 500)
    }
})
app.post('/admin/groups', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const body = await c.req.parseBody()
    const id = crypto.randomUUID()
    const now = Math.floor(Date.now() / 1000)
    await c.env.DB.prepare('INSERT INTO groups (id, name, created_at) VALUES (?, ?, ?)').bind(id, body['name'], now).run()
    return c.redirect('/admin/groups')
})
app.post('/admin/groups/delete', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const body = await c.req.parseBody()
    const id = body['id'] as string
    await c.env.DB.batch([
        c.env.DB.prepare('DELETE FROM group_permissions WHERE group_id = ?').bind(id),
        c.env.DB.prepare('UPDATE users SET group_id = NULL WHERE group_id = ?').bind(id),
        c.env.DB.prepare('DELETE FROM groups WHERE id = ?').bind(id)
    ])
    const details = JSON.stringify({ key: 'log_group_deleted', params: { id: id, admin: user.email } });
    await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)').bind('GROUP_DELETED', details).run()
    return c.redirect('/admin/groups')
})
app.get('/admin/users', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const config = await getSystemConfig(c.env.DB)
    const siteName = getLocalizedValue(c, config.appName)
    const users = await c.env.DB.prepare('SELECT * FROM users ORDER BY created_at DESC').all()
    const apps = await c.env.DB.prepare('SELECT * FROM apps').all()
    const groups = await c.env.DB.prepare('SELECT * FROM groups').all()
    return c.html(<UsersPage t={getLang(c)} userEmail={user.email} users={users.results as any} apps={apps.results as any} groups={groups.results as any} inviteUrl={c.req.query('invite_url')} error={c.req.query('error')} siteName={siteName} appConfig={config} />)
})
app.post('/admin/invite', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const body = await c.req.parseBody()
    const email = body['email'] as string
    if (!email) return c.redirect('/admin/users?error=Email required')
    const token = generateToken()
    const expiresAt = Math.floor(Date.now() / 1000) + 86400
    try { await c.env.DB.prepare('INSERT INTO invitations (id, email, invited_by, expires_at) VALUES (?, ?, ?, ?)').bind(token, email, user.id, expiresAt).run() }
    catch (e: any) { return c.redirect(`/admin/users?error=${encodeURIComponent('Error: ' + e.message)}`) }
    const url = new URL(c.req.url)
    return c.redirect(`/admin/users?invite_url=${encodeURIComponent(url.protocol + '//' + url.host + '/invite?token=' + token)}`)
})
app.post('/admin/users/delete', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const body = await c.req.parseBody()
    const id = body['id'] as string
    await c.env.DB.batch([
        c.env.DB.prepare('DELETE FROM permissions WHERE user_id = ?').bind(id),
        c.env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(id),
        c.env.DB.prepare('DELETE FROM app_sessions WHERE user_id = ?').bind(id),
        c.env.DB.prepare('DELETE FROM auth_codes WHERE user_id = ?').bind(id),
        c.env.DB.prepare('DELETE FROM password_resets WHERE user_id = ?').bind(id),
        c.env.DB.prepare('DELETE FROM invitations WHERE invited_by = ?').bind(id),
        c.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(id)
    ])
    const details = JSON.stringify({ key: 'log_user_deleted', params: { id: id, admin: user.email } });
    await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)').bind('USER_DELETED', details).run()
    return c.redirect('/admin/users')
})
app.post('/admin/users/bulk', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const text = await c.req.text()
    const params = new URLSearchParams(text)
    const ids = params.getAll('user_ids')
    const groupId = params.get('group_id')
    const appId = params.get('app_id')
    if (!ids || ids.length === 0) return c.redirect('/admin/users')
    let gName = null;
    if (groupId) {
        const val = groupId === '__CLEAR__' || groupId === '' ? null : groupId
        for (const uid of ids) {
            await c.env.DB.prepare('UPDATE users SET group_id = ? WHERE id = ?').bind(val, uid).run()
        }
        if (val) {
            const g = await c.env.DB.prepare('SELECT name FROM groups WHERE id = ?').bind(val).first<{ name: string }>();
            gName = g ? g.name : val;
        } else {
            gName = 'None';
        }
    }
    let aName = null;
    if (appId) {
        const start = Math.floor(Date.now() / 1000)
        const end = start + 31536000
        const now = Math.floor(Date.now() / 1000)
        for (const uid of ids) {
            await c.env.DB.prepare(`
                INSERT INTO permissions (user_id, app_id, valid_from, valid_to, created_at) VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(user_id, app_id) DO UPDATE SET valid_from=?, valid_to=?
            `).bind(uid, appId, start, end, now, start, end).run()
        }
        const a = await c.env.DB.prepare('SELECT name FROM apps WHERE id = ?').bind(appId).first<{ name: string }>();
        aName = a ? a.name : appId;
    }
    const details = JSON.stringify({
        key: 'log_bulk_update',
        params: { count: ids.length, admin: user.email, group: gName || '-', app: aName || '-' }
    });
    await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)').bind('USER_UPDATE', details).run()
    return c.redirect('/admin/users')
})
app.get('/admin/api/user-details/:id', async (c) => {
    if (!await getAdmin(c)) return c.json({ error: 'Unauthorized' }, 401)
    const userId = c.req.param('id')
    const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first<User>()
    if (!user) return c.json({ error: 'Not found' }, 404)
    const { results: direct } = await c.env.DB.prepare('SELECT p.*, a.name as app_name FROM permissions p JOIN apps a ON p.app_id = a.id WHERE p.user_id = ?').bind(userId).all()
    let groupPerms: any[] = []
    if (user.group_id) {
        const res = await c.env.DB.prepare('SELECT p.*, a.name as app_name FROM group_permissions p JOIN apps a ON p.app_id = a.id WHERE p.group_id = ?').bind(user.group_id).all()
        groupPerms = res.results
    }
    const allApps = await c.env.DB.prepare('SELECT id, name FROM apps').all<{ id: string, name: string }>()
    const combined = allApps.results.map(app => {
        const d = direct.find((x: any) => x.app_id === app.id)
        const g = groupPerms.find((x: any) => x.app_id === app.id)
        if (d) return { ...d, source: 'user', is_override: true }
        if (g) return { ...g, source: 'group', is_override: false }
        return null
    }).filter(x => x)
    return c.json({ email: user.email, permissions: combined, group_id: user.group_id })
})
app.post('/admin/api/user/group', async (c) => {
    try {
        const user = await getAdmin(c)
        if (!user) return c.json({ error: 'Unauthorized' }, 401)
        const body = await c.req.json()
        const userId = body['user_id']
        const groupId = body['group_id'] || null
        await c.env.DB.prepare('UPDATE users SET group_id = ? WHERE id = ?').bind(groupId || null, userId).run()
        let gName = 'None';
        if (groupId) {
            const g = await c.env.DB.prepare('SELECT name FROM groups WHERE id = ?').bind(groupId).first<{ name: string }>();
            if (g) gName = g.name;
        }
        const details = JSON.stringify({ key: 'log_user_group_update', params: { user: userId, group: gName, admin: user.email } });
        await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)').bind('USER_UPDATE', details).run()
        return c.json({ success: true })
    } catch (e: any) {
        return c.json({ error: e.message, stack: e.stack }, 500)
    }
})
app.post('/admin/api/user/permission/revoke', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const body = await c.req.json()
    const id = body['id']
    await c.env.DB.prepare('DELETE FROM permissions WHERE id = ?').bind(id).run()
    const details = JSON.stringify({ key: 'log_permission_revoke', params: { id: id, admin: user.email } });
    await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)').bind('PERMISSION_REVOKE', details).run()
    return c.json({ success: true })
})
app.post('/admin/api/user/permission/grant', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const body = await c.req.json()
    const userId = body['user_id']
    const appIds = body['app_ids']
    const appId = body['app_id']
    const validTo = body['valid_to']
    const validFrom = body['valid_from'] || Math.floor(Date.now() / 1000)
    const targets = Array.isArray(appIds) ? appIds : [appId]
    const appNames = [];
    const now = Math.floor(Date.now() / 1000)
    for (const aid of targets) {
        if (!aid) continue
        await c.env.DB.prepare(`
            INSERT INTO permissions (user_id, app_id, valid_from, valid_to, created_at) VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(user_id, app_id) DO UPDATE SET valid_from=?, valid_to=?
        `).bind(userId, aid, validFrom, validTo, now, validFrom, validTo).run()
        const a = await c.env.DB.prepare('SELECT name FROM apps WHERE id = ?').bind(aid).first<{ name: string }>();
        if (a) appNames.push(a.name);
    }
    const details = JSON.stringify({ key: 'log_permission_grant', params: { apps: appNames.join(', '), user: userId, admin: user.email } });
    await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)').bind('PERMISSION_GRANT', details).run()
    return c.json({ success: true })
})
app.get('/admin/api/group-details/:id', async (c) => {
    if (!await getAdmin(c)) return c.json({ error: 'Unauthorized' }, 401)
    const groupId = c.req.param('id')
    const { results } = await c.env.DB.prepare(`
        SELECT p.*, a.name as app_name 
        FROM group_permissions p 
        JOIN apps a ON p.app_id = a.id 
        WHERE p.group_id = ?
    `).bind(groupId).all()
    return c.json({ permissions: results })
})
app.post('/admin/api/group/permission/grant', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const body = await c.req.json()
    const groupId = body['group_id']
    const appIds = body['app_ids']
    const validTo = body['valid_to']
    const validFrom = body['valid_from'] || Math.floor(Date.now() / 1000)
    const targets = Array.isArray(appIds) ? appIds : []
    const appNames = [];
    const now = Math.floor(Date.now() / 1000)
    for (const aid of targets) {
        if (!aid) continue
        await c.env.DB.prepare(`
            INSERT INTO group_permissions (group_id, app_id, valid_from, valid_to, created_at) VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(group_id, app_id) DO UPDATE SET valid_from=?, valid_to=?
        `).bind(groupId, aid, validFrom, validTo, now, validFrom, validTo).run()
        const a = await c.env.DB.prepare('SELECT name FROM apps WHERE id = ?').bind(aid).first<{ name: string }>();
        if (a) appNames.push(a.name);
    }
    const g = await c.env.DB.prepare('SELECT name FROM groups WHERE id = ?').bind(groupId).first<{ name: string }>();
    const gName = g ? g.name : groupId;
    const details = JSON.stringify({ key: 'log_group_permission_grant', params: { apps: appNames.join(', '), group: gName, admin: user.email } });
    await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)').bind('GROUP_PERMISSION_GRANT', details).run()
    return c.json({ success: true })
})
app.post('/admin/api/group/permission/revoke', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const body = await c.req.json()
    const id = body['id']
    await c.env.DB.prepare('DELETE FROM group_permissions WHERE id = ?').bind(id).run()
    const details = JSON.stringify({ key: 'log_group_permission_revoke', params: { id: id, admin: user.email } });
    await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)').bind('GROUP_PERMISSION_REVOKE', details).run()
    return c.json({ success: true })
})
app.get('/admin/logs', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const config = await getSystemConfig(c.env.DB)
    const siteName = getLocalizedValue(c, config.appName)
    const page = parseInt(c.req.query('page') || '1');
    const filterEvent = c.req.query('event') || '';
    const pageSize = 50;
    const offset = (page - 1) * pageSize;
    let query = 'SELECT * FROM audit_logs';
    let countQuery = 'SELECT COUNT(*) as c FROM audit_logs';
    const params = [];
    if (filterEvent) {
        const where = ' WHERE event_type = ?';
        query += where;
        countQuery += where;
        params.push(filterEvent);
    }
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(pageSize, offset);
    const { results } = await c.env.DB.prepare(query).bind(...params).all();
    const countParams = filterEvent ? [filterEvent] : [];
    const totalRes = await c.env.DB.prepare(countQuery).bind(...countParams).first<{ c: number }>();
    const totalCount = totalRes?.c || 0;
    const totalPages = Math.ceil(totalCount / pageSize);
    return c.html(<LogsPage
        t={getLang(c)}
        userEmail={user.email}
        logs={results as any}
        currentPage={page}
        totalPages={totalPages}
        totalCount={totalCount}
        currentFilter={filterEvent}
        siteName={siteName}
        appConfig={config}
    />)
})

// Invite, ForgotPW, etc. routes unchanged
app.get('/invite', async (c) => {
    const t = getLang(c)
    const token = c.req.query('token')
    if (!token) return c.html(<Invite t={t} error={t.error_invalid_invite} />)
    const invite = await c.env.DB.prepare('SELECT * FROM invitations WHERE id = ? AND expires_at > ?')
        .bind(token, Math.floor(Date.now() / 1000)).first<{ email: string }>()
    if (!invite) return c.html(<Invite t={t} error={t.error_invalid_invite} />)
    return c.html(<Invite t={t} token={token} email={invite.email} />)
})
app.post('/invite', async (c) => {
    const t = getLang(c)
    const body = await c.req.parseBody()
    const token = (body['token'] as string).replace(/\s+/g, '')
    const password = body['password'] as string
    const invite = await c.env.DB.prepare('SELECT * FROM invitations WHERE id = ? AND expires_at > ?')
        .bind(token, Math.floor(Date.now() / 1000)).first<{ email: string }>()
    if (!invite) return c.html(<Invite t={t} error={t.error_invalid_invite} />)
    const userId = crypto.randomUUID()
    const pwHash = await hashPassword(password)
    const now = Math.floor(Date.now() / 1000)
    try {
        await c.env.DB.prepare('INSERT INTO users (id, email, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?)')
            .bind(userId, invite.email, pwHash, now, now).run()
        await c.env.DB.prepare('DELETE FROM invitations WHERE id = ?').bind(token).run()
        return c.redirect('/login?msg=msg_account_created')
    } catch (e) {
        return c.html(<Invite t={t} token={token} error={t.error_user_exists} />)
    }
})
app.get('/forgot-password', (c) => c.html(<ForgotPassword t={getLang(c)} />))
app.post('/forgot-password', async (c) => {
    const t = getLang(c)
    const body = await c.req.parseBody()
    const email = body['email'] as string
    const user = await c.env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first<User>()
    if (user) {
        const token = generateToken()
        const expires = Math.floor(Date.now() / 1000) + 3600
        await c.env.DB.prepare('INSERT INTO password_resets (token, user_id, expires_at) VALUES (?, ?, ?)').bind(token, user.id, expires).run()
        const resetLink = `${new URL(c.req.url).origin}/reset-password?token=${token}`;
        const htmlBody = `
      <div style="font-family: sans-serif; color: #333; line-height: 1.6;">
        <p><strong>Password Reset</strong></p>
        <p>You requested a password reset. Please click the link below to set a new password:</p>
        <p><a href="${resetLink}" style="color: #0288d1; word-break: break-all;">${resetLink}</a></p>
        <p>This link will expire in 1 hour.</p>
        <p><strong>パスワードリセット</strong></p>
        <p>パスワードリセットのリクエストを受け付けました。以下のリンクをクリックして、新しいパスワードを設定してください。</p>
        <p><a href="${resetLink}" style="color: #0288d1; word-break: break-all;">${resetLink}</a></p>
      </div>
    `;
        await sendEmail(c.env, email, 'Password Reset / パスワードリセット', htmlBody);
    }
    return c.html(<ForgotPassword t={t} message={t.link_sent} />)
})
app.get('/reset-password', async (c) => {
    const t = getLang(c)
    const token = c.req.query('token')
    if (!token) return c.redirect('/forgot-password')
    const reset = await c.env.DB.prepare('SELECT * FROM password_resets WHERE token = ? AND expires_at > ?').bind(token, Math.floor(Date.now() / 1000)).first()
    if (!reset) return c.html(<ResetPassword t={t} token="" error={t.error_invalid_invite} />)
    return c.html(<ResetPassword t={t} token={token} />)
})
app.post('/reset-password', async (c) => {
    const t = getLang(c)
    const body = await c.req.parseBody()
    const token = (body['token'] as string).replace(/\s+/g, '')
    const password = body['password'] as string
    const reset = await c.env.DB.prepare('SELECT * FROM password_resets WHERE token = ? AND expires_at > ?').bind(token, Math.floor(Date.now() / 1000)).first<{ user_id: string }>()
    if (!reset) return c.html(<ResetPassword t={t} token="" error={t.error_invalid_invite} />)
    const pwHash = await hashPassword(password)
    await c.env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(pwHash, reset.user_id).run()
    await c.env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(reset.user_id).run()
    try { await c.env.DB.prepare('DELETE FROM app_sessions WHERE user_id = ?').bind(reset.user_id).run() } catch (e) { }
    await c.env.DB.prepare('DELETE FROM password_resets WHERE token = ?').bind(token).run()
    return c.redirect('/login')
})
app.post('/admin/config', async (c) => {
    try {
        const user = await getAdmin(c)
        if (!user) return c.redirect('/login')
        const body = await c.req.parseBody()
        const app_name_ja = body['app_name_ja'] as string
        const app_name_en = body['app_name_en'] as string
        const app_subtitle_ja = body['app_subtitle_ja'] as string
        const app_subtitle_en = body['app_subtitle_en'] as string
        if (app_name_ja) await c.env.DB.prepare('INSERT INTO system_config (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=?').bind('app_name_ja', app_name_ja, app_name_ja).run()
        if (app_name_en) await c.env.DB.prepare('INSERT INTO system_config (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=?').bind('app_name_en', app_name_en, app_name_en).run()
        if (app_subtitle_ja) await c.env.DB.prepare('INSERT INTO system_config (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=?').bind('app_subtitle_ja', app_subtitle_ja, app_subtitle_ja).run()
        if (app_subtitle_en) await c.env.DB.prepare('INSERT INTO system_config (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=?').bind('app_subtitle_en', app_subtitle_en, app_subtitle_en).run()
        const details = JSON.stringify({ key: 'log_config_update', params: { admin: user.email } });
        await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)').bind('CONFIG_UPDATE', details).run()
        return c.redirect('/admin')
    } catch (e: any) {
        return c.text('Error updating config: ' + e.message, 500)
    }
})

// 2FA Verification Routes
app.get('/login/2fa', async (c) => {
    const t = getLang(c)
    const token = getCookie(c, 'pre_2fa_token')
    if (!token) return c.redirect('/login')
    try { await verify(token, c.env.JWT_SECRET || 'dev_secret') } catch (e) { return c.redirect('/login') }
    const redirectTo = c.req.query('redirect_to')
    return c.html(<Login2FA t={t} redirectTo={redirectTo} />)
})
app.post('/login/2fa', async (c) => {
    const t = getLang(c)
    const body = await c.req.parseBody()
    const otp = (body['token'] as string).replace(/\s+/g, '')
    const redirectTo = body['redirect_to'] as string
    const preToken = getCookie(c, 'pre_2fa_token')
    if (!preToken) return c.redirect('/login')
    let payload;
    try { payload = await verify(preToken, c.env.JWT_SECRET || 'dev_secret') } catch (e) { return c.redirect('/login') }
    const userId = payload.sub as string
    const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first<User>()
    if (!user || !user.two_factor_secret) return c.redirect('/login')
    if (verifyToken(otp, user.two_factor_secret)) {
        const sessionId = generateToken()
        const expires = Math.floor(Date.now() / 1000) + 86400
        await c.env.DB.prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)').bind(sessionId, user.id, expires).run()
        setCookie(c, '__Host-idp_session', sessionId, getCookieOptions(expires))
        deleteCookie(c, 'pre_2fa_token')
        const details = JSON.stringify({ key: 'log_login', params: { email: user.email, method: '2FA' } });
        await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)').bind('LOGIN', details).run()
        if (redirectTo) return issueCodeAndRedirect(c, user.id, redirectTo)
        const admin = await c.env.DB.prepare('SELECT * FROM admins WHERE email = ?').bind(user.email).first()
        return c.redirect(admin ? '/admin' : '/')
    } else {
        return c.html(<Login2FA t={t} redirectTo={redirectTo} error={t.err_invalid_code} />)
    }
})

export default app
