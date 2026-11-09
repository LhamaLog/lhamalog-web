import type { ComponentPropsWithoutRef, ReactNode } from 'react'

type InputProps = ComponentPropsWithoutRef<'input'> & {
  id: string
  label: string
  error?: string
  startIcon?: ReactNode
  endAction?: ReactNode
  compact?: boolean
  hideLabel?: boolean
}

export function Input({
  id,
  label,
  type = 'text',
  error,
  startIcon,
  endAction,
  compact = false,
  hideLabel = false,
  className = '',
  ...props
}: InputProps) {
  return (
    <div className="flex w-full flex-col gap-2">
      <label
        htmlFor={id}
        className={hideLabel ? 'sr-only' : 'text-base font-semibold text-slate-900'}
      >
        {label}
      </label>

      <div className="relative">
        <input
          {...props}
          id={id}
          type={type}
          aria-invalid={error ? true : props['aria-invalid']}
          aria-describedby={
            [props['aria-describedby'], error ? `${id}-error` : undefined]
              .filter(Boolean)
              .join(' ') || undefined
          }
          className={`
            w-full border px-4 text-slate-900
            ${compact ? 'h-10 rounded-lg bg-white text-sm' : 'h-14 rounded-xl bg-slate-50 text-base'}
            placeholder:text-slate-600
            focus:outline-none focus:ring-2
            disabled:cursor-not-allowed disabled:opacity-50
            ${startIcon ? 'pl-10' : ''}
            ${endAction ? 'pr-14' : ''}
            ${
              error
                ? 'border-red-600 focus:border-red-600 focus:ring-red-600/20'
                : 'border-slate-200 focus:border-[#0C70F2] focus:ring-[#0C70F2]/20'
            }
            ${className}
          `}
        />

        {startIcon && (
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute inset-y-0 left-4 flex items-center text-[#0C70F2] ${props.disabled ? 'opacity-50' : ''}`}
          >
            {startIcon}
          </span>
        )}

        {endAction && (
          <div className="absolute inset-y-0 right-4 flex items-center">
            {endAction}
          </div>
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
