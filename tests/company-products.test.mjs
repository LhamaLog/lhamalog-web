import { register } from 'node:module'
import { test } from 'node:test'
import assert from 'node:assert/strict'

register(new URL('./resolve-ts.mjs', import.meta.url))

test('filled values are checked and an incomplete company can still be saved', async () => {
  const { emptyCompanySettings } = await import('../src/features/company/model.ts')
  const { cnpj, companyFieldErrors, errorsForSection, tabForCompanyField } = await import('../src/features/company/validation.ts')
  const { readCompanyFacts } = await import('../src/features/company/contract.ts')
  const settings = emptyCompanySettings('org_real')
  assert.deepEqual(companyFieldErrors(settings), {})
  settings.data.document = '12.345.678/0001-90'
  settings.data.email = 'sem-arroba'
  settings.data.website = 'lhamalog.com'
  settings.data.description = 'a'.repeat(501)
  settings.address.postalCode = '8700-000'
  const errors = companyFieldErrors(settings)
  assert.equal(errors['data.document'], 'Informe um CNPJ válido.')
  assert.equal(errors.email, 'Informe um e-mail válido.')
  assert.equal(errors['data.website'], 'Informe um site http ou https.')
  assert.match(errors['data.description'], /500/)
  assert.equal(errors['address.postalCode'], 'Informe um CEP com 8 dígitos.')
  assert.equal(errors['address.city'], undefined)
  assert.equal(cnpj('11.444.777/0001-61'), true)
  settings.data.document = '11.444.777/0001-61'
  settings.data.email = 'contato@example.com'
  settings.data.website = 'https://example.com'
  settings.data.description = 'Monitoramento'
  settings.address.postalCode = '87000-000'
  assert.deepEqual(errorsForSection(settings, 'data'), {})
  assert.equal(tabForCompanyField('address.postalCode'), 'address')
  assert.equal(tabForCompanyField('email'), 'data')
  const facts = readCompanyFacts({}, settings)
  assert.equal(facts.verified, false)
  assert.equal(facts.metrics, null)
  assert.equal(facts.ingestion, null)
  assert.equal(facts.completion.total, 10)
})

test('product list filters and metrics use api fields only, and old draft keys are dropped', async () => {
  const { filterProducts, occurrenceText, productMetrics, statusTone } = await import('../src/features/products/productListModel.ts')
  const { normalizeProductDraft } = await import('../src/features/products/draft.ts')
  const products = [
    product({ id: '1', name: 'Payment Service', category: 'Financeiro', status: 'Saudável', environment: 'production', sla: 99.98 }),
    product({ id: '2', name: 'Order Service', category: 'E-commerce', status: 'Com incidente', environment: 'Produção', availability: 98.7 }),
    product({ id: '3', name: 'Worker', category: 'Infraestrutura', status: '', environment: 'dev' }),
  ]
  assert.equal(statusTone('Com incidente'), 'danger')
  assert.equal(statusTone('Saudável'), 'success')
  assert.deepEqual(filterProducts(products, { search: 'order', environment: '', category: '', status: '', owner: '' }).map((item) => item.id), ['2'])
  assert.equal(filterProducts(products, { search: '', environment: 'Produção', category: '', status: '', owner: '' }).length, 2)
  assert.equal(filterProducts(products, { search: '', environment: 'Desenvolvimento', category: '', status: '', owner: '' })[0].id, '3')
  const metrics = productMetrics(products)
  assert.equal(metrics.total, 3)
  assert.equal(metrics.healthy, 1)
  assert.equal(metrics.incidents, 1)
  assert.ok(Math.abs(metrics.availability - ((99.98 + 98.7) / 2)) < 0.001)
  assert.match(occurrenceText('não é data'), /não é data/)
  assert.match(occurrenceText(new Date(Date.now() - 3 * 86400000).toISOString()), /há 3 dias/)
  // Fields that left the screen (spec 009, analyze A3) are dropped from an old draft; the rest is kept.
  const draft = normalizeProductDraft({ environment: 'Produção', team: 'Squad', criticality: 'Alta', project: 'P', service: 'S', logLevel: 'WARN', active: false })
  assert.equal(draft.environment, 'Produção')
  assert.deepEqual(['team', 'criticality', 'project', 'service', 'logLevel', 'active'].filter((key) => key in draft), [])
})

function product(partial) {
  return {
    tenantId: 'tenant', description: 'desc', productVersion: '1', createdAt: '', context: { functionalDescription: '', personality: 'STANDARD', responseLanguage: 'pt-BR', architecture: [], scope: [], sensitiveData: [] }, version: 1,
    ...partial,
  }
}
