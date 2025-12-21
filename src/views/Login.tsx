import { html } from 'hono/html'
import { dict } from '../i18n'

interface Props {
  t: typeof dict.en
  redirectTo?: string
  error?: string
  message?: string
}

export const Login = (props: Props) => {
  const t = props.t
  return html`
    <!DOCTYPE html>
    <html lang="${t.lang}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${t.title_login} - Tobira</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;800&family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet">
      <style>
        :root {
            --primary: #4f46e5;
            --primary-hover: #4338ca;
            --text-main: #0f172a;
            --text-sub: #64748b;
            --bg-gradient-start: #e0e7ff;
            --bg-gradient-end: #a5b4fc;
            --glass-bg: rgba(255, 255, 255, 0.75);
            --glass-border: rgba(255, 255, 255, 0.6);
            --glass-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Inter', 'Noto Sans JP', sans-serif;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #f0f4ff 0%, #c7d2fe 50%, #e0e7ff 100%);
            background-size: 200% 200%;
            animation: gradient-animation 15s ease infinite;
            color: var(--text-main);
            padding: 1rem;
        }

        @keyframes gradient-animation {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }

        .container {
            width: 100%;
            max-width: 550px;
            perspective: 1000px;
        }

        .card {
            background: var(--glass-bg);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid var(--glass-border);
            border-radius: 24px;
            padding: 3rem 2.5rem;
            box-shadow: var(--glass-shadow);
            transform-style: preserve-3d;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            position: relative;
            overflow: hidden;
        }

        .card::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(
                90deg,
                transparent,
                rgba(255, 255, 255, 0.4),
                transparent
            );
            transition: 0.5s;
            pointer-events: none;
        }

        .card:hover::before {
            left: 100%;
        }

        .logo-area {
            text-align: center;
            margin-bottom: 2rem;
        }

        .logo-text {
            font-size: 2.5rem;
            font-weight: 800;
            background: linear-gradient(135deg, #4f46e5 0%, #2563eb 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            letter-spacing: -0.05em;
            display: inline-block;
        }

        .subtitle {
            display: block;
            font-size: 0.875rem;
            color: var(--text-sub);
            margin-top: 0.25rem;
            font-weight: 500;
            letter-spacing: 0.02em;
        }

        .input-group {
            margin-bottom: 1.5rem;
            position: relative;
        }

        .input-group input {
            width: 100%;
            padding: 1rem 1rem 1rem 3rem;
            border: 2px solid transparent;
            background: rgba(255, 255, 255, 0.6);
            border-radius: 12px;
            font-size: 1rem;
            color: var(--text-main);
            transition: all 0.3s ease;
            outline: none;
            font-family: inherit;
        }

        .input-group input:focus {
            background: #fff;
            border-color: var(--primary);
            box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
        }

        .input-icon {
            position: absolute;
            left: 1rem;
            top: 50%;
            transform: translateY(-50%);
            color: var(--text-sub);
            transition: color 0.3s ease;
            pointer-events: none;
        }

        .input-group input:focus + .input-icon {
            color: var(--primary);
        }

        .submit-btn {
            width: 100%;
            padding: 1rem;
            background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);
            position: relative;
            overflow: hidden;
            font-family: inherit;
        }

        .submit-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.3);
        }

        .submit-btn:active {
            transform: translateY(0);
        }

        .links {
            margin-top: 2rem;
            text-align: center;
            font-size: 0.875rem;
        }

        .links a {
            color: var(--text-sub);
            text-decoration: none;
            transition: color 0.2s;
            font-weight: 500;
        }

        .links a:hover {
            color: var(--primary);
        }

        /* SVG Icons */
        svg {
            width: 20px;
            height: 20px;
        }

        /* Util for Messages */
        .error-message {
            background-color: #fef2f2;
            color: #b91c1c;
            padding: 0.75rem;
            border-radius: 12px;
            font-size: 0.85rem;
            text-align: center;
            margin-bottom: 1.5rem;
            border: 1px solid #fecaca;
        }
        .success-message {
            background-color: #f0fdf4;
            color: #15803d;
            padding: 0.75rem;
            border-radius: 12px;
            font-size: 0.85rem;
            text-align: center;
            margin-bottom: 1.5rem;
            border: 1px solid #bbf7d0;
            font-weight: 500;
        }

        /* Mobile Responsiveness */
        @media (max-width: 480px) {
            body {
                padding: 1rem;
                align-items: center;
            }

            .card {
                padding: 2rem 1.5rem;
                border-radius: 20px;
            }

            .logo-text {
                font-size: 2rem;
            }

            .input-group input {
                padding: 0.875rem 0.875rem 0.875rem 2.75rem;
            }
            
            .input-icon {
                left: 0.875rem;
            }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="card">
            <div class="logo-area">
                <h1 class="logo-text">Tobira</h1>
                <span class="subtitle">Secure Identity Provider</span>
            </div>
            
            ${props.error ? html`<div class="error-message">${props.error}</div>` : ''}
            ${props.message ? html`<div class="success-message">${props.message}</div>` : ''}
            
            <form method="POST" action="/login">
                ${props.redirectTo ? html`<input type="hidden" name="redirect_to" value="${props.redirectTo}" />` : ''}

                <div class="input-group">
                    <input type="email" name="email" placeholder="${t.email}" required>
                    <div class="input-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                </div>

                <div class="input-group">
                    <input type="password" name="password" placeholder="${t.password}" required>
                    <div class="input-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zM12 9a4 4 0 110-8 4 4 0 010 8z" />
                        </svg>
                    </div>
                </div>

                <button type="submit" class="submit-btn" id="loginBtn">
                    ${t.btn_login}
                </button>
            </form>

            <div class="links">
                <p style="margin-bottom: 0.5rem;"><a href="/forgot-password">${t.forgot_password}</a></p>
            </div>
        </div>
      </div>
    </body>
    </html>
  `
}
