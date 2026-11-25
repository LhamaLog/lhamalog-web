import { useEffect, useId, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { useApi } from '../../../shared/services/useApi'
import { endsSession } from '../../../shared/services/sessionRedirect'
import { Button } from '../../../shared/ui/Button'
import { Checkbox } from '../../../shared/ui/Checkbox'
import { Select } from '../../../shared/ui/Select'
import { statusLabel, typeLabel } from '../labels'
import { periodLabels, periodPresets } from '../occurrenceQuery'
import type { OccurrenceQuery, PeriodPreset } from '../occurrenceQuery'
import { occurrenceStatuses, occurrenceTypes } from '../types'
import type { OccurrenceStatus, OccurrenceType } from '../types'

type ProductOption = { id: string; name: string; archived: boolean }

type OccurrenceFiltersProps = {
  query: OccurrenceQuery
  onApply: (filters: Pick<OccurrenceQuery, 'types' | 'statuses' | 'productIds' | 'period'>) => void
  onClear: () => void
  onClose: () => void
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter(item => item !== value) : [...list, value]
}

function readProducts(raw: unknown, archived: boolean): ProductOption[] {
  if (!Array.isArray(raw)) return []
  return raw.flatMap(item => item && typeof item.id === 'string'
    ? [{ id: item.id, name: typeof item.name === 'string' && item.name ? item.name : 'Produto sem nome', archived }]
    : [])
}

// Filter panel (spec 008, R5): a local draft applied only by "Aplicar filtros"; closing without applying discards it.
export function OccurrenceFilters({ query, onApply, onClear, onClose }: OccurrenceFiltersProps) {
  const request = useApi()
  const titleId = useId()
  const baseId = useId()
  const panel = useRef<HTMLDivElement>(null)
  const [types, setTypes] = useState<OccurrenceType[]>(query.types)
  const [statuses, setStatuses] = useState<OccurrenceStatus[]>(query.statuses)
  const [productIds, setProductIds] = useState<string[]>(query.productIds)
  const [period, setPeriod] = useState<PeriodPreset>(query.period)
  const [products, setProducts] = useState<ProductOption[] | null>(null)
  const [productsError, setProductsError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    Promise.all([
      request<unknown>('/api/products', { signal: controller.signal }),
      request<unknown>('/api/products?archived=true', { signal: controller.signal }),
    ]).then(([active, archived]) => {
      if (controller.signal.aborted) return
      const all = [...readProducts(active, false), ...readProducts(archived, true)]
      setProducts(all.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')))
    }).catch(reason => {
      if (!controller.signal.aborted && !endsSession(reason)) setProductsError('Não foi possível carregar os produtos.')
    })
    return () => controller.abort()
  }, [request])

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    panel.current?.querySelector<HTMLElement>('input, select, button')?.focus()
    return () => previous?.focus?.()
  }, [])

  // Keeps the focus inside the panel and closes it with Esc.
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.stopPropagation()
      onClose()
      return
    }
    if (event.key !== 'Tab' || !panel.current) return
    const focusable = [...panel.current.querySelectorAll<HTMLElement>('input:not([disabled]), select:not([disabled]), button:not([disabled])')]
    if (focusable.length === 0) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
  }

  const known = new Set(products?.map(product => product.id) ?? [])
  // Products of the address that the person can no longer see still show, so they can be unchecked.
  const unknown = products ? productIds.filter(id => !known.has(id)) : []

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-slate-900/30" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={onKeyDown}
        className="flex h-full w-full flex-col bg-white shadow-xl sm:max-w-sm"
      >
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <h2 id={titleId} className="text-base font-bold text-[#083B7A]">Filtros de ocorrências</h2>
          <Button size="icon" variant="outline" fullWidth={false} aria-label="Fechar filtros" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </Button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-4">
          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-semibold text-slate-900">Tipo</legend>
            {occurrenceTypes.map(type => (
              <Checkbox key={type} id={`${baseId}-type-${type}`} label={typeLabel(type)} checked={types.includes(type)} onChange={() => setTypes(toggle(types, type))} />
            ))}
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-semibold text-slate-900">Status</legend>
            {occurrenceStatuses.map(status => (
              <Checkbox key={status} id={`${baseId}-status-${status}`} label={statusLabel(status)} checked={statuses.includes(status)} onChange={() => setStatuses(toggle(statuses, status))} />
            ))}
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-semibold text-slate-900">Produto</legend>
            <p className="text-xs text-slate-500">{productIds.length === 0 ? 'Todos os produtos' : `${productIds.length} selecionado(s)`}</p>
            {productsError && <p role="alert" className="text-sm text-red-600">{productsError}</p>}
            {!products && !productsError && <p role="status" className="text-sm text-slate-500">Carregando produtos...</p>}
            {products?.length === 0 && <p className="text-sm text-slate-500">Nenhum produto disponível.</p>}
            {products?.map(product => (
              <Checkbox
                key={product.id}
                id={`${baseId}-product-${product.id}`}
                label={product.archived ? `${product.name} (arquivado)` : product.name}
                checked={productIds.includes(product.id)}
                onChange={() => setProductIds(toggle(productIds, product.id))}
              />
            ))}
            {unknown.map(id => (
              <Checkbox key={id} id={`${baseId}-product-${id}`} label="Produto indisponível" checked onChange={() => setProductIds(toggle(productIds, id))} />
            ))}
          </fieldset>

          <Select id={`${baseId}-period`} label="Período" value={period} onChange={(event) => setPeriod(event.target.value as PeriodPreset)}>
            {periodPresets.map(preset => <option key={preset} value={preset}>{periodLabels[preset]}</option>)}
          </Select>
        </div>

        <div className="flex flex-col gap-2 border-t border-slate-200 p-4 sm:flex-row-reverse">
          <Button onClick={() => onApply({ types, statuses, productIds, period })}>Aplicar filtros</Button>
          <Button variant="outline" onClick={onClear}>Limpar filtros</Button>
        </div>
      </div>
    </div>
  )
}
