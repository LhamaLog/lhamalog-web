import { Card } from './Card'

type LoadingStateProps = {
  label?: string
  rows?: number
}

export function LoadingState({ label = 'Carregando dados...', rows = 3 }: LoadingStateProps) {
  const count = Number.isFinite(rows) ? Math.min(8, Math.max(1, Math.floor(rows))) : 3

  return (
    <Card role="status" aria-busy="true">
      <p className="mb-4 flex items-center gap-2 text-sm text-slate-600">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="shrink-0 text-[#0C70F2] motion-safe:animate-spin">
          <circle cx="12" cy="12" r="9" className="opacity-20" />
          <path d="M12 3a9 9 0 0 1 9 9" />
        </svg>
        {label}
      </p>
      <div aria-hidden="true" className="space-y-3 motion-safe:animate-pulse">
        {Array.from({ length: count }, (_, index) => (
          <div key={index} className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
            <span className="h-10 w-10 shrink-0 rounded-lg bg-slate-200" />
            <span className="flex-1 space-y-2">
              <span className="block h-3 w-2/3 rounded bg-slate-200" />
              <span className="block h-2 w-1/2 rounded bg-slate-200" />
            </span>
          </div>
        ))}
      </div>
    </Card>
  )
}
