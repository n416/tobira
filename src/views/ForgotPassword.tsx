import { html, raw } from 'hono/html'
import { dict } from '../i18n'

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

  return html`
    <!DOCTYPE html>
    <html lang="${t.lang}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${t.title_forgot}</title>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@1/css/pico.min.css">
      <style>
        body { display: flex; justify-content: center; align-items: center; min-height: 100vh; background-color: #f0f2f5; }
        .container { max-width: 480px; width: 100%; padding: 1rem; }
        .message { color: #2e7d32; background: #e8f5e9; padding: 1rem; border-radius: 4px; margin-bottom: 1.5rem; text-align: center; }
      </style>
    </head>
    <body>
      <main class="container">
        <article>
          <header>
            <hgroup style="margin-bottom:0">
              <h1 style="margin:0; font-size:1.5rem; text-align:center">${t.title_forgot}</h1>
            </hgroup>
          </header>
          
          ${props.message ? html`<div class="message">${props.message}</div>` : ''}
          
          <p style="font-size:0.9rem; color:#666; margin-bottom:1.5rem; text-align:center;">
             ${raw(description)}
          </p>

          <form method="POST" action="/forgot-password" style="margin-bottom:0">
            <label>
              ${t.email}
              <input type="email" name="email" required />
            </label>
            <button type="submit" class="secondary" style="margin-top:1rem">${t.btn_send_link}</button>
          </form>
          
          <div style="text-align:center; margin-top:2rem;">
            <a href="/login" style="text-decoration:none; font-size:0.9rem;">← ${t.back_to_login}</a>
          </div>
        </article>
      </main>
    </body>
    </html>
  `
}
