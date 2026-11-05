import type { ComponentPropsWithoutRef, ReactNode } from 'react'

type SelectProps = ComponentPropsWithoutRef<'select'> & {
  id: string
  label: string
  error?: string
  hideLabel?: boolean
  requiredMark?: boolean
  startIcon?: ReactNode
  wrapperClassName?: string
}

export function Select({
  id,
  label,
  error,
  hideLabel = false,
  requiredMark = false,
  startIcon,
  wrapperClassName = '',
  className = '',
  children,
  ...props
}: SelectProps) {
  return (
    <div className={`flex w-full flex-col gap-2 ${wrapperClassName}`}>
      <label htmlFor={id} className={hideLabel ? 'sr-only' : 'text-sm font-semibold text-slate-900'}>
        {label}
        {requiredMark && <span aria-hidden="true" className="text-red-500"> *</span>}
      </label>
      <div className="relative">
        <select
          {...props}
          id={id}
          aria-required={requiredMark || undefined}
          aria-invalid={error ? true : props['aria-invalid']}
          aria-describedby={
            [props['aria-describedby'], error ? `${id}-error` : undefined].filter(Boolean).join(' ') || undefined
          }
          className={`h-10 w-full appearance-none rounded-lg border bg-white pr-10 text-sm text-slate-900 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 ${
            startIcon ? 'pl-10' : 'pl-3'
          } ${
            error
              ? 'border-red-600 focus:border-red-600 focus:ring-red-600/20'
              : 'border-slate-200 focus:border-[#0C70F2] focus:ring-[#0C70F2]/20'
          } ${className}`}
        >
          {children}
        </select>
        {startIcon && (
          <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[#0C70F2]">
            {startIcon}
          </span>
        )}
        <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </div>
      {error && (
        <p id={`${id}-error`} className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
