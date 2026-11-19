import { register } from 'node:module'
import { test } from 'node:test'
import assert from 'node:assert/strict'

register(new URL('./resolve-ts.mjs', import.meta.url))

const {
  DashboardContractError,
  assertKnownSeverity,
  parseCompanyMetrics,
  parseProductMetrics,
  seriesHasOccurrences,
} = await import('../src/features/dashboard/contract/parseDashboardMetrics.ts')

const {
  ApiError,
  apiRequest,
  createCorrelationId,
} = await import('../src/shared/services/api.ts')

const productBody = {
  productId: 'prd_123',
  from: '2026-11-11T00:00:00.000Z',
  to: '2026-11-18T00:00:00.000Z',
  dadosConsolidadosAte: '2026-11-18T14:00:00.000Z',
  retentionDays: 30,
  volumeIngestaoBytes: 10737418240, // 10 GiB = 10 × 2^30
  totals: {
    logs: 1200,
    error: 40,
    warning: 80,
    info: 1080,
    traces: 15,
    volumeUsedBytes: 1610612736, // 1,5 GiB = 1,5 × 2^30
  },
  series: {
    bucket: 'day',
    points: [
      { start: '2026-11-11T00:00:00.000Z', end: '2026-11-12T00:00:00.000Z', error: 5, warning: 10 },
    ],
  },
  serviceRanking: [{ serviceName: 'checkout', error: 12 }],
}

test('product metrics parser accepts the contract payload', () => {
  const parsed = parseProductMetrics(productBody)
  assert.equal(parsed.productId, 'prd_123')
  assert.equal(parsed.retentionDays, 30)
  assert.equal(parsed.series.points[0].error, 5)
  assert.equal(seriesHasOccurrences(parsed.series.points), false)
})

test('parser rejects unknown severity enums', () => {
  assert.throws(() => assertKnownSeverity('critical'), DashboardContractError)
  assert.throws(
    () => parseProductMetrics({ ...productBody, severities: ['ERROR', 'fatal'] }),
    DashboardContractError,
  )
  assert.throws(
    () => parseCompanyMetrics({
      from: productBody.from,
      to: productBody.to,
      retentionDays: 7,
      totals: { logs: 0, error: 0, warning: 0, productsMonitored: 0 },
      seriesByProduct: [],
      products: [{ productId: 'p', productName: 'P', logs: 0, error: 0, warning: 0, impact: 'URGENTE' }],
    }),
    DashboardContractError,
  )
})

test('apiRequest always sends X-Correlation-Id and exposes it on ApiError', async () => {
  const original = globalThis.fetch
  let seen = ''
  globalThis.fetch = async (_url, options) => {
    seen = options.headers['X-Correlation-Id']
    assert.ok(seen)
    return new Response(JSON.stringify({ message: 'falha' }), {
      status: 500,
      headers: { 'X-Correlation-Id': seen },
    })
  }
  try {
    await assert.rejects(
      apiRequest('http://api.test', '/api/dashboard/products/p/metrics', 'token'),
      (error) => error instanceof ApiError && error.correlationId === seen && error.status === 500,
    )
  } finally {
    globalThis.fetch = original
  }
})

test('createCorrelationId returns a non-empty id', () => {
  assert.ok(createCorrelationId().length > 8)
})
