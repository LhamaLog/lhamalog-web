import { Card } from '../../../shared/ui/Card'
import { RankingList } from '../../../shared/ui/RankingList'

type LogsByProductProps = {
  products: { id: string; name: string; logs: number; formattedValue?: string }[]
  periodLabel: string
}

export function LogsByProduct({ products, periodLabel }: LogsByProductProps) {
  const rankedProducts = [...products].sort((a, b) => b.logs - a.logs)

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-bold text-[#083B7A]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 text-[#0C70F2]">
            <path d="M5 3h14v18H5ZM8 7h8M8 11h8M8 15h5" />
          </svg>
          Logs por produto
        </h3>
        <span className="rounded-md border border-slate-200 px-2 py-1 text-[11px] text-slate-600">{periodLabel}</span>
      </div>
      <RankingList items={rankedProducts.map((product) => ({
        id: product.id,
        label: product.name,
        value: product.logs,
        formattedValue: product.formattedValue,
      }))} />
    </Card>
  )
}
