import { html } from 'hono/html'
import { dict } from '../i18n'
import { App } from '../types'

interface Props {
  t: typeof dict.en
  userEmail: string
  apps: App[]
}

export const UserDashboard = (props: Props) => {
  const t = props.t
  
  return html`
    <!DOCTYPE html>
    <html lang="${t.lang}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${t.title_user_dashboard} - Tobira</title>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@1/css/pico.min.css">
      <style>
        :root { --primary: #0288d1; }
        body > main { padding-top: 1.5rem; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 3rem; padding-bottom: 1rem; border-bottom: 1px solid #eee; }
        .brand { font-size: 1.25rem; font-weight: bold; color: #333; text-decoration: none; }
        .user-nav { display: flex; align-items: center; gap: 1.5rem; }
        .user-email { font-size: 0.9rem; color: #666; }
        .logout-btn { padding: 0.3rem 0.8rem; font-size: 0.85rem; width: auto; margin-bottom: 0; }
        
        .section-title { margin-bottom: 1.5rem; font-size: 1.1rem; color: #444; font-weight: 600; }
        .app-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1.5rem; }
        .app-card { border: 1px solid #eee; border-radius: 6px; padding: 1.5rem; background: #fff; box-shadow: 0 2px 5px rgba(0,0,0,0.03); transition: transform 0.2s, box-shadow 0.2s; display: flex; flex-direction: column; justify-content: space-between; height: 100%; text-decoration: none; color: inherit; }
        .app-card:hover { transform: translateY(-3px); box-shadow: 0 5px 15px rgba(0,0,0,0.08); border-color: var(--primary); }
        .app-content { margin-bottom: 1.5rem; }
        .app-name { font-size: 1.1rem; font-weight: bold; margin-bottom: 0.3rem; color: #333; }
        .app-url { font-size: 0.8rem; color: #888; word-break: break-all; }
        .launch-btn { width: 100%; margin-bottom: 0; font-size: 0.9rem; }
        .no-apps { text-align: center; padding: 4rem 1rem; color: #777; background: #f9f9f9; border-radius: 8px; }
        
        .account-links { margin-top: 3rem; text-align: right; font-size: 0.9rem; }
        .account-links a { color: #666; text-decoration: none; }
        .account-links a:hover { text-decoration: underline; color: var(--primary); }
      </style>
    </head>
    <body>
      <main class="container">
        <header class="header">
            <div class="brand">Tobira</div>
            <div class="user-nav">
                <span class="user-email">${props.userEmail}</span>
                <a href="/logout" role="button" class="outline secondary logout-btn">${t.logout}</a>
            </div>
        </header>

        <section>
            <h4 class="section-title">${t.dashboard_apps_header}</h4>
            ${props.apps.length === 0 ? html`
                <div class="no-apps"><p>${t.no_apps_assigned}</p></div>
            ` : html`
                <div class="app-grid">
                    ${props.apps.map(app => html`
                        <a href="/login?redirect_to=${app.base_url}" class="app-card">
                            <div class="app-content">
                                <div class="app-name">${app.name}</div>
                                <div class="app-url">${app.base_url}</div>
                            </div>
                            <div><button class="launch-btn">${t.btn_open_app}</button></div>
                        </a>
                    `)}
                </div>
            `}
        </section>
        
        <div class="account-links">
            <a href="/change-password">🔑 ${t.btn_change_password}</a>
        </div>
      </main>
    </body>
    </html>
  `
}
