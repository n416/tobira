import { html } from 'hono/html'

interface ButtonProps {
  type?: "submit" | "button" | "reset"
  children: any
  id?: string
  className?: string
}

export const Button = (props: ButtonProps) => {
  return html`
    <style>
        .submit-btn {
            width: 100%;
            padding: 1rem;
            background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);
            position: relative;
            overflow: hidden;
            font-family: inherit;
        }

        .submit-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.3);
        }

        .submit-btn:active {
            transform: translateY(0);
        }
    </style>
    <button type="${props.type || 'button'}" class="submit-btn ${props.className || ''}" id="${props.id || ''}">
        ${props.children}
    </button>
    `
}
