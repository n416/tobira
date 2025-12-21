import { html, raw } from 'hono/html'
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
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
        <hgroup style="margin-bottom: 0;">
          <h2 style="margin-bottom: 0;">${t.section_apps}</h2>
        </hgroup>
        <button onclick="document.getElementById('new-app-modal').showModal()" style="width: auto; margin-bottom: 0; display: inline-flex; align-items: center; gap: 0.5rem;">
            <span class="material-symbols-outlined">add</span> ${t.btn_add_app}
        </button>
      </div>

      <dialog id="new-app-modal">
        <article>
          <header>
            <div class="modal-title">${t.header_new_app}</div>
            <a href="#close" aria-label="Close" class="close" onclick="this.closest('dialog').close()" role="button">
                <span class="material-symbols-outlined">close</span>
            </a>
          </header>
          <form method="POST" action="/admin/apps">
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
            <button type="submit">${t.btn_add_app}</button>
          </form>
        </article>
      </dialog>

      <div class="app-list">
        ${props.apps.map((app, index) => {
          // Zebra striping: Odd=White(0.95), Even=Translucent(0.6)
          // Index 0 (1st item) is Odd visually
          const bgStyle = index % 2 === 0 
              ? 'background: rgba(255,255,255,0.95);' 
              : 'background: rgba(255,255,255,0.6);';
          
          return html`
          <div style="${bgStyle} padding: 1.5rem; border-radius: 12px; margin-bottom: 1rem; border: 1px solid rgba(0,0,0,0.05); display: flex; flex-direction: column; gap: 1rem;">
            
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                    <h4 style="margin-bottom: 0.2rem; font-weight: 700;">${app.name}</h4>
                    <div style="font-size: 0.9rem; color: var(--text-sub); display: flex; gap: 1rem; align-items: center;">
                        <span style="background: rgba(0,0,0,0.05); padding: 0.2rem 0.5rem; border-radius: 6px; font-family: monospace;">${app.id}</span>
                        <a href="${app.base_url}" target="_blank" style="text-decoration: none; display: inline-flex; align-items: center; gap: 0.2rem;">
                            ${app.base_url} <span class="material-symbols-outlined" style="font-size: 16px;">open_in_new</span>
                        </a>
                    </div>
                </div>
                
                <div>
                    ${app.status === 'inactive'
                        ? html`<span style="color:orange; display: inline-flex; align-items: center; gap: 0.3rem; font-weight: 600; font-size: 0.9rem;"><span class="material-symbols-outlined">pause_circle</span> ${t.status_inactive}</span>`
                        : html`<span style="color:green; display: inline-flex; align-items: center; gap: 0.3rem; font-weight: 600; font-size: 0.9rem;"><span class="material-symbols-outlined">check_circle</span> ${t.status_active}</span>`}
                </div>
            </div>

            <div style="display: flex; gap: 0.5rem; justify-content: flex-end; border-top: 1px solid rgba(0,0,0,0.05); padding-top: 1rem;">
                <button class="outline secondary" onclick="document.getElementById('edit-app-${app.id}').showModal()" style="padding: 0.4rem 0.8rem; font-size: 0.9rem; width: auto; display: inline-flex; align-items: center; gap: 0.3rem;">
                    <span class="material-symbols-outlined" style="font-size: 18px;">edit</span> ${t.edit}
                </button>

                <form method="POST" action="/admin/apps/toggle" style="margin:0;" onsubmit="return confirm('${(t.confirm_change_status || 'Change status?').replace('{name}', app.name)}')">
                    <input type="hidden" name="id" value="${app.id}" />
                    <input type="hidden" name="status" value="${app.status === 'inactive' ? 'active' : 'inactive'}" />
                    <button class="outline" style="padding: 0.4rem 0.8rem; font-size: 0.9rem; width: auto; display: inline-flex; align-items: center; gap: 0.3rem;">
                        <span class="material-symbols-outlined" style="font-size: 18px;">${app.status === 'inactive' ? 'play_arrow' : 'pause'}</span>
                        ${app.status === 'inactive' ? t.btn_resume : t.btn_pause}
                    </button>
                </form>
                
                <form method="POST" action="/admin/apps/delete" style="margin:0;" onsubmit="return confirm('${t.confirm_delete_app}')">
                    <input type="hidden" name="id" value="${app.id}" />
                    <button class="outline secondary" style="padding: 0.4rem 0.8rem; font-size: 0.9rem; width: auto; border-color: #d32f2f; color: #d32f2f; display: inline-flex; align-items: center; gap: 0.3rem;">
                        <span class="material-symbols-outlined" style="font-size: 18px;">delete</span> ${t.delete}
                    </button>
                </form>
            </div>

            <dialog id="edit-app-${app.id}">
                <article>
                  <header>
                    <div class="modal-title">${t.header_edit_app}</div>
                    <a href="#close" aria-label="Close" class="close" onclick="document.getElementById('edit-app-${app.id}').close()" role="button">
                        <span class="material-symbols-outlined">close</span>
                    </a>
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

          </div>
        `})}
      </div>
    `
  })
}
