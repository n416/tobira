import { html } from 'hono/html'
import { css } from 'hono/css'

interface ButtonProps {
  type?: "submit" | "button" | "reset"
  children: any
  id?: string
  className?: string
  onclick?: string
  style?: string
  variant?: "primary" | "outline"
}

export const Button = (props: ButtonProps) => {
  const variant = props.variant || 'primary'
  
  const baseBtn = css`
    width: 100%;
    padding: 0.8rem 1rem;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
    overflow: hidden;
    font-family: inherit;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    line-height: 1.2;
    text-decoration: none;
    box-sizing: border-box;
  `

  const primary = css`
    background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
    color: white;
    border: none;
    box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);
    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.3);
    }
    &:active {
        transform: translateY(0);
    }
  `

  const outline = css`
    background: #ffffff;
    border: 1px solid #cbd5e1;
    color: #64748b;
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    &:hover {
        border-color: #4f46e5;
        color: #4f46e5;
        background: #eff6ff;
        box-shadow: none;
    }
  `

  const variantClass = variant === 'outline' ? outline : primary

  return html`
    <button 
        type="${props.type || 'button'}" 
        class="${baseBtn} ${variantClass} ${props.className || ''}" 
        id="${props.id || ''}"
        onclick="${props.onclick || ''}"
        style="${props.style || ''}"
    >
        ${props.children}
    </button>
    `
}
