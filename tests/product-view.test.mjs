import { register } from 'node:module'
import { test } from 'node:test'
import assert from 'node:assert/strict'

register(new URL('./resolve-ts.mjs', import.meta.url))

const context = { functionalDescription: '', personality: 'STANDARD', responseLanguage: 'pt-BR', architecture: [], scope: [], sensitiveData: [] }

function product(overrides = {}) {
  return {
    id: 'p-1', tenantId: 't-1', name: 'API de Pagamentos', description: 'Processamento de cobranças',
    category: 'Financeiro', productVersion: '2.4.1', status: 'CONFIGURING', createdAt: '2026-11-01T12:00:00Z',
    context, version: 3, archivedAt: null, ...overrides,
  }
}

test('a Core product with an empty local draft shows only real data and neutral states (F1)', async () => {
  const { toCardProps } = await import('../src/features/products/productView.ts')
  const { emptyProductDraft } = await import('../src/features/products/types.ts')
  assert.deepEqual(toCardProps(product(), emptyProductDraft()), {
    id: 'p-1',
    name: 'API de Pagamentos',
    description: 'Processamento de cobranças',
    status: 'none',
    categories: [],
    area: 'Financeiro',
    lastLog: null,
    environment: null,
    archivedLabel: null,
  })
})

test('the local draft fills the type and the environment of the card', async () => {
  const { toCardProps } = await import('../src/features/products/productView.ts')
  const { emptyProductDraft } = await import('../src/features/products/types.ts')
  const draft = { ...emptyProductDraft(), productType: ' API / Serviço ', environment: 'Homologação' }
  const card = toCardProps(product(), draft)
  assert.deepEqual(card.categories, ['API / Serviço'])
  assert.equal(card.environment, 'staging')
  assert.equal(toCardProps(product(), { ...draft, environment: 'production' }).environment, 'production')
  assert.equal(toCardProps(product(), { ...draft, environment: 'Marte' }).environment, null)
})

test('an archived product gets the archived badge with the date', async () => {
  const { toCardProps } = await import('../src/features/products/productView.ts')
  const { emptyProductDraft } = await import('../src/features/products/types.ts')
  const card = toCardProps(product({ archivedAt: '2026-11-01T12:00:00Z' }), emptyProductDraft())
  assert.equal(card.archivedLabel, 'Arquivado em 01/11/2026')
})

test('the summary has the real total and neutral values for what the Core does not know', async () => {
  const { summaryFrom } = await import('../src/features/products/productView.ts')
  assert.deepEqual(summaryFrom([product(), product({ id: 'p-2' })]), { total: 2, connected: null, waiting: null, withoutIntegration: null })
  assert.deepEqual(summaryFrom([]), { total: 0, connected: null, waiting: null, withoutIntegration: null })
})

test('search looks at name and description; area and environment filter too', async () => {
  const { filterProducts, emptyFilters } = await import('../src/features/products/productView.ts')
  const { emptyProductDraft } = await import('../src/features/products/types.ts')
  const products = [
    product(),
    product({ id: 'p-2', name: 'Plataforma Web', description: 'Portal do cliente', category: 'Comercial' }),
  ]
  const drafts = { 'p-1': { ...emptyProductDraft(), environment: 'Produção' }, 'p-2': emptyProductDraft() }
  const draftOf = (id) => drafts[id]
  const ids = (filters) => filterProducts(products, draftOf, { ...emptyFilters, ...filters }).map((item) => item.id)
  assert.deepEqual(ids({}), ['p-1', 'p-2'])
  assert.deepEqual(ids({ search: 'COBRANÇAS' }), ['p-1'])
  assert.deepEqual(ids({ search: 'portal' }), ['p-2'])
  assert.deepEqual(ids({ search: 'Financeiro' }), [], 'the area is not part of the text search')
  assert.deepEqual(ids({ area: 'Comercial' }), ['p-2'])
  assert.deepEqual(ids({ environment: 'production' }), ['p-1'])
})

test('the filter button counts the active filters, the archived situation included', async () => {
  const { filterCount, emptyFilters } = await import('../src/features/products/productView.ts')
  assert.equal(filterCount(emptyFilters), 0)
  assert.equal(filterCount({ ...emptyFilters, search: 'x' }), 0, 'the search box is not a filter')
  assert.equal(filterCount({ ...emptyFilters, area: 'Financeiro', environment: 'staging', situation: 'archived' }), 3)
})

test('area options are the areas the company already uses, without repetition', async () => {
  const { areaOptions } = await import('../src/features/products/productView.ts')
  assert.deepEqual(areaOptions([product(), product({ id: 'p-2', category: 'Comercial' }), product({ id: 'p-3', category: ' financeiro ' }), product({ id: 'p-4', category: '' })]),
    ['Comercial', 'Financeiro'])
})

test('pages have 6 products, like the Figma, and the page is kept inside the limits', async () => {
  const { pageOf, productsPageSize } = await import('../src/features/products/productView.ts')
  assert.equal(productsPageSize, 6)
  const items = Array.from({ length: 14 }, (_, index) => index + 1)
  assert.deepEqual(pageOf(items, 1), { items: [1, 2, 3, 4, 5, 6], page: 1, totalPages: 3, first: 1, last: 6 })
  assert.deepEqual(pageOf(items, 3), { items: [13, 14], page: 3, totalPages: 3, first: 13, last: 14 })
  assert.equal(pageOf(items, 9).page, 3)
  assert.equal(pageOf(items, 0).page, 1)
  assert.deepEqual(pageOf([], 1), { items: [], page: 1, totalPages: 1, first: 0, last: 0 })
})

test('the list asks the Core for archived products only in the archived situation (F6)', async () => {
  const { productsPath } = await import('../src/features/products/productView.ts')
  assert.equal(productsPath('active'), '/api/products')
  assert.equal(productsPath('archived'), '/api/products?archived=true')
})

test('side panels show the real active total and a dash for everything the Core does not know (F1)', async () => {
  const { sidePanelsFrom } = await import('../src/features/products/productView.ts')
  const products = Array.from({ length: 7 }, (_, index) => product({ id: `p-${index}`, name: `Produto ${index}` }))
  const panels = sidePanelsFrom(24, products)
  assert.deepEqual(panels.summary, {
    periodLabel: 'Últimos 7 dias',
    total: { value: 24 },
    connected: { value: '—' },
    waiting: { value: '—' },
    withoutIntegration: { value: '—' },
  })
  assert.deepEqual(panels.environments, { production: null, staging: null, development: null })
  assert.equal(panels.logs.periodLabel, 'Últimos 7 dias')
  assert.deepEqual(panels.logs.products.map((item) => [item.name, item.logs, item.formattedValue]), [
    ['Produto 0', 0, '—'], ['Produto 1', 0, '—'], ['Produto 2', 0, '—'], ['Produto 3', 0, '—'], ['Produto 4', 0, '—'],
  ])
  assert.deepEqual(panels.indicators, { activeIntegrations: { value: '—' }, logsToday: { value: '—' } })
})

test('before the active list loads, the total is a dash and not zero', async () => {
  const { sidePanelsFrom } = await import('../src/features/products/productView.ts')
  assert.deepEqual(sidePanelsFrom(null, []).summary.total, { value: '—' })
  assert.deepEqual(sidePanelsFrom(null, []).logs.products, [])
})
