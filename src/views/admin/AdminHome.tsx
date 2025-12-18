import { html } from 'hono/html'
import { Layout } from './Layout'
import { dict } from '../../i18n'

interface Props {
  t: typeof dict.en
  userEmail: string
  stats: { apps: number, users: number, logs: number }
}

export const AdminHome = (props: Props) => {
  const t = props.t
  return Layout({
    t: t,
    userEmail: props.userEmail,
    activeTab: 'home',
    children: html`
      <hgroup>
        <h2>${t.title_dashboard}</h2>
        <h3>${t.welcome}</h3>
      </hgroup>

      <div class="grid">
        <article>
            <header><strong>${t.stat_apps}</strong></header>
            <div style="font-size: 2.5rem; text-align: center; color: #0288d1;">
                ${props.stats.apps}
            </div>
            <footer style="text-align:center">
                <a href="/admin/apps" role="button" class="outline">${t.nav_apps}</a>
            </footer>
        </article>
        
        <article>
            <header><strong>${t.stat_users}</strong></header>
            <div style="font-size: 2.5rem; text-align: center; color: #43a047;">
                ${props.stats.users}
            </div>
            <footer style="text-align:center">
                <a href="/admin/users" role="button" class="outline">${t.nav_users}</a>
            </footer>
        </article>
        
        <article>
            <header><strong>${t.stat_logs}</strong></header>
            <div style="font-size: 2.5rem; text-align: center; color: #fb8c00;">
                ${props.stats.logs}
            </div>
            <footer style="text-align:center">
                <a href="/admin/logs" role="button" class="outline">${t.nav_logs}</a>
            </footer>
        </article>
      </div>
    `
  })
}
