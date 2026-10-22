import { Button } from './Button'
import { Card } from './Card'

type ErrorStateProps = {
  title?: string
  description?: string
  onRetry: () => void
  retrying?: boolean
}

export function ErrorState({ title = 'Não foi possível carregar os dados', description, onRetry, retrying = false }: ErrorStateProps) {
  return (
    <Card role="alert" aria-busy={retrying} className="flex flex-col items-center gap-3 py-8 text-center">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true" className="text-red-600">
        <circle cx="12" cy="12" r="9" /><path d="M12 7v6M12 16h.01" />
      </svg>
      <p className="font-semibold text-[#083B7A]">{title}</p>
      {description && <p className="max-w-md text-sm text-slate-600">{description}</p>}
      <Button size="small" fullWidth={false} disabled={retrying} onClick={onRetry}>
        {retrying ? 'Tentando novamente...' : 'Tentar novamente'}
      </Button>
    </Card>
  )
}
