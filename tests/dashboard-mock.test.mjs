import { register } from 'node:module'
import { test } from 'node:test'
import assert from 'node:assert/strict'

register(new URL('./resolve-ts.mjs', import.meta.url))

const {
  mockCompanyMetrics,
  mockProductMetrics,
} = await import('../src/features/dashboard/api/mockDashboardMetrics.ts')

const { impactBadgeFor } = await import('../src/features/dashboard/model/companyImpact.ts')

const GIB = 1073741824
const from = '2026-11-17T12:00:00.000Z'
const to = '2026-11-18T12:00:00.000Z'

test('mock product metrics zero severities not requested (tipo=ERROR)', () => {
  const body = mockProductMetrics({
    productId: 'prd_billing',
    from,
    to,
    severities: ['ERROR'],
  })
  assert.ok(body.totals.error > 0)
  assert.equal(body.totals.warning, 0)
  assert.equal(body.totals.info, 0)
  assert.equal(body.totals.logs, body.totals.error)
  assert.ok(body.series.points.every((point) => point.warning === 0))
  assert.ok(body.series.points.some((point) => point.error > 0))
})

test('mock company metrics respect severities and vary impact seals', () => {
  const all = mockCompanyMetrics({ from, to })
  const byId = Object.fromEntries(all.products.map((row) => [
    row.productId,
    impactBadgeFor(row.error, row.logs),
  ]))
  assert.equal(byId.prd_checkout, 'CRITICO')
  assert.equal(byId.prd_billing, 'ATENCAO')
  assert.equal(byId.prd_search, 'ESTAVEL')

  const onlyError = mockCompanyMetrics({ from, to, severities: ['ERROR'] })
  assert.equal(onlyError.totals.warning, 0)
  assert.ok(onlyError.totals.error > 0)
  assert.ok(onlyError.seriesByProduct.every((series) => series.points.every((point) => point.warning === 0)))
  assert.ok(onlyError.products.every((row) => row.warning === 0))
})

test('mock volume bytes stay coherent multiples of 2^30', () => {
  for (const productId of ['prd_checkout', 'prd_billing', 'prd_search']) {
    const body = mockProductMetrics({ productId, from, to })
    assert.equal(body.volumeIngestaoBytes % GIB, 0)
    // 0.5 GiB / 1.5 GiB / 3 GiB — múltiplos de 2^29
    assert.equal(body.totals.volumeUsedBytes % (GIB / 2), 0)
  }
})
