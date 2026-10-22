import type { ComponentPropsWithoutRef } from 'react'

type ButtonProps = ComponentPropsWithoutRef<'button'> & {
  variant?: 'primary' | 'outline' | 'soft'
  size?: 'small' | 'normal' | 'icon'
  fullWidth?: boolean
}

const variants = {
  primary:
    'border-transparent bg-[#0C70F2] text-white enabled:hover:bg-[#095ECC]',

  outline:
    'border-slate-300 bg-white text-slate-700 enabled:hover:bg-slate-50',

  soft:
    'border-transparent bg-blue-50 text-[#0C70F2] enabled:hover:bg-blue-100',
}

const sizes = {
  small: 'h-9 px-3 text-sm',
  normal: 'h-12 px-4 text-base',
  icon: 'h-10 w-10 p-0',
}

export function Button({
  children,
  type = 'button',
  variant = 'primary',
  size = 'normal',
  fullWidth = true,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={`
        inline-flex items-center justify-center gap-2
        rounded-xl border font-semibold
        cursor-pointer
        focus-visible:outline-2
        focus-visible:outline-offset-2
        focus-visible:outline-[#0C70F2]
        disabled:cursor-not-allowed disabled:opacity-50
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : 'w-auto'}
        ${className}
      `}
    >
      {children}
    </button>
  )
}