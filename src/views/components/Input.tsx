import { html } from 'hono/html'

interface InputProps {
  type: string
  name: string
  placeholder?: string
  required?: boolean
  value?: string
  icon?: any // SVG content
}

export const Input = (props: InputProps) => {
  return html`
    <style>
        .input-group {
            margin-bottom: 1.5rem;
            position: relative;
        }

        .input-group input {
            width: 100%;
            padding: 1rem 1rem 1rem 3rem; /* Default padding for icon */
            border: 2px solid transparent;
            background: rgba(255, 255, 255, 0.6);
            border-radius: 12px;
            font-size: 1rem;
            color: var(--text-main);
            transition: all 0.3s ease;
            outline: none;
            font-family: inherit;
        }

        .input-group input:focus {
            background: #fff;
            border-color: var(--primary);
            box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
        }

        .input-icon {
            position: absolute;
            left: 1rem;
            top: 50%;
            transform: translateY(-50%);
            color: var(--text-sub);
            transition: color 0.3s ease;
            pointer-events: none;
            display: flex;
            align-items: center;
        }

        .input-icon svg {
            width: 20px;
            height: 20px;
        }

        .input-group input:focus + .input-icon {
            color: var(--primary);
        }
        
        /* Mobile adjustment for input is handled by percentage width, but padding might need touchup if needed. 
           Already handled in global CSS or here. */
        @media (max-width: 480px) {
             .input-group input {
                padding: 0.875rem 0.875rem 0.875rem 2.75rem;
            }
            .input-icon {
                left: 0.875rem;
            }
        }
    </style>
    <div class="input-group">
        <input 
            type="${props.type}" 
            name="${props.name}" 
            placeholder="${props.placeholder || ''}" 
            ${props.required ? 'required' : ''} 
            value="${props.value || ''}"
        />
        ${props.icon ? html`<div class="input-icon">${props.icon}</div>` : ''}
    </div>
    `
}
