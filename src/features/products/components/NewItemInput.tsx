import { useState } from 'react'

// Inline field used by the context lists. Enter adds without submitting the product form; Escape closes.
export function NewItemInput({
  id,
  label,
  onAdd,
  onClose,
  className = '',
}: {
  id: string
  label: string
  onAdd: (value: string) => boolean
  onClose: () => void
  className?: string
}) {
  const [value, setValue] = useState('')
  return (
    <input
      id={id}
      autoFocus
      aria-label={label}
      value={value}
      onChange={(event) => setValue(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault()
          if (onAdd(value)) setValue('')
        }
        if (event.key === 'Escape') {
          event.preventDefault()
          onClose()
        }
      }}
      onBlur={() => {
        if (!value.trim()) onClose()
      }}
      className={`min-w-0 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-900 focus:border-[#0C70F2] focus:outline-none focus:ring-2 focus:ring-[#0C70F2]/20 ${className}`}
    />
  )
}
