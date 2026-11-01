import type { ComponentProps } from 'react'
import { Card } from '../../../shared/ui/Card'
import { MetricCard } from '../../../shared/ui/MetricCard'
import { RankingList } from '../../../shared/ui/RankingList'

type MetricValue = Pick<ComponentProps<typeof MetricCard>, 'value' | 'unit' | 'variation' | 'trend'>

type OccurrencePanelsProps = {
  periodLabel: string
  metrics: { errors: MetricValue; warnings: MetricValue; information: MetricValue; resolved: MetricValue }
  activity: { label: string; values: number[] }[]
  activityColumns: string[]
  activityCaption: string
  services: ComponentProps<typeof RankingList>['items']
  resolutionTime: MetricValue
  resolutionRate: MetricValue
}

const metricDefinitions = [
  { key: 'errors', title: 'Erros', tone: 'red', path: 'M12 5v9M12 18h.01' },
  { key: 'warnings', title: 'Alertas', tone: 'amber', path: 'M12 5v9M12 18h.01' },
  { key: 'information', title: 'Informações', tone: 'blue', path: 'M12 11v7M12 6h.01' },
  { key: 'resolved', title: 'Resolvidas', tone: 'green', path: 'm5 12 4 4L19 6' },
] as const

const intensityColors = ['bg-blue-50', 'bg-blue-100', 'bg-blue-200', 'bg-blue-400', 'bg-[#0C70F2]']

function MetricIcon({ path }: { path: string }) {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={path} /></svg>
}

export function OccurrencePanels({ periodLabel, metrics, activity, activityColumns, activityCaption, services, resolutionTime, resolutionRate }: OccurrencePanelsProps) {
  const maximum = Math.max(1, ...activity.flatMap((row) => row.values).filter(Number.isFinite))

  return (
    <div className="space-y-3">
      <Card>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-[#083B7A]">Métricas principais</h3>
          <span className="text-[11px] text-slate-500">{periodLabel}</span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {metricDefinitions.map((metric) => (
            <MetricCard key={metric.key} {...metrics[metric.key]} title={metric.title} tone={metric.tone} icon={<MetricIcon path={metric.path} />} />
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="mb-3 text-sm font-bold text-[#083B7A]">Ocorrências por dia</h3>
        <table className="w-full table-fixed border-separate border-spacing-1 text-[10px]">
          <caption className="sr-only">{activityCaption}</caption>
          <colgroup><col className="w-7" />{activityColumns.map((label, index) => <col key={`${index}-${label}`} />)}</colgroup>
          <thead className="sr-only">
            <tr><th scope="col">Dia</th>{activityColumns.map((label, index) => <th scope="col" key={`${index}-${label}`}>{label}</th>)}</tr>
          </thead>
          <tbody>
            {activity.map((row, rowIndex) => (
              <tr key={`${rowIndex}-${row.label}`}>
                <th scope="row" aria-label={row.label} className="text-left font-normal text-slate-500">{row.label.slice(0, 3)}</th>
                {row.values.map((value, index) => {
                  const count = Number.isFinite(value) ? Math.max(0, value) : 0
                  const level = Math.min(4, Math.floor((count / maximum) * 4))
                  return (
                    <td key={index} title={`${row.label}, ${activityColumns[index] ?? `amostra ${index + 1}`}: ${count} ocorrências`}>
                      <span className="sr-only">{count} ocorrências</span>
                      <span aria-hidden="true" className={`block h-4 rounded ${intensityColors[level]}`} />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <div aria-hidden="true" className="mt-2 flex items-center justify-center gap-1 text-[10px] text-slate-500">
          Menos {intensityColors.map((color) => <span key={color} className={`h-3 w-4 rounded ${color}`} />)} Mais
        </div>
        <p className="mt-2 text-[10px] text-slate-500">{activityCaption}</p>
      </Card>

      <Card>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-[#083B7A]">Serviços mais impactados</h3>
          <span className="text-[11px] text-slate-500">{periodLabel}</span>
        </div>
        <RankingList items={[...services].sort((a, b) => b.value - a.value)} />
      </Card>

      <div className="grid gap-2 sm:grid-cols-2">
        <MetricCard {...resolutionTime} title="Tempo médio de resolução" icon={<MetricIcon path="M12 7v6l3 2M9 2h6M12 5a8 8 0 1 0 0 16 8 8 0 0 0 0-16Z" />} />
        <MetricCard {...resolutionRate} title="Taxa de resolução" tone="green" icon={<MetricIcon path="m5 12 4 4L19 6" />} />
      </div>
    </div>
  )
}
