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
  environment: 'production' | 'staging' | 'development'
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
}: ProductCardProps) {
  const integration = statuses[status]
  const currentEnvironment = environments[environment]

  return (
    <Card className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <span aria-hidden="true" className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white ${iconColors[iconColor]}`}>
          {icon}
        </span>
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="break-words text-sm font-bold text-[#083B7A]">{name}</h3>
            <Badge variant={integration.variant} dot>{integration.label}</Badge>
          </div>
          <p className="break-words text-xs text-slate-500">{description}</p>
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((category, index) => <Badge key={`${index}-${category}`}>{category}</Badge>)}
            <Badge variant="neutral" dot>{area}</Badge>
          </div>
        </div>
      </div>

      <dl className="space-y-2 border-t border-slate-200 pt-3 text-xs sm:w-48 sm:shrink-0 sm:border-l sm:border-t-0 sm:pl-3 sm:pt-0">
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
    </Card>
  )
}
