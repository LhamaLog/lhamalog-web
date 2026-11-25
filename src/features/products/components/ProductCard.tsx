import type { ReactNode } from 'react'
import { Badge } from '../../../shared/ui/Badge'
import { Card } from '../../../shared/ui/Card'

type ProductCardProps = {
  name: string
  description: string
  icon: ReactNode
  iconColor?: 'blue' | 'green' | 'purple'
  status: 'connected' | 'waiting' | 'error' | 'none'
  categories: string[]
  area: string
  lastLog: { label: string; date: string } | null
  // null when the environment is unknown (it lives only in the local draft of the browser that saved it, spec 009 F1).
  environment: 'production' | 'staging' | 'development' | null
  // Optional (spec 009): makes the card open the product and shows the arrow of the Figma.
  onOpen?: () => void
  // Optional (spec 009, US4): "Arquivado em dd/mm/aaaa".
  archivedLabel?: string | null
}

const statuses = {
  connected: { label: 'Conectado', variant: 'success' },
  waiting: { label: 'Aguardando primeiro log', variant: 'warning' },
  error: { label: 'Falha na conexão', variant: 'danger' },
  none: { label: 'Sem integração', variant: 'neutral' },
} as const

const iconColors = {
  blue: 'bg-[#0C70F2]',
  green: 'bg-emerald-500',
  purple: 'bg-violet-500',
}

const environments = {
  production: { label: 'Produção', color: 'text-[#0C70F2]' },
  staging: { label: 'Homologação', color: 'text-amber-700' },
  development: { label: 'Desenvolvimento', color: 'text-[#083B7A]' },
}

const unknownEnvironment = { label: 'Não informado', color: 'text-slate-500' }

export function ProductCard({
  name,
  description,
  icon,
  iconColor = 'blue',
  status,
  categories,
  area,
  lastLog,
  environment,
  onOpen,
  archivedLabel,
}: ProductCardProps) {
  const integration = statuses[status]
  const currentEnvironment = environment ? environments[environment] : unknownEnvironment

  return (
    <Card className={`flex flex-col gap-4 sm:flex-row sm:items-center ${onOpen ? 'relative transition-colors hover:border-[#0C70F2] focus-within:border-[#0C70F2]' : ''}`}>
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <span aria-hidden="true" className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white ${iconColors[iconColor]}`}>
          {icon}
        </span>
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="break-words text-sm font-bold text-[#083B7A]">
              {onOpen ? (
                <button type="button" onClick={onOpen} className="text-left after:absolute after:inset-0 after:rounded-xl after:content-[''] focus-visible:outline-none">
                  {name}
                </button>
              ) : name}
            </h3>
            <Badge variant={integration.variant} dot>{integration.label}</Badge>
            {archivedLabel && <Badge variant="warning">{archivedLabel}</Badge>}
          </div>
          <p className="break-words text-xs text-slate-500">{description}</p>
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((category, index) => <Badge key={`${index}-${category}`}>{category}</Badge>)}
            {area && <Badge variant="neutral" dot>{area}</Badge>}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 border-t border-slate-200 pt-3 sm:w-56 sm:shrink-0 sm:border-l sm:border-t-0 sm:pl-3 sm:pt-0">
        <dl className="min-w-0 flex-1 space-y-2 text-xs">
          <div>
            <dt className="sr-only">Último log</dt>
            <dd>
              <span className="block font-bold text-slate-900">{lastLog?.label ?? 'Nenhum log recebido'}</span>
              <span className="block text-[11px] text-slate-500">
                {lastLog?.date ?? (status === 'none' ? 'Integração não configurada' : 'Aguardando recebimento de logs')}
              </span>
            </dd>
          </div>
          <div className="flex flex-wrap items-center gap-1">
            <dt className="text-slate-500">Ambiente</dt>
            <dd className={`font-bold ${currentEnvironment.color}`}>{currentEnvironment.label}</dd>
          </div>
        </dl>
        {onOpen && (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 text-[#0C70F2]">
            <path d="m9 6 6 6-6 6" />
          </svg>
        )}
      </div>
    </Card>
  )
}
