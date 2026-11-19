import type { CompanyProductRow, ImpactBadge, RankingItem } from './types'

export function errorRatio(logsError: number, totalLogs: number): number {
  const logs = Number.isFinite(totalLogs) ? totalLogs : 0
  const errors = Number.isFinite(logsError) ? Math.max(0, logsError) : 0
  return errors / Math.max(logs, 1)
}

export function impactBadgeFor(logsError: number, totalLogs: number): ImpactBadge {
  const ratio = errorRatio(logsError, totalLogs)
  if (ratio >= 0.1) return 'CRITICO'
  if (ratio >= 0.02) return 'ATENCAO'
  return 'ESTAVEL'
}

export function withImpactBadges(rows: CompanyProductRow[]): Array<CompanyProductRow & { selo: ImpactBadge }> {
  return rows.map((row) => ({
    ...row,
    selo: row.impact ?? impactBadgeFor(row.error, row.logs),
  }))
}

export function mostImpactedProducts(rows: CompanyProductRow[], limit = 5): RankingItem[] {
  return withImpactBadges(rows)
    .map((row) => ({
      id: row.productId,
      label: row.productName,
      logsError: row.error,
      selo: row.selo,
      ratio: errorRatio(row.error, row.logs),
    }))
    .sort((a, b) => {
      if (b.logsError !== a.logsError) return b.logsError - a.logsError
      return b.ratio - a.ratio
    })
    .slice(0, limit)
    .map(({ id, label, logsError, selo }) => ({ id, label, logsError, selo }))
}

export function consolidateCompanyTotals(rows: CompanyProductRow[]): {
  logs: number
  error: number
  warning: number
  productsMonitored: number
} {
  return rows.reduce(
    (acc, row) => ({
      logs: acc.logs + (Number.isFinite(row.logs) ? row.logs : 0),
      error: acc.error + (Number.isFinite(row.error) ? row.error : 0),
      warning: acc.warning + (Number.isFinite(row.warning) ? row.warning : 0),
      productsMonitored: acc.productsMonitored + 1,
    }),
    { logs: 0, error: 0, warning: 0, productsMonitored: 0 },
  )
}
