import { useState } from 'react'
import { useApiResource } from '../../../shared/hooks/useApiResource'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { SearchInput } from '../../../shared/ui/SearchInput'
import { Pagination } from '../../../shared/ui/Pagination'
import { Card } from '../../../shared/ui/Card'
import { Badge } from '../../../shared/ui/Badge'
import { Button } from '../../../shared/ui/Button'
import { LoadingState } from '../../../shared/ui/LoadingState'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { ErrorState } from '../../../shared/ui/ErrorState'
import { ProductForm } from './ProductForm'
import type { Product } from '../types'

export function ProductsPage() {
  const resource = useApiResource<Product[]>('/api/products')
  const [editing, setEditing] = useState<Product | 'new' | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [message, setMessage] = useState('')
  const products = (resource.data ?? []).filter(product => `${product.name} ${product.description ?? ''} ${product.category ?? ''}`.toLocaleLowerCase().includes(search.toLocaleLowerCase()))
  const currentPage = Math.min(page, Math.max(1, Math.ceil(products.length / 6)))
  return <div className="space-y-5">
    <PageHeader title="Produtos" description="Consulte os produtos da empresa aos quais você tem acesso."
      actions={!editing && <Button fullWidth={false} onClick={() => { setMessage(''); setEditing('new') }}>Cadastrar produto</Button>} />
    {message && <p role="status" className="rounded-lg bg-green-50 p-4 text-green-800">{message}</p>}
    {editing ? <ProductForm key={editing === 'new' ? 'new' : editing.id} product={editing === 'new' ? undefined : editing}
      onCancel={() => { setEditing(null); resource.reload() }} onSaved={product => { setEditing(null); setMessage(`Produto ${product.name} salvo.`); resource.reload() }} />
      : <>
        <SearchInput id="products-search" label="Buscar produtos" placeholder="Buscar por nome, descrição ou categoria" value={search} onChange={event => { setSearch(event.target.value); setPage(1) }} />
        {resource.loading ? <LoadingState label="Carregando produtos..." />
          : resource.error ? <ErrorState description={resource.error} onRetry={resource.reload} />
            : products.length === 0 ? <EmptyState title={search ? 'Nenhum produto encontrado' : 'Nenhum produto disponível'} description={search ? 'Tente outro termo de busca.' : 'Cadastre um produto ou solicite acesso ao administrador da empresa.'} />
              : <div className="space-y-3">{products.slice((currentPage - 1) * 6, currentPage * 6).map(product => <Card key={product.id} className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div className="min-w-0 space-y-2">
                  <h2 className="break-words font-bold text-[#083B7A]">{product.name}</h2>
                  <p className="break-words text-sm text-slate-600">{product.description || 'Sem descrição.'}</p>
                  <div className="flex flex-wrap gap-2">{product.category && <Badge>{product.category}</Badge>}{product.productVersion && <Badge>{product.productVersion}</Badge>}</div>
                </div>
                <Button variant="soft" fullWidth={false} onClick={() => { setMessage(''); setEditing(product) }}>Editar contexto<span className="sr-only"> de {product.name}</span></Button>
              </Card>)}</div>}
        {!resource.loading && !resource.error && products.length > 0 && <Pagination page={currentPage} pageSize={6} totalItems={products.length} onPageChange={setPage} itemLabel="produtos" />}
      </>}
  </div>
}
