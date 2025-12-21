import { html } from 'hono/html'
import { JSX } from 'hono/jsx/jsx-runtime'
import { Style } from 'hono/css'

interface Props {
  title: string
  lang: string
  children: JSX.Element
}

export const Layout = (props: Props) => {
  return (
    <html lang={props.lang}>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{props.title} - Tobira</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css" />
        <style>{`
          body { padding-top: 2rem; }
          .error { color: #d32f2f; background: #ffcdd2; padding: 0.5rem; border-radius: 4px; margin-bottom: 1rem; }
        `}</style>
        ${Style()}
      </head>
      <body>
        <main class="container">
          {props.children}
        </main>
      </body>
    </html>
  )
}
