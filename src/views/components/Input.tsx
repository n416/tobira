import { html } from 'hono/html'
import { css } from 'hono/css'

interface InputProps {
  type: string
  name: string
  placeholder?: string
  required?: boolean
  value?: string
  icon?: any
}

export const Input = (props: InputProps) => {
  const groupClass = css`
    margin-bottom: 1.5rem;
    position: relative;
  `

  const inputClass = css`
    width: 100%;
    padding: 1rem 1rem 1rem 3rem; 
    border: 2px solid transparent;
    background: rgba(255, 255, 255, 0.6);
    border-radius: 12px;
    font-size: 1rem;
    color: var(--text-main);
    transition: all 0.3s ease;
    outline: none;
    font-family: inherit;

    &:focus {
        background: #fff;
        border-color: var(--primary);
        box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
    }
    
    @media (max-width: 480px) {
        padding: 0.875rem 0.875rem 0.875rem 2.75rem;
    }
  `

  const iconClass = css`
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-sub);
    transition: color 0.3s ease;
    pointer-events: none;
    display: flex;
    align-items: center;
    
    & svg { width: 20px; height: 20px; }
  `

  const groupFocusClass = css`
    ${groupClass}
    &:focus-within .input-icon {
        color: var(--primary);
    }
  `

  const iconClassFinal = css`
    ${iconClass}
    @media (max-width: 480px) { left: 0.875rem; }
  `

  return html`
    <div class="${groupFocusClass}">
        <input 
            class="${inputClass}"
            type="${props.type}" 
            name="${props.name}" 
            placeholder="${props.placeholder || ''}" 
            ${props.required ? 'required' : ''} 
            value="${props.value || ''}"
        />
        ${props.icon ? html`<div class="${iconClassFinal} input-icon">${props.icon}</div>` : ''}
    </div>
    `
}
