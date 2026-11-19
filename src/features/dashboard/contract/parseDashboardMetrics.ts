import type {
  CompanyMetrics,
  CompanyProductRow,
  CompanyProductSeries,
  ImpactBadge,
  ProductMetrics,
  SeriesBucket,
  SeriesPoint,
  ServiceRankingItem,
  TimeSeries,
} from '../model/types'

const SEVERITIES = new Set(['ERROR', 'WARNING', 'INFO'])
const BUCKETS = new Set(['hour', 'day'])
const IMPACTS = new Set(['CRITICO', 'ATENCAO', 'ESTAVEL'])

export class DashboardContractError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DashboardContractError'
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new DashboardContractError(`Campo inválido: ${field}`)
  }
  return value
}

function optionalString(value: unknown): string | null {
  if (value == null) return null
  if (typeof value !== 'string' || !value.trim()) {
    throw new DashboardContractError('Campo de texto inválido')
  }
  return value
}

function requireNumber(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new DashboardContractError(`Campo inválido: ${field}`)
  }
  return value
}

function requireBucket(value: unknown): SeriesBucket {
  if (typeof value !== 'string' || !BUCKETS.has(value)) {
    throw new DashboardContractError('bucket inválido')
  }
  return value as SeriesBucket
}

function parsePoint(value: unknown): SeriesPoint {
  if (!isRecord(value)) throw new DashboardContractError('ponto de série inválido')
  const point: SeriesPoint = {
    start: requireString(value.start, 'start'),
    end: requireString(value.end, 'end'),
    error: requireNumber(value.error, 'error'),
    warning: requireNumber(value.warning, 'warning'),
  }
  if ('occurrences' in value && value.occurrences !== undefined) {
    point.occurrences = requireNumber(value.occurrences, 'occurrences')
  }
  return point
}

function parseSeries(value: unknown): TimeSeries {
  if (!isRecord(value) || !Array.isArray(value.points)) {
    throw new DashboardContractError('série inválida')
  }
  return {
    bucket: requireBucket(value.bucket),
    points: value.points.map(parsePoint),
  }
}

function parseServiceRanking(value: unknown): ServiceRankingItem[] {
  if (!Array.isArray(value)) throw new DashboardContractError('serviceRanking inválido')
  return value.slice(0, 5).map((item) => {
    if (!isRecord(item)) throw new DashboardContractError('item de ranking inválido')
    return {
      serviceName: requireString(item.serviceName, 'serviceName'),
      error: requireNumber(item.error, 'error'),
    }
  })
}

function parseImpact(value: unknown): ImpactBadge | undefined {
  if (value == null) return undefined
  if (typeof value !== 'string' || !IMPACTS.has(value)) {
    throw new DashboardContractError('selo de impacto inválido')
  }
  return value as ImpactBadge
}

function assertNormalizedSeveritiesInFilter(severities: unknown): void {
  if (severities == null) return
  const list = Array.isArray(severities) ? severities : [severities]
  for (const item of list) {
    if (typeof item !== 'string' || !SEVERITIES.has(item)) {
      throw new DashboardContractError(`Severidade desconhecida: ${String(item)}`)
    }
  }
}

export function assertKnownSeverity(value: string): void {
  if (!SEVERITIES.has(value)) {
    throw new DashboardContractError(`Severidade desconhecida: ${value}`)
  }
}

export function parseProductMetrics(body: unknown): ProductMetrics {
  if (!isRecord(body)) throw new DashboardContractError('corpo de métricas de produto inválido')
  if (!isRecord(body.totals)) throw new DashboardContractError('totals inválido')
  assertNormalizedSeveritiesInFilter(body.severities)
  return {
    productId: requireString(body.productId, 'productId'),
    from: requireString(body.from, 'from'),
    to: requireString(body.to, 'to'),
    dadosConsolidadosAte: optionalString(body.dadosConsolidadosAte),
    retentionDays: requireNumber(body.retentionDays, 'retentionDays'),
    volumeIngestaoBytes: requireNumber(body.volumeIngestaoBytes, 'volumeIngestaoBytes'),
    totals: {
      logs: requireNumber(body.totals.logs, 'totals.logs'),
      error: requireNumber(body.totals.error, 'totals.error'),
      warning: requireNumber(body.totals.warning, 'totals.warning'),
      info: requireNumber(body.totals.info, 'totals.info'),
      traces: requireNumber(body.totals.traces, 'totals.traces'),
      volumeUsedBytes: requireNumber(body.totals.volumeUsedBytes, 'totals.volumeUsedBytes'),
    },
    series: parseSeries(body.series),
    serviceRanking: parseServiceRanking(body.serviceRanking),
  }
}

function parseCompanyProduct(value: unknown): CompanyProductRow {
  if (!isRecord(value)) throw new DashboardContractError('produto da empresa inválido')
  return {
    productId: requireString(value.productId, 'productId'),
    productName: requireString(value.productName, 'productName'),
    logs: requireNumber(value.logs, 'logs'),
    error: requireNumber(value.error, 'error'),
    warning: requireNumber(value.warning, 'warning'),
    impact: parseImpact(value.impact),
  }
}

function parseCompanySeries(value: unknown): CompanyProductSeries {
  if (!isRecord(value) || !Array.isArray(value.points)) {
    throw new DashboardContractError('série por produto inválida')
  }
  return {
    productId: requireString(value.productId, 'productId'),
    productName: requireString(value.productName, 'productName'),
    bucket: requireBucket(value.bucket),
    points: value.points.map(parsePoint),
  }
}

export function parseCompanyMetrics(body: unknown): CompanyMetrics {
  if (!isRecord(body)) throw new DashboardContractError('corpo de métricas da empresa inválido')
  if (!isRecord(body.totals)) throw new DashboardContractError('totals inválido')
  if (!Array.isArray(body.seriesByProduct)) throw new DashboardContractError('seriesByProduct inválido')
  if (!Array.isArray(body.products)) throw new DashboardContractError('products inválido')
  assertNormalizedSeveritiesInFilter(body.severities)
  return {
    from: requireString(body.from, 'from'),
    to: requireString(body.to, 'to'),
    dadosConsolidadosAte: optionalString(body.dadosConsolidadosAte),
    retentionDays: requireNumber(body.retentionDays, 'retentionDays'),
    totals: {
      logs: requireNumber(body.totals.logs, 'totals.logs'),
      error: requireNumber(body.totals.error, 'totals.error'),
      warning: requireNumber(body.totals.warning, 'totals.warning'),
      productsMonitored: requireNumber(body.totals.productsMonitored, 'totals.productsMonitored'),
    },
    seriesByProduct: body.seriesByProduct.map(parseCompanySeries),
    products: body.products.map(parseCompanyProduct),
  }
}

export function seriesHasOccurrences(points: SeriesPoint[]): boolean {
  return points.some((point) => typeof point.occurrences === 'number')
}

export function isOccurrencesPending(points: Array<{ occurrences?: number }> | null | undefined): boolean {
  if (!points || points.length === 0) return true
  return !seriesHasOccurrences(points as SeriesPoint[])
}
