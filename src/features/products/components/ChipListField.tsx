import { useState } from 'react'
import type { ReactNode } from 'react'
import { addListItem, removeListItem } from '../context'
import type { ContextListField } from '../types'
import { NewItemInput } from './NewItemInput'

export function ChipListField({
  id,
  label,
  field,
  items,
  onChange,
  hint,
  error,
  icon,
  disabled = false,
}: {
  id: string
  label: string
  field: ContextListField
  items: string[]
  onChange: (items: string[]) => void
  hint?: string
  error?: string
  icon?: ReactNode
  disabled?: boolean
}) {
  const [adding, setAdding] = useState(false)
  const [localError, setLocalError] = useState<string>()
  const shownError = localError ?? error
  const describedBy = [hint ? `${id}-hint` : undefined, shownError ? `${id}-error` : undefined].filter(Boolean).join(' ') || undefined

  function add(value: string) {
    const result = addListItem(items, value, field)
    setLocalError(result.error)
    if (result.error) return false
    if (result.list !== items) onChange(result.list)
    return true
  }

  return (
    <div className="flex flex-col gap-2">
      <span id={`${id}-label`} className="text-sm font-semibold text-slate-900">{label}</span>
      <div
        role="group"
        aria-labelledby={`${id}-label`}
        aria-describedby={describedBy}
        className={`flex min-h-11 flex-wrap items-center gap-2 rounded-lg border bg-field px-3 py-2 ${shownError ? 'border-red-600' : 'border-slate-200'}`}
      >
        {icon && <span aria-hidden="true" className="mr-1 text-slate-500">{icon}</span>}
        {items.map((item, index) => (
          <span key={`${index}-${item}`} className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-xs text-[#0C70F2]">
            {item}
            <button
              type="button"
              disabled={disabled}
              aria-label={`Remover ${item}`}
              onClick={() => { setLocalError(undefined); onChange(removeListItem(items, index)) }}
              className="cursor-pointer rounded px-0.5 font-bold hover:text-[#083B7A] focus-visible:outline-2 focus-visible:outline-[#0C70F2]"
            >
              ×
            </button>
          </span>
        ))}
        {adding && (
          <NewItemInput
            id={`${id}-new`}
            label={`Novo item em ${label}`}
            className="h-7 w-40"
            onAdd={add}
            onClose={() => { setAdding(false); setLocalError(undefined) }}
          />
        )}
        <button
          type="button"
          disabled={disabled}
          aria-label={`Adicionar item em ${label}`}
          onClick={() => setAdding(true)}
          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-[#0C70F2] bg-white text-[#0C70F2] hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0C70F2] disabled:cursor-not-allowed"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
        </button>
      </div>
      {hint && <p id={`${id}-hint`} className="text-xs text-slate-500">{hint}</p>}
      {shownError && <p id={`${id}-error`} className="text-sm text-red-600">{shownError}</p>}
    </div>
  )
}
