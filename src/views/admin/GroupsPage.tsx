import { html } from 'hono/html'
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
  return Layout({
    t: t,
    userEmail: props.userEmail,
    activeTab: 'groups',
    children: html`
      <h2>${t.section_groups}</h2>
      
      <article>
        <h3>${t.header_new_group}</h3>
        <form method="POST" action="/admin/groups" style="margin-bottom: 0;">
          <div class="grid" style="grid-template-columns: 1fr auto; align-items: end; gap: 1rem;">
            <label style="margin-bottom: 0;">
              ${t.label_group_name}
              <input type="text" name="name" placeholder="${t.placeholder_group_name}" required style="margin-bottom: 0;" />
            </label>
            <button type="submit" style="width: auto; margin-bottom: 0;">${t.btn_add_group}</button>
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
              <tr>
                <td>${g.name}</td>
                <td>
                    <div class="grid" style="grid-template-columns: auto auto; gap: 0.5rem;">
                        <button class="outline" style="padding:0.4rem 0.8rem; font-size:0.8rem; width:100%;" 
                             onclick="openGroupModal('${g.id}', '${g.name}')">${t.edit}</button>

                        <form method="POST" action="/admin/groups/delete" style="margin:0;" onsubmit="return confirm('${t.confirm_delete_group}')">
                             <input type="hidden" name="id" value="${g.id}" />
                             <button class="outline secondary" style="padding:0.4rem 0.8rem; font-size:0.8rem; border-color:#d32f2f; color:#d32f2f; width:100%;">${t.delete}</button>
                        </form>
                    </div>
                </td>
              </tr>
            `)}
          </tbody>
        </table>
      </figure>

      <dialog id="group-modal">
        <article style="width: 100%; max-width: 800px;">
          <header>
            <a href="#close" aria-label="Close" class="close" onclick="closeGroupModal()"></a>
            ${t.modal_section_group}: <span id="modal-group-name"></span>
          </header>
          
          <div class="grid">
             <div>
                <label>${t.modal_section_add}</label>
                <div class="grid">
                    <label>
                        ${t.modal_label_app}
                        <select id="g-perm-app-id" multiple style="height:120px">
                            ${props.apps.map(a => html`<option value="${a.id}">${a.name}</option>`)}
                        </select>
                    </label>
                    <div>
                        <label>${t.label_valid_to}</label>
                        <input type="date" id="g-perm-valid-to" />
                        <div class="grid">
                            <button class="outline secondary" onclick="setGroupDate(1)">${t.btn_term_1mo}</button>
                            <button class="outline secondary" onclick="setGroupDate(12)">${t.btn_term_1yr}</button>
                            <button class="outline secondary" onclick="setGroupDate(120)">${t.btn_term_forever}</button>
                        </div>
                    </div>
                </div>
                <button onclick="grantGroupPermission()">${t.btn_grant}</button>
             </div>
          </div>
          
          <hr>
          
          <h4>${t.header_active_permissions}</h4>
          <table role="grid">
            <thead>
                <tr>
                    <th>${t.modal_th_app}</th>
                    <th>${t.modal_th_valid}</th>
                    <th>${t.modal_th_action}</th>
                </tr>
            </thead>
            <tbody id="modal-g-perm-list"></tbody>
          </table>

        </article>
      </dialog>

      <script>
        const gModal = document.getElementById('group-modal');
        let currentGroupId = '';

        function openGroupModal(id, name) {
            currentGroupId = id;
            document.getElementById('modal-group-name').innerText = name;
            gModal.setAttribute('open', true);
            loadGroupPerms(id);
        }
        function closeGroupModal() { gModal.removeAttribute('open'); }
        
        function loadGroupPerms(id) {
            fetch('/admin/api/group-details/' + id)
                .then(r => r.json())
                .then(data => {
                    const tbody = document.getElementById('modal-g-perm-list');
                    tbody.innerHTML = '';
                    data.permissions.forEach(p => {
                        const tr = document.createElement('tr');
                        let html = '<td>' + p.app_name + '</td>';
                        html += '<td>' + new Date(p.valid_to * 1000).toLocaleDateString() + '</td>';
                        html += '<td><button class="outline secondary" onclick="revokeGroupPerm(' + p.id + ')">❌</button></td>';
                        tr.innerHTML = html;
                        tbody.appendChild(tr);
                    });
                });
        }

        function grantGroupPermission() {
            const apps = Array.from(document.getElementById('g-perm-app-id').selectedOptions).map(o => o.value);
            const dateVal = document.getElementById('g-perm-valid-to').value;
            const validTo = dateVal ? Math.floor(new Date(dateVal).getTime()/1000) : Math.floor(Date.now()/1000) + 315360000;
            
            fetch('/admin/api/group/permission/grant', {
                method: 'POST', body: JSON.stringify({
                    group_id: currentGroupId, app_ids: apps, valid_to: validTo
                })
            }).then(() => loadGroupPerms(currentGroupId));
        }

        function revokeGroupPerm(pid) {
            if(!confirm('Revoke?')) return;
            fetch('/admin/api/group/permission/revoke', {
                method: 'POST', body: JSON.stringify({id: pid})
            }).then(() => loadGroupPerms(currentGroupId));
        }

        function setGroupDate(months) {
            const d = new Date();
            d.setMonth(d.getMonth() + months);
            document.getElementById('g-perm-valid-to').value = d.toISOString().split('T')[0];
        }
      </script>
    `
  })
}
