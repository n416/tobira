import { html } from 'hono/html'
import { dict } from '../i18n'
import { Layout } from './components/Layout'
import { Card } from './components/Card'
import { Input } from './components/Input'
import { Button } from './components/Button'

interface Props {
  t: typeof dict.en
  token?: string
  email?: string
  error?: string
}

export const Invite = (props: Props) => {
  const t = props.t

  const passwordIcon = html`
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zM12 9a4 4 0 110-8 4 4 0 010 8z" />
    </svg>
  `

  return Layout({
    title: t.title_invite,
    lang: t.lang,
    children: Card({
      children: html`
        <div style="text-align: center; margin-bottom: 2rem;">
            <h1 style="font-size: 1.8rem; font-weight: 800; color: var(--text-main); margin-bottom: 0.5rem;">${t.title_invite}</h1>
        </div>
          
        ${props.error ? html`<div class="error-message">${props.error}</div>` : ''}
          
        ${props.token ? html`
            <p style="text-align:center; margin-bottom:1.5rem; color: var(--text-sub);">
                ${t.setup_desc} <strong style="color: var(--text-main);">${props.email}</strong>
            </p>
            <form method="POST" action="/invite" style="margin-bottom:0">
              <input type="hidden" name="token" value="${props.token}" />
              ${Input({ type: "password", name: "password", placeholder: t.label_new_password, required: true, icon: passwordIcon })}
              ${Button({ type: "submit", children: t.btn_create_account })}
            </form>
        ` : html`
             <div style="text-align:center; padding:2rem 0; color: var(--text-sub);">
                <p>Invalid or expired invitation link.</p>
                <div style="margin-top: 1.5rem;">
                    <a href="/login" class="nav-item">Back to Login</a>
                </div>
             </div>
        `}
        `
    })
  })
}
