import { html, raw } from 'hono/html'
import { css, keyframes } from 'hono/css'
import { Layout } from './Layout'
import { dict } from '../../i18n'
import { Group, App } from '../../types'
import { Modal } from '../components/Modal'
import { Button } from '../components/Button'
import { MultiSelect } from '../components/MultiSelect'

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
            
            window.resetGrantButton();

            window.loadGroupPerms(id);
        };
        window.closeGroupModal = function() { 
            if(gModal) gModal.close(); 
            window.resetGrantButton();
        };
        
        window.resetGrantButton = function() {
            var btn = document.getElementById('btn-grant-perm');
            if(btn) { btn.innerHTML = '<span class="material-symbols-outlined">add</span> <span>' + (i18n.btnGrant || 'Grant') + '</span>'; }
            var card = document.getElementById('grant-form-card');
            if(card) { card.classList.remove('blink-active'); }
            if(tsControl) { tsControl.clear(); tsControl.refreshOptions(); }
        };

        window.highlightGrantForm = function() {
            var btn = document.getElementById('btn-grant-perm');
            if(btn) { 
                btn.innerHTML = '<span class="material-symbols-outlined">edit</span> <span>' + (i18n.btnChange || 'Change') + '</span>'; 
                btn.scrollIntoView({ behavior: 'smooth', block: 'center' }); 
            }
            
            var card = document.getElementById('grant-form-card');
            if(card) { 
                card.classList.remove('blink-active'); 
                void card.offsetWidth;
                card.classList.add('blink-active'); 
            }
        };

        window.editGroupPerm = function(appId, startTs, endTs) {
            if (tsControl) { tsControl.setValue([appId]); }
            var validFrom = document.getElementById('g-perm-valid-from');
            if(validFrom) validFrom.value = new Date(startTs * 1000).toISOString().split('T')[0];
            var validTo = document.getElementById('g-perm-valid-to');
            if(validTo) { 
                var isForever = endTs > 2000000000; 
                validTo.value = isForever ? '' : new Date(endTs * 1000).toISOString().split('T')[0]; 
            }
            window.highlightGrantForm();
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
                meta.innerHTML = '<div style="display:flex; align-items:center; gap:0.5rem;"><span class="material-symbols-outlined" style="font-size:16px; margin-right:4px;">date_range</span> ' + dateStrStart + ' ～ ' + (isForever ? (i18n.termForever || 'Forever') : dateStrEnd) + '</div>';
                left.appendChild(meta);
                
                row.appendChild(left);
                
                var right = document.createElement('div');
                right.style.display = 'flex';
                right.style.gap = '0.5rem';
                right.style.alignItems = 'center';
                
                // Edit Button
                var btnEdit = document.createElement('button');
                btnEdit.className = 'action-btn';
                btnEdit.innerHTML = '<span class="material-symbols-outlined">edit</span>';
                btnEdit.onclick = function() { window.editGroupPerm(p.app_id, p.valid_from, p.valid_to); };
                right.appendChild(btnEdit);

                // Revoke Button
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
            .then(function() { 
                window.loadGroupPerms(currentGroupId); 
                window.resetGrantButton(); 
            });
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
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        border-color: var(--primary);
        transform: translateY(-1px);
    }
  `

  const itemTitle = css`font-weight: 600; font-size: 1rem; color: #1e293b; margin-bottom: 0.2rem;`
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

  const grantFormCard = css`
    background: #ffffff;
    padding: 2rem;
    border-radius: 16px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    margin-bottom: 2rem;
    transition: border-color 0.3s ease, box-shadow 0.3s ease;
    &.blink-active {
        animation: ${blinkActive} 1s ease-in-out 3;
    }
  `
  
  const formLabel = css`
    display: block;
    font-weight: 700;
    font-size: 0.95rem;
    color: #1e293b;
    margin-bottom: 0.5rem;
  `

  const dateInput = css`
    width: 100%;
    padding: 0.8rem 1rem;
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    font-size: 1rem;
    color: #334155;
    transition: all 0.2s;
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    &:focus {
        border-color: var(--primary);
        outline: none;
        box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
    }
  `

  const quickBtnGroup = css`
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.75rem;
    margin-top: 0.75rem;
  `

  const pageWrapper = css``

  return Layout({
    t: t,
    userEmail: props.userEmail,
    activeTab: 'groups',
    children: html`
      <div class="${pageWrapper}">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
            <h2 style="margin-bottom: 0;">${t.section_groups}</h2>
            <button onclick="document.getElementById('new-group-modal').showModal()" style="width: auto; margin-bottom: 0; padding: 0.5rem 1rem; font-size: 0.9rem; display: inline-flex; align-items: center; gap: 0.5rem; background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%); color:white; border:none; border-radius:12px; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);">
                <span class="material-symbols-outlined" style="font-size:18px;">add</span> ${t.btn_add_group}
            </button>
          </div>

          ${Modal({
            id: "new-group-modal",
            title: t.header_new_group,
            closeAction: "this.closest('dialog').close()",
            children: html`
                  <form method="POST" action="/admin/groups">
                    <div class="grid-vertical">
                        <label style="width:100%;">
                          <span class="${formLabel}">${t.label_group_name}</span>
                          <input type="text" name="name" placeholder="${t.placeholder_group_name}" required style="margin-top:0.2rem;" />
                        </label>
                        <div style="margin-top:1rem;">
                            ${Button({ type: "submit", children: t.btn_add_group })}
                        </div>
                    </div>
                  </form>
            `
          })}

          <hr />

          <div class="${listGrid}">
            ${props.groups.length === 0 ? html`<div style="text-align:center; padding:2rem; color:#94a3b8;">${t.no_groups}</div>` : ''}
            ${props.groups.map((g) => {
                return html`
              <div class="${listCard}" onclick="openGroupModal('${g.id}', '${g.name}')">
                <div style="flex-grow:1;">
                    <div class="${itemTitle}">${g.name}</div>
                </div>
                <div>
                    <form method="POST" action="/admin/groups/delete" style="margin:0;" onsubmit="return confirm('${t.confirm_delete_group.replace(/\n/g, '\\n')}')" onclick="event.stopPropagation()">
                         <input type="hidden" name="id" value="${g.id}" />
                         <button class="${deleteBtn}" title="${t.delete}">
                            <span class="material-symbols-outlined">delete</span>
                         </button>
                    </form>
                </div>
              </div>
            `})}
          </div>

          ${Modal({
            id: "group-modal",
            title: html`${t.modal_section_group}: <span id="modal-group-name" style="font-weight:400; color:#64748b; margin-left:0.5rem;"></span>`,
            closeAction: "closeGroupModal()",
            closeBtnId: "modal-close-btn",
            children: html`
                 <div id="grant-form-card" class="${grantFormCard}">
                    <div style="margin-bottom: 1.5rem;">
                       <label class="${formLabel}">${t.modal_label_app}</label>
                       ${MultiSelect({
                           id: "g-perm-app-id",
                           placeholder: t.placeholder_select,
                           options: props.apps.map(a => ({ value: a.id, text: a.name }))
                       })}
                    </div>

                    <div style="display:grid; grid-template-columns: 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
                         <div>
                              <label class="${formLabel}">
                                ${t.label_valid_from} <span style="font-weight:normal; color:#94a3b8; font-size:0.85em;">(開始予定日)</span>
                              </label>
                              <input type="date" id="g-perm-valid-from" class="${dateInput}" />
                              <div class="${quickBtnGroup}">
                                  ${Button({ variant: "outline", onclick: "calcGroupDate('g-perm-valid-from', -1, 'month')", children: "-1ヶ月", style: "padding:0.6rem 0.5rem; font-size:0.85rem;" })}
                                  ${Button({ variant: "outline", onclick: "calcGroupDate('g-perm-valid-from', -7, 'day')", children: "-1週間", style: "padding:0.6rem 0.5rem; font-size:0.85rem;" })}
                                  ${Button({ variant: "outline", onclick: "calcGroupDate('g-perm-valid-from', -1, 'day')", children: "-1日", style: "padding:0.6rem 0.5rem; font-size:0.85rem;" })}
                                  ${Button({ variant: "outline", onclick: "calcGroupDate('g-perm-valid-from', 0, 'day')", children: t.btn_date_today, style: "padding:0.6rem 0.5rem; font-size:0.85rem;" })}
                              </div>
                         </div>
                         <div>
                             <label class="${formLabel}">${t.label_valid_to}</label>
                             <input type="date" id="g-perm-valid-to" class="${dateInput}" />
                             <div class="${quickBtnGroup}">
                                  ${Button({ variant: "outline", onclick: "calcGroupDate('g-perm-valid-to', 0, 'day')", children: t.btn_date_today, style: "padding:0.6rem 0.5rem; font-size:0.85rem;" })}
                                  ${Button({ variant: "outline", onclick: "calcGroupDate('g-perm-valid-to', 1, 'month')", children: t.btn_term_1mo, style: "padding:0.6rem 0.5rem; font-size:0.85rem;" })}
                                  ${Button({ variant: "outline", onclick: "calcGroupDate('g-perm-valid-to', 1, 'year')", children: t.btn_term_1yr, style: "padding:0.6rem 0.5rem; font-size:0.85rem;" })}
                                  ${Button({ variant: "outline", onclick: "calcGroupDate('g-perm-valid-to', 99, 'forever')", children: t.btn_term_forever, style: "padding:0.6rem 0.5rem; font-size:0.85rem;" })}
                             </div>
                         </div>
                    </div>

                    ${Button({ id: "btn-grant-perm", onclick: "grantGroupPermission()", children: html`<span class="material-symbols-outlined">add</span> <span>${t.btn_grant}</span>` })}
                 </div>
                 
                 <h4 style="font-size:1.1rem; margin:2rem 0 1rem; font-weight:600; color:#334155;">${t.header_active_permissions}</h4>
                 
                 <div id="modal-g-perm-list"></div>
            `
          })}

          <div id="i18n-data" style="display:none;"
            data-msg-revoke="${t.confirm_revoke_permission}"
            data-term-forever="${t.btn_term_forever}"
            data-msg-overwrite-confirm="${t.confirm_overwrite}"
            data-alert-select-app="${t.alert_select_app}"
            data-alert-update-fail="${t.alert_update_fail}"
            data-alert-error="${t.alert_error}"
            data-placeholder-select="${t.placeholder_select}" 
            data-btn-grant="${t.btn_grant}"
            data-btn-change="${t.btn_change || 'Change'}"
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
