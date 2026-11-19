export type Severity = 'ERROR' | 'WARNING' | 'INFO'

export type PeriodPreset = '24h' | '7d' | '30d' | 'personalizado'

export type SeriesBucket = 'hour' | 'day'

export type ImpactBadge = 'CRITICO' | 'ATENCAO' | 'ESTAVEL'

export type DashboardRole = 'DONO' | 'ADMIN' | 'MEMBRO'

export type DashboardScreenState =
  | 'loading'
  | 'empty'
  | 'ready'
  | 'filter_invalid'
  | 'forbidden'
  | 'error'
  | 'session'

export type DashboardFilter = {
  productIds: string[]
  periodPreset: PeriodPreset
  from: Date | null
  to: Date | null
  severities: Severity[]
  maxPeriodDays: number
}

export type ResolvedPeriod = {
  start: Date
  end: Date
  durationHours: number
  bucket: SeriesBucket
  timeZone: string
}

export type SeriesPoint = {
  start: string
  end: string
  error: number
  warning: number
  occurrences?: number
}

export type TimeSeries = {
  bucket: SeriesBucket
  points: SeriesPoint[]
}

export type ServiceRankingItem = {
  serviceName: string
  error: number
}

export type ProductMetrics = {
  productId: string
  from: string
  to: string
  dadosConsolidadosAte: string | null
  retentionDays: number
  volumeIngestaoBytes: number
  totals: {
    logs: number
    error: number
    warning: number
    info: number
    traces: number
    volumeUsedBytes: number
  }
  series: TimeSeries
  serviceRanking: ServiceRankingItem[]
}

export type CompanyProductRow = {
  productId: string
  productName: string
  logs: number
  error: number
  warning: number
  impact?: ImpactBadge
}

export type CompanyProductSeries = {
  productId: string
  productName: string
  bucket: SeriesBucket
  points: SeriesPoint[]
}

export type CompanyMetrics = {
  from: string
  to: string
  dadosConsolidadosAte: string | null
  retentionDays: number
  totals: {
    logs: number
    error: number
    warning: number
    productsMonitored: number
  }
  seriesByProduct: CompanyProductSeries[]
  products: CompanyProductRow[]
}

export type RankingItem = {
  id: string
  label: string
  logsError: number
  selo?: ImpactBadge
}

export type AccessibleProduct = {
  id: string
  name: string
}

export type DashboardVisibility = {
  role: DashboardRole
  products: AccessibleProduct[]
  companyAllowed: boolean
  memberWithoutProducts: boolean
  forbidden: boolean
}
