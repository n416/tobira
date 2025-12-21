import { html } from 'hono/html'

export const Card = (props: { children: any }) => {
  return html`
    <style>
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

        @media (max-width: 480px) {
            .card {
                padding: 2rem 1.5rem;
                border-radius: 20px;
            }
        }
    </style>
    <div class="card">
        ${props.children}
    </div>
  `
}
