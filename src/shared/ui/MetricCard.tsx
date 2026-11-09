import type { ReactNode } from 'react'
import { Card } from './Card'
import { Sparkline } from './Sparkline'

type MetricCardProps = {
  title: string
  value: string | number
  unit?: string
  icon?: ReactNode
  variation?: string
  trend?: number[]
  tone?: 'blue' | 'green' | 'amber' | 'neutral' | 'red'
}

const tones = {
  red: { background: 'bg-red-50!', title: 'text-red-600', icon: 'bg-red-600' },
  blue: { background: 'bg-blue-50!', title: 'text-[#0C70F2]', icon: 'bg-[#0C70F2]' },
  green: { background: 'bg-green-50!', title: 'text-green-700', icon: 'bg-green-500' },
  amber: { background: 'bg-amber-50!', title: 'text-amber-700', icon: 'bg-amber-500' },
  neutral: { background: 'bg-slate-100!', title: 'text-slate-600', icon: 'bg-slate-600' },
}

export function MetricCard({ title, value, unit, icon, variation, trend, tone = 'blue' }: MetricCardProps) {
  const colors = tones[tone]

  return (
    <Card className={`flex min-w-0 items-start gap-3 border-transparent! ${colors.background}`}>
      {icon && (
        <span aria-hidden="true" className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white ${colors.icon}`}>
          {icon}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className={`break-words text-xs font-bold ${colors.title}`}>{title}</p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-2">
          <p className="break-words text-2xl font-bold text-[#083B7A]">
            {value}{unit && <span className="ml-1 text-lg">{unit}</span>}
          </p>
          {trend && (
            <span className={colors.title}>
              <Sparkline values={trend} label={`Histórico de ${title}: ${trend.filter(Number.isFinite).join(', ')}`} />
            </span>
          )}
        </div>
        {variation && <p className="mt-1 break-words text-[11px] text-slate-600">{variation}</p>}
      </div>
    </Card>
  )
}
