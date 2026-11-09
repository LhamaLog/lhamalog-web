import type { ComponentPropsWithoutRef } from 'react'

type BadgeProps = ComponentPropsWithoutRef<'span'> & {
  variant?: 'info' | 'success' | 'warning' | 'danger' | 'neutral'
  dot?: boolean
}

const variants = {
  info: 'bg-blue-50 text-blue-600',
  success: 'bg-green-50 text-green-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-red-50 text-red-600',
  neutral: 'bg-slate-100 text-slate-600',
}

export function Badge({
  children,
  variant = 'info',
  dot = false,
  className = '',
  ...props
}: BadgeProps) {
  return (
    <span
      {...props}
      className={`
        inline-flex items-center gap-1.5
        rounded-full px-2.5 py-1
        text-xs font-medium
        ${variants[variant]}
        ${className}
      `}
    >
      {dot && (
        <span
          aria-hidden="true"
          className="h-1.5 w-1.5 shrink-0 rounded-full bg-current"
        />
      )}

      {children}
    </span>
  )
}
