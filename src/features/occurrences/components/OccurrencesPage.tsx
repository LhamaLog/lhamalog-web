import { useEffect, useId, useMemo, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAppliedPreferences } from '../../profile/preferences'
import { Button } from '../../../shared/ui/Button'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { ErrorState } from '../../../shared/ui/ErrorState'
import { LoadingState } from '../../../shared/ui/LoadingState'
import { Select } from '../../../shared/ui/Select'
import { situationLabels } from '../labels'
import {
  activeFilterCount, clearFilters, hasFiltersOrSearch, maxSearchLength, occurrencesPath, pageSizes,
  readOccurrenceQuery, writeOccurrenceQuery,
} from '../occurrenceQuery'
import type { OccurrenceQuery, PageSize } from '../occurrenceQuery'
import { toCardItem } from '../occurrenceView'
import type { OccurrencePage } from '../types'
import { useCoreResource } from '../useCoreResource'
import { OccurrenceFilters } from './OccurrenceFilters'
import { OccurrencesView } from './OccurrencesView'

const searchPause = 400

// /ocorrencias (spec 008, US1 and US2): the list of the Core, with its whole state in the address.
export function OccurrencesPage() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { language, timezone } = useAppliedPreferences()
  const query = useMemo(() => readOccurrenceQuery(params), [params])
  // The path is computed once per address, so `from` of a preset does not change at every render.
  const path = useMemo(() => occurrencesPath(query), [query])
  const resource = useCoreResource<OccurrencePage>(path)
  const [search, setSearch] = useState(query.q)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const situationId = useId()

  const go = (next: OccurrenceQuery) => setParams(writeOccurrenceQuery(next))

  // The address wins when it changes from outside (clear, back, link).
  useEffect(() => { setSearch(query.q) }, [query.q])

  // One request after a pause in typing, back to page 1 (FR-006).
  useEffect(() => {
    if (search === query.q) return
    const timer = window.setTimeout(() => go({ ...query, q: search.slice(0, maxSearchLength), page: 1 }), searchPause)
    return () => window.clearTimeout(timer)
  }, [search])

  const clear = () => { setSearch(''); setFiltersOpen(false); go(clearFilters(query)) }
  const page = resource.data
  const filtered = hasFiltersOrSearch(query)
  const clearButton = <Button size="small" fullWidth={false} variant="outline" onClick={clear}>Limpar filtros</Button>

  let status = null
  let emptyState = null
  let showPagination = false
  if (resource.error) {
    status = resource.error.status === 404
      ? <EmptyState title={resource.error.message || 'Produto não encontrado ou sem acesso.'} description="Um dos produtos do filtro não está disponível para você." action={clearButton} />
      : resource.error.status === 400
      ? <EmptyState title="Não foi possível aplicar os filtros" description={resource.error.message} action={clearButton} />
      : <ErrorState title="Não foi possível carregar as ocorrências" description={resource.error.message} onRetry={resource.reload} retrying={resource.loading} />
  } else if (!page || (resource.loading && page.items.length === 0)) {
    status = <LoadingState label="Carregando ocorrências..." rows={4} />
  } else if (page.items.length === 0 && page.totalItems > 0) {
    // Page beyond the last one: the pagination stays to go back.
    emptyState = <EmptyState title="Não há ocorrências nesta página" description="Volte para uma página anterior." />
    showPagination = true
  } else if (page.items.length === 0 && query.archived) {
    emptyState = <EmptyState title="Nenhuma ocorrência arquivada" action={filtered ? clearButton : undefined} />
  } else if (page.items.length === 0) {
    emptyState = filtered
      ? <EmptyState title="Nenhuma ocorrência encontrada para os filtros aplicados" action={clearButton} />
      : <EmptyState title="Nenhuma ocorrência por aqui ainda" description="As ocorrências dos seus produtos aparecem aqui assim que forem registradas." />
  } else {
    showPagination = true
  }

  return (
    <div aria-busy={resource.loading} className="space-y-4">
      <OccurrencesView
        header={{
          search,
          onSearchChange: setSearch,
          onFilterClick: () => setFiltersOpen(true),
          filterCount: activeFilterCount(query),
          description: 'Acompanhe os erros, alertas e eventos dos produtos a que você tem acesso.',
          searchMaxLength: maxSearchLength,
          pageSize: query.size,
          pageSizes,
          onPageSizeChange: (size) => go({ ...query, size: size as PageSize, page: 1 }),
          // Spec 013 (LLT-136): active or archived occurrences, kept in the address as situacao=arquivadas.
          controls: (
            <div className="sm:w-44">
              <Select id={situationId} label="Situação" hideLabel value={query.archived ? 'archived' : 'active'}
                onChange={(event) => go({ ...query, archived: event.target.value === 'archived', page: 1 })}>
                <option value="active">{situationLabels.active}</option>
                <option value="archived">{situationLabels.archived}</option>
              </Select>
            </div>
          ),
        }}
        list={{
          occurrences: page ? page.items.map(item => toCardItem(item, language, timezone)) : [],
          onOpen: (id) => navigate(`/ocorrencias/${encodeURIComponent(id)}`, { state: { from: location.search } }),
        }}
        pagination={showPagination && page ? {
          page: query.page,
          pageSize: query.size,
          totalItems: page.totalItems,
          itemLabel: 'ocorrências',
          onPageChange: (next) => go({ ...query, page: next }),
        } : undefined}
        emptyState={emptyState}
        status={status}
      />
      {filtersOpen && (
        <OccurrenceFilters
          query={query}
          onClose={() => setFiltersOpen(false)}
          onClear={clear}
          onApply={(filters) => { setFiltersOpen(false); go({ ...query, ...filters, q: search.slice(0, maxSearchLength), page: 1 }) }}
        />
      )}
    </div>
  )
}
