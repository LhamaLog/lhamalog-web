// Props of the product list of the Figma (01-produtos-lista.png) built from the Core product and the local draft
// (spec 009, US1, F1). Pure functions: no React, so tests/*.test.mjs can run them. Nothing here invents numbers:
// what the Core does not know is null and the screen shows a neutral state.
import { environmentLabel, uniqueSorted } from './productListModel'
import type { Product, ProductUiDraft } from './types'

// The Figma shows "Mostrando 1 - 6 de 24 produtos".
export const productsPageSize = 6

export type EnvironmentKey = 'production' | 'staging' | 'development'

export type Situation = 'active' | 'archived'

export type ProductFilters = {
  search: string
  area: string
  environment: '' | EnvironmentKey
  situation: Situation
}

export const emptyFilters: ProductFilters = { search: '', area: '', environment: '', situation: 'active' }

// The Core has no integration status nor last log yet (F1): every card is "Sem integração", without last log.
export type ProductCardData = {
  id: string
  name: string
  description: string
  status: 'none'
  categories: string[]
  area: string
  lastLog: null
  environment: EnvironmentKey | null
  archivedLabel: string | null
}

export type ProductSummaryData = {
  total: number
  connected: null
  waiting: null
  withoutIntegration: null
}

const environmentKeys: Record<string, EnvironmentKey> = {
  Produção: 'production',
  Homologação: 'staging',
  Desenvolvimento: 'development',
}

export function environmentKey(value?: string | null): EnvironmentKey | null {
  return environmentKeys[environmentLabel(value)] ?? null
}

function dateLabel(value: string, locale: string): string | null {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date)
}

export function toCardProps(product: Product, draft: ProductUiDraft, locale = 'pt-BR'): ProductCardData {
  const type = draft.productType.trim()
  const archivedOn = product.archivedAt ? dateLabel(product.archivedAt, locale) : null
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    status: 'none',
    categories: type ? [type] : [],
    area: product.category.trim(),
    lastLog: null,
    environment: environmentKey(draft.environment),
    archivedLabel: archivedOn ? `Arquivado em ${archivedOn}` : null,
  }
}

// Only the total is real. Connected, waiting and without integration depend on ingestion data the Core does not
// expose yet (pendências para o Core).
export function summaryFrom(products: Product[]): ProductSummaryData {
  return { total: products.length, connected: null, waiting: null, withoutIntegration: null }
}

// The archived situation is not filtered here: it changes the Core call (GET /api/products?archived=true).
export function filterProducts(products: Product[], draftOf: (id: string) => ProductUiDraft, filters: ProductFilters): Product[] {
  const search = filters.search.trim().toLocaleLowerCase('pt-BR')
  return products.filter((product) => {
    if (filters.area && product.category.trim() !== filters.area) return false
    if (filters.environment && environmentKey(draftOf(product.id).environment) !== filters.environment) return false
    if (!search) return true
    return `${product.name} ${product.description}`.toLocaleLowerCase('pt-BR').includes(search)
  })
}

export function filterCount(filters: ProductFilters): number {
  return [filters.area !== '', filters.environment !== '', filters.situation === 'archived'].filter(Boolean).length
}

// Options of the "Área" select (clarify N2): the areas the company already uses, case-insensitive, sorted.
// When the same area was typed in different cases, the spelling of the first product wins.
export function areaOptions(products: Product[]): string[] {
  const byKey = new Map<string, string>()
  for (const product of products) {
    const value = product.category.trim()
    const key = value.toLocaleLowerCase('pt-BR')
    if (value && !byKey.has(key)) byKey.set(key, value)
  }
  return uniqueSorted([...byKey.values()])
}

export function pageOf<T>(items: T[], page: number, size = productsPageSize): { items: T[]; page: number; totalPages: number; first: number; last: number } {
  const totalPages = Math.max(1, Math.ceil(items.length / size))
  const current = Math.min(Math.max(1, Math.floor(page) || 1), totalPages)
  const start = (current - 1) * size
  const slice = items.slice(start, start + size)
  return { items: slice, page: current, totalPages, first: slice.length ? start + 1 : 0, last: start + slice.length }
}

// GET /api/products returns only active products; archived ones need ?archived=true (contracts/core-api.md, F6).
export function productsPath(situation: Situation): string {
  return situation === 'archived' ? '/api/products?archived=true' : '/api/products'
}

export const neutralValue = '—'

// The Figma shows "Últimos 7 dias" on the summary and on the logs ranking. The period does not change anything yet,
// because the Core has no ingestion numbers (F1, analyze A5).
export const periodLabel = 'Últimos 7 dias'

const logsRankingSize = 5

// Props of the side panels of the Figma. Only the total of active products is real (null while it is unknown);
// everything else is a dash, never a made-up number (F1).
export function sidePanelsFrom(activeTotal: number | null, products: Product[]) {
  const neutral = { value: neutralValue }
  return {
    summary: {
      periodLabel,
      total: { value: activeTotal ?? neutralValue },
      connected: neutral,
      waiting: neutral,
      withoutIntegration: neutral,
    },
    environments: { production: null, staging: null, development: null },
    logs: {
      periodLabel,
      products: products.slice(0, logsRankingSize).map((product) => ({ id: product.id, name: product.name, logs: 0, formattedValue: neutralValue })),
    },
    indicators: { activeIntegrations: neutral, logsToday: neutral },
  }
}
