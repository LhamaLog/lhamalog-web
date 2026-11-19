import { register } from 'node:module'
import { test } from 'node:test'
import assert from 'node:assert/strict'

register(new URL('./resolve-ts.mjs', import.meta.url))

const {
  canAccessProduct,
  filterAuthorizedProductIds,
  resolveDashboardRole,
  resolveDashboardVisibility,
} = await import('../src/features/dashboard/model/accessVisibility.ts')

const catalog = [
  { id: 'prd_1', name: 'Checkout' },
  { id: 'prd_2', name: 'Billing' },
  { id: 'prd_3', name: 'Search' },
]

test('DONO and ADMIN see the same full product set', () => {
  assert.equal(resolveDashboardRole('org:admin'), 'ADMIN')
  assert.equal(resolveDashboardRole(null, 'DONO'), 'DONO')
  const dono = resolveDashboardVisibility({
    orgRole: 'owner',
    allCompanyProducts: catalog,
    linkedProductIds: ['prd_1'],
  })
  const admin = resolveDashboardVisibility({
    orgRole: 'org:admin',
    allCompanyProducts: catalog,
    linkedProductIds: [],
  })
  assert.deepEqual(dono.products.map((p) => p.id), ['prd_1', 'prd_2', 'prd_3'])
  assert.deepEqual(admin.products.map((p) => p.id), ['prd_1', 'prd_2', 'prd_3'])
  assert.equal(dono.memberWithoutProducts, false)
  assert.equal(admin.forbidden, false)
})

test('MEMBRO sees only AcessoProduto subset', () => {
  const visibility = resolveDashboardVisibility({
    orgRole: 'org:member',
    allCompanyProducts: catalog,
    linkedProductIds: ['prd_2'],
  })
  assert.equal(visibility.role, 'MEMBRO')
  assert.deepEqual(visibility.products.map((p) => p.id), ['prd_2'])
  assert.equal(canAccessProduct(visibility, 'prd_2'), true)
  assert.equal(canAccessProduct(visibility, 'prd_1'), false)
})

test('MEMBRO without products gets empty state, not error', () => {
  const visibility = resolveDashboardVisibility({
    orgRole: 'org:member',
    allCompanyProducts: catalog,
    linkedProductIds: [],
  })
  assert.equal(visibility.memberWithoutProducts, true)
  assert.deepEqual(visibility.products, [])
  assert.equal(visibility.forbidden, false)
})

test('company dashboard without permission is forbidden', () => {
  const visibility = resolveDashboardVisibility({
    orgRole: 'org:member',
    allCompanyProducts: catalog,
    linkedProductIds: ['prd_1'],
    companyDashboardAllowed: false,
  })
  assert.equal(visibility.forbidden, true)
  assert.equal(visibility.companyAllowed, false)
})

test('visibility is recalculated from input without caching side effects', () => {
  const first = resolveDashboardVisibility({
    orgRole: 'org:member',
    allCompanyProducts: catalog,
    linkedProductIds: ['prd_1'],
  })
  const second = resolveDashboardVisibility({
    orgRole: 'org:member',
    allCompanyProducts: catalog,
    linkedProductIds: ['prd_3'],
  })
  assert.deepEqual(first.products.map((p) => p.id), ['prd_1'])
  assert.deepEqual(second.products.map((p) => p.id), ['prd_3'])
  assert.deepEqual(filterAuthorizedProductIds(second, ['prd_3']).productIds, ['prd_3'])
  assert.equal(filterAuthorizedProductIds(second, ['prd_1']).ok, false)
})
