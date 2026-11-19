import {
  defaultDashboardFilter,
  isKnownPreset,
  parseSeverities,
  resolvePresetRange,
  validateDashboardFilter,
} from './filterPeriod'
import type { DashboardFilter, PeriodPreset, Severity } from './types'

export type DashboardQuery = {
  produto?: string | string[] | null
  periodo?: string | null
  de?: string | null
  ate?: string | null
  tipo?: string | string[] | null
}

export type ApplyFilterResult = {
  applied: DashboardFilter
  changed: boolean
  invalid: boolean
  messageKey: 'dashboard.filter.invalid' | 'dashboard.filter.periodTooLong' | 'dashboard.filter.rangeOrder' | null
  messageDays?: number
  searchParams: URLSearchParams
}

function asList(value: string | string[] | null | undefined): string[] {
  if (value == null || value === '') return []
  if (Array.isArray(value)) {
    return value.flatMap((item) => item.split(',')).map((item) => item.trim()).filter(Boolean)
  }
  return value.split(',').map((item) => item.trim()).filter(Boolean)
}

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function deserializeDashboardQuery(
  query: DashboardQuery,
  base: DashboardFilter = defaultDashboardFilter(),
  now = new Date(),
): DashboardFilter {
  const productIds = asList(query.produto)
  const periodPreset: PeriodPreset = isKnownPreset(query.periodo) ? query.periodo : base.periodPreset
  const severities = parseSeverities(query.tipo)
  let from = base.from
  let to = base.to
  if (periodPreset === 'personalizado') {
    from = parseDate(query.de)
    to = parseDate(query.ate)
  } else {
    const range = resolvePresetRange(periodPreset, now)
    if (range) {
      from = range.from
      to = range.to
    }
  }
  return {
    ...base,
    productIds,
    periodPreset,
    from,
    to,
    severities: severities === null ? base.severities : severities,
  }
}

export type ProductDashboardLoadDecision =
  | { type: 'idle' }
  | { type: 'select_default_product', filter: DashboardFilter }
  | { type: 'fetch', filter: DashboardFilter }

/** Decisão pura: sem produto na URL → 1º autorizado; com produto e intervalo → buscar métricas. */
export function decideProductDashboardLoad(input: {
  applied: DashboardFilter
  authorizedProductIds: string[]
  memberWithoutProducts: boolean
}): ProductDashboardLoadDecision {
  if (input.memberWithoutProducts) return { type: 'idle' }
  const currentId = input.applied.productIds[0]
  if (!currentId) {
    const firstId = input.authorizedProductIds[0]
    if (!firstId) return { type: 'idle' }
    return {
      type: 'select_default_product',
      filter: { ...input.applied, productIds: [firstId] },
    }
  }
  if (!input.applied.from || !input.applied.to) return { type: 'idle' }
  return { type: 'fetch', filter: input.applied }
}

export function serializeDashboardFilter(filter: DashboardFilter, mode: 'product' | 'company' = 'product'): URLSearchParams {
  const params = new URLSearchParams()
  if (mode === 'product' && filter.productIds[0]) {
    params.set('produto', filter.productIds[0])
  }
  if (mode === 'company') {
    for (const id of filter.productIds) params.append('produto', id)
  }
  params.set('periodo', filter.periodPreset)
  if (filter.periodPreset === 'personalizado' && filter.from && filter.to) {
    params.set('de', filter.from.toISOString())
    params.set('ate', filter.to.toISOString())
  }
  if (filter.severities.length > 0 && filter.severities.length < 3) {
    params.set('tipo', filter.severities.join(','))
  }
  return params
}

/** Evita setSearchParams quando a query já é a desejada (setSearchParams muda de identidade a cada navigate). */
export function shouldReplaceSearchParams(current: URLSearchParams, next: URLSearchParams): boolean {
  return current.toString() !== next.toString()
}

export function applyDashboardFilters(input: {
  current: DashboardFilter
  draft: DashboardFilter
  now?: Date
}): ApplyFilterResult {
  const validation = validateDashboardFilter(input.draft, input.now)
  if (!validation.ok || !validation.filter) {
    return {
      applied: input.current,
      changed: false,
      invalid: true,
      messageKey: validation.messageKey ?? 'dashboard.filter.invalid',
      messageDays: validation.messageDays,
      searchParams: serializeDashboardFilter(input.current),
    }
  }
  return {
    applied: validation.filter,
    changed: true,
    invalid: false,
    messageKey: null,
    searchParams: serializeDashboardFilter(validation.filter),
  }
}

export function applyCompanyDashboardFilters(input: {
  current: DashboardFilter
  draft: DashboardFilter
  authorizedIds: string[]
  now?: Date
}): ApplyFilterResult {
  const authorized = new Set(input.authorizedIds)
  if (input.draft.productIds.some((id) => !authorized.has(id))) {
    return {
      applied: input.current,
      changed: false,
      invalid: true,
      messageKey: 'dashboard.filter.invalid',
      searchParams: serializeDashboardFilter(input.current, 'company'),
    }
  }
  const result = applyDashboardFilters(input)
  return {
    ...result,
    searchParams: serializeDashboardFilter(result.invalid ? input.current : result.applied, 'company'),
  }
}

export function clearCompanyProductSelection(filter: DashboardFilter): DashboardFilter {
  return { ...filter, productIds: [] }
}

export function severitiesForQuery(severities: Severity[]): Severity[] {
  return severities.length === 0 || severities.length === 3 ? [] : severities
}
