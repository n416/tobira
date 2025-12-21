import { html } from 'hono/html'

interface ModalProps {
    id: string
    title: any
    closeAction: string
    closeBtnId?: string
    children: any
}

export const Modal = ({ id, title, closeAction, closeBtnId, children }: ModalProps) => {
    return html`
    <style>
        dialog { 
            background: transparent; 
            padding: 0; 
            border: none; 
            z-index: 1000;
        }
        dialog > article {
            background: rgba(255, 255, 255, 0.95) !important;
            backdrop-filter: blur(40px);
            -webkit-backdrop-filter: blur(40px);
            border: 1px solid rgba(255, 255, 255, 0.8);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
            animation: modal-in 0.3s ease-out;
            max-width: 750px;
            width: 100%;
            padding: 0 !important;
            overflow: hidden;
            border-radius: 24px !important;
            color: var(--text-main);
            position: relative; 
        }
        
        .modal-header { 
            padding: 1.5rem 2rem; 
            background: #f8fafc; 
            border-bottom: 1px solid #e2e8f0; 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            margin-bottom: 0;
        }
        
        .modal-title { 
            font-size: 1.25rem; 
            font-weight: 700; 
            color: #0f172a; 
        }

        .modal-body { 
            padding: 2rem; 
            max-height: 80vh; 
            overflow-y: auto; 
        }

        /* Close Button Style */
        .modal-header .action-btn { 
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
            text-decoration: none;
        }
        .modal-header .action-btn:hover { 
            background: #f1f5f9 !important; 
            color: var(--text-main) !important; 
        }

        /* Form elements inside modal override */
        dialog form { margin-bottom: 0; }
        dialog form label {
            margin-bottom: 1.25rem;
            font-size: 0.9rem;
            color: var(--text-sub);
            font-weight: 500;
        }
        dialog form input { margin-top: 0.4rem; }
        
        dialog form button[type="submit"] {
            margin-top: 1.5rem;
            margin-bottom: 0;
            width: 100%;
            padding: 0.9rem;
            font-size: 1rem;
            border-radius: 12px;
        }

        @keyframes modal-in {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        dialog::backdrop {
            background: rgba(15, 23, 42, 0.3);
            backdrop-filter: blur(3px);
        }
    </style>
    <dialog id="${id}" onclick="if(event.target === this) { ${closeAction} }">
        <article>
            <header class="modal-header">
                <div class="modal-title">${title}</div>
                <a href="#close" 
                   ${closeBtnId ? html`id="${closeBtnId}"` : ''} 
                   aria-label="Close" 
                   class="action-btn" 
                   onclick="${closeAction}">
                    <span class="material-symbols-outlined">close</span>
                </a>
            </header>
            <div class="modal-body">
                ${children}
            </div>
        </article>
    </dialog>
    `
}
