import { html } from 'hono/html'
import { Layout } from './Layout'
import { dict } from '../../i18n'

interface Props {
  t: typeof dict.en
  userEmail: string
  logs: { created_at: number, event_type: string, details: string }[]
  currentPage: number
  totalPages: number
  totalCount: number
  currentFilter: string
}

export const LogsPage = (props: Props) => {
  const t = props.t
  
  // Helper to parse details JSON safely
  const formatDetails = (jsonStr: string) => {
      try {
          const obj = JSON.parse(jsonStr);
          // If the object has a "key" for translation, use it
          if (obj.key && t[obj.key]) {
             let msg = t[obj.key];
             // Replace params
             if (obj.params) {
                 for (const k in obj.params) {
                     msg = msg.replace('{' + k + '}', obj.params[k]);
                 }
             }
             return msg;
          }
          return jsonStr;
      } catch(e) { return jsonStr; }
  }

  const events = [
      'LOGIN', 'PASSWORD_CHANGE',
      'APP_CREATED', 'APP_UPDATED', 'APP_DELETED',
      'USER_UPDATE', 'USER_DELETED',
      'PERMISSION_GRANT', 'PERMISSION_REVOKE',
      'GROUP_PERMISSION_GRANT', 'GROUP_PERMISSION_REVOKE', 'GROUP_DELETED'
  ];

  return Layout({
    t: t,
    userEmail: props.userEmail,
    activeTab: 'logs',
    children: html`
      <h2>${t.section_logs}</h2>
      
      <details>
        <summary>${t.label_filter_event}</summary>
        <form method="GET" action="/admin/logs" style="margin-bottom:1rem;">
            <div class="grid">
                <select name="event">
                    <option value="">${t.option_all_events}</option>
                    ${events.map(e => html`
                        <option value="${e}" ${props.currentFilter === e ? 'selected' : ''}>
                            ${t['event_' + e] || e}
                        </option>
                    `)}
                </select>
                <button type="submit" style="width:auto;">${t.btn_filter}</button>
            </div>
        </form>
      </details>

      <figure>
        <table role="grid">
          <thead>
            <tr>
              <th scope="col" style="width:180px">${t.th_time}</th>
              <th scope="col" style="width:150px">${t.th_event}</th>
              <th scope="col">${t.th_details}</th>
            </tr>
          </thead>
          <tbody>
            ${props.logs.map(log => html`
              <tr>
                <td>${new Date(log.created_at * 1000).toLocaleString()}</td>
                <td>
                    <small>${t['event_' + log.event_type] || log.event_type}</small>
                </td>
                <td style="font-size:0.9rem; color:#444;">
                    ${formatDetails(log.details)}
                </td>
              </tr>
            `)}
          </tbody>
        </table>
      </figure>
      
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
            ${props.currentPage > 1 ? html`<a href="/admin/logs?page=${props.currentPage - 1}&event=${props.currentFilter}" role="button" class="outline">${t.pager_prev}</a>` : ''}
        </div>
        <div style="font-size:0.9rem; color:#666;">
            ${t.pager_info.replace('{current}', props.currentPage).replace('{total}', props.totalPages).replace('{count}', props.totalCount)}
        </div>
        <div>
            ${props.currentPage < props.totalPages ? html`<a href="/admin/logs?page=${props.currentPage + 1}&event=${props.currentFilter}" role="button" class="outline">${t.pager_next}</a>` : ''}
        </div>
      </div>
    `
  })
}
