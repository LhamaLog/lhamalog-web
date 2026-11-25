import { occurrenceStatuses, occurrenceTypes } from './types'
import type { OccurrenceStatus, OccurrenceType } from './types'

// List state kept in the address (spec 008, FR-008): read, written and turned into the Core path here.

export const periodPresets = ['all', '24h', '7d', '30d'] as const
export type PeriodPreset = (typeof periodPresets)[number]

export const pageSizes = [10, 20, 50] as const
export type PageSize = (typeof pageSizes)[number]

export const maxSearchLength = 200
export const defaultPageSize: PageSize = 20

export type OccurrenceQuery = {
  q: string
  types: OccurrenceType[]
  statuses: OccurrenceStatus[]
  productIds: string[]
  period: PeriodPreset
  page: number
  size: PageSize
}

export const periodLabels: Record<PeriodPreset, string> = {
  all: 'Todo o período',
  '24h': 'Últimas 24 horas',
  '7d': 'Últimos 7 dias',
  '30d': 'Últimos 30 dias',
}

const periodMillis: Record<Exclude<PeriodPreset, 'all'>, number> = {
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
}

export function defaultOccurrenceQuery(): OccurrenceQuery {
  return { q: '', types: [], statuses: [], productIds: [], period: 'all', page: 1, size: defaultPageSize }
}

function known<T extends string>(values: string[], allowed: readonly T[]): T[] {
  return [...new Set(values.filter((value): value is T => (allowed as readonly string[]).includes(value)))]
}

function positiveInteger(value: string | null): number | null {
  if (value === null || !/^\d+$/.test(value)) return null
  const number = Number(value)
  return Number.isSafeInteger(number) && number >= 1 ? number : null
}

// Invalid values are dropped, never an error (FR-008, quickstart O19).
export function readOccurrenceQuery(params: URLSearchParams): OccurrenceQuery {
  const size = positiveInteger(params.get('size'))
  const period = params.get('periodo')
  return {
    q: (params.get('q') ?? '').slice(0, maxSearchLength),
    types: known(params.getAll('type'), occurrenceTypes),
    statuses: known(params.getAll('status'), occurrenceStatuses),
    productIds: [...new Set(params.getAll('productId').map(value => value.trim()).filter(Boolean))],
    period: (periodPresets as readonly string[]).includes(period ?? '') ? period as PeriodPreset : 'all',
    page: positiveInteger(params.get('page')) ?? 1,
    size: (pageSizes as readonly number[]).includes(size ?? 0) ? size as PageSize : defaultPageSize,
  }
}

// Default values are left out, so the link stays short.
export function writeOccurrenceQuery(query: OccurrenceQuery): URLSearchParams {
  const params = new URLSearchParams()
  if (query.q) params.set('q', query.q)
  query.types.forEach(type => params.append('type', type))
  query.statuses.forEach(status => params.append('status', status))
  query.productIds.forEach(id => params.append('productId', id))
  if (query.period !== 'all') params.set('periodo', query.period)
  if (query.page > 1) params.set('page', String(query.page))
  if (query.size !== defaultPageSize) params.set('size', String(query.size))
  return params
}

// The preset becomes `from` only when the Core is called, so a saved link keeps meaning "the last 7 days".
export function occurrencesPath(query: OccurrenceQuery, now: Date = new Date()): string {
  const params = new URLSearchParams()
  params.set('page', String(query.page))
  params.set('size', String(query.size))
  query.types.forEach(type => params.append('type', type))
  query.statuses.forEach(status => params.append('status', status))
  query.productIds.forEach(id => params.append('productId', id))
  if (query.period !== 'all') params.set('from', new Date(now.getTime() - periodMillis[query.period]).toISOString())
  const search = query.q.trim()
  if (search) params.set('q', search)
  return `/api/occurrences?${params.toString()}`
}

// Type, status, product and period count 1 each; the search is visible in its field and does not count.
export function activeFilterCount(query: OccurrenceQuery): number {
  return [query.types.length > 0, query.statuses.length > 0, query.productIds.length > 0, query.period !== 'all']
    .filter(Boolean).length
}

export function hasFiltersOrSearch(query: OccurrenceQuery): boolean {
  return activeFilterCount(query) > 0 || query.q.trim() !== ''
}

// Clears search and filters and goes back to page 1; the page size stays.
export function clearFilters(query: OccurrenceQuery): OccurrenceQuery {
  return { ...defaultOccurrenceQuery(), size: query.size }
}
