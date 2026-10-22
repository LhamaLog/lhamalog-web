import type { ReactNode } from 'react'
import { Card } from './Card'

type MetricCardProps = {
  title: string
  value: string | number
  unit?: string
  icon?: ReactNode
  variation?: string
  tone?: 'blue' | 'green' | 'amber' | 'neutral'
}

const tones = {
  blue: { background: 'bg-blue-50!', title: 'text-[#0C70F2]', icon: 'bg-[#0C70F2]' },
  green: { background: 'bg-green-50!', title: 'text-green-700', icon: 'bg-green-500' },
  amber: { background: 'bg-amber-50!', title: 'text-amber-700', icon: 'bg-amber-500' },
  neutral: { background: 'bg-slate-100!', title: 'text-slate-600', icon: 'bg-slate-600' },
}

export function MetricCard({ title, value, unit, icon, variation, tone = 'blue' }: MetricCardProps) {
  const colors = tones[tone]

  return (
    <Card className={`flex min-w-0 items-start gap-3 border-transparent! ${colors.background}`}>
      {icon && (
        <span aria-hidden="true" className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white ${colors.icon}`}>
          {icon}
        </span>
      )}
      <div className="min-w-0">
        <p className={`break-words text-xs font-bold ${colors.title}`}>{title}</p>
        <p className="mt-1 break-words text-2xl font-bold text-[#083B7A]">
          {value}{unit && <span className="ml-1 text-lg">{unit}</span>}
        </p>
        {variation && <p className="mt-1 break-words text-[11px] text-slate-600">{variation}</p>}
      </div>
    </Card>
  )
}
