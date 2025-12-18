import { html } from 'hono/html'
import { dict } from '../i18n'

interface Props {
  t: typeof dict.en
  token?: string
  email?: string
  error?: string
}

export const Invite = (props: Props) => {
  const t = props.t
  return html`
    <!DOCTYPE html>
    <html lang="${t.lang}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${t.title_invite}</title>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@1/css/pico.min.css">
      <style>
        body { display: flex; justify-content: center; align-items: center; min-height: 100vh; background-color: #f0f2f5; }
        .container { max-width: 480px; width: 100%; padding: 1rem; }
        .error { color: #d32f2f; background: #ffebee; padding: 0.8rem; border-radius: 4px; margin-bottom: 1.5rem; text-align: center; }
      </style>
    </head>
    <body>
      <main class="container">
        <article>
          <header>
            <h1 style="text-align:center; margin:0; font-size:1.5rem">${t.title_invite}</h1>
          </header>
          
          ${props.error ? html`<div class="error">${props.error}</div>` : ''}
          
          ${props.token ? html`
            <p style="text-align:center; margin-bottom:1.5rem">
                ${t.setup_desc} <strong>${props.email}</strong>
            </p>
            <form method="POST" action="/invite" style="margin-bottom:0">
              <input type="hidden" name="token" value="${props.token}" />
              <label>
                ${t.label_new_password}
                <input type="password" name="password" required minlength="8" />
              </label>
              <button type="submit" style="margin-top:1rem">${t.btn_create_account}</button>
            </form>
          ` : html`
             <div style="text-align:center; padding:2rem 0;">
                <p>Invalid or expired invitation link.</p>
                <a href="/login" role="button" class="secondary">Back to Login</a>
             </div>
          `}
        </article>
      </main>
    </body>
    </html>
  `
}
