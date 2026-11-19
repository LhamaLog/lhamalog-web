import { register } from 'node:module'
import { test } from 'node:test'
import assert from 'node:assert/strict'

register(new URL('./resolve-ts.mjs', import.meta.url))

const {
  consolidateCompanyTotals,
  impactBadgeFor,
  mostImpactedProducts,
} = await import('../src/features/dashboard/model/companyImpact.ts')

test('impact badges use approved thresholds including stable with no logs', () => {
  assert.equal(impactBadgeFor(10, 100), 'CRITICO')
  assert.equal(impactBadgeFor(9, 100), 'ATENCAO')
  assert.equal(impactBadgeFor(2, 100), 'ATENCAO')
  assert.equal(impactBadgeFor(1, 100), 'ESTAVEL')
  assert.equal(impactBadgeFor(0, 0), 'ESTAVEL')
})

test('most impacted ranking orders by error then ratio', () => {
  const ranking = mostImpactedProducts([
    { productId: 'a', productName: 'A', logs: 100, error: 5, warning: 1 },
    { productId: 'b', productName: 'B', logs: 10, error: 5, warning: 0 },
    { productId: 'c', productName: 'C', logs: 1000, error: 20, warning: 2 },
    { productId: 'd', productName: 'D', logs: 50, error: 0, warning: 3 },
  ], 3)
  assert.deepEqual(ranking.map((item) => item.id), ['c', 'b', 'a'])
  assert.equal(ranking[0].selo, 'ATENCAO')
  assert.equal(ranking[1].selo, 'CRITICO')
  assert.equal(ranking[2].selo, 'ATENCAO')
})

test('company totals sum product rows', () => {
  assert.deepEqual(consolidateCompanyTotals([
    { productId: 'a', productName: 'A', logs: 10, error: 1, warning: 2 },
    { productId: 'b', productName: 'B', logs: 5, error: 3, warning: 1 },
  ]), { logs: 15, error: 4, warning: 3, productsMonitored: 2 })
})
