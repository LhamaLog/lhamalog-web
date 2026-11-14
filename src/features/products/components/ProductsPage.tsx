import { useState } from 'react'
import { useApiResource } from '../../../shared/hooks/useApiResource'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { ErrorState } from '../../../shared/ui/ErrorState'
import { Input } from '../../../shared/ui/Input'
import { LoadingState } from '../../../shared/ui/LoadingState'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { Pagination } from '../../../shared/ui/Pagination'
import { SearchInput } from '../../../shared/ui/SearchInput'
import { Select } from '../../../shared/ui/Select'
import { useAppliedPreferences } from '../../profile/preferences'
import { environmentLabel, filterProducts, formatPercent, productMetrics, uniqueSorted } from '../productListModel'
import type { Product } from '../types'
import { ProductForm } from './ProductForm'
import { ProductTable } from './ProductTable'

const pageSize = 8

export function ProductsPage() {
  const resource = useApiResource<Product[]>('/api/products')
  const [editing, setEditing] = useState<Product | 'new' | null>(null)
  const [message, setMessage] = useState('')

  return (
    <div className="space-y-5">
      {message && !editing && <p role="status" className="rounded-lg bg-green-50 p-4 text-sm text-green-800">{message}</p>}
      {editing ? (
        <ProductForm
          key={editing === 'new' ? 'new' : editing.id}
          product={editing === 'new' ? undefined : editing}
          onCancel={() => { setEditing(null); resource.reload() }}
          onSaved={(product) => { setEditing(null); setMessage(`Produto ${product.name} salvo.`); resource.reload() }}
        />
      ) : (
        <ProductsBrowser
          products={resource.data ?? []}
          loading={resource.loading}
          error={resource.error}
          onRetry={resource.reload}
          onCreate={() => { setMessage(''); setEditing('new') }}
          onEdit={(product) => { setMessage(''); setEditing(product) }}
        />
      )}
    </div>
  )
}

export function ProductsBrowser({
  products,
  loading = false,
  error = '',
  onRetry,
  onCreate,
  onEdit,
}: {
  products: Product[]
  loading?: boolean
  error?: string
  onRetry?: () => void
  onCreate: () => void
  onEdit: (product: Product) => void
}) {
  const [search, setSearch] = useState('')
  const [environment, setEnvironment] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('')
  const [owner, setOwner] = useState('')
  const [moreFilters, setMoreFilters] = useState(false)
  const [page, setPage] = useState(1)
  const metrics = productMetrics(products)
  const filtered = filterProducts(products, { search, environment, category, status, owner })
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const { language } = useAppliedPreferences()
  const categories = uniqueSorted(products.map((product) => product.category), language)
  const statuses = uniqueSorted(products.map((product) => product.status), language)
  const environments = uniqueSorted(['Produção', 'Homologação', 'Desenvolvimento', ...products.map((product) => environmentLabel(product.environment))], language)

  function update(setter: (value: string) => void) {
    return (value: string) => {
      setter(value)
      setPage(1)
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Produtos"
        description="Gerencie e monitore todos os seus produtos em um só lugar."
        icon={<CubeIcon />}
        actions={
          <Button fullWidth={false} onClick={onCreate}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Novo produto
          </Button>
        }
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric title="Total de Produtos" value={String(metrics.total)} detail="na lista atual" tone="blue" icon="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3zM12 12l8-4.5M12 12v9M12 12L4 7.5" />
        <Metric title="Produtos Saudáveis" value={String(metrics.healthy)} detail="conforme o status informado" tone="green" icon="m5 12 5 5L20 7" />
        <Metric title="Com Incidentes" value={String(metrics.incidents)} detail="conforme o status informado" tone="red" icon="M12 9v4M12 17h.01M12 3l10 18H2L12 3z" />
        <Metric title="Disponibilidade Média" value={formatPercent(metrics.availability, language) ?? '—'} detail={metrics.availability === null ? 'SLA ainda não vem da API' : 'média informada pelos produtos'} tone="green" icon="M3 12h4l2-6 4 12 2-6h6" />
      </div>
      <Card className="space-y-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="min-w-0 flex-1">
            <SearchInput id="products-search" label="Buscar produtos" placeholder="Buscar por nome, descrição ou owner..." value={search} onChange={(event) => update(setSearch)(event.target.value)} />
          </div>
          <Select id="products-environment" label="Ambiente" hideLabel wrapperClassName="xl:w-52" value={environment} onChange={(event) => update(setEnvironment)(event.target.value)}>
            <option value="">Todos os ambientes</option>
            {environments.map((item) => <option key={item} value={item}>{item}</option>)}
          </Select>
          <Select id="products-category" label="Categoria" hideLabel wrapperClassName="xl:w-48" value={category} onChange={(event) => update(setCategory)(event.target.value)}>
            <option value="">Todas as categorias</option>
            {categories.map((item) => <option key={item} value={item}>{item}</option>)}
          </Select>
          <Select id="products-status" label="Status" hideLabel wrapperClassName="xl:w-44" value={status} onChange={(event) => update(setStatus)(event.target.value)}>
            <option value="">Todos os status</option>
            {statuses.map((item) => <option key={item} value={item}>{item}</option>)}
          </Select>
          <Button variant="outline" size="small" fullWidth={false} aria-expanded={moreFilters} onClick={() => setMoreFilters((current) => !current)}>
            Mais filtros
          </Button>
        </div>
        {moreFilters && (
          <div className="max-w-sm">
            <Input id="products-owner" label="Owner" compact placeholder="Filtrar por responsável" value={owner} onChange={(event) => update(setOwner)(event.target.value)} />
          </div>
        )}
        {loading ? <LoadingState label="Carregando produtos..." />
          : error ? <ErrorState description={error} onRetry={onRetry ?? (() => undefined)} />
            : products.length === 0 ? <EmptyState title="Nenhum produto disponível" description="Cadastre um produto ou solicite acesso ao administrador da empresa." />
              : filtered.length === 0 ? <EmptyState title="Nenhum produto encontrado" description="Tente outro termo ou ajuste os filtros." />
                : <ProductTable products={visible} onEdit={onEdit} />}
        {!loading && !error && filtered.length > 0 && (
          <Pagination page={currentPage} pageSize={pageSize} totalItems={filtered.length} onPageChange={setPage} itemLabel="produtos" />
        )}
      </Card>
    </div>
  )
}

function Metric({ title, value, detail, tone, icon }: { title: string; value: string; detail: string; tone: 'blue' | 'green' | 'red'; icon: string }) {
  const tones = {
    blue: 'bg-blue-50 text-[#0C70F2]',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-500',
  }
  return (
    <Card className="flex items-center gap-4">
      <span aria-hidden="true" className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${tones[tone]}`}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d={icon} />
        </svg>
      </span>
      <span className="min-w-0">
        <span className="block text-sm text-slate-500">{title}</span>
        <span className="block text-2xl font-bold text-[#083B7A]">{value}</span>
        <span className="block text-xs text-slate-500">{detail}</span>
      </span>
    </Card>
  )
}

function CubeIcon() {
  return (
    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#0C70F2]">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" aria-hidden="true">
        <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3zM12 12l8-4.5M12 12v9M12 12 4 7.5" />
      </svg>
    </span>
  )
}
