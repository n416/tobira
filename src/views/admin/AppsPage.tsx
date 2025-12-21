import { html, raw } from 'hono/html'
import { css, keyframes } from 'hono/css'
import { Layout } from './Layout'
import { dict } from '../../i18n'
import { App, SystemConfig } from '../../types'
import { Modal } from '../components/Modal'
import { Button } from '../components/Button'

interface Props {
  t: typeof dict.en
  userEmail: string
  apps: App[]
  siteName: string
  appConfig: SystemConfig
}

export const AppsPage = (props: Props) => {
  const t = props.t
  const scriptContent = raw(`
        (function() {
            var editModal = document.getElementById('edit-app-modal');
            window.openEditAppModal = function(id, name, baseUrl) {
                if(!editModal) return;
                var form = editModal.querySelector('form');
                form.querySelector('input[name="id"]').value = id;
                form.querySelector('input[name="name"]').value = name;
                form.querySelector('input[name="base_url"]').value = baseUrl;
                editModal.showModal();
                setTimeout(function() {
                    var closeBtn = document.getElementById('edit-close-btn');
                    if(closeBtn) closeBtn.focus();
                }, 50);
            };
            window.closeEditAppModal = function() {
                if(editModal) editModal.close();
            };
        })();
  `);

  const listGrid = css`display: flex; flex-direction: column; gap: 1rem;`
  
  const listCard = css`
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 1.2rem 1.5rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: all 0.2s ease;
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    cursor: pointer;
    &:hover {
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        border-color: var(--primary);
        transform: translateY(-1px);
    }
  `

  const itemTitle = css`font-weight: 600; font-size: 1rem; color: #1e293b; margin-bottom: 0.2rem;`
  const itemSub = css`font-size: 0.85rem; color: #64748b; display: flex; align-items: center; gap: 0.4rem;`
  
  const actionBtn = css`
    background: transparent !important; 
    border: none !important; 
    color: #94a3b8 !important; 
    cursor: pointer !important; 
    padding: 8px !important; 
    border-radius: 50% !important; 
    transition: all 0.2s !important;
    box-shadow: none !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    width: 36px !important;
    height: 36px !important;
    flex-shrink: 0 !important;
    &:hover { background: #f1f5f9 !important; color: var(--text-main) !important; }
  `
  const deleteBtn = css`${actionBtn} &:hover { background: #fef2f2 !important; color: #ef4444 !important; }`

  return Layout({
    t: t,
    userEmail: props.userEmail,
    activeTab: 'apps',
    siteName: props.siteName,
    appConfig: props.appConfig,
    children: html`
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
        <h2 style="margin-bottom: 0;">${t.section_apps}</h2>
        <button onclick="document.getElementById('new-app-modal').showModal()" style="width: auto; margin-bottom: 0; padding: 0.5rem 1rem; font-size: 0.9rem; display: inline-flex; align-items: center; gap: 0.5rem; background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%); color:white; border:none; border-radius:12px; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);">
            <span class="material-symbols-outlined" style="font-size: 18px;">add</span> ${t.btn_add_app}
        </button>
      </div>

      ${Modal({
        id: "new-app-modal",
        title: t.header_new_app,
        closeAction: "this.closest('dialog').close()",
        children: html`
              <form method="POST" action="/admin/apps">
                <div class="grid-vertical" style="display:flex; flex-direction:column; gap:1.5rem;">
                    <label style="width:100%;">
                      <span class="form-label">${t.label_app_id}</span>
                      <input type="text" name="id" placeholder="${t.placeholder_app_id}" required />
                    </label>
                    <label style="width:100%;">
                      <span class="form-label">${t.label_app_name}</span>
                      <input type="text" name="name" placeholder="${t.placeholder_app_name}" required />
                    </label>
                    <label style="width:100%;">
                      <span class="form-label">${t.label_base_url}</span>
                      <input type="url" name="base_url" placeholder="https://..." required />
                    </label>
                    <div style="margin-top:1rem;">
                        ${Button({ type: "submit", children: t.btn_add_app })}
                    </div>
                </div>
              </form>
        `
      })}

      <div class="${listGrid}">
        ${props.apps.map(app => html`
          <div class="${listCard}" onclick="openEditAppModal('${app.id}', '${app.name}', '${app.base_url}')">
            <div style="flex-grow:1;">
                <div style="display:flex; align-items:center; gap:0.5rem;">
                    <div class="${itemTitle}" style="margin-bottom:0;">${app.name}</div>
                    ${app.status === 'inactive'
                        ? html`<span style="color:#d97706; background:#fffbeb; border:1px solid #fcd34d; padding:2px 6px; border-radius:4px; font-size:0.75rem; font-weight:bold;">${t.status_inactive}</span>`
                        : html`<span style="color:#16a34a; background:#f0fdf4; border:1px solid #bbf7d0; padding:2px 6px; border-radius:4px; font-size:0.75rem; font-weight:bold;">${t.status_active}</span>`}
                </div>
                <div class="${itemSub}">
                    <span style="font-family:monospace; background:#f1f5f9; padding:2px 4px; border-radius:4px; margin-right:0.5rem;">${app.id}</span>
                    <a href="${app.base_url}" target="_blank" style="text-decoration:none; color:inherit; display:inline-flex; align-items:center; gap:0.2rem;" onclick="event.stopPropagation()">
                        ${app.base_url} <span class="material-symbols-outlined" style="font-size: 14px;">open_in_new</span>
                    </a>
                </div>
            </div>
            
            <div style="display: flex; gap: 0.5rem; align-items: center;">
                <form method="POST" action="/admin/apps/toggle" style="margin:0;" onsubmit="return confirm('${(t.confirm_change_status || 'Change status?').replace('{name}', app.name).replace(/\\n/g, '\\\\n')}')" onclick="event.stopPropagation()">
                    <input type="hidden" name="id" value="${app.id}" />
                    <input type="hidden" name="status" value="${app.status === 'inactive' ? 'active' : 'inactive'}" />
                    <button class="${actionBtn}" title="${app.status === 'inactive' ? t.btn_resume : t.btn_pause}">
                        <span class="material-symbols-outlined">${app.status === 'inactive' ? 'play_arrow' : 'pause'}</span>
                    </button>
                </form>
                
                <form method="POST" action="/admin/apps/delete" style="margin:0;" onsubmit="return confirm('${t.confirm_delete_app.replace(/\\n/g, '\\\\n')}')" onclick="event.stopPropagation()">
                    <input type="hidden" name="id" value="${app.id}" />
                    <button class="${deleteBtn}" title="${t.delete}">
                        <span class="material-symbols-outlined">delete</span>
                    </button>
                </form>
            </div>
          </div>
        `)}
      </div>

      ${Modal({
        id: "edit-app-modal",
        title: t.header_edit_app,
        closeAction: "closeEditAppModal()",
        closeBtnId: "edit-close-btn",
        children: html`
              <form method="POST" action="/admin/apps/update">
                <div class="grid-vertical" style="display:flex; flex-direction:column; gap:1.5rem;">
                    <input type="hidden" name="id" value="" />
                    <label style="width:100%;">
                        <span class="form-label">${t.label_app_name}</span>
                        <input type="text" name="name" required />
                    </label>
                    <label style="width:100%;">
                        <span class="form-label">${t.label_base_url}</span>
                        <input type="url" name="base_url" required />
                    </label>
                    <div style="margin-top:1rem;">
                        ${Button({ type: "submit", children: html`<span class="material-symbols-outlined" style="margin-right:4px;">save</span> ${t.save}` })}
                    </div>
                </div>
              </form>
        `
      })}

      <script>
      ${scriptContent}
      </script>
    `
  })
}
