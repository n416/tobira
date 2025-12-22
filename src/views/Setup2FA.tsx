import { html } from 'hono/html'
import { dict } from '../i18n'
import { Layout } from './components/Layout'
import { Card } from './components/Card'
import { Input } from './components/Input'
import { Button } from './components/Button'

interface Props {
  t: typeof dict.en
  qrCodeDataUrl: string
  secret: string
  error?: string
}

export const Setup2FA = (props: Props) => {
  const t = props.t

  return Layout({
    title: t.title_setup_2fa,
    lang: t.lang,
    children: Card({
      children: html`
        <div style="text-align: center; margin-bottom: 2rem;">
            <h1 style="font-size: 1.5rem; font-weight: 800; color: var(--text-main); margin-bottom: 0.5rem;">${t.header_setup_2fa}</h1>
        </div>

        ${props.error ? html`<div class="error-message">${props.error}</div>` : ''}

        <div style="text-align: center; margin-bottom: 2rem;">
            <p style="margin-bottom: 1rem; color: var(--text-sub); font-size: 0.9rem;">${t.desc_setup_2fa}</p>
            <div style="background: white; padding: 1rem; display: inline-block; border-radius: 8px; border: 1px solid #e2e8f0;">
                <img src="${props.qrCodeDataUrl}" alt="QR Code" style="display: block; width: 200px; height: 200px;" />
            </div>
            <div style="margin-top: 1rem; font-family: monospace; background: #f1f5f9; padding: 0.5rem; border-radius: 4px; font-size: 0.9rem; word-break: break-all;">
                ${props.secret}
            </div>
            <p style="font-size: 0.8rem; color: var(--text-sub); margin-top: 0.5rem;">${t.label_secret_key}</p>
        </div>

        <form method="POST" action="/user/2fa/setup">
            <input type="hidden" name="secret" value="${props.secret}" />
            ${Input({ type: "text", name: "token", placeholder: "000000", required: true, icon: html`<span class="material-symbols-outlined">lock</span>` })}
            ${Button({ type: "submit", children: t.btn_setup_2fa })}
        </form>

        <div style="text-align:center; margin-top:1.5rem;">
            <a href="/" style="font-size:0.9rem;">${t.cancel}</a>
        </div>
      `
    })
  })
}
