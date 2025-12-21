import { html, raw } from 'hono/html'
import { dict } from '../i18n'
import { Layout } from './components/Layout'
import { Card } from './components/Card'
import { Input } from './components/Input'
import { Button } from './components/Button'

interface Props {
  t: typeof dict.en
  message?: string
}

export const ForgotPassword = (props: Props) => {
  const t = props.t

  // Prepare localized text with HTML
  const description = t.lang === 'ja'
    ? '登録したメールアドレスを入力してください。<br>リセットリンクを送信します。'
    : 'Enter your email address to receive a reset link.';

  const emailIcon = html`
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
`

  return Layout({
    title: t.title_forgot,
    lang: t.lang,
    children: Card({
      children: html`
          <div style="text-align: center; margin-bottom: 2rem;">
            <h1 style="font-size: 1.8rem; font-weight: 800; color: var(--text-main); margin-bottom: 0.5rem;">${t.title_forgot}</h1>
          </div>
          
          ${props.message ? html`<div class="success-message">${props.message}</div>` : ''}
          
          <p style="font-size:0.9rem; color:var(--text-sub); margin-bottom:1.5rem; text-align:center;">
             ${raw(description)}
          </p>

          <form method="POST" action="/forgot-password" style="margin-bottom:0">
            ${Input({ type: "email", name: "email", placeholder: t.email, required: true, icon: emailIcon })}
            ${Button({ type: "submit", children: t.btn_send_link })}
          </form>
          
          <div style="text-align:center; margin-top:2rem;">
            <a href="/login" style="text-decoration:none; font-size:0.9rem;">← ${t.back_to_login}</a>
          </div>
      `
    })
  })
}
