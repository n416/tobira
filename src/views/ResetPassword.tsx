import { Layout } from './Layout'
import { dict } from '../i18n'

interface Props {
  t: typeof dict.en
  token: string
  error?: string
}

export const ResetPassword = (props: Props) => {
  const t = props.t
  return (
    <Layout title={t.title_forgot} lang={t.lang}>
      <article>
        <header>
          <h1>{t.title_forgot}</h1>
        </header>

        {props.error && <div class="error">{props.error}</div>}

        <form method="POST" action="/reset-password">
          <input type="hidden" name="token" value={props.token} />
          <label>
            {t.label_new_password}
            <input type="password" name="password" required minlength={8} />
          </label>
          <button type="submit">{t.btn_reset_password}</button>
        </form>
      </article>
    </Layout>
  )
}
