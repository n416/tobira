import { Layout } from './Layout'
import { dict } from '../i18n'
import { App, User } from '../types'

interface Log {
  id: number
  event_type: string
  details: string
  created_at: number
}

interface PermissionRow {
  id: number
  user_email: string
  app_name: string
  valid_from: number
  valid_to: number
}

interface Props {
  t: typeof dict.en
  userEmail: string
  apps: App[]
  users: User[]
  logs: Log[]
  permissions: PermissionRow[]
  inviteUrl?: string
  error?: string
}

export const AdminDashboard = (props: Props) => {
  const t = props.t
  
  const fmt = (ts: number) => new Date(ts * 1000).toLocaleString()

  return (
    <Layout title={t.title_dashboard} lang={t.lang}>
      <nav>
        <ul>
          <li><strong>Tobira Admin</strong></li>
        </ul>
        <ul>
          <li>{props.userEmail}</li>
          <li><a href="/logout" role="button" class="secondary outline">{t.logout}</a></li>
        </ul>
      </nav>

      {props.inviteUrl && (
        <article style={{ borderColor: '#2e7d32', backgroundColor: '#f1f8e9' }}>
          <header>✅ {t.invite_created}</header>
          <div class="grid">
            <input type="text" value={props.inviteUrl} readonly onClick="this.select()" />
            <button class="outline" onClick="navigator.clipboard.writeText(this.previousSibling.value)">Copy</button>
          </div>
          <small>{t.invite_copy_hint}</small>
        </article>
      )}
      
      {props.error && <div class="error">{props.error}</div>}

      {/* --- Section 1: Applications --- */}
      <section style={{ marginTop: '2rem' }}>
        <h3>📦 {t.section_apps}</h3>
        <article>
          <header><strong>{t.header_new_app}</strong></header>
          <form method="POST" action="/admin/apps" style={{ marginBottom: 0 }}>
            <div class="grid">
              <label>
                App ID
                <input type="text" name="id" placeholder={t.placeholder_app_id} required />
              </label>
              <label>
                App Name
                <input type="text" name="name" placeholder={t.placeholder_app_name} required />
              </label>
              <label>
                Base URL
                <input type="url" name="base_url" placeholder="https://..." required />
              </label>
              <div style={{ alignSelf: 'end' }}>
                 <button type="submit" class="contrast">{t.btn_add_app}</button>
              </div>
            </div>
          </form>
        </article>

        <details>
          <summary>Show App List ({props.apps.length})</summary>
          <table class="striped">
            <thead>
              <tr>
                <th>{t.th_name}</th>
                <th>{t.th_base_url}</th>
              </tr>
            </thead>
            <tbody>
              {props.apps.map(app => (
                <tr>
                  <td>{app.name} <small>({app.id})</small></td>
                  <td>{app.base_url}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </section>

      <hr />

      {/* --- Section 2: Users --- */}
      <section>
        <h3>👤 {t.section_users}</h3>
        <div class="grid">
          <article>
            <header><strong>{t.header_invite}</strong></header>
            <form method="POST" action="/admin/invite" style={{ marginBottom: 0 }}>
              <div class="grid">
                <input type="email" name="email" placeholder={t.placeholder_invite_email} required />
                <button type="submit" class="secondary">{t.btn_generate_invite}</button>
              </div>
            </form>
          </article>
          <article>
            <header><strong>{t.header_registered_users}</strong></header>
            <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
              <ul>
                {props.users.map(u => <li>{u.email}</li>)}
              </ul>
            </div>
          </article>
        </div>
      </section>

      <hr />

      {/* --- Section 3: Permissions (Full Width) --- */}
      <section>
        <h3>🔑 {t.section_permissions}</h3>
        
        <article>
          <header><strong>{t.header_grant_permission}</strong></header>
          <form method="POST" action="/admin/permissions" style={{ marginBottom: 0 }}>
            <div class="grid">
              <label>{t.label_user}
                <select name="user_id" required>
                  <option value="" disabled selected>Select User</option>
                  {props.users.map(u => <option value={u.id}>{u.email}</option>)}
                </select>
              </label>
              <label>{t.label_app}
                <select name="app_id" required>
                   <option value="" disabled selected>Select App</option>
                   {props.apps.map(a => <option value={a.id}>{a.name}</option>)}
                </select>
              </label>
              <label>{t.label_valid_from}
                <input type="datetime-local" name="valid_from" required />
              </label>
              <label>{t.label_valid_to}
                <input type="datetime-local" name="valid_to" required />
              </label>
            </div>
            <button type="submit">{t.btn_grant}</button>
          </form>
        </article>

        <h4>Active Permissions List</h4>
        <figure>
          <table class="striped">
            <thead>
              <tr>
                <th>User</th>
                <th>App</th>
                <th>Valid From</th>
                <th>Valid To</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {props.permissions.length === 0 && <tr><td colspan={5} style={{textAlign: 'center'}}>No permissions granted yet.</td></tr>}
              {props.permissions.map(p => (
                <tr>
                  <td>{p.user_email}</td>
                  <td>{p.app_name}</td>
                  <td>{fmt(p.valid_from)}</td>
                  <td>{fmt(p.valid_to)}</td>
                  <td>
                    <form method="POST" action="/admin/permissions/revoke" style={{margin:0}}>
                      <input type="hidden" name="id" value={p.id} />
                      <button type="submit" class="outline secondary" style={{padding: '0.2em 0.5em', fontSize: '0.8em'}}>Revoke</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </figure>
      </section>

      <hr />

      {/* --- Section 4: Logs --- */}
      <section>
        <h3>📜 {t.section_logs}</h3>
        <figure>
          <table style={{ fontSize: '0.85em' }}>
            <thead><tr><th>{t.th_time}</th><th>{t.th_event}</th><th>{t.th_details}</th></tr></thead>
            <tbody>
              {props.logs.map(log => (
                <tr>
                  <td>{fmt(log.created_at)}</td>
                  <td>{log.event_type}</td>
                  <td>{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </figure>
      </section>
    </Layout>
  )
}
