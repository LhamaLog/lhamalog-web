import type { ComponentPropsWithoutRef, ReactNode } from 'react'

type InputProps = ComponentPropsWithoutRef<'input'> & {
  id: string
  label: string
  error?: string
  endAction?: ReactNode
}

export function Input({
  id,
  label,
  type = 'text',
  error,
  endAction,
  ...props
}: InputProps) {
  return (
    <div className="flex w-full flex-col gap-2">
      <label
        htmlFor={id}
        className="text-base font-semibold text-slate-900"
      >
        {label}
      </label>

      <div className="relative">
        <input
          {...props}
          id={id}
          type={type}
          aria-invalid={error ? true : undefined}
          aria-describedby={
            error ? `${id}-error` : props['aria-describedby']
          }
          className={`
            h-14 w-full rounded-xl border
            bg-slate-50 px-4 text-base text-slate-900
            placeholder:text-slate-600
            focus:outline-none focus:ring-2
            disabled:cursor-not-allowed disabled:opacity-50
            ${endAction ? 'pr-14' : ''}
            ${
              error
                ? 'border-red-600 focus:border-red-600 focus:ring-red-600/20'
                : 'border-slate-200 focus:border-[#0C70F2] focus:ring-[#0C70F2]/20'
            }
          `}
        />

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