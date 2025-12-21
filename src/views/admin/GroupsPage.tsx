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
  
  // アプリ一覧をJSONとして準備
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
                        onInitialize: function() {
                            this.wrapper.style.marginBottom = '0'; 
                        }
                    });
                }
            });
            
            var gModal = document.getElementById('group-modal');

            window.openGroupModal = function(id, name) {
                currentGroupId = id;
                document.getElementById('modal-group-name').innerText = name;
                if(gModal) {
                    gModal.showModal();
                    var closeBtn = document.getElementById('modal-close-btn');
                    if(closeBtn) closeBtn.focus();
                }
                
                if (tsControl) tsControl.clear();
                
                var validFrom = document.getElementById('g-perm-valid-from');
                if(validFrom) validFrom.value = new Date().toISOString().split('T')[0];
                
                var validTo = document.getElementById('g-perm-valid-to');
                if(validTo) validTo.value = '';
                
                window.resetGrantButton();
                
                window.loadGroupPerms(id);
            };
            
            window.closeGroupModal = function() { 
                if(gModal) gModal.close(); 
                window.resetGrantButton();
            };
            
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
                    empty.style.color = 'var(--text-sub)';
                    empty.textContent = '(権限なし)';
                    container.appendChild(empty);
                    return;
                }

                list.forEach(function(p) {
                    var item = document.createElement('div');
                    item.style.padding = '1rem 0';
                    item.style.borderBottom = '1px solid rgba(0,0,0,0.1)';
                    item.style.display = 'flex';
                    item.style.flexDirection = 'column';
                    item.style.gap = '0.5rem';

                    var title = document.createElement('div');
                    title.style.fontWeight = 'bold';
                    title.style.fontSize = '1.05rem';
                    title.textContent = p.app_name || 'Unknown';
                    item.appendChild(title);

                    var infoRow = document.createElement('div');
                    infoRow.style.display = 'flex';
                    infoRow.style.justifyContent = 'space-between';
                    infoRow.style.alignItems = 'flex-start';
                    infoRow.style.gap = '1rem';
                    infoRow.style.flexWrap = 'wrap';

                    var meta = document.createElement('div');
                    meta.style.fontSize = '0.9rem';
                    meta.style.color = 'var(--text-sub)';
                    
                    var dateStrStart = new Date(p.valid_from * 1000).toLocaleDateString();
                    var dateStrEnd = new Date(p.valid_to * 1000).toLocaleDateString();
                    var isForever = p.valid_to > 2000000000;
                    
                    meta.innerHTML = '<div style="display:flex; align-items:center; gap:0.5rem;">' +
                        '<span class="material-symbols-outlined" style="font-size:18px; vertical-align:text-bottom;">date_range</span> ' +
                        dateStrStart + ' ～ ' + (isForever ? (i18n.termForever || 'Forever') : dateStrEnd) +
                        '</div>';
                    infoRow.appendChild(meta);

                    var actions = document.createElement('div');
                    actions.style.marginLeft = 'auto';
                    
                    var btnRevoke = document.createElement('button');
                    btnRevoke.type = 'button';
                    btnRevoke.className = 'outline secondary';
                    btnRevoke.style.cssText = 'border:none; background:transparent; padding:0.4rem; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; color:#ef4444; width:36px; height:36px; cursor:pointer;';
                    btnRevoke.innerHTML = '<span class="material-symbols-outlined" style="font-size:20px;">delete</span>';
                    btnRevoke.onclick = function() { window.revokeGroupPerm(p.id); };
                    
                    actions.appendChild(btnRevoke);
                    infoRow.appendChild(actions);
                    
                    item.appendChild(infoRow);
                    container.appendChild(item);
                });
            };

            window.grantGroupPermission = function() {
                var dateVal = document.getElementById('g-perm-valid-to').value;
                var startVal = document.getElementById('g-perm-valid-from').value;
                var dateStrStart = new Date(startVal).toLocaleDateString();
                var dateStrEnd = dateVal ? new Date(dateVal).toLocaleDateString() : (i18n.termForever || 'Forever');

                var appIds = [];
                if (tsControl) {
                    appIds = tsControl.getValue();
                    if (!Array.isArray(appIds)) appIds = [appIds];
                } else {
                    var appSelect = document.getElementById('g-perm-app-id');
                    if (appSelect.value) appIds = [appSelect.value];
                }
                
                appIds = appIds.filter(function(id) { return id !== ''; });

                if(appIds.length === 0) { alert('Select at least one App'); return; }

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
                    var msg = warningMessages.join('\\n') + '\\n\\nの権限が ' + dateStrStart + ' ～ ' + dateStrEnd + ' で上書きされます。\\n本当に良いですか？';
                    if (!confirm(msg)) return;
                }

                var validTo = dateVal ? Math.floor(new Date(dateVal).getTime()/1000) : Math.floor(Date.now()/1000) + 315360000;
                var validFrom = startVal ? Math.floor(new Date(startVal).getTime()/1000) : Math.floor(Date.now()/1000);
                
                fetch('/admin/api/group/permission/grant', {
                    method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({
                        group_id: currentGroupId, app_ids: appIds, valid_from: validFrom, valid_to: validTo
                    })
                }).then(function() { 
                    window.loadGroupPerms(currentGroupId);
                    window.resetGrantButton();
                });
            };

            window.revokeGroupPerm = function(pid) {
                if(!confirm(i18n.msgRevoke || 'Revoke?')) return;
                fetch('/admin/api/group/permission/revoke', {
                    method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({id: pid})
                }).then(function() { 
                    window.loadGroupPerms(currentGroupId);
                });
            };

            window.calcGroupDate = function(targetId, offset, unit) {
                var d = new Date();
                
                if (unit === 'forever') {
                     var el = document.getElementById(targetId);
                     if(el) el.value = '';
                     return;
                }

                if (unit === 'year') {
                    d.setFullYear(d.getFullYear() + offset);
                } else if (unit === 'month') {
                    d.setMonth(d.getMonth() + offset);
                } else if (unit === 'day') {
                    d.setDate(d.getDate() + offset);
                }
                
                var el = document.getElementById(targetId);
                if(el) el.value = d.toISOString().split('T')[0];
            };
            
            window.resetGrantButton = function() {
                if(tsControl) tsControl.clear();
            };
        })();

  `);

  return Layout({
    t: t,
    userEmail: props.userEmail,
    activeTab: 'groups',
    children: html`
      <style>
        /* Shared Styles matching UsersPage */
        
        .ts-control, .ts-wrapper.single .ts-control {
            background-color: rgba(255, 255, 255, 0.9) !important;
            border: 1px solid #cbd5e1 !important;
            border-radius: 12px !important;
            padding: 6px 12px !important;
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important;
            min-height: 48px;
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 4px;
        }

        .ts-wrapper.focus .ts-control {
            border-color: var(--primary) !important;
            box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1) !important;
            outline: none !important;
        }

        .ts-wrapper .ts-control > input {
            border: none !important;
            background: transparent !important;
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            min-height: auto !important;
            width: auto !important;
            flex: 1 1 auto;
            display: inline-block !important;
            line-height: inherit !important;
            font-size: inherit !important;
            color: inherit !important;
            border-radius: 0 !important;
        }
        .ts-wrapper .ts-control > input:focus {
            box-shadow: none !important;
            border: none !important;
            background: transparent !important;
            outline: none !important;
        }

        .ts-wrapper.multi .ts-control > div.item {
            background: #e0e7ff;
            color: #4f46e5;
            border: 1px solid #c7d2fe;
            border-radius: 6px;
            padding: 2px 8px;
            margin: 2px 4px 2px 0;
            font-size: 0.9rem;
            font-weight: 500;
            display: flex;
            align-items: center;
            box-shadow: none !important;
        }
        .ts-wrapper.multi .ts-control > div.item.active {
            background: #4f46e5;
            color: white;
            border-color: #4338ca;
        }

        .ts-dropdown {
            margin-top: 8px;
            border-radius: 12px !important;
            border: 1px solid #cbd5e1 !important;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
            background: #ffffff !important;
            overflow: hidden;
            z-index: 10000 !important;
            padding: 6px 0 !important;
        }
        
        .ts-dropdown .option {
            padding: 10px 16px !important;
            cursor: pointer;
            color: #334155 !important;
            font-weight: 500 !important;
            transition: background-color 0.1s ease;
        }
        
        .ts-dropdown .option.active, .ts-dropdown .active {
            background-color: #f1f5f9 !important;
            color: var(--primary) !important;
            font-weight: 600 !important;
        }
        
        .material-symbols-outlined {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            vertical-align: middle;
        }
        button span.material-symbols-outlined {
            margin-right: 0;
        }
      </style>

      <h2>${t.section_groups}</h2>
      
      <article>
        <h3>${t.header_new_group}</h3>
        <form method="POST" action="/admin/groups" style="margin-bottom: 0;">
          <div class="grid" style="grid-template-columns: 1fr auto; align-items: end; gap: 1rem;">
            <label style="margin-bottom: 0;">
              ${t.label_group_name}
              <input type="text" name="name" placeholder="${t.placeholder_group_name}" required style="margin-bottom: 0;" />
            </label>
            <button type="submit" style="width: auto; margin-bottom: 0;">
                <span class="material-symbols-outlined" style="margin-right:4px;">add</span> ${t.btn_add_group}
            </button>
          </div>
        </form>
      </article>

      <hr />

      <figure>
        <table role="grid">
          <thead>
            <tr>
              <th scope="col">${t.label_group_name}</th>
              <th scope="col" style="width: 200px;">${t.action}</th>
            </tr>
          </thead>
          <tbody>
            ${props.groups.length === 0 ? html`<tr><td colspan="2">${t.no_groups}</td></tr>` : ''}
            ${props.groups.map(g => html`
              <tr onclick="openGroupModal('${g.id}', '${g.name}')" style="cursor:pointer" class="hover-row">
                <td>${g.name}</td>
                <td>
                    <div class="grid" style="grid-template-columns: auto auto; gap: 0.5rem; justify-content: flex-end;">
                        <form method="POST" action="/admin/groups/delete" style="margin:0;" onsubmit="return confirm('${t.confirm_delete_group}')" onclick="event.stopPropagation()">
                             <input type="hidden" name="id" value="${g.id}" />
                             <button class="outline secondary" style="padding:0.4rem 0.8rem; font-size:0.8rem; border-color:#d32f2f; color:#d32f2f; width: auto;">
                                <span class="material-symbols-outlined" style="font-size:18px; margin-right:4px;">delete</span> ${t.delete}
                             </button>
                        </form>
                    </div>
                </td>
              </tr>
            `)}
          </tbody>
        </table>
      </figure>

      <dialog id="group-modal">
        <article style="max-width: 600px !important; width: 100%; margin-top: 5vh;">
          <header>
            <div class="modal-title">${t.modal_section_group}: <span id="modal-group-name"></span></div>
            <a href="#close" id="modal-close-btn" aria-label="Close" class="close" onclick="closeGroupModal()" role="button" tabindex="0">
                <span class="material-symbols-outlined">close</span>
            </a>
          </header>
          
          <div class="grid">
             <div>
                <div style="background:rgba(255,255,255,0.8); padding:1.5rem; border-radius:12px; margin-bottom:1.5rem; border:1px solid rgba(0,0,0,0.1); box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                    <div style="margin-bottom: 1.5rem;">
                       <label style="font-size:0.95rem; font-weight:600; margin-bottom:0.5rem; display:block;">${t.modal_label_app}</label>
                       <select id="g-perm-app-id" multiple autocomplete="off" placeholder="アプリを選択..." style="width:100%; margin-bottom:0;">
                          <option value="">Select App...</option>
                          ${props.apps.map(a => html`<option value="${a.id}">${a.name}</option>`)}
                       </select>
                    </div>

                    <div style="display:flex; flex-direction:column; gap: 1.5rem; margin-bottom: 1.5rem;">
                         
                         <div>
                              <label style="font-size:0.95rem; font-weight:600; margin-bottom:0.5rem; display:block;">
                                ${t.label_valid_from} <span style="font-weight:normal; color:#666; font-size:0.85em;">(開始予定日)</span>
                              </label>
                              <input type="date" id="g-perm-valid-from" style="width:100%; margin-bottom:0.5rem;" />
                              
                              <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
                                  <button type="button" class="outline secondary" onclick="calcGroupDate('g-perm-valid-from', -1, 'month')" style="flex:1; padding:0.4rem; font-size:0.85rem;">-1ヶ月</button>
                                  <button type="button" class="outline secondary" onclick="calcGroupDate('g-perm-valid-from', -7, 'day')" style="flex:1; padding:0.4rem; font-size:0.85rem;">-1週間</button>
                                  <button type="button" class="outline secondary" onclick="calcGroupDate('g-perm-valid-from', -1, 'day')" style="flex:1; padding:0.4rem; font-size:0.85rem;">-1日</button>
                                  <button type="button" class="outline secondary" onclick="calcGroupDate('g-perm-valid-from', 0, 'day')" style="flex:1; padding:0.4rem; font-size:0.85rem;">${t.btn_date_today || '本日'}</button>
                              </div>
                         </div>

                         <div>
                             <label style="font-size:0.95rem; font-weight:600; margin-bottom:0.5rem; display:block;">${t.label_valid_to}</label>
                             <input type="date" id="g-perm-valid-to" style="width:100%; margin-bottom:0.5rem;" />
                             
                             <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
                                  <button type="button" class="outline secondary" onclick="calcGroupDate('g-perm-valid-to', 0, 'day')" style="flex:1; padding:0.4rem; font-size:0.85rem;">${t.btn_date_today || '本日'}</button>
                                  <button type="button" class="outline secondary" onclick="calcGroupDate('g-perm-valid-to', 1, 'month')" style="flex:1; padding:0.4rem; font-size:0.85rem;">${t.btn_term_1mo}</button>
                                  <button type="button" class="outline secondary" onclick="calcGroupDate('g-perm-valid-to', 1, 'year')" style="flex:1; padding:0.4rem; font-size:0.85rem;">${t.btn_term_1yr}</button>
                                  <button type="button" class="outline secondary" onclick="calcGroupDate('g-perm-valid-to', 99, 'forever')" style="flex:1; padding:0.4rem; font-size:0.85rem;">${t.btn_term_forever}</button>
                             </div>
                         </div>
                    </div>

                    <button type="button" onclick="grantGroupPermission()" style="width:100%; padding:1rem; display:flex; align-items:center; justify-content:center; gap:0.5rem; font-weight:bold; transition: all 0.2s;">
                        <span class="material-symbols-outlined">add</span>
                        <span>${t.btn_grant}</span>
                    </button>
                </div>
             </div>
          </div>
          
          <hr style="margin: 1.5rem 0;">
          
          <h4 style="font-size:1.1rem; margin-bottom:1rem; color:var(--text-main); font-weight:600;">${t.header_active_permissions}</h4>
          
          <div id="modal-g-perm-list" style="border:1px solid rgba(0,0,0,0.05); border-radius:12px; background: rgba(255,255,255,0.4); padding: 0 1rem;">
          </div>

        </article>
      </dialog>

      <div id="i18n-data" style="display:none;"
        data-msg-revoke="${t.confirm_revoke_permission}"
        data-term-forever="${t.btn_term_forever}"
      ></div>
      
      <script type="application/json" id="app-data">${raw(allAppsJson)}</script>

      <script>
      ${scriptContent}
      </script>
    `
  })
}
