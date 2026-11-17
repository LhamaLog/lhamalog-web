export type Selection = { all: boolean; ids: string[] }
export type Preferences = {
  web: true; email: boolean; push: boolean
  products: Selection; types: Selection; severities: Selection; version: number | null
}
export type Option = { id: string; label: string }
export type Catalog = { types: Option[]; severities: Option[] }
export const preferencesPath = '/api/user/notification-preferences'
function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null
}
function identifier(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.trim() === value && value.length <= 200
}
function readSelection(value: unknown): Selection | null {
  const data = record(value)
  if (!data || typeof data.all !== 'boolean' || !Array.isArray(data.ids) || data.ids.length > 500
      || !data.ids.every(identifier) || new Set(data.ids).size !== data.ids.length
      || (data.all ? data.ids.length !== 0 : data.ids.length === 0)) return null
  return { all: data.all, ids: [...data.ids] }
}
export function readPreferences(value: unknown): Preferences | null {
  const data = record(value)
  if (!data || data.web !== true || typeof data.email !== 'boolean' || typeof data.push !== 'boolean'
      || !(data.version === null || (typeof data.version === 'number' && Number.isSafeInteger(data.version) && data.version >= 0))) return null
  const products = readSelection(data.products), types = readSelection(data.types), severities = readSelection(data.severities)
  if (!products || !types || !severities) return null
  return { web: true, email: data.email, push: data.push, products, types, severities, version: data.version as number | null }
}
function readOptions(value: unknown): Option[] | null {
  if (!Array.isArray(value) || value.length > 500) return null
  const options: Option[] = []
  for (const item of value) {
    const data = record(item)
    if (!data || !identifier(data.id) || typeof data.label !== 'string' || !data.label.trim() || data.label.length > 200) return null
    options.push({ id: data.id, label: data.label })
  }
  return new Set(options.map(item => item.id)).size === options.length ? options : null
}
export function readCatalog(value: unknown): Catalog | null {
  const data = record(value)
  if (!data) return null
  const types = readOptions(data.types), severities = readOptions(data.severities)
  return types && severities ? { types, severities } : null
}
export function readProducts(value: unknown): Option[] | null {
  if (!Array.isArray(value)) return null
  const options: Option[] = []
  for (const item of value) {
    const data = record(item)
    if (!data || !identifier(data.id) || typeof data.name !== 'string' || !data.name.trim()) return null
    options.push({ id: data.id, label: data.name })
  }
  return new Set(options.map(item => item.id)).size === options.length ? options : null
}
export function preferenceErrors(value: Preferences, catalog: Catalog, products: Option[]): string[] {
  const errors: string[] = []
  const groups = [
    ['produtos', value.products, products], ['tipos', value.types, catalog.types],
    ['severidades', value.severities, catalog.severities],
  ] as const
  for (const [label, selection, options] of groups) {
    if (!readSelection(selection)) errors.push('Selecione Todos ou ao menos um item em ' + label + '.')
    else if (!selection.all && selection.ids.some(id => !options.some(option => option.id === id)))
      errors.push('Remova os itens indisponíveis em ' + label + ' ou escolha Todos.')
  }
  return errors
}
export function preferencePayload(value: Preferences): Preferences {
  return { web: true, email: value.email, push: value.push,
    products: { all: value.products.all, ids: [...value.products.ids] },
    types: { all: value.types.all, ids: [...value.types.ids] },
    severities: { all: value.severities.all, ids: [...value.severities.ids] }, version: value.version }
}
export function confirmedPreferences(sent: Preferences, saved: Preferences): boolean {
  return sent.email === saved.email && sent.push === saved.push
    && (['products', 'types', 'severities'] as const).every(key =>
      sent[key].all === saved[key].all && sent[key].ids.length === saved[key].ids.length
      && sent[key].ids.every(id => saved[key].ids.includes(id)))
    && saved.version !== null && (sent.version === null || saved.version > sent.version)
}
