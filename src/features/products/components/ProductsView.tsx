import type { ComponentProps } from 'react'
import { Pagination } from '../../../shared/ui/Pagination'
import { ProductsHeader } from './ProductsHeader'
import { ProductList } from './ProductList'
import { ProductsSummary } from './ProductsSummary'
import { ProductsByEnvironment } from './ProductsByEnvironment'
import { LogsByProduct } from './LogsByProduct'
import { ProductIndicators } from './ProductIndicators'

type ProductsViewProps = {
  header: ComponentProps<typeof ProductsHeader>
  list: ComponentProps<typeof ProductList>
  pagination: ComponentProps<typeof Pagination>
  summary: ComponentProps<typeof ProductsSummary>
  environments: ComponentProps<typeof ProductsByEnvironment>
  logs: ComponentProps<typeof LogsByProduct>
  indicators: ComponentProps<typeof ProductIndicators>
}

export function ProductsView({ header, list, pagination, summary, environments, logs, indicators }: ProductsViewProps) {
  return (
    <div className="@container rounded-xl bg-slate-50 p-4">
      <div className="grid min-w-0 gap-5 @min-[64rem]:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="min-w-0 space-y-4">
          <ProductsHeader {...header} />
          <ProductList {...list} />
          <Pagination {...pagination} />
        </div>
        <div className="min-w-0 space-y-3">
          <ProductsSummary {...summary} />
          <ProductsByEnvironment {...environments} />
          <LogsByProduct {...logs} />
          <ProductIndicators {...indicators} />
        </div>
      </div>
    </div>
  )
}
