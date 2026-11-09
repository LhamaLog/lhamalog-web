import type { ComponentProps } from 'react'
import { MetricCard } from '../../../shared/ui/MetricCard'

type IndicatorValue = Pick<ComponentProps<typeof MetricCard>, 'value' | 'unit' | 'variation' | 'trend'>

type ProductIndicatorsProps = {
  activeIntegrations: IndicatorValue
  logsToday: IndicatorValue
}

export function ProductIndicators({ activeIntegrations, logsToday }: ProductIndicatorsProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <MetricCard
        {...activeIntegrations}
        title="Integrações ativas"
        tone="green"
        icon={
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4" />
          </svg>
        }
      />
      <MetricCard
        {...logsToday}
        title="Logs recebidos hoje"
        icon={
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 3h14v18H5ZM8 7h8M8 11h8M8 15h5" />
          </svg>
        }
      />
    </div>
  )
}
