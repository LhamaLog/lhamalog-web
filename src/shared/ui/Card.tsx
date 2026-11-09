import type { ComponentPropsWithoutRef } from 'react'

type CardProps = ComponentPropsWithoutRef<'div'>

export function Card({ children, className = '', ...props }: CardProps) {
  return (
    <div
      {...props}
      className={`rounded-xl border border-slate-200 bg-white p-4 ${className}`}
    >
      {children}
    </div>
  )
}
