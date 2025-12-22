import { html } from 'hono/html'
import { css } from 'hono/css'
import { dict } from '../i18n'
import { App } from '../types'
import { Layout } from './components/Layout'
import { Card } from './components/Card'
import { Button } from './components/Button'

interface Props {
  t: typeof dict.en
  userEmail: string
  apps: App[]
  siteName: string
  has2FA: boolean
}

export const UserDashboard = (props: Props) => {
  const t = props.t

  const headerClass = css`
    display: flex; 
    justify-content: space-between; 
    align-items: center; 
    margin-bottom: 2rem; 
    padding-bottom: 1rem; 
    border-bottom: 1px solid rgba(255,255,255,0.3);
  `

  const brandClass = css`
    font-size: 1.5rem; 
    font-weight: 800; 
    color: var(--primary); 
    text-decoration: none;
  `

  const userNavClass = css`
    display: flex; 
    align-items: center; 
    gap: 1rem;
  `

  const userEmailClass = css`
    font-size: 0.9rem; 
    color: var(--text-sub); 
    display: none;
    @media(min-width: 600px) { display: inline; }
  `

  const appGridClass = css`
    display: grid; 
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); 
    gap: 1.5rem;
  `

  const appCardLinkClass = css`
    text-decoration: none; 
    color: inherit; 
    display: block; 
    height: 100%; 
    transition: transform 0.2s;
    &:hover { transform: translateY(-4px); }
  `

  const appCardContentClass = css`
    background: rgba(255,255,255,0.6); 
    backdrop-filter: blur(10px); 
    padding: 1.5rem; 
    border-radius: 16px; 
    border: 1px solid rgba(255,255,255,0.5); 
    height: 100%; 
    display: flex; 
    flex-direction: column; 
    justify-content: space-between; 
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
  `

  const appNameClass = css`
    font-size: 1.2rem; 
    font-weight: 700; 
    margin-bottom: 0.5rem; 
    color: var(--text-main);
  `

  const appUrlClass = css`
    font-size: 0.85rem; 
    color: var(--text-sub); 
    word-break: break-all; 
    margin-bottom: 1.5rem;
  `

  const noAppsClass = css`
    text-align: center; 
    padding: 3rem; 
    background: rgba(255,255,255,0.4); 
    border-radius: 16px; 
    color: var(--text-sub);
  `

  const logoutBtnClass = css`
    padding: 0.5rem 1rem; 
    background: rgba(255,255,255,0.5); 
    border: 1px solid rgba(0,0,0,0.1); 
    border-radius: 8px; 
    font-size: 0.85rem; 
    cursor: pointer; 
    color: var(--text-main); 
    text-decoration: none; 
    transition: background 0.2s;
    &:hover { background: rgba(255,255,255,0.8); }
  `

  return Layout({
    title: t.title_user_dashboard,
    siteName: props.siteName,
    lang: t.lang,
    width: 800, 
    children: html`
        <header class="${headerClass}">
            <div class="${brandClass}">${props.siteName}</div>
            <div class="${userNavClass}">
                <span class="${userEmailClass}">${props.userEmail}</span>
                <a href="/logout" class="${logoutBtnClass}">${t.logout}</a>
            </div>
        </header>

        <section>
            <h4 style="margin-bottom: 1.5rem; font-size: 1.1rem; color: var(--text-main); font-weight: 600;">${t.dashboard_apps_header}</h4>
            ${props.apps.length === 0 ? html`
                <div class="${noAppsClass}"><p>${t.no_apps_assigned}</p></div>
            ` : html`
                <div class="${appGridClass}">
                    ${props.apps.map(app => html`
                        <a href="/login?redirect_to=${app.base_url}" class="${appCardLinkClass}">
                            <div class="${appCardContentClass}">
                                <div>
                                    <div class="${appNameClass}">${app.name}</div>
                                    <div class="${appUrlClass}">${app.base_url}</div>
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
        
        
        <div style="margin-top: 2rem; padding-top: 2rem; border-top: 1px solid rgba(255,255,255,0.3); display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span class="material-symbols-outlined" style="color: var(--text-sub);">security</span>
                <span style="font-weight: 600; color: var(--text-main);">${t.label_2fa_status}:</span>
                ${props.has2FA 
                    ? html`<span style="color: #16a34a; background: #dcfce7; padding: 2px 8px; border-radius: 99px; font-size: 0.85rem; font-weight: 600;">${t.status_enabled}</span>` 
                    : html`<span style="color: #64748b; background: #f1f5f9; padding: 2px 8px; border-radius: 99px; font-size: 0.85rem; font-weight: 600;">${t.status_disabled}</span>`
                }
            </div>
            <div>
                ${props.has2FA
                    ? html`
                        <form method="POST" action="/user/2fa/disable" style="margin:0; display:inline;" onsubmit="return confirm('${t.confirm_disable_2fa}')">
                            <button type="submit" style="background: none; border: 1px solid #cbd5e1; color: #64748b; padding: 0.4rem 0.8rem; border-radius: 8px; font-size: 0.85rem; cursor: pointer;">${t.btn_disable_2fa}</button>
                        </form>`
                    : html`<a href="/user/2fa/setup" style="background: var(--primary); color: white; padding: 0.4rem 0.8rem; border-radius: 8px; text-decoration: none; font-size: 0.85rem; font-weight: 600;">${t.btn_setup_2fa}</a>`
                }
            </div>
        </div>
        
<div style="margin-top: 3rem; text-align: right;">
            <a href="/change-password" style="font-size: 0.9rem;">🔑 ${t.btn_change_password}</a>
        </div>
    `
  })
}
