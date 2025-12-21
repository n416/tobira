import { html } from 'hono/html'
import { css } from 'hono/css'

interface Option {
  value: string
  text: string
}

interface MultiSelectProps {
  id: string
  name?: string
  placeholder?: string
  options: Option[]
  selectedValues?: string[]
  required?: boolean
  style?: string
}

export const MultiSelect = (props: MultiSelectProps) => {
  // Tom Select Custom Styles scoped to this component wrapper
  const wrapperClass = css`
    width: 100%;
    
    /* Base Control */
    & .ts-control {
        background-color: #ffffff !important;
        border: 1px solid #cbd5e1 !important;
        border-radius: 8px !important;
        padding: 6px 10px !important;
        box-shadow: 0 1px 2px rgba(0,0,0,0.05) !important;
        font-size: 1rem !important;
        min-height: 3rem !important; /* Changed to 3rem */
        display: flex !important;
        flex-wrap: wrap !important;
        align-items: center !important;
        gap: 6px !important;
        transition: all 0.2s;
    }

    /* Input Field inside Control */
    & .ts-wrapper .ts-control > input,
    & .ts-wrapper.multi .ts-control > input,
    & .ts-wrapper.single .ts-control > input,
    & div.ts-control > input {
        border: none !important;
        background: transparent !important;
        box-shadow: none !important;
        margin: 0 !important;
        padding: 0 !important;
        width: auto !important;
        flex: 1 1 auto !important;
        min-width: 4rem !important;
        display: inline-block !important;
        height: auto !important;
        line-height: inherit !important;
        border-radius: 0 !important;
    }

    /* Focus State */
    & .ts-wrapper.focus .ts-control {
        border-color: var(--primary) !important;
        box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1) !important;
        z-index: 2;
    }

    /* Selected Items (Badges) */
    & .ts-wrapper.multi .ts-control > div.item {
        background: #eff6ff !important;
        color: #4f46e5 !important;
        border: 1px solid #c7d2fe !important;
        border-radius: 6px !important;
        padding: 4px 8px !important;
        margin: 0 !important;
        font-size: 0.9rem !important;
        font-weight: 500 !important;
        display: flex !important;
        align-items: center !important;
        line-height: 1.2 !important;
        box-shadow: 0 1px 1px rgba(0,0,0,0.05);
    }
    
    /* Remove Button in Badge */
    & .ts-wrapper.multi .ts-control > div.item .remove {
        border-left: 1px solid #c7d2fe !important;
        margin-left: 6px !important;
        padding-left: 6px !important;
        font-size: 1rem !important;
        color: #4f46e5 !important;
        opacity: 0.7;
    }
    & .ts-wrapper.multi .ts-control > div.item .remove:hover {
        opacity: 1;
        background: transparent !important;
    }

    /* Dropdown Menu */
    & .ts-dropdown {
        border-radius: 8px !important;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
        border: 1px solid #e2e8f0 !important;
        z-index: 20000 !important;
        font-size: 1rem !important;
        margin-top: 4px !important;
        overflow: hidden !important;
    }

    & .ts-dropdown .option {
        padding: 10px 16px !important;
        cursor: pointer !important;
        color: #334155 !important;
    }

    & .ts-dropdown .option.active, 
    & .ts-dropdown .active {
        background-color: #f1f5f9 !important;
        color: var(--primary) !important;
        font-weight: 600 !important;
    }
    
    /* Placeholder */
    & .ts-wrapper .ts-control .input-placeholder {
        color: #94a3b8 !important;
    }
  `

  return html`
    <div class="${wrapperClass}" style="${props.style || ''}">
      <select 
        id="${props.id}" 
        name="${props.name || ''}" 
        multiple 
        autocomplete="off" 
        placeholder="${props.placeholder || 'Select...'}"
        ${props.required ? 'required' : ''}
        style="display:none;" 
      >
        <option value="">${props.placeholder || 'Select...'}</option>
        ${props.options.map(opt => {
            const isSelected = props.selectedValues?.includes(opt.value) ? 'selected' : ''
            return html`<option value="${opt.value}" ${isSelected}>${opt.text}</option>`
        })}
      </select>
    </div>
  `
}
