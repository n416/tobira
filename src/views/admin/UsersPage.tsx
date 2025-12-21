import { html, raw } from 'hono/html'
import { css, keyframes } from 'hono/css'
import { Layout } from './Layout'
import { dict } from '../../i18n'
import { User, App, Group, SystemConfig } from '../../types'
import { Modal } from '../components/Modal'
import { Button } from '../components/Button'
import { MultiSelect } from '../components/MultiSelect'

interface Props {
    t: typeof dict.en
    userEmail: string
    users: (User & { group_name?: string })[]
    apps: App[]
    groups: Group[]
    inviteUrl?: string
    error?: string
    siteName: string
    appConfig: SystemConfig
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
            } catch(e) { console.error(e); }
            var tsControl = null;
            var currentExistingIds = []; 
            var currentUserPermissions = []; 
            
            // Global state for bulk mode
            window.isBulkMode = false;

            document.addEventListener('DOMContentLoaded', function() {
                if (typeof TomSelect !== 'undefined') {
                    tsControl = new TomSelect('#perm-app-id', { 
                        plugins: ['remove_button'], 
                        create: false, 
                        maxItems: null, 
                        placeholder: i18n.placeholderSelect || 'Select...',
                        render: {
                            option: function(data, escape) { return '<div>' + escape(data.text) + '</div>'; },
                            item: function(data, escape) { return '<div>' + escape(data.text) + '</div>'; },
                            no_results: function(data, escape) {
                                return '<div class="no-results">' + (i18n.textNoResults || 'No results found') + '</div>';
                            }
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
            window.handleUserCardClick = function(e, id) {
                if (e.target.closest('button') || e.target.closest('a') || e.target.tagName === 'INPUT') return;

                if (window.isBulkMode) {
                    var cb = document.querySelector('input.user-check[value="' + id + '"]');
                    if (cb) cb.checked = !cb.checked;
                } else {
                    window.openUserModal(id);
                }
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
                    setTimeout(function() { var closeBtn = document.getElementById('modal-close-btn'); if(closeBtn) { closeBtn.focus(); closeBtn.blur(); closeBtn.focus(); } }, 50);
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
                var card = document.getElementById('grant-form-card');
                if(card) { card.classList.remove('blink-active'); }
                if(tsControl) { tsControl.settings.maxItems = null; tsControl.refreshOptions(); }
            };
            window.highlightGrantForm = function() {
                var btn = document.getElementById('btn-grant-perm');
                if(btn) { btn.innerHTML = '<span class="material-symbols-outlined">edit</span> <span>' + (i18n.btnChange || '変更') + '</span>'; btn.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
                
                var card = document.getElementById('grant-form-card');
                if(card) { 
                    card.classList.remove('blink-active'); 
                    void card.offsetWidth;
                    card.classList.add('blink-active'); 
                }
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
                    row.style.alignItems = 'center'; // Center vertically
                    
                    var left = document.createElement('div');
                    left.style.display = 'flex';
                    left.style.flexDirection = 'column';
                    left.style.gap = '0.2rem';
                    
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
                    var sourceText = p.source === 'group' ? (i18n.sourceGroup || 'Group') : (i18n.sourceUser || 'User');
                    var sourceColor = p.source === 'group' ? '#94a3b8' : 'var(--primary)';
                    
                    meta.innerHTML = '<div style="display:flex; align-items:center; gap:0.5rem;"><span class="material-symbols-outlined" style="font-size:18px; color:'+sourceColor+'">' + sourceIcon + '</span> ' + sourceText + ' : ' + dateHtml + '</div>';
                    if(p.is_override) meta.innerHTML += ' <span style="color:#d97706; margin-left:4px;">⚠</span>';
                    left.appendChild(meta);
                    
                    row.appendChild(left);
                    
                    var right = document.createElement('div');
                    right.style.display = 'flex';
                    right.style.gap = '0.5rem';
                    right.style.alignItems = 'center';
                    
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
                    var msgTemplate = i18n.msgOverwriteConfirm || 'Overwrite?\\\\n{list}';
                    var listStr = warningMessages.join('\\\\n');
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
                    var tmpl = i18n.alertUpdateFail || 'Update failed: {message}';
                    alert(tmpl.replace('{message}', e.message)); 
                    console.error(e);
                });
            };
            var btn = document.getElementById('toggleBulkMode');
            var controls = document.getElementById('bulkControls');
            var selectAllContainer = document.getElementById('selectAllContainer');
            
            if(btn) {
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    window.isBulkMode = !window.isBulkMode;
                    
                    var iconName = window.isBulkMode ? 'close' : 'bolt';
                    var text = window.isBulkMode ? (i18n.btnExit || 'Exit') : (i18n.btnEnter || 'Bulk Mode');
                    
                    btn.innerHTML = '<span class="material-symbols-outlined">' + iconName + '</span> ' + text;
                    
                    if(controls) controls.style.display = window.isBulkMode ? 'block' : 'none';
                    if(selectAllContainer) selectAllContainer.style.display = window.isBulkMode ? 'block' : 'none';
                    
                    document.querySelectorAll('.col-select').forEach(function(el) { el.style.display = window.isBulkMode ? 'table-cell' : 'none'; });
                });
            }
        })();
    `);

    const blinkActive = keyframes`
        0% { border-color: #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        50% { border-color: var(--primary); box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.2); }
        100% { border-color: #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    `

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
            outline: 1px solid var(--primary);
        }
    `
    const itemTitle = css`font-weight: 600; font-size: 1rem; color: #1e293b; margin-bottom: 0.2rem;`
    const itemSub = css`font-size: 0.85rem; color: #64748b; display: flex; align-items: center; gap: 0.4rem;`
    const grantFormCard = css`
        background: #ffffff;
        padding: 2rem;
        border-radius: 16px;
        border: 1px solid #e2e8f0;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        margin-bottom: 2rem;
        transition: border-color 0.3s ease, box-shadow 0.3s ease;
        &.blink-active { animation: ${blinkActive} 1s ease-in-out 3; }
    `
    const formLabel = css`display: block; font-weight: 700; font-size: 0.95rem; color: #1e293b; margin-bottom: 0.5rem;`
    const dateInput = css`
        width: 100%; padding: 0.8rem 1rem; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 1rem; color: #334155; transition: all 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        &:focus { border-color: var(--primary); outline: none; box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1); }
    `
    const quickBtnGroup = css`display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; margin-top: 0.75rem;`
    const actionBtn = css`
        background: transparent !important; border: none !important; color: #94a3b8 !important; cursor: pointer !important; padding: 8px !important; border-radius: 50% !important; transition: all 0.2s !important; box-shadow: none !important; display: inline-flex !important; align-items: center !important; justify-content: center !important; width: 36px !important; height: 36px !important; flex-shrink: 0 !important;
        &:hover { background: #f1f5f9 !important; color: var(--text-main) !important; }
    `
    const deleteBtn = css`${actionBtn} &:hover { background: #fef2f2 !important; color: #ef4444 !important; }`
    const checkboxLabel = css`display: flex; align-items: center; gap: 0.5rem; margin-top: 0.75rem; font-size: 0.95rem; color: #475569; cursor: pointer; width: fit-content; & input { width: 1.1em; height: 1.1em; cursor: pointer; }`

    // Styled Select All Label (Button-like)
    const selectAllLabel = css`
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
        padding: 0.4rem 0.8rem;
        border-radius: 8px;
        border: 1px solid #cbd5e1;
        background: #fff;
        transition: all 0.2s;
        font-size: 0.9rem;
        color: #475569;
        font-weight: 500;
        user-select: none;

        &:hover {
            background: #f8fafc;
            border-color: #94a3b8;
        }
        
        & input {
            display: none;
        }
        
        & .icon-box {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 1.1rem;
            height: 1.1rem;
            border-radius: 4px;
            border: 2px solid #cbd5e1;
            background: #fff;
            transition: all 0.2s;
            color: white;
        }

        /* Checked state */
        &:has(input:checked) {
            background: #eff6ff;
            border-color: var(--primary);
            color: var(--primary);
        }

        &:has(input:checked) .icon-box {
            background: var(--primary);
            border-color: var(--primary);
        }
        
        /* Fallback for browsers not supporting :has */
        & input:checked + .icon-box {
            background: var(--primary);
            border-color: var(--primary);
        }
    `

    const pageWrapper = css``

    return Layout({
        t: t,
        userEmail: props.userEmail,
        activeTab: 'users',
        siteName: props.siteName,
        appConfig: props.appConfig,
        children: html`
      <div class="${pageWrapper}">
          <div class="grid">
            <hgroup>
              <h2 style="margin-bottom:0; font-size:1.5rem;">${t.section_users}</h2>
              <h3 style="font-size:1rem; font-weight:normal; color:#64748b;">${t.header_invite}</h3>
            </hgroup>
            <div style="text-align:right; display: flex; justify-content: flex-end; align-items: start;">
               ${Button({
                   id: "toggleBulkMode",
                   variant: "outline",
                   style: "width: auto; margin-bottom: 0;",
                   children: html`<span class="material-symbols-outlined">bolt</span> ${t.btn_bulk_mode}`
               })}
               <button onclick="document.getElementById('invite-modal').showModal()" style="width: auto; margin-bottom: 0; margin-left: 1rem; display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem;">
                    <span class="material-symbols-outlined">add</span> ${t.header_invite}
               </button>
            </div>
          </div>
          
          ${props.error ? html`<article style="background:#ffebee; color:#c62828; border-left:4px solid #c62828; margin-bottom:1rem;">${props.error}</article>` : ''}

          ${Modal({
            id: "invite-modal",
            title: t.header_invite,
            closeAction: "this.closest('dialog').close()",
            children: html`
                  <form method="POST" action="/admin/invite">
                    <div class="grid-vertical">
                        <label style="margin-bottom:0; width:100%;">
                            <span class="${formLabel}">${t.email}</span>
                            <input type="email" name="email" placeholder="${t.placeholder_invite_email}" required />
                        </label>
                        <div style="margin-top:1rem;">
                            ${Button({ type: "submit", children: html`<span class="material-symbols-outlined">send</span> ${t.btn_generate_invite}` })}
                        </div>
                    </div>
                  </form>
                  ${props.inviteUrl ? html`
                    <div style="background:#e8f5e9; padding:1rem; border-radius:8px; margin-top:1.5rem; border:1px solid #bbf7d0;">
                        <strong style="color:#15803d;">${t.invite_created}</strong><br>
                        <small style="color:#166534;">${t.invite_copy_hint}</small><br>
                        <input type="text" value="${props.inviteUrl}" readonly onclick="this.select()" style="margin-top:0.5rem; background:white;" />
                    </div>
                  `: ''}
            `
          })}

          <hr />

          <form id="bulkForm" method="POST" action="/admin/users/bulk">
            <div id="bulkControls" style="display:none; background:#f0f7ff; padding:1rem; border-radius:8px; margin-bottom:1rem; border:1px solid #cce5ff;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1rem;">
                    <h4 style="margin:0; font-size:1.1rem; color:#0369a1;">${t.btn_bulk_mode}</h4>
                </div>
                <div class="grid">
                    <label>
                        <span class="${formLabel}">${t.modal_section_group}</span>
                        <select name="group_id">
                            <option value="">(No Change)</option>
                            <option value="__CLEAR__">${t.no_affiliation}</option>
                            ${props.groups.map(g => html`<option value="${g.id}">${g.name}</option>`)}
                        </select>
                    </label>
                    <label>
                        <span class="${formLabel}">${t.modal_section_add}</span>
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

            <div style="margin-bottom:1rem;">
                <h3 style="font-size:1.2rem; font-weight:600; margin-bottom:0.5rem;">${t.header_registered_users}</h3>
                
                <div id="selectAllContainer" style="display:none; margin-top: 0.5rem; margin-left: 0.7rem;">
                    <label class="${selectAllLabel}">
                        <input type="checkbox" onclick="toggleAllCheckboxes(this)">
                        <span class="icon-box">
                            <span class="material-symbols-outlined" style="font-size: 16px;">check</span>
                        </span>
                        <span>Select All</span>
                    </label>
                </div>
            </div>
            
            <div class="${listGrid}">
                ${props.users.map((u) => {
                const g = props.groups.find(x => x.id === u.group_id)
                const gName = g ? g.name : t.no_affiliation
                return html`
                <div class="${listCard}" onclick="handleUserCardClick(event, '${u.id}')">
                    <div style="display:flex; align-items:center; gap:1rem; flex-grow:1;">
                        <div class="col-select" style="display:none;" onclick="event.stopPropagation()">
                            <input type="checkbox" name="ids" value="${u.id}" class="user-check" style="margin:0; width:1.2em; height:1.2em;" />
                        </div>
                        <div>
                            <div class="${itemTitle}">${u.email}</div>
                            <div class="${itemSub}">
                                <span class="material-symbols-outlined" style="font-size:16px;">group</span>
                                ${gName}
                            </div>
                        </div>
                    </div>
                    <div>
                         <button type="button" class="${deleteBtn}" onclick="event.stopPropagation(); deleteUser('${u.id}')" title="${t.delete}">
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

          ${Modal({
            id: "user-modal",
            title: html`${t.header_user_details} <span id="modal-user-email" style="font-weight:400; font-size:1rem; color:#64748b; margin-left:0.5rem;"></span>`,
            closeAction: "closeUserModal()",
            closeBtnId: "modal-close-btn",
            children: html`
                  <div style="margin-bottom: 2rem;">
                    <label class="${formLabel}">${t.modal_section_group}</label>
                    <div style="display: flex; gap: 0.5rem; align-items: stretch;">
                        <select id="modal-group-select" style="flex-grow: 1; margin-bottom: 0;">
                            <option value="">${t.no_affiliation}</option>
                            ${props.groups.map(g => html`<option value="${g.id}">${g.name}</option>`)}
                        </select>
                        ${Button({ onclick: "updateUserGroup()", variant: "primary", style: "width:auto; white-space:nowrap; flex-shrink:0;", children: t.save })}
                    </div>
                    <small style="color:#94a3b8; margin-top:0.4rem; display:block;">${t.desc_group_override}</small>
                  </div>

                  <h4 style="font-size:1.1rem; margin-bottom:1rem; font-weight:600; color:#334155;">${t.tab_permissions}</h4>
                  
                  <div id="grant-form-card" class="${grantFormCard}">
                    <div style="margin-bottom: 1.5rem;">
                       <label class="${formLabel}">${t.label_app}</label>
                       ${MultiSelect({
                           id: "perm-app-id",
                           placeholder: t.placeholder_select,
                           options: props.apps.map(a => ({ value: a.id, text: a.name }))
                       })}
                       <label class="${checkboxLabel}">
                           <input type="checkbox" id="exclude-existing-check" />
                           登録されているものは含まない
                       </label>
                    </div>

                    <div style="display:grid; grid-template-columns: 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
                         <div>
                              <label class="${formLabel}">
                                ${t.label_valid_from} <span style="font-weight:normal; color:#94a3b8; font-size:0.85em;">(開始予定日)</span>
                              </label>
                              <input type="date" id="perm-valid-from" class="${dateInput}" />
                              <div class="${quickBtnGroup}">
                                  ${Button({ variant: "outline", onclick: "calcDate('perm-valid-from', -1, 'month')", children: "-1ヶ月", style: "padding:0.6rem 0.5rem; font-size:0.85rem;" })}
                                  ${Button({ variant: "outline", onclick: "calcDate('perm-valid-from', -7, 'day')", children: "-1週間", style: "padding:0.6rem 0.5rem; font-size:0.85rem;" })}
                                  ${Button({ variant: "outline", onclick: "calcDate('perm-valid-from', -1, 'day')", children: "-1日", style: "padding:0.6rem 0.5rem; font-size:0.85rem;" })}
                                  ${Button({ variant: "outline", onclick: "calcDate('perm-valid-from', 0, 'day')", children: t.btn_date_today, style: "padding:0.6rem 0.5rem; font-size:0.85rem;" })}
                              </div>
                         </div>
                         <div>
                             <label class="${formLabel}">${t.label_valid_to}</label>
                             <input type="date" id="perm-valid-to" class="${dateInput}" />
                             <div class="${quickBtnGroup}">
                                  ${Button({ variant: "outline", onclick: "calcDate('perm-valid-to', 0, 'day')", children: t.btn_date_today, style: "padding:0.6rem 0.5rem; font-size:0.85rem;" })}
                                  ${Button({ variant: "outline", onclick: "calcDate('perm-valid-to', 1, 'month')", children: t.btn_term_1mo, style: "padding:0.6rem 0.5rem; font-size:0.85rem;" })}
                                  ${Button({ variant: "outline", onclick: "calcDate('perm-valid-to', 1, 'year')", children: t.btn_term_1yr, style: "padding:0.6rem 0.5rem; font-size:0.85rem;" })}
                                  ${Button({ variant: "outline", onclick: "calcDate('perm-valid-to', 99, 'forever')", children: t.btn_term_forever, style: "padding:0.6rem 0.5rem; font-size:0.85rem;" })}
                             </div>
                         </div>
                     </div>

                     ${Button({ id: "btn-grant-perm", onclick: "grantPermission()", children: html`<span class="material-symbols-outlined">add</span> <span>${t.btn_grant}</span>` })}
                  </div>

                  <div id="modal-perm-list"></div>
            `
          })}

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
            data-placeholder-select="${t.placeholder_select}" 
            data-text-no-results="${t.text_no_results}"
          ></div>
          
          <script type="application/json" id="app-data">${raw(allAppsJson)}</script>

          <script>
          ${scriptContent}
          </script>
      </div>
    `
    })
}
