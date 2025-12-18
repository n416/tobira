import { html } from 'hono/html'
import { Layout } from './Layout'
import { dict } from '../../i18n'
import { App } from '../../types'

interface Props {
  t: typeof dict.en
  userEmail: string
  apps: App[]
}

export const AppsPage = (props: Props) => {
  const t = props.t
  return Layout({
    t: t,
    userEmail: props.userEmail,
    activeTab: 'apps',
    children: html`
      <h2>${t.section_apps}</h2>
      
      <article>
        <h3>${t.header_new_app}</h3>
        <form method="POST" action="/admin/apps" style="margin-bottom:0">
          <div class="grid">
            <label>
              ${t.label_app_id}
              <input type="text" name="id" placeholder="${t.placeholder_app_id}" required />
            </label>
            <label>
              ${t.label_app_name}
              <input type="text" name="name" placeholder="${t.placeholder_app_name}" required />
            </label>
            <label>
              ${t.label_base_url}
              <input type="url" name="base_url" placeholder="https://..." required />
            </label>
          </div>
          <button type="submit" style="width:auto; margin-top:1rem">${t.btn_add_app}</button>
        </form>
      </article>

      <hr />

      <figure>
        <table role="grid">
          <thead>
            <tr>
              <th scope="col">${t.label_app_name}</th>
              <th scope="col">${t.label_base_url}</th>
              <th scope="col">${t.status}</th>
              <th scope="col">${t.action}</th>
            </tr>
          </thead>
          <tbody>
            ${props.apps.map(app => html`
              <tr>
                <td>
                    <strong>${app.name}</strong><br>
                    <small style="color:gray">${app.id}</small>
                </td>
                <td><a href="${app.base_url}" target="_blank">${app.base_url}</a></td>
                <td>
                    ${app.status === 'inactive' 
                        ? html`<span style="color:orange">⏸ ${t.status_inactive}</span>` 
                        : html`<span style="color:green">▶ ${t.status_active}</span>`}
                </td>
                <td>
                  <div class="grid" style="grid-template-columns: repeat(3, auto); gap: 0.5rem;">
                    <form method="POST" action="/admin/apps/toggle" style="margin:0;">
                        <input type="hidden" name="id" value="${app.id}" />
                        <input type="hidden" name="status" value="${app.status === 'inactive' ? 'active' : 'inactive'}" />
                        <button class="outline" style="padding:0.3rem 0.6rem; font-size:0.8rem;">
                            ${app.status === 'inactive' ? t.btn_resume : t.btn_pause}
                        </button>
                    </form>
                    
                    <button class="outline" style="padding:0.3rem 0.6rem; font-size:0.8rem;" 
                        onclick="document.getElementById('edit-app-${app.id}').setAttribute('open',true)">${t.edit}</button>

                    <form method="POST" action="/admin/apps/delete" style="margin:0;" onsubmit="return confirm('${t.confirm_delete_app}')">
                        <input type="hidden" name="id" value="${app.id}" />
                        <button class="outline secondary" style="padding:0.3rem 0.6rem; font-size:0.8rem; border-color:#d32f2f; color:#d32f2f;">${t.delete}</button>
                    </form>
                  </div>
                  
                  <dialog id="edit-app-${app.id}">
                    <article>
                      <header>
                        <a href="#close" aria-label="Close" class="close" onclick="this.closest('dialog').removeAttribute('open')"></a>
                        ${t.header_edit_app}
                      </header>
                      <form method="POST" action="/admin/apps/update">
                        <input type="hidden" name="id" value="${app.id}" />
                        <label>
                            ${t.label_app_name}
                            <input type="text" name="name" value="${app.name}" required />
                        </label>
                        <label>
                            ${t.label_base_url}
                            <input type="url" name="base_url" value="${app.base_url}" required />
                        </label>
                        <button type="submit">${t.save}</button>
                      </form>
                    </article>
                  </dialog>
                </td>
              </tr>
            `)}
          </tbody>
        </table>
      </figure>
    `
  })
}
