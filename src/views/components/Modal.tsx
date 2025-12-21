import { html } from 'hono/html'
import { css, keyframes } from 'hono/css'

interface ModalProps {
    id: string
    title: any
    closeAction: string
    closeBtnId?: string
    children: any
}

export const Modal = ({ id, title, closeAction, closeBtnId, children }: ModalProps) => {
    
    const modalIn = keyframes`
        from { opacity: 0; transform: translateY(-10px) scale(0.98); }
        to { opacity: 1; transform: translateY(0) scale(1); }
    `

    const dialogClass = css`
        background: transparent;
        padding: 0;
        border: none;
        z-index: 1000;
        max-width: 100%;
        max-height: 100%;

        &::backdrop {
            background: rgba(15, 23, 42, 0.4);
            backdrop-filter: blur(4px);
        }
        
        & > article {
            background: rgba(255, 255, 255, 0.98) !important;
            border: 1px solid rgba(226, 232, 240, 0.8);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            animation: ${modalIn} 0.25s ease-out;
            
            width: min(750px, 95vw) !important;
            max-width: 750px !important;
            margin: 2rem auto; 
            padding: 0 !important; 
            
            overflow: hidden; 
            border-radius: 16px !important;
            color: #0f172a;
            position: relative;
            display: flex;
            flex-direction: column;
        }

        & form { margin-bottom: 0; }
        & form label { margin-bottom: 0.5rem; font-weight:600; color:#334155; }
        & form input { margin-bottom: 1rem; }
    `

    const headerClass = css`
        padding: 1.25rem 1.5rem; 
        background: #f1f5f9; 
        border-bottom: 1px solid #e2e8f0; 
        display: flex; 
        justify-content: space-between; 
        align-items: center;
        flex-shrink: 0;
        
        margin: 0 !important;
        border-top-left-radius: 0 !important;
        border-top-right-radius: 0 !important;
    `

    const titleClass = css`
        font-size: 1.15rem; 
        font-weight: 700; 
        color: #1e293b;
        margin: 0;
        line-height: 1.4;
    `

    const bodyClass = css`
        padding: 2rem; 
        overflow-y: auto; 
        max-height: 70vh; 
    `

    const closeBtnClass = css`
        background: transparent !important; 
        border: none !important; 
        color: #64748b !important; 
        cursor: pointer !important; 
        padding: 4px !important; 
        border-radius: 50% !important; 
        transition: all 0.2s !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        width: 32px !important;
        height: 32px !important;
        text-decoration: none;
        margin: 0 !important;

        &:hover { 
            background: #e2e8f0 !important; 
            color: #0f172a !important; 
        }
    `

    return html`
    <dialog id="${id}" class="${dialogClass}" onclick="if(event.target === this) { ${closeAction} }">
        <article>
            <header class="${headerClass}">
                <div class="${titleClass}">${title}</div>
                <a href="#close" 
                   ${closeBtnId ? html`id="${closeBtnId}"` : ''} 
                   aria-label="Close" 
                   class="${closeBtnClass}" 
                   onclick="${closeAction}">
                    <span class="material-symbols-outlined" style="font-size:20px;">close</span>
                </a>
            </header>
            <div class="${bodyClass}">
                ${children}
            </div>
        </article>
    </dialog>
    `
}
