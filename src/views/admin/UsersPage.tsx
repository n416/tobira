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
    const allAppsJson = JSON.stringify(props.apps.map(a => ({value: a.id, text: a.name})));
    const scriptContent = raw(`

        (function() {
            var i18nEl = document.getElementById('i18n-data');
            var i18n = i18nEl ? i18nEl.dataset : {};
            var ALL_APPS = [];
            try {
                var appDataEl = document.getElementById('app-data');
                if(appDataEl) ALL_APPS = JSON.parse(appDataEl.textContent);
            } catch(e) { console.error("Failed to load app data", e); }
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
                        render: {
                            option: function(data, escape) { return '<div>' + escape(data.text) + '</div>'; },
                            item: function(data, escape) { return '<div>' + escape(data.text) + '</div>'; }
                        }
                    });
                }
                var filterCheck = document.getElementById('exclude-existing-check');
                if (filterCheck) { filterCheck.addEventListener('change', refreshAppOptions); }
            });
            function refreshAppOptions() {
                if (!tsControl) return;
                var exclude = document.getElementById('exclude-existing-check').checked;
                tsControl.clearOptions();
                var optionsToShow = ALL_APPS;
                if (exclude) { optionsToShow = ALL_APPS.filter(function(app) { return !currentExistingIds.includes(app.value); }); }
                tsControl.addOption(optionsToShow);
                tsControl.refreshOptions(false); 
            }
            window.toggleAllCheckboxes = function(source) {
                var checkboxes = document.querySelectorAll('.user-check');
                for(var i=0; i<checkboxes.length; i++) { checkboxes[i].checked = source.checked; }
            };
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
                    setTimeout(function() { var closeBtn = document.getElementById('modal-close-btn'); if(closeBtn) closeBtn.focus(); }, 50);
                }
                if (tsControl) tsControl.clear();
                var validFrom = document.getElementById('perm-valid-from');
                if(validFrom) validFrom.value = new Date().toISOString().split('T')[0];
                var validTo = document.getElementById('perm-valid-to');
                if(validTo) validTo.value = '';
                window.resetGrantButton();
                fetch('/admin/api/user-details/' + id + '?t=' + new Date().getTime())
                    .then(function(r) { return r.json(); })
                    .then(function(data) {
                        var emailEl = document.getElementById('modal-user-email');
                        if(emailEl) emailEl.innerText = data.email;
                        var groupSel = document.getElementById('modal-group-select');
                        if(groupSel) groupSel.value = data.group_id || '';
                        window.renderPerms(data.permissions);
                        currentUserPermissions = data.permissions;
                        currentExistingIds = data.permissions.map(function(p) { return p.app_id; });
                        refreshAppOptions();
                    })
                    .catch(function(e) { console.error(e); });
            };
            window.closeUserModal = function() { if(modal) modal.close(); window.resetGrantButton(); };
            window.resetGrantButton = function() {
                var btn = document.getElementById('btn-grant-perm');
                if(btn) { btn.innerHTML = '<span class="material-symbols-outlined">add</span> <span>' + (i18n.btnGrant || 'Grant') + '</span>'; }
                if(tsControl) { tsControl.settings.maxItems = null; tsControl.refreshOptions(); }
            };
            window.highlightGrantForm = function() {
                var btn = document.getElementById('btn-grant-perm');
                if(btn) { btn.innerHTML = '<span class="material-symbols-outlined">edit</span> <span>' + (i18n.btnChange || '変更') + '</span>'; btn.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
            };
            window.editPerm = function(appId, startTs, endTs) {
                var filterCheck = document.getElementById('exclude-existing-check');
                if(filterCheck && filterCheck.checked) { filterCheck.checked = false; refreshAppOptions(); }
                if (tsControl) { tsControl.setValue([appId]); }
                var validFrom = document.getElementById('perm-valid-from');
                if(validFrom) validFrom.value = new Date(startTs * 1000).toISOString().split('T')[0];
                var validTo = document.getElementById('perm-valid-to');
                if(validTo) { var isForever = endTs > 2000000000; validTo.value = isForever ? '' : new Date(endTs * 1000).toISOString().split('T')[0]; }
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
                    var dateHtml = dateStrStart + ' ～ ' + (isForever ? (i18n.termForever || 'Forever') : dateStrEnd);
                    var sourceIcon = p.source === 'group' ? 'domain' : 'person';
                    var sourceColor = p.source === 'group' ? '#64748b' : 'var(--primary)';
                    meta.innerHTML = '<span class="material-symbols-outlined" style="font-size:16px; color:'+sourceColor+'">' + sourceIcon + '</span> ' + dateHtml;
                    if(p.is_override) meta.innerHTML += ' <span style="color:#d97706; margin-left:4px;">⚠</span>';
                    left.appendChild(meta);
                    row.appendChild(left);
                    var right = document.createElement('div');
                    if (p.source === 'user') {
                        var btnEdit = document.createElement('button');
                        btnEdit.className = 'action-btn';
                        btnEdit.innerHTML = '<span class="material-symbols-outlined">edit</span>';
                        btnEdit.onclick = function() { window.editPerm(p.app_id, p.valid_from, p.valid_to); };
                        right.appendChild(btnEdit);
                        var btnRevoke = document.createElement('button');
                        btnRevoke.className = 'action-btn delete';
                        btnRevoke.innerHTML = '<span class="material-symbols-outlined">delete</span>';
                        btnRevoke.onclick = function() { window.revokePerm(p.id); };
                        right.appendChild(btnRevoke);
                    } else {
                        right.innerHTML = '<span class="material-symbols-outlined" style="color:#cbd5e1;">lock</span>';
                    }
                    row.appendChild(right);
                    item.appendChild(row);
                    container.appendChild(item);
                });
            };
            window.calcDate = function(targetId, offset, unit) {
                var d = new Date();
                if (unit === 'forever') { var el = document.getElementById(targetId); if(el) el.value = ''; return; }
                if (unit === 'year') { d.setFullYear(d.getFullYear() + offset); } else if (unit === 'month') { d.setMonth(d.getMonth() + offset); } else if (unit === 'day') { d.setDate(d.getDate() + offset); }
                var el = document.getElementById(targetId); if(el) el.value = d.toISOString().split('T')[0];
            };
            window.grantPermission = function() {
                var dateVal = document.getElementById('perm-valid-to').value;
                var startVal = document.getElementById('perm-valid-from').value;
                var dateStrStart = new Date(startVal).toLocaleDateString();
                var dateStrEnd = dateVal ? new Date(dateVal).toLocaleDateString() : (i18n.termForever || 'Forever');
                var appIds = [];
                if (tsControl) { appIds = tsControl.getValue(); if (!Array.isArray(appIds)) appIds = [appIds]; } 
                else { var appSelect = document.getElementById('perm-app-id'); if (appSelect.value) appIds = [appSelect.value]; }
                appIds = appIds.filter(function(id) { return id !== ''; });
                // Use i18n for alert
                if(appIds.length === 0) { alert(i18n.alertSelectApp || 'Select at least one App'); return; }
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
                    var msgTemplate = i18n.msgOverwriteConfirm || 'Overwrite?\\n{list}';
                    var listStr = warningMessages.join('\\n');
                    var msg = msgTemplate.replace('{start}', dateStrStart).replace('{end}', dateStrEnd).replace('{list}', listStr);
                    if (!confirm(msg)) return;
                }
                var validTo = dateVal ? Math.floor(new Date(dateVal).getTime()/1000) : Math.floor(Date.now()/1000) + 315360000;
                var validFrom = startVal ? Math.floor(new Date(startVal).getTime()/1000) : Math.floor(Date.now()/1000);
                fetch('/admin/api/user/permission/grant', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ user_id: currentUserId, app_ids: appIds, valid_from: validFrom, valid_to: validTo }) })
                .then(function(r) { return r.json(); })
                .then(function() { window.openUserModal(currentUserId); window.resetGrantButton(); })
                .catch(function(e) { 
                    console.error(e); 
                    // Use i18n for alert
                    var tmpl = i18n.alertError || 'Error: {message}';
                    alert(tmpl.replace('{message}', e)); 
                });
            };
            window.revokePerm = function(pid) {
                if(!confirm(i18n.msgRevoke || 'Revoke?')) return;
                fetch('/admin/api/user/permission/revoke', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({id: pid}) })
                .then(function() { window.openUserModal(currentUserId); });
            };
            window.updateUserGroup = function() {
                var gid = document.getElementById('modal-group-select').value;
                fetch('/admin/api/user/group', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({user_id: currentUserId, group_id: gid}) })
                .then(function(r) { if (!r.ok) { return r.json().catch(function(){ return {}; }).then(function(err) { throw new Error(err.error || 'Server returned ' + r.status); }); } return r.json(); })
                .then(function() { window.closeUserModal(); window.location.reload(); })
                .catch(function(e) { 
                    // Use i18n for alert
                    var tmpl = i18n.alertUpdateFail || 'Update failed: {message}';
                    alert(tmpl.replace('{message}', e.message)); 
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

      <div class="grid">
        <hgroup>
          <h2 style="margin-bottom:0; font-size:1.5rem;">${t.section_users}</h2>
          <h3 style="font-size:1rem; font-weight:normal; color:#64748b;">${t.header_invite}</h3>
        </hgroup>
        <div style="text-align:right; display: flex; justify-content: flex-end; align-items: start;">
           <button type="button" id="toggleBulkMode" class="btn-glass" style="width: auto; margin-bottom: 0;">
                <span class="material-symbols-outlined">bolt</span> ${t.btn_bulk_mode}
           </button>
           <button onclick="document.getElementById('invite-modal').showModal()" style="width: auto; margin-bottom: 0; margin-left: 1rem; display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem;">
                <span class="material-symbols-outlined">add</span> ${t.header_invite}
           </button>
        </div>
      </div>
      
      ${props.error ? html`<article style="background:#ffebee; color:#c62828; border-left:4px solid #c62828; margin-bottom:1rem;">${props.error}</article>` : ''}

      <dialog id="invite-modal">
        <article>
          <header class="modal-header">
            <div class="modal-title">${t.header_invite}</div>
            <a href="#close" aria-label="Close" class="action-btn" onclick="this.closest('dialog').close()">
                <span class="material-symbols-outlined">close</span>
            </a>
          </header>
          <div class="modal-body">
              <form method="POST" action="/admin/invite">
                <div class="grid-vertical">
                    <label style="margin-bottom:0; width:100%;">
                        <span class="form-label">${t.email}</span>
                        <input type="email" name="email" placeholder="${t.placeholder_invite_email}" required />
                    </label>
                    <button type="submit" id="btn-grant-perm">
                        <span class="material-symbols-outlined">send</span> ${t.btn_generate_invite}
                    </button>
                </div>
              </form>
              ${props.inviteUrl ? html`
                <div style="background:#e8f5e9; padding:1rem; border-radius:8px; margin-top:1.5rem; border:1px solid #bbf7d0;">
                    <strong style="color:#15803d;">${t.invite_created}</strong><br>
                    <small style="color:#166534;">${t.invite_copy_hint}</small><br>
                    <input type="text" value="${props.inviteUrl}" readonly onclick="this.select()" style="margin-top:0.5rem; background:white;" />
                </div>
              `: ''}
          </div>
        </article>
      </dialog>

      <hr />

      <form id="bulkForm" method="POST" action="/admin/users/bulk">
        <div id="bulkControls" style="display:none; background:#f0f7ff; padding:1rem; border-radius:8px; margin-bottom:1rem; border:1px solid #cce5ff;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1rem;">
                <h4 style="margin:0; font-size:1.1rem; color:#0369a1;">${t.btn_bulk_mode}</h4>
                <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer;">
                    <input type="checkbox" onclick="toggleAllCheckboxes(this)" style="margin:0; width:1.2em; height:1.2em;">
                    <small>Select All</small>
                </label>
            </div>
            <div class="grid">
                <label>
                    <span class="form-label">${t.modal_section_group}</span>
                    <select name="group_id">
                        <option value="">(No Change)</option>
                        <option value="__CLEAR__">${t.no_affiliation}</option>
                        ${props.groups.map(g => html`<option value="${g.id}">${g.name}</option>`)}
                    </select>
                </label>
                <label>
                    <span class="form-label">${t.modal_section_add}</span>
                    <select name="app_id">
                        <option value="">(None)</option>
                        ${props.apps.map(a => html`<option value="${a.id}">${a.name}</option>`)}
                    </select>
                </label>
            </div>
            <button type="submit" style="width: auto; min-width: 150px; margin-top:1rem; background:#0284c7; border:none;">
                <span class="material-symbols-outlined" style="margin-right: 4px;">done_all</span> ${t.btn_bulk_apply}
            </button>
        </div>

        <h3 style="font-size:1.2rem; font-weight:600; margin-bottom:1rem;">${t.header_registered_users}</h3>
        
        <div class="list-grid">
            ${props.users.map((u) => {
            const g = props.groups.find(x => x.id === u.group_id)
            const gName = g ? g.name : t.no_affiliation
            return html`
            <div class="list-card" onclick="openUserModal('${u.id}')">
                <div style="display:flex; align-items:center; gap:1rem; flex-grow:1;">
                    <div class="col-select" style="display:none;" onclick="event.stopPropagation()">
                        <input type="checkbox" name="ids" value="${u.id}" class="user-check" style="margin:0; width:1.2em; height:1.2em;" />
                    </div>
                    <div>
                        <div class="item-title">${u.email}</div>
                        <div class="item-sub">
                            <span class="material-symbols-outlined" style="font-size:16px;">group</span>
                            ${gName}
                        </div>
                    </div>
                </div>
                <div>
                     <button type="button" class="action-btn delete" onclick="event.stopPropagation(); deleteUser('${u.id}')" title="${t.delete}">
                        <span class="material-symbols-outlined">delete</span>
                     </button>
                </div>
            </div>
            `})}
        </div>
      </form>

      <form id="delete-user-form" method="POST" action="/admin/users/delete">
        <input type="hidden" name="id" value="" />
      </form>

      <dialog id="user-modal">
        <article>
          <header class="modal-header">
            <div class="modal-title">${t.header_user_details} <span id="modal-user-email" style="font-weight:400; font-size:1rem; color:#64748b; margin-left:0.5rem;"></span></div>
            <a href="#close" id="modal-close-btn" aria-label="Close" class="action-btn" onclick="closeUserModal()">
                <span class="material-symbols-outlined">close</span>
            </a>
          </header>
          
          <div class="modal-body">
              <div style="margin-bottom: 2rem;">
                <label class="form-label">${t.modal_section_group}</label>
                <div style="display: flex; gap: 0.5rem; align-items: stretch;">
                    <select id="modal-group-select" style="flex-grow: 1; margin-bottom: 0;">
                        <option value="">${t.no_affiliation}</option>
                        ${props.groups.map(g => html`<option value="${g.id}">${g.name}</option>`)}
                    </select>
                    <button type="button" class="outline" onclick="updateUserGroup()" style="width: auto; padding:0 1.5rem; background:white; border:1px solid #cbd5e1; color:#475569;">
                        ${t.save}
                    </button> 
                </div>
                <small style="color:#94a3b8; margin-top:0.4rem; display:block;">${t.desc_group_override}</small>
              </div>

              <h4 style="font-size:1.1rem; margin-bottom:1rem; font-weight:600; color:#334155;">${t.tab_permissions}</h4>
              
              <div id="grant-form-card">
                <div style="margin-bottom: 1.5rem;">
                   <label class="form-label">${t.label_app}</label>
                   <select id="perm-app-id" multiple autocomplete="off" placeholder="アプリを選択..."></select>
                   <label class="checkbox-label">
                       <input type="checkbox" id="exclude-existing-check" />
                       登録されているものは含まない
                   </label>
                </div>

                <div style="display:grid; grid-template-columns: 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
                     <div>
                          <label class="form-label">
                            ${t.label_valid_from} <span style="font-weight:normal; color:#94a3b8; font-size:0.85em;">(開始予定日)</span>
                          </label>
                          <input type="date" id="perm-valid-from" />
                          <div class="quick-btn-group">
                              <button type="button" class="quick-btn" onclick="calcDate('perm-valid-from', -1, 'month')">-1ヶ月</button>
                              <button type="button" class="quick-btn" onclick="calcDate('perm-valid-from', -7, 'day')">-1週間</button>
                              <button type="button" class="quick-btn" onclick="calcDate('perm-valid-from', -1, 'day')">-1日</button>
                              <button type="button" class="quick-btn" onclick="calcDate('perm-valid-from', 0, 'day')">${t.btn_date_today}</button>
                          </div>
                     </div>
                     <div>
                         <label class="form-label">${t.label_valid_to}</label>
                         <input type="date" id="perm-valid-to" />
                         <div class="quick-btn-group">
                              <button type="button" class="quick-btn" onclick="calcDate('perm-valid-to', 0, 'day')">${t.btn_date_today}</button>
                              <button type="button" class="quick-btn" onclick="calcDate('perm-valid-to', 1, 'month')">${t.btn_term_1mo}</button>
                              <button type="button" class="quick-btn" onclick="calcDate('perm-valid-to', 1, 'year')">${t.btn_term_1yr}</button>
                              <button type="button" class="quick-btn" onclick="calcDate('perm-valid-to', 99, 'forever')">${t.btn_term_forever}</button>
                         </div>
                     </div>
                 </div>

                 <button type="button" id="btn-grant-perm" onclick="grantPermission()">
                     <span class="material-symbols-outlined">add</span>
                     <span>${t.btn_grant}</span>
                 </button>
              </div>

              <div id="modal-perm-list"></div>
          </div>
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
