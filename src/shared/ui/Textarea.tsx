import type { ComponentPropsWithoutRef } from 'react'

type TextareaProps = ComponentPropsWithoutRef<'textarea'> & {
  id: string
  label: string
  error?: string
  requiredMark?: boolean
}

export function Textarea({
  id,
  label,
  error,
  requiredMark = false,
  maxLength,
  value,
  ...props
}: TextareaProps) {
  const length = typeof value === 'string' ? value.length : 0

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-semibold text-slate-900">
        {label}
        {requiredMark && <span aria-hidden="true" className="text-red-500"> *</span>}
      </label>
      <div className="relative">
        <textarea
          {...props}
          id={id}
          value={value}
          maxLength={maxLength}
          aria-required={requiredMark || undefined}
          aria-invalid={error ? true : props['aria-invalid']}
          aria-describedby={
            [props['aria-describedby'], error ? `${id}-error` : undefined].filter(Boolean).join(' ') || undefined
          }
          className={`min-h-28 w-full rounded-lg border bg-white p-3 text-sm text-slate-900 placeholder:text-slate-600 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 ${
            maxLength ? 'pb-7' : ''
          } ${
            error
              ? 'border-red-600 focus:border-red-600 focus:ring-red-600/20'
              : 'border-slate-200 focus:border-[#0C70F2] focus:ring-[#0C70F2]/20'
          }`}
        />
        {typeof maxLength === 'number' && (
          <span className="pointer-events-none absolute right-3 bottom-2 text-xs text-slate-400">
            {length}/{maxLength}
          </span>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
