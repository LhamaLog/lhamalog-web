import type { CompanyMetrics, ProductMetrics, Severity } from '../model/types'

const DAY = 24 * 60 * 60 * 1000

function pointsFor(from: string, to: string, seed: number) {
  const start = new Date(from).getTime()
  const end = new Date(to).getTime()
  const durationHours = (end - start) / (60 * 60 * 1000)
  const bucket = durationHours <= 48 ? 'hour' : 'day'
  const step = bucket === 'hour' ? 60 * 60 * 1000 : DAY
  const points = []
  let index = 0
  for (let cursor = start; cursor < end; cursor += step) {
    const error = (seed + index) % 7
    const warning = (seed + index * 2) % 11
    points.push({
      start: new Date(cursor).toISOString(),
      end: new Date(Math.min(cursor + step, end)).toISOString(),
      error,
      warning,
    })
    index += 1
    if (points.length >= 48) break
  }
  return { bucket: bucket as 'hour' | 'day', points }
}

const products = [
  { productId: 'prd_checkout', productName: 'Checkout' },
  { productId: 'prd_billing', productName: 'Billing' },
  { productId: 'prd_search', productName: 'Search' },
]

export function isDashboardMockEnabled(flag = import.meta.env.VITE_DASHBOARD_MOCK): boolean {
  return String(flag ?? '').trim().toLowerCase() === 'true'
}

export function mockProductMetrics(input: {
  productId: string
  from: string
  to: string
  severities?: Severity[]
}): ProductMetrics {
  const series = pointsFor(input.from, input.to, input.productId.length)
  const error = series.points.reduce((sum, point) => sum + point.error, 0)
  const warning = series.points.reduce((sum, point) => sum + point.warning, 0)
  const info = Math.max(20, error + warning)
  return {
    productId: input.productId,
    from: input.from,
    to: input.to,
    dadosConsolidadosAte: new Date(new Date(input.to).getTime() - 60 * 60 * 1000).toISOString(),
    retentionDays: 30,
    // Cota 10 GiB e uso 1,5 GiB (múltiplos de 2^30 = 1073741824 bytes)
    volumeIngestaoBytes: 10 * 1073741824,
    totals: {
      logs: error + warning + info,
      error,
      warning,
      info,
      traces: 12,
      volumeUsedBytes: 1610612736,
    },
    series,
    serviceRanking: [
      { serviceName: 'api', error: Math.max(1, error) },
      { serviceName: 'worker', error: Math.max(0, error - 2) },
    ],
  }
}

export function mockCompanyMetrics(input: {
  from: string
  to: string
  productIds?: string[]
  severities?: Severity[]
}): CompanyMetrics {
  const selected = input.productIds?.length
    ? products.filter((product) => input.productIds?.includes(product.productId))
    : products
  const seriesByProduct = selected.map((product, index) => ({
    ...product,
    ...pointsFor(input.from, input.to, 3 + index),
  }))
  const rows = selected.map((product, index) => {
    const series = seriesByProduct[index]
    const error = series.points.reduce((sum, point) => sum + point.error, 0)
    const warning = series.points.reduce((sum, point) => sum + point.warning, 0)
    return {
      productId: product.productId,
      productName: product.productName,
      logs: error + warning + 40 + index * 5,
      error,
      warning,
    }
  })
  return {
    from: input.from,
    to: input.to,
    dadosConsolidadosAte: new Date(new Date(input.to).getTime() - 60 * 60 * 1000).toISOString(),
    retentionDays: 30,
    totals: {
      logs: rows.reduce((sum, row) => sum + row.logs, 0),
      error: rows.reduce((sum, row) => sum + row.error, 0),
      warning: rows.reduce((sum, row) => sum + row.warning, 0),
      productsMonitored: rows.length,
    },
    seriesByProduct,
    products: rows,
  }
}

export const mockAccessibleProducts = products.map((product) => ({
  id: product.productId,
  name: product.productName,
}))
