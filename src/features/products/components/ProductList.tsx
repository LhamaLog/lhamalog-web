import type { ComponentProps } from 'react'
import { ProductCard } from './ProductCard'

export type ProductListItem = ComponentProps<typeof ProductCard> & {
  id: string
}

type ProductListProps = {
  products: ProductListItem[]
}

export function ProductList({ products }: ProductListProps) {
  return (
    <ul aria-label="Produtos" className="space-y-2">
      {products.map(({ id, ...product }) => (
        <li key={id}>
          <ProductCard {...product} />
        </li>
      ))}
    </ul>
  )
}
