import { Layout } from '../Layout'
import { dict } from '../../i18n'

interface Props {
  t: typeof dict.en
  userEmail: string
  activeTab: 'home' | 'apps' | 'groups' | 'users' | 'logs'
  children: any
}

export const AdminLayout = (props: Props) => {
  const t = props.t
  return (
    <Layout title={t.title_dashboard} lang={t.lang}>
      <nav>
        <ul>
          <li><strong>{t.tobira_admin}</strong></li>
        </ul>
        <ul>
          <li>{props.userEmail}</li>
          <li><a href="/logout" role="button" class="secondary outline">{t.logout}</a></li>
        </ul>
      </nav>

      <nav>
        <ul>
          <li><a href="/admin" role="button" class={props.activeTab === 'home' ? '' : 'outline'}>{t.nav_home}</a></li>
          <li><a href="/admin/apps" role="button" class={props.activeTab === 'apps' ? '' : 'outline'}>{t.nav_apps}</a></li>
          <li><a href="/admin/groups" role="button" class={props.activeTab === 'groups' ? '' : 'outline'}>{t.nav_groups}</a></li>
          <li><a href="/admin/users" role="button" class={props.activeTab === 'users' ? '' : 'outline'}>{t.nav_users}</a></li>
          <li><a href="/admin/logs" role="button" class={props.activeTab === 'logs' ? '' : 'outline'}>{t.nav_logs}</a></li>
        </ul>
      </nav>
      
      <main style={{ marginTop: '1rem' }}>
        {props.children}
      </main>
    </Layout>
  )
}
