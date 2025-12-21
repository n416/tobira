import { html } from 'hono/html'
import { css, Style } from 'hono/css'
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

    const wrapperClass = css`
        display: grid; 
        grid-template-columns: 260px 1fr; 
        min-height: 100vh;
        max-width: 1400px;
        margin: 0 auto;
        background: rgba(255, 255, 255, 0.4);
        backdrop-filter: blur(10px);
        box-shadow: 0 0 40px rgba(0,0,0,0.05);

        @media (max-width: 768px) {
            display: block; 
            backdrop-filter: none;
            -webkit-backdrop-filter: none;
            transform: none;
            background: transparent;
            box-shadow: none;
        }
    `

    const sidebarClass = css`
        background: rgba(255, 255, 255, 0.6); 
        padding: 2rem 1.5rem; 
        border-right: 1px solid rgba(255,255,255,0.5); 
        display: flex; 
        flex-direction: column;

        & h1 {
            font-size: 1.5rem; 
            margin-bottom: 2.5rem; 
            background: linear-gradient(135deg, #4f46e5 0%, #2563eb 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            font-weight: 800; 
            text-align: center; 
        }

        @media (max-width: 768px) {
            display: flex;
            position: fixed;
            top: 0; left: 0;
            height: 100vh;
            width: 280px; 
            z-index: 2000;
            transform: translateX(-100%);
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 10px 0 25px rgba(0,0,0,0.1);
            border-right: none;
            background: rgba(255, 255, 255, 0.98); 

            &.open { transform: translateX(0); }
        }
    `

    const navItemClass = css`
        display: block; 
        padding: 0.85rem 1rem; 
        color: var(--text-sub); 
        text-decoration: none; 
        border-radius: 12px; 
        margin-bottom: 0.5rem; 
        transition: all 0.2s; 
        font-size: 0.95rem;
        font-weight: 500;
        
        &:hover { 
            background: rgba(255,255,255,0.7); 
            color: var(--primary); 
            transform: translateX(4px);
        }
        
        &.active { 
            background: white; 
            color: var(--primary); 
            font-weight: 700; 
            box-shadow: 0 4px 6px -2px rgba(0,0,0,0.05);
        }
    `

    const contentClass = css`
        padding: 2rem 3rem; 
        overflow-y: auto; 
        
        @media (max-width: 768px) {
            padding: 1rem; 
            padding-bottom: 5rem; 
        }
    `

    const mobileToggleClass = css`
        display: none;
        position: fixed;
        bottom: 1.5rem; right: 1.5rem;
        z-index: 1000;
        background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
        color: white;
        border: none;
        border-radius: 50%;
        width: 48px; height: 48px;
        align-items: center; justify-content: center;
        box-shadow: 0 4px 10px rgba(79, 70, 229, 0.3);
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        
        &:hover { transform: scale(1.1); }
        &:active { transform: scale(0.95); }

        @media (max-width: 768px) { display: flex; padding: 0; }
    `

    // General Overrides for Pico/Base
    const globalOverrides = html`
      <style>
        :root {
            --primary: #4f46e5;
            --primary-hover: #4338ca;
            --text-main: #0f172a;
            --text-sub: #64748b;
        }
        address, blockquote, dl, figure, form, ol, p, pre, table, ul { margin-bottom: 0; }
        body {
            font-family: 'Inter', 'Noto Sans JP', sans-serif;
            min-height: 100vh;
            background: linear-gradient(135deg, #f0f4ff 0%, #c7d2fe 50%, #e0e7ff 100%);
            background-size: 200% 200%;
            animation: gradient-animation 15s ease infinite;
            color: var(--text-main);
            margin: 0; padding: 0;
        }
        button, input, select, textarea { font-family: inherit; }
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; font-size: 20px; vertical-align: text-bottom; line-height: 1; }
        @keyframes gradient-animation { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }

        /* Pico Override */
        article {
            background: rgba(255, 255, 255, 0.7) !important;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.6);
            border-radius: 16px;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
        }
        button {
            background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
            color: white;
            border: none;
            border-radius: 12px;
            padding: 0.75rem 1.5rem;
            margin-bottom: 0; 
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);
            display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
        }
        button:hover { transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.3); background: linear-gradient(135deg, #4338ca 0%, #3730a3 100%); }
        button:active { transform: translateY(0); }
        button.contrast, button.secondary, button.outline { background: transparent !important; border: 1px solid #cbd5e1; color: var(--text-sub); box-shadow: none; }
        button.contrast:hover, button.secondary:hover, button.outline:hover { background: rgba(255, 255, 255, 0.5) !important; color: var(--primary); border-color: var(--primary); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }

        input:not([type="checkbox"]):not([type="radio"]), select {
            width: 100%; padding: 0.8rem 1rem; margin-bottom: 0; 
            border: 1px solid #cbd5e1 !important; background: rgba(255, 255, 255, 0.9) !important; 
            border-radius: 12px !important; font-size: 1rem; color: var(--text-main); transition: all 0.3s ease; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); 
        }
        input:not([type="checkbox"]):not([type="radio"]):focus, select:focus {
            background: #fff !important; border-color: var(--primary) !important; box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1) !important; outline: none;
        }
        table { border-collapse: separate; border-spacing: 0 0.5rem; }
        th { border-bottom: none; color: var(--text-sub); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; padding: 0.5rem 1rem; }
        td { background: rgba(255,255,255,0.4); border-top: 1px solid rgba(255,255,255,0.5); border-bottom: 1px solid rgba(255,255,255,0.5); padding: 1rem; vertical-align: middle; }
        td:first-child { border-top-left-radius: 12px; border-bottom-left-radius: 12px; border-left: 1px solid rgba(255,255,255,0.5); }
        td:last-child { border-top-right-radius: 12px; border-bottom-right-radius: 12px; border-right: 1px solid rgba(255,255,255,0.5); }

        /* Sidebar Overlay */
        .sidebar-overlay { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.3); backdrop-filter: blur(2px); z-index: 90; }
        @media (max-width: 768px) { .sidebar-overlay.visible { display: block; } }
      </style>
    `

    return html`
    <!DOCTYPE html>
    <html lang="${t.lang}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${t.tobira_admin}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;800&family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet">
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet" />
      <link href="https://cdn.jsdelivr.net/npm/tom-select@2.2.2/dist/css/tom-select.css" rel="stylesheet">
      <script src="https://cdn.jsdelivr.net/npm/tom-select@2.2.2/dist/js/tom-select.complete.min.js"></script>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@1/css/pico.min.css">
      ${globalOverrides}
      ${Style()}
    </head>
    <body>
      <div class="sidebar-overlay" onclick="toggleSidebar()"></div>
      <button class="${mobileToggleClass}" onclick="toggleSidebar()" aria-label="Menu">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>
      <div class="${wrapperClass}">
        <aside class="sidebar ${sidebarClass}">
            <h1>tobira</h1>
            <nav>
                ${navItems.map(item => html`
                    <a href="${item.href}" class="${navItemClass} ${props.activeTab === item.id ? 'active' : ''}">
                        ${item.label}
                    </a>
                `)}
            </nav>
            <div style="margin-top: auto; padding: 1rem 0; border-top: 1px solid rgba(255,255,255,0.5);">
                <div style="font-size: 0.85rem; color: var(--text-sub); margin-bottom: 0.5rem; padding: 0 0.5rem;">${props.userEmail}</div>
                <div style="display:flex; gap: 0.5rem;">
                    <a href="/" class="${navItemClass}" style="flex:1; text-align:center; font-size:0.85rem; padding: 0.6rem;">${t.nav_home}</a>
                    <a href="/logout" class="${navItemClass}" style="flex:1; text-align:center; font-size:0.85rem; padding: 0.6rem; color:#ef4444;">${t.logout}</a>
                </div>
            </div>
        </aside>
        
        <main class="${contentClass}">
            <div style="display: flex; justify-content: flex-end; align-items: center; margin-bottom: 2rem; font-size: 0.9rem; color: var(--text-sub); padding-bottom: 1rem; border-bottom: 1px solid rgba(0,0,0,0.05);">
               <span class="material-symbols-outlined" style="margin-right: 6px; font-size: 18px; color: var(--text-sub);">admin_panel_settings</span> ${t.tobira_admin}
            </div>
            ${props.children}
        </main>
      </div>

      <script>
        function toggleSidebar() {
            var sidebar = document.querySelector('.sidebar');
            if(sidebar) sidebar.classList.toggle('open');
            var overlay = document.querySelector('.sidebar-overlay');
            if(overlay) overlay.classList.toggle('visible');
        }
      </script>
    </body>
    </html>
    `
}
