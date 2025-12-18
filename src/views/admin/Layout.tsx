import { html } from 'hono/html'
import { dict } from '../../i18n'

interface LayoutProps {
  t: typeof dict.en
  userEmail: string
  activeTab: string
  children: any
}

export const Layout = (props: LayoutProps) => {
  const t = props.t
  const navItems = [
    { id: 'home', label: t.nav_home, href: '/admin' },
    { id: 'apps', label: t.nav_apps, href: '/admin/apps' },
    { id: 'groups', label: t.nav_groups, href: '/admin/groups' },
    { id: 'users', label: t.nav_users, href: '/admin/users' },
    { id: 'logs', label: t.nav_logs, href: '/admin/logs' },
  ]

  return html`
    <!DOCTYPE html>
    <html lang="${t.lang}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${t.tobira_admin}</title>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@1/css/pico.min.css">
      <style>
        body { min-height: 100vh; display: grid; grid-template-rows: auto 1fr auto; background: #fdfdfd; }
        
        /* Admin Grid Layout */
        .admin-wrapper { display: grid; grid-template-columns: 240px 1fr; min-height: 100vh; }
        
        /* Sidebar Styling */
        .sidebar { 
            background: #f8f9fa; 
            padding: 2rem 1rem; 
            border-right: 1px solid #e0e0e0; 
            display: flex; 
            flex-direction: column; 
        }
        
        /* Minimal Logo in Admin */
        .sidebar h1 { 
            font-size: 1.4rem; 
            margin-bottom: 2.5rem; 
            color: #333; 
            text-align: center; 
            font-weight: 400; 
            letter-spacing: 0.05em;
        }
        .sidebar h1 span { color: #888; font-size: 0.8em; margin-left: 5px; }
        
        /* Nav Items */
        .nav-item { 
            display: block; 
            padding: 0.75rem 1rem; 
            color: #666; 
            text-decoration: none; 
            border-radius: 6px; 
            margin-bottom: 0.25rem; 
            transition: all 0.2s; 
            font-size: 0.95rem;
        }
        .nav-item:hover { background: #eef2f6; color: #333; text-decoration: none; }
        .nav-item.active { background: #e0e0e0; color: #000; font-weight: 500; }
        
        /* Content Area */
        .content { padding: 2rem 3rem; overflow-y: auto; }
        
        .top-bar { 
            display: flex; 
            justify-content: flex-end; 
            align-items: center; 
            margin-bottom: 2rem; 
            font-size: 0.9rem;
            color: #888;
        }
        
        /* Mobile responsive */
        @media (max-width: 768px) {
            .admin-wrapper { grid-template-columns: 1fr; }
            .sidebar { display: none; } 
        }
      </style>
    </head>
    <body>
      <div class="admin-wrapper">
        <aside class="sidebar">
            <h1>tobira<span>admin</span></h1>
            <nav>
                ${navItems.map(item => html`
                    <a href="${item.href}" class="nav-item ${props.activeTab === item.id ? 'active' : ''}">
                        ${item.label}
                    </a>
                `)}
            </nav>
            <div style="margin-top: auto; padding-top: 2rem; border-top: 1px solid #eee;">
                <a href="/" class="nav-item" style="color: #666;">← App Dashboard</a>
                <a href="/logout" class="nav-item" style="color: #c62828;">${t.logout}</a>
            </div>
        </aside>
        <main class="content">
            <div class="top-bar">
                <span>${props.userEmail}</span>
            </div>
            ${props.children}
        </main>
      </div>
    </body>
    </html>
  `
}
