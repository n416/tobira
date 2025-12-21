import { html, raw } from 'hono/html'
import { Layout } from './Layout'
import { dict } from '../../i18n'
import { User, App, Group } from '../../types'

interface Props {
    t: typeof dict.en
    userEmail: string
    users: (User & { group_name?: string })[]
    apps: App[]
    groups: Group[]
    inviteUrl?: string
    error?: string
}

export const UsersPage = (props: Props) => {
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
            var currentExistingIds = []; 
            var currentUserPermissions = []; 

            document.addEventListener('DOMContentLoaded', function() {
                if (typeof TomSelect !== 'undefined') {
                    tsControl = new TomSelect('#perm-app-id', {
                        plugins: ['remove_button'],
                        create: false,
                        maxItems: null,
                        placeholder: 'アプリを選択...',
                        onInitialize: function() {
                            this.wrapper.style.marginBottom = '0'; 
                        }
                    });
                }
                
                var filterCheck = document.getElementById('exclude-existing-check');
                if (filterCheck) {
                    filterCheck.addEventListener('change', refreshAppOptions);
                }
            });
            
            function refreshAppOptions() {
                if (!tsControl) return;
                var exclude = document.getElementById('exclude-existing-check').checked;
                tsControl.clearOptions();
                var optionsToShow = ALL_APPS;
                if (exclude) {
                    optionsToShow = ALL_APPS.filter(function(app) {
                        return !currentExistingIds.includes(app.value);
                    });
                }
                tsControl.addOption(optionsToShow);
                tsControl.refreshOptions(false); 
            }
            
            window.deleteUser = function(id) {
                if(!confirm(i18n.deleteConfirm)) return;
                var form = document.getElementById('delete-user-form');
                if (!form) return;
                var input = form.querySelector('input[name="id"]');
                input.value = id;
                form.submit();
            };

            var modal = document.getElementById('user-modal');
            var currentUserId = '';

            window.openUserModal = function(id) {
                currentUserId = id;
                if(modal) {
                    modal.showModal();
                    var closeBtn = document.getElementById('modal-close-btn');
                    if(closeBtn) closeBtn.focus();
                }
                
                if (tsControl) tsControl.clear();
                
                var validFrom = document.getElementById('perm-valid-from');
                if(validFrom) validFrom.value = new Date().toISOString().split('T')[0];
                
                var validTo = document.getElementById('perm-valid-to');
                if(validTo) validTo.value = '';
                
                window.resetGrantButton();

                fetch('/admin/api/user-details/' + id + '?t=' + new Date().getTime())
                    .then(function(r){ return r.json(); })
                    .then(function(data){
                        var emailEl = document.getElementById('modal-user-email');
                        if(emailEl) emailEl.innerText = data.email;
                        
                        var groupSel = document.getElementById('modal-group-select');
                        if(groupSel) groupSel.value = data.group_id || '';
                        
                        window.renderPerms(data.permissions);
                        
                        currentUserPermissions = data.permissions;
                        currentExistingIds = data.permissions.map(function(p){ return p.app_id; });
                        
                        refreshAppOptions();
                    })
                    .catch(function(e){ console.error(e); });
            };
            
            window.closeUserModal = function() { 
                if(modal) modal.close(); 
                window.resetGrantButton();
            };
            
            window.resetGrantButton = function() {
                var btn = document.getElementById('btn-grant-perm');
                if(btn) {
                    btn.innerHTML = '<span class="material-symbols-outlined">add</span> <span>' + (i18n.btnGrant || 'Grant') + '</span>';
                }
                var card = document.getElementById('grant-form-card');
                if(card) {
                    card.classList.remove('blink-active');
                }
                if(tsControl) {
                    tsControl.settings.maxItems = null;
                    tsControl.refreshOptions();
                }
            };

            window.highlightGrantForm = function() {
                var btn = document.getElementById('btn-grant-perm');
                if(btn) {
                     btn.innerHTML = '<span class="material-symbols-outlined">edit</span> <span>' + (i18n.btnChange || '変更') + '</span>';
                     btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                var card = document.getElementById('grant-form-card');
                if(card) {
                    card.classList.remove('blink-active');
                    void card.offsetWidth; 
                    card.classList.add('blink-active');
                }
            };

            window.editPerm = function(appId, startTs, endTs) {
                var filterCheck = document.getElementById('exclude-existing-check');
                if(filterCheck && filterCheck.checked) {
                    filterCheck.checked = false;
                    refreshAppOptions();
                }

                if (tsControl) {
                    tsControl.setValue([appId]);
                }
                
                var validFrom = document.getElementById('perm-valid-from');
                if(validFrom) validFrom.value = new Date(startTs * 1000).toISOString().split('T')[0];
                
                var validTo = document.getElementById('perm-valid-to');
                if(validTo) {
                    var isForever = endTs > 2000000000;
                    validTo.value = isForever ? '' : new Date(endTs * 1000).toISOString().split('T')[0];
                }
                
                window.highlightGrantForm();
            };

            window.renderPerms = function(list) {
                var container = document.getElementById('modal-perm-list');
                if(!container) return;
                container.innerHTML = '';

                if (!list || list.length === 0) {
                    var empty = document.createElement('div');
                    empty.style.textAlign = 'center';
                    empty.style.padding = '2rem';
                    empty.style.color = 'var(--text-sub)';
                    empty.textContent = i18n.noAffiliation || '(None)';
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
                    meta.style.display = 'flex';
                    meta.style.flexDirection = 'column';
                    meta.style.gap = '0.2rem';
                    
                    var detailsLine = document.createElement('div');
                    detailsLine.style.display = 'flex';
                    detailsLine.style.alignItems = 'center';
                    detailsLine.style.gap = '0.5rem';
                    detailsLine.style.flexWrap = 'wrap';

                    var sourceHtml = '';
                    var sourceIcon = '';
                    var sourceText = '';
                    if (p.source === 'group') {
                        sourceIcon = 'domain';
                        sourceText = i18n.sourceGroup || 'Group';
                        sourceHtml = '<span class="material-symbols-outlined" style="font-size:18px; vertical-align:text-bottom;">' + sourceIcon + '</span> ' + sourceText;
                    } else {
                        sourceIcon = 'person';
                        sourceText = i18n.sourceUser || 'User';
                        sourceHtml = '<span class="material-symbols-outlined" style="font-size:18px; vertical-align:text-bottom; color:var(--primary);">' + sourceIcon + '</span> <span style="color:var(--primary);">' + sourceText + '</span>';
                    }
                    
                    var dateStrStart = new Date(p.valid_from * 1000).toLocaleDateString();
                    var dateStrEnd = new Date(p.valid_to * 1000).toLocaleDateString();
                    var isForever = p.valid_to > 2000000000;
                    var dateHtml = ': ' + dateStrStart + ' ～ ' + (isForever ? (i18n.termForever || 'Forever') : dateStrEnd);

                    detailsLine.innerHTML = sourceHtml + dateHtml;
                    meta.appendChild(detailsLine);

                    if (p.is_override) {
                        var warn = document.createElement('small');
                        warn.style.color = '#d97706';
                        warn.textContent = '⚠ ' + (i18n.msgOverride || '');
                        meta.appendChild(warn);
                    }
                    
                    infoRow.appendChild(meta);

                    var actions = document.createElement('div');
                    actions.style.display = 'flex';
                    actions.style.gap = '0.5rem';
                    actions.style.marginLeft = 'auto';

                    if (p.source === 'user') {
                        var btnEdit = document.createElement('button');
                        btnEdit.type = 'button';
                        btnEdit.className = 'outline secondary';
                        btnEdit.style.cssText = 'border:none; background:transparent; padding:0.4rem; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; color:#0ea5e9; width:36px; height:36px; cursor:pointer;';
                        btnEdit.innerHTML = '<span class="material-symbols-outlined" style="font-size:20px;">edit</span>';
                        btnEdit.title = 'Edit';
                        btnEdit.onclick = function() { window.editPerm(p.app_id, p.valid_from, p.valid_to); };
                        actions.appendChild(btnEdit);

                        var btnRevoke = document.createElement('button');
                        btnRevoke.type = 'button';
                        btnRevoke.className = 'outline secondary';
                        btnRevoke.style.cssText = 'border:none; background:transparent; padding:0.4rem; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; color:#ef4444; width:36px; height:36px; cursor:pointer;';
                        btnRevoke.innerHTML = '<span class="material-symbols-outlined" style="font-size:20px;">delete</span>';
                        btnRevoke.title = 'Revoke';
                        btnRevoke.onclick = function() { window.revokePerm(p.id); };
                        actions.appendChild(btnRevoke);
                    } else {
                        var spanLock = document.createElement('span');
                        spanLock.style.color = '#cbd5e1';
                        spanLock.style.padding = '0.5rem';
                        spanLock.innerHTML = '<span class="material-symbols-outlined" style="font-size:20px;">lock</span>';
                        spanLock.title = 'Inherited from Group';
                        actions.appendChild(spanLock);
                    }

                    infoRow.appendChild(actions);
                    item.appendChild(infoRow);
                    container.appendChild(item);
                });
            };
            
            window.calcDate = function(targetId, offset, unit) {
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

            window.grantPermission = function() {
                var dateVal = document.getElementById('perm-valid-to').value;
                var startVal = document.getElementById('perm-valid-from').value;
                var dateStrStart = new Date(startVal).toLocaleDateString();
                var dateStrEnd = dateVal ? new Date(dateVal).toLocaleDateString() : (i18n.termForever || 'Forever');
                
                var appIds = [];
                if (tsControl) {
                    appIds = tsControl.getValue();
                    if (!Array.isArray(appIds)) appIds = [appIds];
                } else {
                    var appSelect = document.getElementById('perm-app-id');
                    if (appSelect.value) appIds = [appSelect.value];
                }
                
                appIds = appIds.filter(function(id) { return id !== ''; });

                if(appIds.length === 0) { alert('Select at least one App'); return; }

                var warningMessages = [];
                appIds.forEach(function(id) {
                    var existing = currentUserPermissions.find(function(p) { return p.app_id === id && p.source === 'user'; });
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

                fetch('/admin/api/user/permission/grant', {
                    method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({
                        user_id: currentUserId, app_ids: appIds, valid_from: validFrom, valid_to: validTo
                    })
                }).then(function(r) { return r.json(); }).then(function() {
                    window.openUserModal(currentUserId);
                    window.resetGrantButton(); 
                }).catch(function(e) {
                    console.error(e);
                    alert(e);
                });
            };

            window.revokePerm = function(pid) {
                if(!confirm(i18n.msgRevoke || 'Revoke?')) return;
                fetch('/admin/api/user/permission/revoke', {
                    method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({id: pid})
                }).then(function() {
                    window.openUserModal(currentUserId);
                });
            };
            
            window.updateUserGroup = function() {
                var gid = document.getElementById('modal-group-select').value;
                
                fetch('/admin/api/user/group', {
                    method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({user_id: currentUserId, group_id: gid})
                })
                .then(function(r) {
                    if (!r.ok) {
                        return r.json().catch(function(){ return {}; }).then(function(err) {
                            throw new Error(err.error || 'Server returned ' + r.status);
                        });
                    }
                    return r.json();
                })
                .then(function() {
                    window.closeUserModal();
                    window.location.reload();
                })
                .catch(function(e) {
                    alert('Failed to update group: ' + e.message);
                    console.error(e);
                });
            };

            var btn = document.getElementById('toggleBulkMode');
            var controls = document.getElementById('bulkControls');
            var bulkMode = false;
            
            if(btn) {
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    bulkMode = !bulkMode;
                    var iconName = bulkMode ? 'close' : 'bolt';
                    var text = bulkMode ? (i18n.btnExit || 'Exit') : (i18n.btnEnter || 'Bulk Mode');
                    btn.innerHTML = '<span class="material-symbols-outlined">' + iconName + '</span> ' + text;
                    btn.className = bulkMode ? '' : 'btn-glass';
                    if(controls) controls.style.display = bulkMode ? 'block' : 'none';
                    document.querySelectorAll('.col-select').forEach(function(el) { el.style.display = bulkMode ? 'table-cell' : 'none'; });
                });
            }
        })();

    `);

    return Layout({
        t: t,
        userEmail: props.userEmail,
        activeTab: 'users',
        children: html`
      <style>
        @keyframes border-blink {
            0% { border-color: rgba(0,0,0,0.1); box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
            50% { border-color: var(--primary); box-shadow: 0 0 15px rgba(79, 70, 229, 0.4); }
            100% { border-color: rgba(0,0,0,0.1); box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        }
        .blink-active {
            animation: border-blink 1s ease-in-out 3;
        }

        /* --- Tom Select Customization for Pico.css (Strict Override) --- */
        
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

        .checkbox-label {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-top: 0.5rem;
            font-size: 0.9rem;
            color: var(--text-main);
            cursor: pointer;
            user-select: none;
            width: fit-content;
        }
        .checkbox-label input {
            margin: 0 !important;
            width: 1.1em !important;
            height: 1.1em !important;
            cursor: pointer;
        }
      </style>

      <div class="grid">
        <hgroup>
          <h2>${t.section_users}</h2>
          <h3>${t.header_invite}</h3>
        </hgroup>
        <div style="text-align:right; display: flex; justify-content: flex-end; align-items: start;">
           <button type="button" id="toggleBulkMode" class="btn-glass" style="width: auto; margin-bottom: 0;">
                <span class="material-symbols-outlined">bolt</span> ${t.btn_bulk_mode}
           </button>
        </div>
      </div>
      
      ${props.error ? html`<article style="background:#ffebee; color:#c62828; border-left:4px solid #c62828;">${props.error}</article>` : ''}

      <article>
        <form method="POST" action="/admin/invite">
            <div class="grid" style="grid-template-columns: 1fr auto; gap: 1rem;">
                <input type="email" name="email" placeholder="${t.placeholder_invite_email}" required />
                <button type="submit">
                    <span class="material-symbols-outlined" style="margin-right: 4px;">send</span> ${t.btn_generate_invite}
                </button>
            </div>
        </form>
        ${props.inviteUrl ? html`
            <div style="background:#e8f5e9; padding:1rem; border-radius:4px; margin-top:1rem;">
                <strong>${t.invite_created}</strong><br>
                <small>${t.invite_copy_hint}</small><br>
                <input type="text" value="${props.inviteUrl}" readonly onclick="this.select()" style="margin-top:0.5rem;" />
            </div>
        `: ''}
      </article>

      <hr />

      <form id="bulkForm" method="POST" action="/admin/users/bulk">
        <div id="bulkControls" style="display:none; background:#f0f7ff; padding:1rem; border-radius:8px; margin-bottom:1rem; border:1px solid #cce5ff;">
            <h4>${t.btn_bulk_mode}</h4>
            <div class="grid">
                <label>
                    ${t.modal_section_group}
                    <select name="group_id">
                        <option value="">(No Change)</option>
                        <option value="__CLEAR__">${t.no_affiliation}</option>
                        ${props.groups.map(g => html`<option value="${g.id}">${g.name}</option>`)}
                    </select>
                </label>
                <label>
                    ${t.modal_section_add}
                    <select name="app_id">
                        <option value="">(None)</option>
                        ${props.apps.map(a => html`<option value="${a.id}">${a.name}</option>`)}
                    </select>
                </label>
            </div>
            <div class="grid" style="margin-top:1rem; grid-template-columns: max-content;">
                <button type="submit" style="min-width: 120px;">
                    <span class="material-symbols-outlined" style="margin-right: 4px;">done_all</span> ${t.btn_bulk_apply}
                </button>
            </div>
        </div>

        <h3>${t.header_registered_users}</h3>
        <figure>
            <table role="grid">
            <thead>
                <tr>
                <th scope="col" style="width:50px; display:none;" class="col-select">
                    <input type="checkbox" onclick="document.querySelectorAll('.user-check').forEach(c=>c.checked=this.checked)">
                </th>
                <th scope="col">${t.email}</th>
                <th scope="col">${t.label_affiliation}</th>
                <th scope="col">${t.action}</th>
                </tr>
            </thead>
            <tbody>
                ${props.users.map(u => {
            const g = props.groups.find(x => x.id === u.group_id)
            const gName = g ? g.name : t.no_affiliation
            return html`
                    <tr onclick="openUserModal('${u.id}')" style="cursor:pointer" class="hover-row">
                        <td class="col-select" style="display:none" onclick="event.stopPropagation()">
                             <input type="checkbox" name="ids" value="${u.id}" />
                        </td>
                        <td>${u.email}</td>
                        <td>${gName}</td>
                        <td>
                             <button type="button" class="outline secondary" style="padding:0.2rem 0.5rem; font-size:0.8rem; border-color:#d32f2f; color:#d32f2f;" 
                                onclick="event.stopPropagation(); deleteUser('${u.id}')">
                                <span class="material-symbols-outlined" style="font-size:18px; margin-right:4px;">delete</span> ${t.delete}
                             </button>
                        </td>
                    </tr>
                `})}
            </tbody>
            </table>
        </figure>
      </form>

      <form id="delete-user-form" method="POST" action="/admin/users/delete">
        <input type="hidden" name="id" value="" />
      </form>

      <dialog id="user-modal">
        <article style="max-width: 600px !important; width: 100%; margin-top: 5vh;">
          <header>
            <div class="modal-title">${t.header_user_details} <span id="modal-user-email"></span></div>
            <a href="#close" id="modal-close-btn" aria-label="Close" class="close" onclick="closeUserModal()" role="button" tabindex="0">
                <span class="material-symbols-outlined">close</span>
            </a>
          </header>
          
          <div class="grid">
            <div style="padding: 1rem 0;">
                <label style="font-weight:600; margin-bottom:0.5rem; display:block;">${t.modal_section_group}</label>
                <div style="display: flex; gap: 0.5rem; align-items: center;">
                    <select id="modal-group-select" style="flex-grow: 1; margin-bottom: 0;">
                        <option value="">${t.no_affiliation}</option>
                        ${props.groups.map(g => html`<option value="${g.id}">${g.name}</option>`)}
                    </select>
                    <button type="button" class="outline" onclick="updateUserGroup()" style="width: auto; margin: 0; white-space: nowrap; padding: 0.8rem 1.5rem;">
                        <span class="material-symbols-outlined" style="margin-right: 4px;">save</span> ${t.save}
                    </button> 
                </div>
                <small style="color:var(--text-sub); margin-top:0.5rem; display:block;">
                    ${t.desc_group_override}
                </small>
            </div>
          </div>

          <div style="margin: 1.5rem 0; border-top: 1px solid rgba(0,0,0,0.1);"></div>
          
          <h4 style="font-size:1.1rem; margin-bottom:1rem; color:var(--text-main); font-weight:600;">${t.tab_permissions}</h4>
          
          <div id="grant-form-card" style="background:rgba(255,255,255,0.8); padding:1.5rem; border-radius:12px; margin-bottom:1.5rem; border:1px solid rgba(0,0,0,0.1); box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); transition: all 0.3s ease;">
            <div style="margin-bottom: 1.5rem;">
               <label style="font-size:0.95rem; font-weight:600; margin-bottom:0.5rem; display:block;">${t.label_app}</label>
               <select id="perm-app-id" multiple autocomplete="off" placeholder="アプリを選択..." style="width:100%; margin-bottom:0;">
                  <option value="">Select App...</option>
                  ${props.apps.map(a => html`<option value="${a.id}">${a.name}</option>`)}
               </select>
               <label class="checkbox-label">
                   <input type="checkbox" id="exclude-existing-check" />
                   登録されているものは含まない
               </label>
            </div>

            <div style="display:flex; flex-direction:column; gap: 1.5rem; margin-bottom: 1.5rem;">
                 
                 <div>
                      <label style="font-size:0.95rem; font-weight:600; margin-bottom:0.5rem; display:block;">
                        ${t.label_valid_from} <span style="font-weight:normal; color:#666; font-size:0.85em;">(開始予定日)</span>
                      </label>
                      <input type="date" id="perm-valid-from" style="width:100%; margin-bottom:0.5rem;" />
                      
                      <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
                          <button type="button" class="outline secondary" onclick="calcDate('perm-valid-from', -1, 'month')" style="flex:1; padding:0.4rem; font-size:0.85rem;">-1ヶ月</button>
                          <button type="button" class="outline secondary" onclick="calcDate('perm-valid-from', -7, 'day')" style="flex:1; padding:0.4rem; font-size:0.85rem;">-1週間</button>
                          <button type="button" class="outline secondary" onclick="calcDate('perm-valid-from', -1, 'day')" style="flex:1; padding:0.4rem; font-size:0.85rem;">-1日</button>
                          <button type="button" class="outline secondary" onclick="calcDate('perm-valid-from', 0, 'day')" style="flex:1; padding:0.4rem; font-size:0.85rem;">${t.btn_date_today || '本日'}</button>
                      </div>
                 </div>

                 <div>
                     <label style="font-size:0.95rem; font-weight:600; margin-bottom:0.5rem; display:block;">${t.label_valid_to}</label>
                     <input type="date" id="perm-valid-to" style="width:100%; margin-bottom:0.5rem;" />
                     
                     <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
                          <button type="button" class="outline secondary" onclick="calcDate('perm-valid-to', 0, 'day')" style="flex:1; padding:0.4rem; font-size:0.85rem;">${t.btn_date_today || '本日'}</button>
                          <button type="button" class="outline secondary" onclick="calcDate('perm-valid-to', 1, 'month')" style="flex:1; padding:0.4rem; font-size:0.85rem;">${t.btn_term_1mo}</button>
                          <button type="button" class="outline secondary" onclick="calcDate('perm-valid-to', 1, 'year')" style="flex:1; padding:0.4rem; font-size:0.85rem;">${t.btn_term_1yr}</button>
                          <button type="button" class="outline secondary" onclick="calcDate('perm-valid-to', 99, 'forever')" style="flex:1; padding:0.4rem; font-size:0.85rem;">${t.btn_term_forever}</button>
                     </div>
                 </div>
             </div>

             <button type="button" id="btn-grant-perm" onclick="grantPermission()" style="width:100%; padding:1rem; display:flex; align-items:center; justify-content:center; gap:0.5rem; font-weight:bold; transition: all 0.2s;">
                 <span class="material-symbols-outlined">add</span>
                 <span>${t.btn_grant}</span>
             </button>
          </div>

          <div id="modal-perm-list" style="border:1px solid rgba(0,0,0,0.05); border-radius:12px; background: rgba(255,255,255,0.4); padding: 0 1rem;"></div>
        </article>
      </dialog>

      <div id="i18n-data" style="display:none;"
        data-delete-confirm="${t.confirm_delete_user}"
        data-msg-revoke="${t.confirm_revoke_permission}"
        data-btn-grant="${t.btn_grant}"
        data-btn-apply="${t.btn_bulk_apply || 'Update'}"
        data-btn-change="変更"
        data-btn-exit="${t.btn_exit_bulk}"
        data-btn-enter="${t.btn_bulk_mode}"
        data-no-affiliation="${t.no_affiliation || '(None)'}"
        data-msg-override="${t.msg_override}"
        data-term-forever="${t.btn_term_forever}"
        data-source-group="${t.source_group}"
        data-source-user="${t.source_user}"
      ></div>
      
      <script type="application/json" id="app-data">${raw(allAppsJson)}</script>

      <script>
      ${scriptContent}
      </script>
    `
    })
}
