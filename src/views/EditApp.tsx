import { Layout } from './Layout'
import { html } from 'hono/html'

export const EditApp = (props: { t: any, app: any }) => {
  return (
    <Layout title={props.t.edit}>
      <nav><ul><li><a href="/admin">${props.t.cancel}</a></li></ul></nav>
      <article>
        <header>${props.t.edit}: ${props.app.name}</header>
        <form method="POST">
          <label>App ID (Cannot change)<input value={props.app.id} disabled /></label>
          <label>Name<input name="name" value={props.app.name} required /></label>
          <label>Base URL<input name="base_url" value={props.app.base_url} required /></label>
          <div class="grid">
            <button type="submit">${props.t.save}</button>
            <a href="/admin" role="button" class="secondary">${props.t.cancel}</a>
          </div>
        </form>
      </article>
    </Layout>
  )
}