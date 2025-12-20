import { html } from 'hono/html'
import { Layout } from './Layout'
import { dict } from '../../i18n'
import { User, App, Group } from '../../types'

interface Props {
  t: typeof dict.en
  userEmail: string
  users: (User & {group_name?: string})[]
  apps: App[]
  groups: Group[]
  inviteUrl?: string
  error?: string
}

export const UsersPage = (props: Props) => {
  const t = props.t
  return Layout({
    t: t,
    userEmail: props.userEmail,
    activeTab: 'users',
    children: html`
      <div class="grid">
        <hgroup>
          <h2>${t.section_users}</h2>
          <h3>${t.header_invite}</h3>
        </hgroup>
        <div style="text-align:right">
           <button type="button" id="toggleBulkMode" class="outline">${t.btn_bulk_mode}</button>
        </div>
      </div>
      
      ${props.error ? html`<article style="background:#ffebee; color:#c62828; border-left:4px solid #c62828;">${props.error}</article>` : ''}

      <article>
        <form method="POST" action="/admin/invite">
            <div class="grid">
                <input type="email" name="email" placeholder="${t.placeholder_invite_email}" required />
                <button type="submit">${t.btn_generate_invite}</button>
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
            <div class="grid" style="margin-top:1rem;">
                <button type="submit">${t.btn_bulk_apply}</button>
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
                    <tr>
                        <td style="display:none;" class="col-select">
                            <input type="checkbox" name="user_ids" value="${u.id}" class="user-check">
                        </td>
                        <td>${u.email}</td>
                        <td>${gName}</td>
                        <td>
                            <div class="grid" style="grid-template-columns: auto auto; gap: 0.5rem;">
                                <button class="outline" style="padding:0.2rem 0.5rem; font-size:0.8rem;" 
                                    type="button" onclick="event.preventDefault(); openUserModal('${u.id}')">${t.edit}</button>
                                
                                <button type="button" class="outline secondary" style="padding:0.2rem 0.5rem; font-size:0.8rem; border-color:#d32f2f; color:#d32f2f;" onclick="deleteUser('${u.id}')">${t.delete}</button>
                            </div>
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
        <article style="width: 100%; max-width: 800px;">
          <header>
            <a href="#close" aria-label="Close" class="close" onclick="closeUserModal()"></a>
            ${t.header_user_details} <span id="modal-user-email"></span>
          </header>
          
          <div class="grid">
            <div>
                <label>${t.modal_section_group}</label>
                <div class="grid">
                    <select id="modal-group-select">
                        <option value="">${t.no_affiliation}</option>
                        ${props.groups.map(g => html`<option value="${g.id}">${g.name}</option>`)}
                    </select>
                    <button type="button" class="outline" onclick="updateGroup()">${t.save}</button>
                </div>
            </div>
          </div>

          <hr>
          
          <h4>${t.tab_permissions}</h4>
          
          <details>
            <summary>${t.modal_section_add}</summary>
            <div class="grid">
                <label>
                    ${t.modal_label_app}
                    <select id="perm-app-id" multiple style="height:120px">
                        ${props.apps.map(a => html`<option value="${a.id}">${a.name}</option>`)}
                    </select>
                </label>
                <div>
                    <label>${t.label_valid_to}</label>
                    <input type="date" id="perm-valid-to" />
                    <div class="grid">
                        <button type="button" class="outline secondary" onclick="setQuickDate(1)">${t.btn_term_1mo}</button>
                        <button type="button" class="outline secondary" onclick="setQuickDate(12)">${t.btn_term_1yr}</button>
                        <button type="button" class="outline secondary" onclick="setQuickDate(120)">${t.btn_term_forever}</button>
                    </div>
                </div>
            </div>
            <button type="button" onclick="grantPermission()">${t.btn_grant}</button>
          </details>

          <figure>
            <table role="grid">
                <thead>
                    <tr>
                        <th>${t.modal_th_app}</th>
                        <th>${t.modal_th_source}</th>
                        <th>${t.modal_th_valid}</th>
                        <th>${t.modal_th_action}</th>
                    </tr>
                </thead>
                <tbody id="modal-perm-list"></tbody>
            </table>
          </figure>
        </article>
      </dialog>

      <script>
        function deleteUser(id) {
            // @ts-ignore
            if(!confirm('${t.confirm_delete_user}')) return;
            const form = document.getElementById('delete-user-form') as HTMLFormElement;
            const input = form.querySelector('input[name="id"]') as HTMLInputElement;
            input.value = id;
            form.submit();
        }
        const modal = document.getElementById('user-modal');
        let currentUserId = '';

        function openUserModal(id) {
            currentUserId = id;
            modal.setAttribute('open', true);
            fetch('/admin/api/user-details/' + id + '?t=' + new Date().getTime())
                .then(r => r.json())
                .then(data => {
                    document.getElementById('modal-user-email').innerText = data.email;
                    document.getElementById('modal-group-select').value = data.group_id || '';
                    renderPerms(data.permissions);
                });
        }
        function closeUserModal() { modal.removeAttribute('open'); }
        
        // FIX: Replaced template literals with string concatenation to be safe
        function renderPerms(list) {
            const tbody = document.getElementById('modal-perm-list');
            tbody.innerHTML = '';
            list.forEach(p => {
                const tr = document.createElement('tr');
                let html = '<td>' + p.app_name + '</td>';
                html += '<td>';
                // Server-side vars ${t.xxx} are interpolated by Hono. Client-side vars p.xxx are concatenated.
                html += (p.source === 'group' ? '<span data-tooltip="Inherited">🏢 ${t.source_group}</span>' : '👤 ${t.source_user}');
                html += (p.is_override ? '<br><small style="color:orange">${t.msg_override}</small>' : '');
                html += '</td>';
                html += '<td>' + new Date(p.valid_to * 1000).toLocaleDateString() + '</td>';
                html += '<td>';
                if (p.source === 'user') {
                    html += '<button type="button" class="outline secondary" onclick="revokePerm(' + p.id + ')">❌</button>';
                }
                html += '</td>';
                tr.innerHTML = html;
                tbody.appendChild(tr);
            });
        }
        
        function updateGroup() {
            const gid = document.getElementById('modal-group-select').value;
            fetch('/admin/api/user/group', {
                method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({user_id: currentUserId, group_id: gid})
            }).then(() => {
                // 背景のテーブル行（所属カラム）を即座に更新する
                const select = document.getElementById('modal-group-select');
                if (select) {
                    const gName = select.options[select.selectedIndex].text;
                    // このユーザーの編集ボタンを探して、対応する行(tr)を特定する
                    const btn = document.querySelector('button[onclick*="' + currentUserId + '"]');
                    if(btn) {
                        const row = btn.closest('tr');
                        // カラム構成: 0:Checkbox(hidden), 1:Email, 2:Group, 3:Action
                        if(row && row.cells.length > 2) {
                            row.cells[2].innerText = gName;
                        }
                    }
                }
                closeUserModal();
            });
        }
        
        function revokePerm(pid) {
            if(!confirm('Revoke?')) return;
            fetch('/admin/api/user/permission/revoke', {
                method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({id: pid})
            }).then(() => {
                // 背景のテーブル行（所属カラム）を即座に更新する
                const select = document.getElementById('modal-group-select');
                if (select) {
                    const gName = select.options[select.selectedIndex].text;
                    // このユーザーの編集ボタンを探して、対応する行(tr)を特定する
                    const btn = document.querySelector('button[onclick*="' + currentUserId + '"]');
                    if(btn) {
                        const row = btn.closest('tr');
                        // カラム構成: 0:Checkbox(hidden), 1:Email, 2:Group, 3:Action
                        if(row && row.cells.length > 2) {
                            row.cells[2].innerText = gName;
                        }
                    }
                }
                closeUserModal();
            });
        }

        function grantPermission() {
            const apps = Array.from(document.getElementById('perm-app-id').selectedOptions).map(o => o.value);
            const dateVal = document.getElementById('perm-valid-to').value;
            const validTo = dateVal ? Math.floor(new Date(dateVal).getTime()/1000) : Math.floor(Date.now()/1000) + 315360000;
            
            fetch('/admin/api/user/permission/grant', {
                method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({
                    user_id: currentUserId, app_ids: apps, valid_to: validTo
                })
            }).then(() => {
                // 背景のテーブル行（所属カラム）を即座に更新する
                const select = document.getElementById('modal-group-select');
                if (select) {
                    const gName = select.options[select.selectedIndex].text;
                    // このユーザーの編集ボタンを探して、対応する行(tr)を特定する
                    const btn = document.querySelector('button[onclick*="' + currentUserId + '"]');
                    if(btn) {
                        const row = btn.closest('tr');
                        // カラム構成: 0:Checkbox(hidden), 1:Email, 2:Group, 3:Action
                        if(row && row.cells.length > 2) {
                            row.cells[2].innerText = gName;
                        }
                    }
                }
                closeUserModal();
            });
        }
        
        function setQuickDate(months) {
            const d = new Date();
            d.setMonth(d.getMonth() + months);
            document.getElementById('perm-valid-to').value = d.toISOString().split('T')[0];
        }

        const btn = document.getElementById('toggleBulkMode');
        const controls = document.getElementById('bulkControls');
        const cols = document.querySelectorAll('.col-select');
        let bulkMode = false;
        
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            bulkMode = !bulkMode;
            btn.innerText = bulkMode ? '${t.btn_exit_bulk}' : '${t.btn_bulk_mode}';
            btn.className = bulkMode ? 'secondary' : 'outline';
            controls.style.display = bulkMode ? 'block' : 'none';
            document.querySelectorAll('.col-select').forEach(el => el.style.display = bulkMode ? 'table-cell' : 'none');
        });
      </script>
    `
  })
}
