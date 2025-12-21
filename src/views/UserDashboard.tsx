import { html } from 'hono/html'
import { dict } from '../i18n'
import { App } from '../types'
import { Layout } from './components/Layout'
import { Card } from './components/Card'
import { Button } from './components/Button'

interface Props {
  t: typeof dict.en
  userEmail: string
  apps: App[]
}

export const UserDashboard = (props: Props) => {
  const t = props.t

  return Layout({
    title: t.title_user_dashboard,
    lang: t.lang,
    width: 800, // Wider layout for dashboard
    children: html`
        <style>
          .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.3); }
          .brand { font-size: 1.5rem; font-weight: 800; color: var(--primary); text-decoration: none; }
          .user-nav { display: flex; align-items: center; gap: 1rem; }
          .user-email { font-size: 0.9rem; color: var(--text-sub); display: none; } /* Hide email on small screens if needed, or show */
          @media(min-width: 600px) { .user-email { display: inline; } }

          .app-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }
          
          /* App Card specialized style */
          .app-card-link { text-decoration: none; color: inherit; display: block; height: 100%; transition: transform 0.2s; }
          .app-card-link:hover { transform: translateY(-4px); }
          .app-card-content { background: rgba(255,255,255,0.6); backdrop-filter: blur(10px); padding: 1.5rem; border-radius: 16px; border: 1px solid rgba(255,255,255,0.5); height: 100%; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
          .app-name { font-size: 1.2rem; font-weight: 700; margin-bottom: 0.5rem; color: var(--text-main); }
          .app-url { font-size: 0.85rem; color: var(--text-sub); word-break: break-all; margin-bottom: 1.5rem; }
          
          .no-apps { text-align: center; padding: 3rem; background: rgba(255,255,255,0.4); border-radius: 16px; color: var(--text-sub); }
          
          .logout-btn { padding: 0.5rem 1rem; background: rgba(255,255,255,0.5); border: 1px solid rgba(0,0,0,0.1); border-radius: 8px; font-size: 0.85rem; cursor: pointer; color: var(--text-main); text-decoration: none; transition: background 0.2s; }
          .logout-btn:hover { background: rgba(255,255,255,0.8); }
        </style>

        <header class="header">
            <div class="brand">Tobira</div>
            <div class="user-nav">
                <span class="user-email">${props.userEmail}</span>
                <a href="/logout" class="logout-btn">${t.logout}</a>
            </div>
        </header>

        <section>
            <h4 style="margin-bottom: 1.5rem; font-size: 1.1rem; color: var(--text-main); font-weight: 600;">${t.dashboard_apps_header}</h4>
            ${props.apps.length === 0 ? html`
                <div class="no-apps"><p>${t.no_apps_assigned}</p></div>
            ` : html`
                <div class="app-grid">
                    ${props.apps.map(app => html`
                        <a href="/login?redirect_to=${app.base_url}" class="app-card-link">
                            <div class="app-card-content">
                                <div>
                                    <div class="app-name">${app.name}</div>
                                    <div class="app-url">${app.base_url}</div>
                                </div>
                                <div style="text-align: right;">
                                    <span style="font-size: 0.9rem; font-weight: 600; color: var(--primary);">Login &rarr;</span>
                                </div>
                            </div>
                        </a>
                    `)}
                </div>
            `}
        </section>
        
        <div style="margin-top: 3rem; text-align: right;">
            <a href="/change-password" style="font-size: 0.9rem;">🔑 ${t.btn_change_password}</a>
        </div>
    `
  })
}
