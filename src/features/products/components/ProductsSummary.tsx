import { Card } from '../../../shared/ui/Card'
import { MetricCard } from '../../../shared/ui/MetricCard'

type SummaryMetric = {
  value: number
  variation?: string
}

type ProductsSummaryProps = {
  total: SummaryMetric
  connected: SummaryMetric
  waiting: SummaryMetric
  withoutIntegration: SummaryMetric
  periodLabel: string
}

const metrics = [
  { key: 'total', title: 'Total', tone: 'blue', path: 'm12 3 9 5v8l-9 5-9-5V8ZM3 8l9 5 9-5M12 13v8' },
  { key: 'connected', title: 'Conectados', tone: 'green', path: 'm5 12 4 4L19 6' },
  { key: 'waiting', title: 'Aguardando', tone: 'amber', path: 'M12 8v5l3 2M9 2h6M12 5a8 8 0 1 0 0 16 8 8 0 0 0 0-16Z' },
  { key: 'withoutIntegration', title: 'Sem integração', tone: 'neutral', path: 'M5 12h14' },
] as const

export function ProductsSummary({ periodLabel, ...values }: ProductsSummaryProps) {
  return (
    <Card>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-[#083B7A]">Resumo dos produtos</h3>
        <span className="rounded-md border border-slate-200 px-2 py-1 text-[11px] text-slate-600">
          {periodLabel}
        </span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {metrics.map((metric) => (
          <MetricCard
            key={metric.key}
            title={metric.title}
            tone={metric.tone}
            value={values[metric.key].value}
            variation={values[metric.key].variation}
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d={metric.path} />
              </svg>
            }
          />
        ))}
      </div>
    </Card>
  )
}
