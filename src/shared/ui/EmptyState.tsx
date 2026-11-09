import type { ReactNode } from 'react'
import { Card } from './Card'

type EmptyStateProps = {
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <Card role="status" className="flex flex-col items-center gap-3 py-8 text-center">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-slate-400">
        <path d="M4 4h16v16H4ZM4 14h5l1 3h4l1-3h5M8 8h8" />
      </svg>
      <p className="font-semibold text-[#083B7A]">{title}</p>
      {description && <p className="max-w-md text-sm text-slate-600">{description}</p>}
      {action && <div className="mt-1 flex flex-wrap justify-center gap-2">{action}</div>}
    </Card>
  )
}
