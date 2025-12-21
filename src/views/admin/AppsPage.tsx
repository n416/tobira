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

  return Layout({
    t: t,
    userEmail: props.userEmail,
    activeTab: 'apps',
    children: html`
      <style>
        
        /* --- Base & Reset --- */
        .material-symbols-outlined { display: inline-flex; align-items: center; justify-content: center; vertical-align: middle; }
        
        /* --- Animation: Border Blink --- */
        @keyframes border-blink {
            0% { border-color: #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
            50% { border-color: var(--primary); box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.2); }
            100% { border-color: #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        }
        .blink-active {
            animation: border-blink 1s ease-in-out 3;
        }

        /* --- Card / List Layout --- */
        .list-grid { display: flex; flex-direction: column; gap: 1rem; }
        
        /* List Item Card */
        .list-card {
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
        }
        .list-card:hover {
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            border-color: var(--primary);
            transform: translateY(-1px);
        }
        
        /* Text Typography */
        .item-title { font-weight: 600; font-size: 1rem; color: #1e293b; margin-bottom: 0.2rem; }
        .item-sub { font-size: 0.85rem; color: #64748b; display: flex; align-items: center; gap: 0.4rem; }
        
        /* --- Permission Grant Card --- */
        #grant-form-card {
            background: #ffffff;
            padding: 2rem;
            border-radius: 16px;
            border: 1px solid #e2e8f0;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
            margin-bottom: 2rem;
            transition: border-color 0.3s ease, box-shadow 0.3s ease;
        }
        
        .form-label {
            display: block;
            font-weight: 700;
            font-size: 0.95rem;
            color: #1e293b;
            margin-bottom: 0.5rem;
        }
        
        /* Date Inputs */
        input[type="date"] {
            width: 100%;
            padding: 0.8rem 1rem;
            background: #ffffff;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            font-size: 1rem;
            color: #334155;
            transition: all 0.2s;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        input[type="date"]:focus {
            border-color: var(--primary);
            outline: none;
            box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }

        /* Quick Buttons */
        .quick-btn-group {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 0.75rem;
            margin-top: 0.75rem;
        }
        .quick-btn {
            background: #ffffff !important;
            border: 1px solid #e2e8f0 !important;
            color: #64748b !important;
            padding: 0.6rem 0.5rem !important;
            border-radius: 8px !important;
            font-size: 0.85rem !important;
            font-weight: 500 !important;
            cursor: pointer !important;
            transition: all 0.2s !important;
            text-align: center !important;
            width: 100% !important;
            box-shadow: none !important;
            line-height: 1 !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
        }
        .quick-btn:hover {
            border-color: var(--primary) !important;
            color: var(--primary) !important;
            background: #eff6ff !important;
            box-shadow: none !important;
        }

        /* Grant Button */
        #btn-grant-perm {
            width: 100%;
            margin-top: 2rem;
            padding: 1rem;
            background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
        }
        #btn-grant-perm:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.3);
        }
        
        /* Action Buttons */
        .action-btn { 
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
        }
        .action-btn:hover { background: #f1f5f9 !important; color: var(--text-main) !important; }
        .action-btn.delete:hover { background: #fef2f2 !important; color: #ef4444 !important; }

        /* --- Tom Select Customization (Specific Fix) --- */
        .ts-control {
            background-color: #ffffff !important;
            border: 1px solid #cbd5e1 !important;
            border-radius: 8px !important;
            padding: 6px 10px !important;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05) !important;
            font-size: 1rem !important;
            min-height: auto !important;
            display: flex !important;
            flex-wrap: wrap !important;
            align-items: center !important;
            gap: 6px !important;
        }

        /* Override Global Input Border AND Radius */
        .ts-wrapper .ts-control > input,
        .ts-wrapper.multi .ts-control > input,
        .ts-wrapper.single .ts-control > input,
        div.ts-control > input {
            border: none !important;
            background: transparent !important;
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
            width: auto !important;
            flex: 1 1 auto !important;
            min-width: 4rem !important;
            display: inline-block !important;
            height: auto !important;
            line-height: inherit !important;
            border-radius: 0 !important;
        }

        .ts-wrapper.focus .ts-control {
            border-color: var(--primary) !important;
            box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1) !important;
        }

        .ts-wrapper.multi .ts-control > div.item {
            background: #eff6ff !important;
            color: #4f46e5 !important;
            border: 1px solid #c7d2fe !important;
            border-radius: 6px !important;
            padding: 4px 10px !important;
            margin: 0 !important;
            font-size: 0.95rem !important;
            font-weight: 500 !important;
            display: flex !important;
            align-items: center !important;
            line-height: 1.2 !important;
        }

        .ts-dropdown {
            border-radius: 8px !important;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important;
            border: 1px solid #e2e8f0 !important;
            z-index: 20000 !important;
            font-size: 1rem !important;
        }
        .ts-dropdown .option {
            padding: 10px 16px !important;
            cursor: pointer !important;
            color: #334155 !important;
        }
        .ts-dropdown .option.active, .ts-dropdown .active {
            background-color: #f1f5f9 !important;
            color: var(--primary) !important;
            font-weight: 600 !important;
        }
        
        /* Modal tweaks */
        dialog article { padding: 0 !important; overflow: hidden; border-radius: 20px !important; max-width: 600px; }
        .modal-header { padding: 1.5rem 2rem; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center; }
        .modal-body { padding: 2rem; max-height: 80vh; overflow-y: auto; }
        .modal-title { font-size: 1.25rem; font-weight: 700; color: #0f172a; }
        
        .checkbox-label {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-top: 0.75rem;
            font-size: 0.95rem;
            color: #475569;
            cursor: pointer;
            width: fit-content;
        }
        .checkbox-label input { width: 1.1em; height: 1.1em; cursor: pointer; }

      </style>

      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
        <h2 style="margin-bottom: 0;">${t.section_apps}</h2>
        <button onclick="document.getElementById('new-app-modal').showModal()" style="width: auto; margin-bottom: 0; padding: 0.5rem 1rem; font-size: 0.9rem; display: inline-flex; align-items: center; gap: 0.5rem; background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%); color:white; border:none; border-radius:12px; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);">
            <span class="material-symbols-outlined" style="font-size: 18px;">add</span> ${t.btn_add_app}
        </button>
      </div>

      <dialog id="new-app-modal">
        <article>
          <header class="modal-header">
            <div class="modal-title">${t.header_new_app}</div>
            <a href="#close" aria-label="Close" class="action-btn" onclick="this.closest('dialog').close()">
                <span class="material-symbols-outlined">close</span>
            </a>
          </header>
          <div class="modal-body">
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
                    <button type="submit" id="btn-grant-perm" style="margin-top:1rem;">
                        ${t.btn_add_app}
                    </button>
                </div>
              </form>
          </div>
        </article>
      </dialog>

      <div class="list-grid">
        ${props.apps.map(app => html`
          <div class="list-card" onclick="openEditAppModal('${app.id}', '${app.name}', '${app.base_url}')">
            <div style="flex-grow:1;">
                <div style="display:flex; align-items:center; gap:0.5rem;">
                    <div class="item-title" style="margin-bottom:0;">${app.name}</div>
                    ${app.status === 'inactive'
                        ? html`<span style="color:#d97706; background:#fffbeb; border:1px solid #fcd34d; padding:2px 6px; border-radius:4px; font-size:0.75rem; font-weight:bold;">${t.status_inactive}</span>`
                        : html`<span style="color:#16a34a; background:#f0fdf4; border:1px solid #bbf7d0; padding:2px 6px; border-radius:4px; font-size:0.75rem; font-weight:bold;">${t.status_active}</span>`}
                </div>
                <div class="item-sub">
                    <span style="font-family:monospace; background:#f1f5f9; padding:2px 4px; border-radius:4px; margin-right:0.5rem;">${app.id}</span>
                    <a href="${app.base_url}" target="_blank" style="text-decoration:none; color:inherit; display:inline-flex; align-items:center; gap:0.2rem;" onclick="event.stopPropagation()">
                        ${app.base_url} <span class="material-symbols-outlined" style="font-size: 14px;">open_in_new</span>
                    </a>
                </div>
            </div>
            
            <div style="display: flex; gap: 0.5rem; align-items: center;">
                <form method="POST" action="/admin/apps/toggle" style="margin:0;" onsubmit="return confirm('${(t.confirm_change_status || 'Change status?').replace('{name}', app.name)}')" onclick="event.stopPropagation()">
                    <input type="hidden" name="id" value="${app.id}" />
                    <input type="hidden" name="status" value="${app.status === 'inactive' ? 'active' : 'inactive'}" />
                    <button class="action-btn" title="${app.status === 'inactive' ? t.btn_resume : t.btn_pause}">
                        <span class="material-symbols-outlined">${app.status === 'inactive' ? 'play_arrow' : 'pause'}</span>
                    </button>
                </form>
                
                <form method="POST" action="/admin/apps/delete" style="margin:0;" onsubmit="return confirm('${t.confirm_delete_app}')" onclick="event.stopPropagation()">
                    <input type="hidden" name="id" value="${app.id}" />
                    <button class="action-btn delete" title="${t.delete}">
                        <span class="material-symbols-outlined">delete</span>
                    </button>
                </form>
            </div>
          </div>
        `)}
      </div>

      <dialog id="edit-app-modal">
        <article>
          <header class="modal-header">
            <div class="modal-title">${t.header_edit_app}</div>
            <a href="#close" id="edit-close-btn" aria-label="Close" class="action-btn" onclick="closeEditAppModal()">
                <span class="material-symbols-outlined">close</span>
            </a>
          </header>
          <div class="modal-body">
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
                    <button type="submit" class="outline" style="margin-top:1rem; width:100%; border:1px solid #cbd5e1; color:#475569; background:white;">
                        <span class="material-symbols-outlined" style="margin-right:4px;">save</span> ${t.save}
                    </button>
                </div>
              </form>
          </div>
        </article>
      </dialog>

      <script>
      ${scriptContent}
      </script>
    `
  })
}
