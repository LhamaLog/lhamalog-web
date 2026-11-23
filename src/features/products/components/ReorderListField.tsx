import { useState } from 'react'
import { addListItem, moveListItem, removeListItem } from '../context'
import type { ContextListField } from '../types'
import { NewItemInput } from './NewItemInput'

const iconButton =
  'flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-[#083B7A] focus-visible:outline-2 focus-visible:outline-[#0C70F2] disabled:cursor-not-allowed'

// Move buttons stay invisible until the row is hovered or a button gets keyboard focus, keeping the Figma look.
const moveButton = `${iconButton} opacity-0 group-hover:opacity-100 focus-visible:opacity-100 disabled:invisible`

export function ReorderListField({
  id,
  label,
  field,
  items,
  onChange,
  hint,
  error,
  disabled = false,
}: {
  id: string
  label: string
  field: ContextListField
  items: string[]
  onChange: (items: string[]) => void
  hint?: string
  error?: string
  disabled?: boolean
}) {
  const [adding, setAdding] = useState(false)
  const [localError, setLocalError] = useState<string>()
  const [dragged, setDragged] = useState<number | null>(null)
  const [status, setStatus] = useState('')
  const shownError = localError ?? error
  const describedBy = [hint ? `${id}-hint` : undefined, shownError ? `${id}-error` : undefined].filter(Boolean).join(' ') || undefined

  function add(value: string) {
    const result = addListItem(items, value, field)
    setLocalError(result.error)
    if (result.error) return false
    if (result.list !== items) onChange(result.list)
    return true
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= items.length || from === to) return
    onChange(moveListItem(items, from, to))
    setStatus(`${items[from]} movido para a posição ${to + 1} de ${items.length}.`)
  }

  return (
    <div className="flex flex-col gap-2">
      <span id={`${id}-label`} className="text-sm font-semibold text-slate-900">{label}</span>
      <div
        role="group"
        aria-labelledby={`${id}-label`}
        aria-describedby={describedBy}
        className={`overflow-hidden rounded-lg border bg-white ${shownError ? 'border-red-600' : 'border-slate-200'}`}
      >
        <ul className="divide-y divide-slate-200">
          {items.map((item, index) => (
            <li
              key={`${index}-${item}`}
              draggable={!disabled}
              onDragStart={(event) => { setDragged(index); event.dataTransfer.effectAllowed = 'move' }}
              onDragOver={(event) => { if (dragged !== null) event.preventDefault() }}
              onDrop={(event) => { event.preventDefault(); if (dragged !== null) move(dragged, index); setDragged(null) }}
              onDragEnd={() => setDragged(null)}
              className={`group flex items-center gap-2 px-3 py-2 text-sm text-slate-900 ${dragged === index ? 'bg-blue-50' : ''}`}
            >
              <span aria-hidden="true" className="cursor-grab text-slate-400">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.6" /><circle cx="15" cy="6" r="1.6" /><circle cx="9" cy="12" r="1.6" /><circle cx="15" cy="12" r="1.6" /><circle cx="9" cy="18" r="1.6" /><circle cx="15" cy="18" r="1.6" /></svg>
              </span>
              <span className="min-w-0 flex-1 break-words">{item}</span>
              <button type="button" disabled={disabled || index === 0} aria-label={`Mover ${item} para cima`} onClick={() => move(index, index - 1)} className={moveButton}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m18 15-6-6-6 6" /></svg>
              </button>
              <button type="button" disabled={disabled || index === items.length - 1} aria-label={`Mover ${item} para baixo`} onClick={() => move(index, index + 1)} className={moveButton}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
              </button>
              <button
                type="button"
                disabled={disabled}
                aria-label={`Remover ${item}`}
                onClick={() => { setLocalError(undefined); onChange(removeListItem(items, index)) }}
                className={iconButton}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            </li>
          ))}
          <li className="flex items-center gap-2 px-3 py-2">
            {adding ? (
              <NewItemInput
                id={`${id}-new`}
                label={`Novo item em ${label}`}
                className="h-8 flex-1"
                onAdd={add}
                onClose={() => { setAdding(false); setLocalError(undefined) }}
              />
            ) : (
              <button
                type="button"
                disabled={disabled}
                onClick={() => setAdding(true)}
                className="inline-flex cursor-pointer items-center gap-2 rounded-md text-sm text-[#0C70F2] hover:text-[#083B7A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0C70F2] disabled:cursor-not-allowed"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
                Adicionar item
              </button>
            )}
          </li>
        </ul>
      </div>
      <p className="sr-only" role="status">{status}</p>
      {hint && <p id={`${id}-hint`} className="text-xs text-slate-500">{hint}</p>}
      {shownError && <p id={`${id}-error`} className="text-sm text-red-600">{shownError}</p>}
    </div>
  )
}
