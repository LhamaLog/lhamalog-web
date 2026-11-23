import { useRef } from 'react'
import type { KeyboardEvent } from 'react'

type Option<T extends string> = { value: T; label: string }

export function SegmentedControl<T extends string>({
  id,
  label,
  options,
  value,
  onChange,
  hint,
  error,
  requiredMark = false,
  disabled = false,
}: {
  id: string
  label: string
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
  hint?: string
  error?: string
  requiredMark?: boolean
  disabled?: boolean
}) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([])
  const selected = Math.max(0, options.findIndex((option) => option.value === value))
  const describedBy = [hint ? `${id}-hint` : undefined, error ? `${id}-error` : undefined].filter(Boolean).join(' ') || undefined

  function keyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const step = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0
    const target = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : step ? (index + step + options.length) % options.length : -1
    if (target < 0) return
    event.preventDefault()
    onChange(options[target].value)
    buttons.current[target]?.focus()
  }

  return (
    <div className="flex flex-col gap-2">
      <span id={`${id}-label`} className="text-sm font-semibold text-slate-900">
        {label}
        {requiredMark && <span aria-hidden="true" className="text-red-500"> *</span>}
      </span>
      <div
        role="radiogroup"
        aria-labelledby={`${id}-label`}
        aria-describedby={describedBy}
        aria-required={requiredMark || undefined}
        className={`grid gap-1 rounded-lg border bg-slate-100 p-1 ${error ? 'border-red-600' : 'border-slate-200'}`}
        style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      >
        {options.map((option, index) => {
          const checked = index === selected
          return (
            <button
              key={option.value}
              ref={(element) => { buttons.current[index] = element }}
              type="button"
              role="radio"
              aria-checked={checked}
              tabIndex={checked ? 0 : -1}
              disabled={disabled}
              onClick={() => onChange(option.value)}
              onKeyDown={(event) => keyDown(event, index)}
              className={`h-9 cursor-pointer rounded-md text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0C70F2] disabled:cursor-not-allowed ${
                checked ? 'bg-white font-semibold text-[#0C70F2] shadow-sm' : 'text-slate-600 hover:text-[#083B7A]'
              }`}
            >
              {option.label}
            </button>
          )
        })}
      </div>
      {hint && <p id={`${id}-hint`} className="text-xs text-slate-500">{hint}</p>}
      {error && <p id={`${id}-error`} className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
