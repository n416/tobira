import { html, raw } from 'hono/html'
import { Layout } from './Layout'
import { dict } from '../../i18n'
import { Group, App } from '../../types'

interface Props {
  t: typeof dict.en
  userEmail: string
  groups: Group[]
  apps: App[]
}

export const GroupsPage = (props: Props) => {
  const t = props.t
  const allAppsJson = JSON.stringify(props.apps.map(a => ({value: a.id, text: a.name})));

  const scriptContent = raw(`

    (function() {
        var i18nEl = document.getElementById('i18n-data');
        var i18n = i18nEl ? i18nEl.dataset : {};
        var ALL_APPS = [];
        try {
            var appDataEl = document.getElementById('app-data');
            if(appDataEl) ALL_APPS = JSON.parse(appDataEl.textContent);
        } catch(e) { console.error(e); }
        var tsControl = null;
        var currentGroupId = '';
        var currentGroupPermissions = [];
        document.addEventListener('DOMContentLoaded', function() {
            if (typeof TomSelect !== 'undefined') {
                tsControl = new TomSelect('#g-perm-app-id', { 
                    plugins: ['remove_button'], 
                    create: false, 
                    maxItems: null, 
                    placeholder: 'アプリを選択...',
                    render: {
                        option: function(data, escape) { return '<div>' + escape(data.text) + '</div>'; },
                        item: function(data, escape) { return '<div>' + escape(data.text) + '</div>'; }
                    }
                });
            }
        });
        var gModal = document.getElementById('group-modal');
        window.openGroupModal = function(id, name) {
            currentGroupId = id;
            var titleEl = document.getElementById('modal-group-name');
            if(titleEl) titleEl.innerText = name;
            if(gModal) {
                gModal.showModal();
                setTimeout(function() { var closeBtn = document.getElementById('modal-close-btn'); if(closeBtn) closeBtn.focus(); }, 50);
            }
            if (tsControl) tsControl.clear();
            var validFrom = document.getElementById('g-perm-valid-from');
            if(validFrom) validFrom.value = new Date().toISOString().split('T')[0];
            var validTo = document.getElementById('g-perm-valid-to');
            if(validTo) validTo.value = '';
            window.loadGroupPerms(id);
        };
        window.closeGroupModal = function() { if(gModal) gModal.close(); };
        window.loadGroupPerms = function(id) {
            fetch('/admin/api/group-details/' + id + '?t=' + new Date().getTime())
                .then(function(r) { return r.json(); })
                .then(function(data) {
                    window.renderGroupPerms(data.permissions);
                    currentGroupPermissions = data.permissions;
                })
                .catch(function(e) { console.error(e); });
        };
        window.renderGroupPerms = function(list) {
            var container = document.getElementById('modal-g-perm-list');
            if(!container) return;
            container.innerHTML = '';
            if (!list || list.length === 0) {
                var empty = document.createElement('div');
                empty.style.textAlign = 'center';
                empty.style.padding = '2rem';
                empty.style.color = '#94a3b8';
                empty.textContent = '(権限なし)';
                container.appendChild(empty);
                return;
            }
            list.forEach(function(p) {
                var item = document.createElement('div');
                item.style.padding = '0.75rem 0';
                item.style.borderBottom = '1px solid #f1f5f9';
                var row = document.createElement('div');
                row.style.display = 'flex';
                row.style.justifyContent = 'space-between';
                row.style.alignItems = 'center';
                var left = document.createElement('div');
                left.style.display = 'flex';
                left.style.flexDirection = 'column';
                var title = document.createElement('div');
                title.className = 'item-title';
                title.innerText = p.app_name || 'Unknown';
                left.appendChild(title);
                var meta = document.createElement('div');
                meta.className = 'item-sub';
                var dateStrStart = new Date(p.valid_from * 1000).toLocaleDateString();
                var dateStrEnd = new Date(p.valid_to * 1000).toLocaleDateString();
                var isForever = p.valid_to > 2000000000;
                meta.innerHTML = '<span class="material-symbols-outlined" style="font-size:16px; margin-right:4px;">date_range</span> ' + dateStrStart + ' ～ ' + (isForever ? (i18n.termForever || 'Forever') : dateStrEnd);
                left.appendChild(meta);
                row.appendChild(left);
                var right = document.createElement('div');
                var btnRevoke = document.createElement('button');
                btnRevoke.className = 'action-btn delete';
                btnRevoke.innerHTML = '<span class="material-symbols-outlined">delete</span>';
                btnRevoke.onclick = function() { window.revokeGroupPerm(p.id); };
                right.appendChild(btnRevoke);
                row.appendChild(right);
                item.appendChild(row);
                container.appendChild(item);
            });
        };
        window.grantGroupPermission = function() {
            var dateVal = document.getElementById('g-perm-valid-to').value;
            var startVal = document.getElementById('g-perm-valid-from').value;
            var dateStrStart = new Date(startVal).toLocaleDateString();
            var dateStrEnd = dateVal ? new Date(dateVal).toLocaleDateString() : (i18n.termForever || 'Forever');
            var appIds = [];
            if (tsControl) { appIds = tsControl.getValue(); if (!Array.isArray(appIds)) appIds = [appIds]; } 
            else { var appSelect = document.getElementById('g-perm-app-id'); if (appSelect.value) appIds = [appSelect.value]; }
            appIds = appIds.filter(function(id) { return id !== ''; });
            // Use i18n for alert
            if(appIds.length === 0) { alert(i18n.alertSelectApp || 'Select at least one App'); return; }
            var warningMessages = [];
            appIds.forEach(function(id) {
                var existing = currentGroupPermissions.find(function(p) { return p.app_id === id; });
                if (existing) {
                    var exStart = new Date(existing.valid_from * 1000).toLocaleDateString();
                    var isForever = existing.valid_to > 2000000000;
                    var exEnd = isForever ? (i18n.termForever || 'Forever') : new Date(existing.valid_to * 1000).toLocaleDateString();
                    warningMessages.push('・' + existing.app_name + ' (' + exStart + ' ～ ' + exEnd + ')');
                }
            });
            if (warningMessages.length > 0) {
                var msgTemplate = i18n.msgOverwriteConfirm || 'Overwrite?\\n{list}';
                var listStr = warningMessages.join('\\n');
                var msg = msgTemplate.replace('{start}', dateStrStart).replace('{end}', dateStrEnd).replace('{list}', listStr);
                if (!confirm(msg)) return;
            }
            var validTo = dateVal ? Math.floor(new Date(dateVal).getTime()/1000) : Math.floor(Date.now()/1000) + 315360000;
            var validFrom = startVal ? Math.floor(new Date(startVal).getTime()/1000) : Math.floor(Date.now()/1000);
            fetch('/admin/api/group/permission/grant', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ group_id: currentGroupId, app_ids: appIds, valid_from: validFrom, valid_to: validTo }) })
            .then(function() { window.loadGroupPerms(currentGroupId); if(tsControl) tsControl.clear(); });
        };
        window.revokeGroupPerm = function(pid) {
            if(!confirm(i18n.msgRevoke || 'Revoke?')) return;
            fetch('/admin/api/group/permission/revoke', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({id: pid}) })
            .then(function() { window.loadGroupPerms(currentGroupId); });
        };
        window.calcGroupDate = function(targetId, offset, unit) {
            var d = new Date();
            if (unit === 'forever') { var el = document.getElementById(targetId); if(el) el.value = ''; return; }
            if (unit === 'year') { d.setFullYear(d.getFullYear() + offset); } else if (unit === 'month') { d.setMonth(d.getMonth() + offset); } else if (unit === 'day') { d.setDate(d.getDate() + offset); }
            var el = document.getElementById(targetId); if(el) el.value = d.toISOString().split('T')[0];
        };
    })();

  `);

  return Layout({
    t: t,
    userEmail: props.userEmail,
    activeTab: 'groups',
    children: html`
      <style>
        
        /* --- Base & Reset --- */
        .material-symbols-outlined { display: inline-flex; align-items: center; justify-content: center; vertical-align: middle; }
        
        /* --- Card / List Layout --- */
        .list-grid { display: flex; flex-direction: column; gap: 1rem; }
        
        /* List Item Card (Reverted to clean white style) */
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
        
        /* --- Permission Grant Card (The "Right" Image Design) --- */
        #grant-form-card {
            background: #ffffff;
            padding: 2rem;
            border-radius: 16px;
            border: 1px solid #e2e8f0;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
            margin-bottom: 2rem;
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

        /* Quick Buttons Container */
        .quick-btn-group {
            display: grid;
            grid-template-columns: repeat(4, 1fr); /* 4 buttons in a row */
            gap: 0.75rem;
            margin-top: 0.75rem;
        }
        
        /* Quick Button Style (Pill/Soft) */
        .quick-btn {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            color: #64748b;
            padding: 0.5rem;
            border-radius: 8px;
            font-size: 0.85rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
            text-align: center;
            width: 100%;
        }
        .quick-btn:hover {
            border-color: var(--primary);
            color: var(--primary);
            background: #eff6ff;
        }

        /* Grant Button (Gradient) */
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

        /* --- Tom Select Customization (Matching "Input" style) --- */
        .ts-control {
            background-color: #ffffff !important;
            border: 1px solid #cbd5e1 !important;
            border-radius: 8px !important;
            padding: 10px 12px !important;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05) !important;
            font-size: 1rem;
        }
        .ts-wrapper.focus .ts-control {
            border-color: var(--primary) !important;
            box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1) !important;
        }
        .ts-dropdown {
            border-radius: 8px !important;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important;
            border: 1px solid #e2e8f0 !important;
            z-index: 20000 !important; /* Above modal */
        }
        
        /* Modal tweaks */
        dialog article { padding: 0 !important; overflow: hidden; border-radius: 20px !important; max-width: 600px; }
        .modal-header { padding: 1.5rem 2rem; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center; }
        .modal-body { padding: 2rem; max-height: 80vh; overflow-y: auto; }
        .modal-title { font-size: 1.25rem; font-weight: 700; color: #0f172a; }
        
        .action-btn { background:transparent; border:none; color:#94a3b8; cursor:pointer; padding:6px; border-radius:50%; transition:all 0.2s; }
        .action-btn:hover { background:#f1f5f9; color:var(--text-main); }
        .action-btn.delete:hover { background:#fef2f2; color:#ef4444; }
        
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
        <h2 style="margin-bottom: 0;">${t.section_groups}</h2>
        <button onclick="document.getElementById('new-group-modal').showModal()" style="width: auto; margin-bottom: 0; padding: 0.5rem 1rem; font-size: 0.9rem; display: inline-flex; align-items: center; gap: 0.5rem; background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%); color:white; border:none; border-radius:12px; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);">
            <span class="material-symbols-outlined" style="font-size:18px;">add</span> ${t.btn_add_group}
        </button>
      </div>

      <dialog id="new-group-modal">
        <article>
          <header class="modal-header">
            <div class="modal-title">${t.header_new_group}</div>
            <a href="#close" aria-label="Close" class="action-btn" onclick="this.closest('dialog').close()">
                <span class="material-symbols-outlined">close</span>
            </a>
          </header>
          <div class="modal-body">
              <form method="POST" action="/admin/groups">
                <div class="grid-vertical">
                    <label style="width:100%;">
                      <span class="form-label">${t.label_group_name}</span>
                      <input type="text" name="name" placeholder="${t.placeholder_group_name}" required style="margin-top:0.2rem;" />
                    </label>
                    <button type="submit" id="btn-grant-perm" style="margin-top:1rem;">
                        ${t.btn_add_group}
                    </button>
                </div>
              </form>
          </div>
        </article>
      </dialog>

      <hr />

      <div class="list-grid">
        ${props.groups.length === 0 ? html`<div style="text-align:center; padding:2rem; color:#94a3b8;">${t.no_groups}</div>` : ''}
        ${props.groups.map((g) => {
            return html`
          <div class="list-card" onclick="openGroupModal('${g.id}', '${g.name}')">
            <div style="flex-grow:1;">
                <div class="item-title">${g.name}</div>
            </div>
            <div>
                <form method="POST" action="/admin/groups/delete" style="margin:0;" onsubmit="return confirm('${t.confirm_delete_group}')" onclick="event.stopPropagation()">
                     <input type="hidden" name="id" value="${g.id}" />
                     <button class="action-btn delete" title="${t.delete}">
                        <span class="material-symbols-outlined">delete</span>
                     </button>
                </form>
            </div>
          </div>
        `})}
      </div>

      <dialog id="group-modal">
        <article>
          <header class="modal-header">
            <div class="modal-title">${t.modal_section_group}: <span id="modal-group-name" style="font-weight:400; color:#64748b; margin-left:0.5rem;"></span></div>
            <a href="#close" id="modal-close-btn" aria-label="Close" class="action-btn" onclick="closeGroupModal()">
                <span class="material-symbols-outlined">close</span>
            </a>
          </header>
          
          <div class="modal-body">
             <div id="grant-form-card">
                <div style="margin-bottom: 1.5rem;">
                   <label class="form-label">${t.modal_label_app}</label>
                   <select id="g-perm-app-id" multiple autocomplete="off" placeholder="アプリを選択..."></select>
                </div>

                <div style="display:grid; grid-template-columns: 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
                     <div>
                          <label class="form-label">
                            ${t.label_valid_from} <span style="font-weight:normal; color:#94a3b8; font-size:0.85em;">(開始予定日)</span>
                          </label>
                          <input type="date" id="g-perm-valid-from" />
                          <div class="quick-btn-group">
                              <button type="button" class="quick-btn" onclick="calcGroupDate('g-perm-valid-from', -1, 'month')">-1ヶ月</button>
                              <button type="button" class="quick-btn" onclick="calcGroupDate('g-perm-valid-from', -7, 'day')">-1週間</button>
                              <button type="button" class="quick-btn" onclick="calcGroupDate('g-perm-valid-from', -1, 'day')">-1日</button>
                              <button type="button" class="quick-btn" onclick="calcGroupDate('g-perm-valid-from', 0, 'day')">${t.btn_date_today}</button>
                          </div>
                     </div>
                     <div>
                         <label class="form-label">${t.label_valid_to}</label>
                         <input type="date" id="g-perm-valid-to" />
                         <div class="quick-btn-group">
                              <button type="button" class="quick-btn" onclick="calcGroupDate('g-perm-valid-to', 0, 'day')">${t.btn_date_today}</button>
                              <button type="button" class="quick-btn" onclick="calcGroupDate('g-perm-valid-to', 1, 'month')">${t.btn_term_1mo}</button>
                              <button type="button" class="quick-btn" onclick="calcGroupDate('g-perm-valid-to', 1, 'year')">${t.btn_term_1yr}</button>
                              <button type="button" class="quick-btn" onclick="calcGroupDate('g-perm-valid-to', 99, 'forever')">${t.btn_term_forever}</button>
                         </div>
                     </div>
                </div>

                <button type="button" id="btn-grant-perm" onclick="grantGroupPermission()">
                    <span class="material-symbols-outlined">add</span>
                    <span>${t.btn_grant}</span>
                </button>
             </div>
             
             <h4 style="font-size:1.1rem; margin:2rem 0 1rem; font-weight:600; color:#334155;">${t.header_active_permissions}</h4>
             
             <div id="modal-g-perm-list"></div>
          </div>
        </article>
      </dialog>

      <div id="i18n-data" style="display:none;"
        data-msg-revoke="${t.confirm_revoke_permission}"
        data-term-forever="${t.btn_term_forever}"
        data-msg-overwrite-confirm="${t.confirm_overwrite}"
        data-alert-select-app="${t.alert_select_app}"
        data-alert-update-fail="${t.alert_update_fail}"
        data-alert-error="${t.alert_error}"
      ></div>
      
      <script type="application/json" id="app-data">${raw(allAppsJson)}</script>

      <script>
      ${scriptContent}
      </script>
    `
    })
}
