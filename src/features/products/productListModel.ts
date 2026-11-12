import type { Product, ProductUiDraft } from './types'

const environmentAliases: Record<string, string> = {
  production: 'Produção',
  prod: 'Produção',
  produção: 'Produção',
  staging: 'Homologação',
  homologacao: 'Homologação',
  homologação: 'Homologação',
  development: 'Desenvolvimento',
  dev: 'Desenvolvimento',
  desenvolvimento: 'Desenvolvimento',
}

export type ProductQuery = {
  search: string
  environment: string
  category: string
  status: string
  owner: string
}

export function environmentLabel(value?: string | null) {
  if (!value?.trim()) return ''
  return environmentAliases[value.trim().toLocaleLowerCase()] ?? value.trim()
}

export function statusTone(status: string): 'success' | 'warning' | 'danger' | 'neutral' {
  const value = status.toLocaleLowerCase()
  if (!value.trim()) return 'neutral'
  if (/(incident|erro|error|fail|falha|critic)/.test(value)) return 'danger'
  if (/(degrad|warn|aguard|pending)/.test(value)) return 'warning'
  if (/(saud|health|ativ|connect|ok|success)/.test(value)) return 'success'
  return 'neutral'
}

export function filterProducts(products: Product[], query: ProductQuery) {
  const search = query.search.trim().toLocaleLowerCase()
  const owner = query.owner.trim().toLocaleLowerCase()
  return products.filter((product) => {
    if (query.environment && environmentLabel(product.environment) !== query.environment) return false
    if (query.category && product.category !== query.category) return false
    if (query.status && product.status !== query.status) return false
    if (owner && !(product.owner ?? '').toLocaleLowerCase().includes(owner)) return false
    if (!search) return true
    const haystack = [product.name, product.description, product.category, product.status, product.owner, environmentLabel(product.environment)].join(' ').toLocaleLowerCase()
    return haystack.includes(search)
  })
}

export function productMetrics(products: Product[]) {
  const samples = products
    .map((product) => (typeof product.availability === 'number' ? product.availability : product.sla))
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
  return {
    total: products.length,
    healthy: products.filter((product) => statusTone(product.status) === 'success').length,
    incidents: products.filter((product) => statusTone(product.status) === 'danger').length,
    availability: samples.length ? samples.reduce((sum, value) => sum + value, 0) / samples.length : null,
  }
}

export function uniqueSorted(values: Array<string | undefined>, locale = 'pt-BR') {
  return [...new Set(values.map((value) => value?.trim() ?? '').filter(Boolean))].sort((a, b) => a.localeCompare(b, locale))
}

export function occurrenceText(value?: string | null, now = Date.now(), locale = 'pt-BR') {
  if (!value?.trim()) return 'Sem registro'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const minutes = Math.round((date.getTime() - now) / 60000)
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'always' })
  if (Math.abs(minutes) < 60) return formatter.format(minutes, 'minute')
  const hours = Math.round(minutes / 60)
  if (Math.abs(hours) < 24) return formatter.format(hours, 'hour')
  return formatter.format(Math.round(hours / 24), 'day')
}

export function formatPercent(value?: number | null, locale = 'pt-BR') {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  return `${value.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
}

export function initials(name: string, locale = 'pt-BR') {
  const letters = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0] ?? '')
  return letters.join('').toLocaleUpperCase(locale) || '•'
}

export function productFieldErrors(input: { editing: boolean; name: string; category: string; draft: ProductUiDraft }) {
  if (input.editing) return {}
  const errors: Record<string, string> = {}
  if (!input.name.trim()) errors.name = 'Informe o nome do produto.'
  if (!input.draft.productType.trim()) errors.productType = 'Selecione o tipo de produto.'
  if (!input.draft.environment.trim()) errors.environment = 'Selecione o ambiente.'
  if (!input.category.trim()) errors.category = 'Informe o domínio ou a área.'
  if (!input.draft.team.trim()) errors.team = 'Informe a equipe responsável.'
  if (!input.draft.criticality.trim()) errors.criticality = 'Selecione a criticidade.'
  if (!input.draft.project.trim()) errors.project = 'Informe o projeto.'
  if (!input.draft.service.trim()) errors.service = 'Informe a aplicação principal.'
  if (!input.draft.logLevel.trim()) errors.logLevel = 'Selecione o nível de log.'
  return errors
}
