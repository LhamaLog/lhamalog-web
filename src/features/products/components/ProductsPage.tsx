import { useMemo, useState } from 'react'
import { useApiResource } from '../../../shared/hooks/useApiResource'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { ErrorState } from '../../../shared/ui/ErrorState'
import { LoadingState } from '../../../shared/ui/LoadingState'
import { Select } from '../../../shared/ui/Select'
import { useAppliedPreferences } from '../../profile/preferences'
import { loadProductDraft } from '../draft'
import {
  areaOptions,
  emptyFilters,
  filterCount,
  filterProducts,
  pageOf,
  productsPageSize,
  productsPath,
  sidePanelsFrom,
  toCardProps,
} from '../productView'
import type { EnvironmentKey, ProductFilters, Situation } from '../productView'
import type { Product } from '../types'
import { ProductForm } from './ProductForm'
import { ProductsView } from './ProductsView'

type Resource = {
  data: Product[] | null
  error: string
  loading: boolean
  reload: () => void
}

// Product list of the Figma (01-produtos-lista.png, spec 009 US1). The active list is always loaded, because the
// "Total" of the summary is the number of active products even while the archived situation is shown (F6).
export function ProductsPage() {
  const active = useApiResource<Product[]>(productsPath('active'))
  const [editing, setEditing] = useState<Product | 'new' | null>(null)
  const [message, setMessage] = useState('')
  const [filters, setFilters] = useState<ProductFilters>(emptyFilters)
  const [page, setPage] = useState(1)

  if (editing) {
    return (
      <ProductForm
        key={editing === 'new' ? 'new' : editing.id}
        product={editing === 'new' ? undefined : editing}
        areas={areaOptions(active.data ?? [])}
        onCancel={() => { setEditing(null); active.reload() }}
        onSaved={(product, text) => { setEditing(null); setMessage(text ?? `Produto ${product.name} salvo.`); active.reload() }}
      />
    )
  }

  const browser: BrowserProps = {
    activeTotal: active.data ? active.data.length : null,
    areas: areaOptions(active.data ?? []),
    filters,
    page,
    onFiltersChange: (next) => { setFilters(next); setPage(1) },
    onPageChange: setPage,
    onCreate: () => { setMessage(''); setEditing('new') },
    onEdit: (product) => { setMessage(''); setEditing(product) },
  }

  return (
    <div className="space-y-5">
      {message && <p role="status" className="rounded-lg bg-green-50 p-4 text-sm text-green-800">{message}</p>}
      {filters.situation === 'archived' ? <ArchivedProducts {...browser} /> : <ProductsBrowser {...browser} resource={active} />}
    </div>
  )
}

type BrowserProps = {
  activeTotal: number | null
  areas: string[]
  filters: ProductFilters
  page: number
  onFiltersChange: (filters: ProductFilters) => void
  onPageChange: (page: number) => void
  onCreate: () => void
  onEdit: (product: Product) => void
}

// Mounted only in the archived situation, so GET /api/products?archived=true runs only when it is needed.
function ArchivedProducts(props: BrowserProps) {
  const archived = useApiResource<Product[]>(productsPath('archived'))
  return <ProductsBrowser {...props} resource={archived} />
}

function ProductsBrowser({ resource, activeTotal, areas, filters, page, onFiltersChange, onPageChange, onCreate, onEdit }: BrowserProps & { resource: Resource }) {
  const { language } = useAppliedPreferences()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const products = useMemo(() => resource.data ?? [], [resource.data])
  const drafts = useMemo(() => new Map(products.map((product) => [product.id, loadProductDraft(product.id)])), [products])
  const draftOf = (id: string) => drafts.get(id) ?? loadProductDraft(id)
  const filtered = filterProducts(products, draftOf, filters)
  const current = pageOf(filtered, page)
  const panels = sidePanelsFrom(activeTotal, products)
  const archivedView = filters.situation === 'archived'

  let listState
  if (resource.loading) listState = <LoadingState label="Carregando produtos..." />
  else if (resource.error) listState = <ErrorState description={resource.error} onRetry={resource.reload} />
  else if (products.length === 0) {
    listState = archivedView
      ? <EmptyState title="Nenhum produto arquivado" description="Os produtos arquivados aparecem aqui." />
      : <EmptyState title="Nenhum produto disponível" description="Cadastre um produto ou solicite acesso ao administrador da empresa." />
  } else if (filtered.length === 0) listState = <EmptyState title="Nenhum produto encontrado" description="Tente outro termo ou ajuste os filtros." />

  return (
    <ProductsView
      header={{
        search: filters.search,
        onSearchChange: (search) => onFiltersChange({ ...filters, search }),
        filterCount: filterCount(filters),
        onFilterClick: () => setFiltersOpen((open) => !open),
        onCreateClick: onCreate,
      }}
      filters={filtersOpen && <FiltersPanel areas={areas} filters={filters} onChange={onFiltersChange} />}
      listState={listState}
      list={{
        products: current.items.map((product) => ({
          ...toCardProps(product, draftOf(product.id), language),
          icon: <CubeGlyph />,
          onOpen: () => onEdit(product),
        })),
      }}
      pagination={{ page: current.page, pageSize: productsPageSize, totalItems: filtered.length, itemLabel: 'produtos', onPageChange }}
      summary={panels.summary}
      environments={panels.environments}
      logs={panels.logs}
      indicators={panels.indicators}
    />
  )
}

function FiltersPanel({ areas, filters, onChange }: { areas: string[]; filters: ProductFilters; onChange: (filters: ProductFilters) => void }) {
  return (
    <Card className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <Select id="products-filter-area" label="Área" value={filters.area} onChange={(event) => onChange({ ...filters, area: event.target.value })}>
          <option value="">Todas as áreas</option>
          {areas.map((area) => <option key={area} value={area}>{area}</option>)}
        </Select>
        <Select id="products-filter-environment" label="Ambiente" value={filters.environment} onChange={(event) => onChange({ ...filters, environment: event.target.value as '' | EnvironmentKey })}>
          <option value="">Todos os ambientes</option>
          <option value="production">Produção</option>
          <option value="staging">Homologação</option>
          <option value="development">Desenvolvimento</option>
        </Select>
        <Select id="products-filter-situation" label="Situação" value={filters.situation} onChange={(event) => onChange({ ...filters, situation: event.target.value as Situation })}>
          <option value="active">Ativos</option>
          <option value="archived">Arquivados</option>
        </Select>
      </div>
      {filterCount(filters) > 0 && (
        <Button variant="outline" size="small" fullWidth={false} onClick={() => onChange({ ...emptyFilters, search: filters.search })}>
          Limpar filtros
        </Button>
      )}
    </Card>
  )
}

function CubeGlyph() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" aria-hidden="true">
      <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3zM12 12l8-4.5M12 12v9M12 12 4 7.5" />
    </svg>
  )
}
