import { html } from 'hono/html'
import { dict } from '../i18n'
import { Layout } from './components/Layout'
import { Card } from './components/Card'
import { Input } from './components/Input'
import { Button } from './components/Button'

interface Props {
  t: typeof dict.en
  redirectTo?: string
  error?: string
}

export const Login2FA = (props: Props) => {
  const t = props.t

  return Layout({
    title: t.title_2fa_verify,
    lang: t.lang,
    children: Card({
      children: html`
        <div style="text-align: center; margin-bottom: 2rem;">
            <h1 style="font-size: 1.5rem; font-weight: 800; color: var(--text-main); margin-bottom: 0.5rem;">${t.header_2fa_verify}</h1>
        </div>

        ${props.error ? html`<div class="error-message">${props.error}</div>` : ''}

        <p style="text-align: center; color: var(--text-sub); margin-bottom: 1.5rem;">
            ${t.desc_2fa_verify}
        </p>

        <form method="POST" action="/login/2fa">
            ${props.redirectTo ? html`<input type="hidden" name="redirect_to" value="${props.redirectTo}" />` : ''}
            ${Input({ type: "text", name: "token", placeholder: "000000", required: true, icon: html`<span class="material-symbols-outlined">lock</span>`, value: "" })}
            ${Button({ type: "submit", children: t.btn_verify })}
        </form>

        <div style="text-align:center; margin-top:1.5rem;">
            <a href="/login" style="font-size:0.9rem;">${t.back_to_login}</a>
        </div>
      `
    })
  })
}
