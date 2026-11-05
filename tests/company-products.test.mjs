import { register } from 'node:module'
import { test } from 'node:test'
import assert from 'node:assert/strict'

register(new URL('./resolve-ts.mjs', import.meta.url))

test('company save stays optional for partial addresses and blocks empty identity', async () => {
  const { companyFieldErrors, tabForCompanyField } = await import('../src/features/company/validation.ts')
  const company = {
    id: 'company',
    clerkOrgId: 'org',
    version: 1,
    data: { legalName: 'LhamaLog Tecnologia LTDA', tradeName: 'LhamaLog', document: '12.345.678/0001-90', registrationDate: null, size: '' },
    context: { sector: 'Tecnologia da Informação', mission: '', targetAudience: '', differentiators: '', language: '' },
    address: { street: '', number: '', complement: '', district: '', city: 'Maringá', state: '', country: '', postalCode: '' },
  }
  assert.deepEqual(companyFieldErrors(company), {})
  assert.deepEqual(companyFieldErrors({ ...company, data: { ...company.data, legalName: ' ' }, context: { ...company.context, sector: '' } }), {
    'data.legalName': 'Informe a razão social.',
    'context.sector': 'Informe o ramo de atuação.',
  })
  assert.equal(tabForCompanyField('context.sector'), 'data')
  assert.equal(tabForCompanyField('context.differentiators'), 'context')
  assert.equal(tabForCompanyField('address.city'), 'address')
  assert.equal(tabForCompanyField('data.registrationDate'), 'documents')
})

test('company profile keeps known fields and falls back when stored selects are blank', async () => {
  const { normalizeCompanyProfile } = await import('../src/features/company/profile.ts')
  const profile = normalizeCompanyProfile({ timeZone: '', currency: 'Euro (EUR)', monitoredSystems: ['API', 3], contacts: [{ id: '1', name: 'Ana' }] })
  assert.equal(profile.timeZone, '(UTC-03:00) Brasília')
  assert.equal(profile.currency, 'Euro (EUR)')
  assert.deepEqual(profile.monitoredSystems, ['API'])
  assert.equal(profile.contacts[0].name, 'Ana')
  assert.equal(profile.contacts[0].email, '')
})

test('product list filters, metrics and create requirements use api fields only', async () => {
  const { filterProducts, occurrenceText, productFieldErrors, productMetrics, statusTone } = await import('../src/features/products/productListModel.ts')
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
  const draft = normalizeProductDraft({ environment: 'Produção' })
  assert.equal(draft.logLevel, 'INFO')
  assert.deepEqual(productFieldErrors({ editing: false, name: '', category: 'Financeiro', draft }), {
    name: 'Informe o nome do produto.',
    productType: 'Selecione o tipo de produto.',
    team: 'Informe a equipe responsável.',
    criticality: 'Selecione a criticidade.',
    project: 'Informe o projeto.',
    service: 'Informe a aplicação principal.',
  })
  assert.deepEqual(productFieldErrors({ editing: true, name: '', category: '', draft: normalizeProductDraft({}) }), {})
})

function product(partial) {
  return {
    tenantId: 'tenant', description: 'desc', productVersion: '1', createdAt: '', context: { problemSolved: '', targetAudience: '', differentiators: '', keywords: '', restrictions: '' }, version: 1,
    ...partial,
  }
}
