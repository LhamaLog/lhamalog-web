import { Card } from '../../../shared/ui/Card'
import { DistributionBars } from '../../../shared/ui/DistributionBars'

type ProductsByEnvironmentProps = {
  production: number
  staging: number
  development: number
}

export function ProductsByEnvironment({ production, staging, development }: ProductsByEnvironmentProps) {
  return (
    <Card>
      <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-[#083B7A]">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 text-[#0C70F2]">
          <path d="m12 3 10 5-10 5L2 8ZM2 12l10 5 10-5M2 16l10 5 10-5" />
        </svg>
        Produtos por ambiente
      </h3>
      <DistributionBars
        items={[
          { label: 'Produção', value: production, color: 'blue' },
          { label: 'Homologação', value: staging, color: 'amber' },
          { label: 'Desenvolvimento', value: development, color: 'navy' },
        ]}
      />
    </Card>
  )
}
