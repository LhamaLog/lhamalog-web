import type { CompanyMetrics, ProductMetrics, Severity } from '../model/types'

const DAY = 24 * 60 * 60 * 1000
const GIB = 1073741824

type ProductProfile = {
  productId: string
  productName: string
  errorScale: number
  warningScale: number
  /** Razão-alvo error/logs para selos estáveis em qualquer período. */
  targetErrorRatio: number
  volumeUsedGiB: number
}

const products: ProductProfile[] = [
  { productId: 'prd_checkout', productName: 'Checkout', errorScale: 4, warningScale: 2, targetErrorRatio: 0.2, volumeUsedGiB: 3 },
  { productId: 'prd_billing', productName: 'Billing', errorScale: 1, warningScale: 3, targetErrorRatio: 0.05, volumeUsedGiB: 1.5 },
  { productId: 'prd_search', productName: 'Search', errorScale: 0, warningScale: 1, targetErrorRatio: 0.01, volumeUsedGiB: 0.5 },
]

function profileFor(productId: string): ProductProfile {
  return products.find((product) => product.productId === productId)
    ?? { productId, productName: productId, errorScale: 1, warningScale: 1, targetErrorRatio: 0.05, volumeUsedGiB: 1 }
}

/** null = todas as severidades (filtro vazio ou as três). */
function activeSeverities(severities?: Severity[]): Set<Severity> | null {
  if (!severities || severities.length === 0 || severities.length >= 3) return null
  return new Set(severities)
}

function pointsFor(
  from: string,
  to: string,
  profile: ProductProfile,
  severities?: Severity[],
) {
  const start = new Date(from).getTime()
  const end = new Date(to).getTime()
  const durationHours = (end - start) / (60 * 60 * 1000)
  const bucket = durationHours <= 48 ? 'hour' : 'day'
  const step = bucket === 'hour' ? 60 * 60 * 1000 : DAY
  const allowed = activeSeverities(severities)
  const points = []
  let index = 0
  for (let cursor = start; cursor < end; cursor += step) {
    let error = profile.errorScale === 0 ? 0 : profile.errorScale + (index % 3)
    let warning = profile.warningScale === 0 ? 0 : profile.warningScale + (index % 2)
    if (allowed) {
      if (!allowed.has('ERROR')) error = 0
      if (!allowed.has('WARNING')) warning = 0
    }
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

function infoForTargetRatio(error: number, warning: number, targetErrorRatio: number, allowed: Set<Severity> | null): number {
  if (allowed && !allowed.has('INFO')) return 0
  if (error <= 0) return 100
  if (!(targetErrorRatio > 0 && targetErrorRatio < 1)) return Math.max(0, 40 - warning)
  return Math.max(0, Math.round(error / targetErrorRatio - error - warning))
}

export function isDashboardMockEnabled(flag = import.meta.env.VITE_DASHBOARD_MOCK): boolean {
  return String(flag ?? '').trim().toLowerCase() === 'true'
}

export function mockProductMetrics(input: {
  productId: string
  from: string
  to: string
  severities?: Severity[]
}): ProductMetrics {
  const profile = profileFor(input.productId)
  const allowed = activeSeverities(input.severities)
  const series = pointsFor(input.from, input.to, profile, input.severities)
  const error = series.points.reduce((sum, point) => sum + point.error, 0)
  const warning = series.points.reduce((sum, point) => sum + point.warning, 0)
  const info = infoForTargetRatio(error, warning, profile.targetErrorRatio, allowed)
  const rankingError = allowed && !allowed.has('ERROR') ? 0 : Math.max(0, error)
  return {
    productId: input.productId,
    from: input.from,
    to: input.to,
    dadosConsolidadosAte: new Date(new Date(input.to).getTime() - 60 * 60 * 1000).toISOString(),
    retentionDays: 30,
    volumeIngestaoBytes: 10 * GIB,
    totals: {
      logs: error + warning + info,
      error,
      warning,
      info,
      traces: 12,
      volumeUsedBytes: profile.volumeUsedGiB * GIB,
    },
    series,
    serviceRanking: [
      { serviceName: 'api', error: rankingError },
      { serviceName: 'worker', error: rankingError > 0 ? Math.max(0, rankingError - 2) : 0 },
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
  const allowed = activeSeverities(input.severities)
  const seriesByProduct = selected.map((product) => ({
    productId: product.productId,
    productName: product.productName,
    ...pointsFor(input.from, input.to, product, input.severities),
  }))
  const rows = selected.map((product, index) => {
    const series = seriesByProduct[index]
    const error = series.points.reduce((sum, point) => sum + point.error, 0)
    const warning = series.points.reduce((sum, point) => sum + point.warning, 0)
    const info = infoForTargetRatio(error, warning, product.targetErrorRatio, allowed)
    return {
      productId: product.productId,
      productName: product.productName,
      logs: error + warning + info,
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
