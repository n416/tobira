import { html } from 'hono/html'

interface ModalProps {
    id: string
    title: any          // 文字列またはHTML要素
    closeAction: string // 閉じるボタンのonclickアクション (例: "closeUserModal()")
    closeBtnId?: string // 閉じるボタンのID
    children: any       // モーダルの中身
}

export const Modal = ({ id, title, closeAction, closeBtnId, children }: ModalProps) => {
    // dialog要素自体(背景)がクリックされた場合のみ閉じるアクションを実行
    return html`
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
