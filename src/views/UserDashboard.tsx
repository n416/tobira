import { html } from 'hono/html'
import { css } from 'hono/css'
import { dict } from '../i18n'
import { App } from '../types'
import { Layout } from './components/Layout'
import { Card } from './components/Card'
import { Button } from './components/Button'
import { Modal } from './components/Modal'

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
                                    <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:0.75rem;">
                                        ${app.icon_url ? html`<img src="${app.icon_url}" style="width:40px; height:40px; border-radius:8px; object-fit:contain; background:white; padding:2px; box-shadow:0 1px 2px rgba(0,0,0,0.05);">` : ''}
                                        <div class="${appNameClass}" style="margin-bottom:0;">${app.name}</div>
                                    </div>
                                    ${app.description ? html`<div style="font-size:0.9rem; color:var(--text-sub); margin-bottom:1rem; line-height:1.4;">${app.description}</div>` : ''}
                                    <div class="${appUrlClass}" style="margin-bottom:0; opacity:0.7;">${app.base_url}</div>
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
                        <form id="disable-2fa-form" method="POST" action="/user/2fa/disable" style="margin:0; display:inline;">
                            <button type="button" onclick="document.getElementById('disable-2fa-modal').showModal()" style="background: none; border: 1px solid #cbd5e1; color: #64748b; padding: 0.4rem 0.8rem; border-radius: 8px; font-size: 0.85rem; cursor: pointer;">${t.btn_disable_2fa}</button>
                        </form>`
                    : html`<a href="/user/2fa/setup" style="background: var(--primary); color: white; padding: 0.4rem 0.8rem; border-radius: 8px; text-decoration: none; font-size: 0.85rem; font-weight: 600;">${t.btn_setup_2fa}</a>`
                }
            </div>
        </div>

        <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid rgba(255,255,255,0.3); display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--text-sub);"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
                <span style="font-weight: 600; color: var(--text-main);">パスキー (生体認証):</span>
            </div>
            <div>
                <button type="button" id="registerPasskeyBtn" style="background: var(--primary); color: white; border: none; padding: 0.4rem 0.8rem; border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer;">
                    端末を登録する
                </button>
            </div>
        </div>
        <div id="passkeyRegMsg" style="text-align: right; font-size: 0.85rem; margin-top: 0.5rem; display: none;"></div>
        
        <div style="margin-top: 3rem; text-align: right;">
            <a href="/change-password" style="font-size: 0.9rem;">🔑 ${t.btn_change_password}</a>
        </div>
        
        ${Modal({
            id: "disable-2fa-modal",
            title: html`<span style="color:#d97706; display:flex; align-items:center; gap:0.5rem;"><span class="material-symbols-outlined">warning</span> ${t.btn_disable_2fa || 'Disable 2FA'}</span>`,
            closeAction: "this.closest('dialog').close()",
            children: html`
                  <div style="margin-bottom: 2rem;">
                    <p style="color:#475569; font-size:1rem; line-height:1.5;">${t.confirm_disable_2fa}</p>
                  </div>
                  <div style="display: flex; justify-content: flex-end; gap: 1rem;">
                      <button type="button" onclick="this.closest('dialog').close()" style="background: transparent; color: #64748b; border: 1px solid #cbd5e1; border-radius: 8px; padding: 0.5rem 1rem; font-weight: 600; cursor: pointer;">Cancel</button>
                      <button type="button" onclick="document.getElementById('disable-2fa-form').submit()" style="background: #d97706; color: white; border: none; border-radius: 8px; padding: 0.5rem 1rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.5rem;">
                         <span class="material-symbols-outlined" style="font-size:18px;">check</span> Execute
                      </button>
                  </div>
            `
        })}

        <script src="https://unpkg.com/@simplewebauthn/browser/dist/bundle/index.umd.min.js"></script>
        <script>
            document.addEventListener('DOMContentLoaded', () => {
                const regBtn = document.getElementById('registerPasskeyBtn');
                const msgDiv = document.getElementById('passkeyRegMsg');
                
                if (regBtn) {
                    regBtn.addEventListener('click', async () => {
                        try {
                            regBtn.disabled = true;
                            msgDiv.style.display = 'none';
                            regBtn.innerText = '登録中...';
                            
                            const optRes = await fetch('/api/webauthn/register/options');
                            if (!optRes.ok) throw new Error('登録の準備に失敗しました');
                            const options = await optRes.json();
                            
                            const { startRegistration } = SimpleWebAuthnBrowser;
                            const attResp = await startRegistration({ optionsJSON: options });
                            
                            const verifyRes = await fetch('/api/webauthn/register/verify', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(attResp)
                            });
                            
                            const verification = await verifyRes.json();
                            if (verification.verified) {
                                msgDiv.innerText = 'パスキーの登録が完了しました！次回のログインから利用できます。';
                                msgDiv.style.color = '#15803d';
                                msgDiv.style.display = 'block';
                            } else {
                                throw new Error(verification.error || '登録に失敗しました');
                            }
                        } catch (err) {
                            console.error(err);
                            let errorMsg = '登録がキャンセルされたか、エラーが発生しました。';
                            if (err.name === 'NotAllowedError' || err.message.includes('not allowed')) {
                                errorMsg = '生体認証がキャンセルされました。';
                            }
                            msgDiv.innerText = errorMsg;
                            msgDiv.style.color = '#b91c1c';
                            msgDiv.style.display = 'block';
                        } finally {
                            regBtn.innerText = '端末を登録する';
                            regBtn.disabled = false;
                        }
                    });
                }
            });
        </script>
    `
  })
}
