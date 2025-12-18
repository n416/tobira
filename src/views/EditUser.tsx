import { Layout } from './Layout'
import { html } from 'hono/html'

export const EditUser = (props: { t: any, user: any }) => {
  return (
    <Layout title={props.t.edit}>
      <nav><ul><li><a href="/admin">${props.t.cancel}</a></li></ul></nav>
      <article>
        <header>${props.t.edit}: ${props.user.email}</header>
        <form method="POST">
          <label>${props.t.email}<input type="email" name="email" value={props.user.email} required /></label>
          <label>${props.t.password} (Leave blank to keep current)
            <input type="password" name="password" placeholder="New Password" />
          </label>
          <div class="grid">
            <button type="submit">${props.t.save}</button>
            <a href="/admin" role="button" class="secondary">${props.t.cancel}</a>
          </div>
        </form>
      </article>
    </Layout>
  )
}