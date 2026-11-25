import { useAppliedPreferences } from '../../profile/preferences'
import { Card } from '../../../shared/ui/Card'
import { DistributionBars } from '../../../shared/ui/DistributionBars'

// null shows "—" with an empty bar: the Core does not count products by environment yet (spec 009, F1).
type ProductsByEnvironmentProps = {
  production: number | null
  staging: number | null
  development: number | null
}

function bar(value: number | null) {
  return value === null ? { value: 0, formattedValue: '—' } : { value }
}

export function ProductsByEnvironment({ production, staging, development }: ProductsByEnvironmentProps) {
  const { language } = useAppliedPreferences()
  return (
    <Card>
      <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-[#083B7A]">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 text-[#0C70F2]">
          <path d="m12 3 10 5-10 5L2 8ZM2 12l10 5 10-5M2 16l10 5 10-5" />
        </svg>
        Produtos por ambiente
      </h3>
      <DistributionBars
        locale={language}
        items={[
          { label: 'Produção', ...bar(production), color: 'blue' },
          { label: 'Homologação', ...bar(staging), color: 'amber' },
          { label: 'Desenvolvimento', ...bar(development), color: 'navy' },
        ]}
      />
    </Card>
  )
}
