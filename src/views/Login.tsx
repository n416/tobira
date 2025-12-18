import { html } from 'hono/html'
import { dict } from '../i18n'

interface Props {
  t: typeof dict.en
  redirectTo?: string
  error?: string
}

export const Login = (props: Props) => {
  const t = props.t
  return html`
    <!DOCTYPE html>
    <html lang="${t.lang}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Login - tobira</title>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@1/css/pico.min.css">
      <style>
        body { display: flex; justify-content: center; align-items: center; min-height: 100vh; background-color: #f9f9f9; }
        .container { max-width: 380px; width: 100%; padding: 1rem; }
        .error { color: #c62828; background: #ffebee; padding: 0.75rem; border-radius: 4px; margin-bottom: 1.5rem; text-align: center; font-size: 0.8rem; }
        
        /* Minimal Logo Style: Small, lowercase, faint color */
        h1 { 
            text-align: center; 
            margin-bottom: 1.5rem; 
            font-size: 1.2rem; 
            font-weight: 400; 
            color: #bbb; /* Very light grey */
            letter-spacing: 0.05em;
        }
        
        .links { margin-top: 1.5rem; text-align: center; font-size: 0.8rem; }
        .links a { color: #999; text-decoration: none; }
        .links a:hover { text-decoration: underline; color: #666; }
        
        /* Muted button color */
        button[type="submit"] { background-color: #607d8b; border-color: #607d8b; font-weight: normal; font-size: 0.9rem; }
        button[type="submit"]:hover { background-color: #546e7a; border-color: #546e7a; }
        
        /* Subtler Card */
        article { padding: 2rem; border-radius: 6px; box-shadow: 0 2px 6px rgba(0,0,0,0.03); border: 1px solid #eee; background: white; }
        
        /* Smaller labels */
        label { font-size: 0.85rem; color: #666; }
        input { font-size: 0.9rem; border-color: #eee; }
      </style>
    </head>
    <body>
      <main class="container">
        <article>
            <h1>tobira</h1>
            
            ${props.error ? html`<div class="error">${props.error}</div>` : ''}
            
            <form method="POST" action="/login" style="margin-bottom:0">
              ${props.redirectTo ? html`<input type="hidden" name="redirect_to" value="${props.redirectTo}" />` : ''}
              
              <label>
                ${t.email}
                <input type="email" name="email" required />
              </label>
              
              <label>
                ${t.password}
                <input type="password" name="password" required />
              </label>
              
              <button type="submit" style="margin-top:1.2rem">${t.btn_login}</button>
            </form>

            <div class="links">
                <a href="/forgot-password">${t.forgot_password}</a>
            </div>
        </article>
      </main>
    </body>
    </html>
  `
}
