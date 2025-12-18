import { html } from 'hono/html'
import { dict } from '../i18n'

interface Props {
  t: typeof dict.en
  error?: string
  message?: string
}

export const ChangePassword = (props: Props) => {
  const t = props.t
  return html`
    <!DOCTYPE html>
    <html lang="${t.lang}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${t.title_change_password}</title>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@1/css/pico.min.css">
      <style>body { display: flex; justify-content: center; padding-top: 5vh; }</style>
    </head>
    <body>
      <main class="container" style="max-width: 500px;">
        <article>
          <header>
            <hgroup>
              <h1>${t.header_change_password}</h1>
            </hgroup>
          </header>
          
          ${props.error ? html`<div style="color:red; margin-bottom:1rem;">${props.error}</div>` : ''}
          ${props.message ? html`<div style="color:green; margin-bottom:1rem;">${props.message}</div>` : ''}
          
          <form method="POST" action="/change-password">
            <label>
              ${t.label_new_password}
              <input type="password" name="password" required />
            </label>
            <button type="submit">${t.save}</button>
          </form>
          <div style="text-align:center; margin-top:1rem;">
            <a href="/">${t.nav_home}</a>
          </div>
        </article>
      </main>
    </body>
    </html>
  `
}
