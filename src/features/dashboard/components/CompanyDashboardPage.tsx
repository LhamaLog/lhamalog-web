import { useAuth } from '@clerk/react'
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ApiError } from '../../../shared/services/api'
import { endsSession } from '../../../shared/services/sessionRedirect'
import { useApi } from '../../../shared/services/useApi'
import { Badge } from '../../../shared/ui/Badge'
import { Card } from '../../../shared/ui/Card'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { ErrorState } from '../../../shared/ui/ErrorState'
import { LoadingState } from '../../../shared/ui/LoadingState'
import { MetricCard } from '../../../shared/ui/MetricCard'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { RankingList } from '../../../shared/ui/RankingList'
import { TimeSeriesChart } from '../../../shared/ui/TimeSeriesChart'
import { useAppliedPreferences } from '../../profile/preferences'
import { fetchCompanyMetrics } from '../api/fetchCompanyMetrics'
import { isDashboardMockEnabled, mockAccessibleProducts } from '../api/mockDashboardMetrics'
import { isOccurrencesPending } from '../contract/parseDashboardMetrics'
import { dashboardMessage, type DashboardMessageKey } from '../messages'
import { resolveDashboardVisibility } from '../model/accessVisibility'
import {
  applyCompanyDashboardFilters,
  clearCompanyProductSelection,
  deserializeDashboardQuery,
} from '../model/applyDashboardFilters'
import {
  defaultDashboardFilter,
  revalidateAfterRetention,
  withRetentionCeiling,
} from '../model/filterPeriod'
import { formatCount } from '../model/format'
import { mostImpactedProducts } from '../model/companyImpact'
import { formatBucketLabel, formatInTimeZone, resolvePeriod } from '../model/timezoneBuckets'
import type { CompanyMetrics, DashboardFilter, ImpactBadge } from '../model/types'
import { DashboardFilters } from './DashboardFilters'
import { DashboardForbidden } from './DashboardForbidden'
import { MemberEmptyNotice } from './MemberEmptyNotice'

const seriesColors = ['#DC2626', '#0C70F2', '#059669', '#D97706', '#7C3AED']

function badgeVariant(selo: ImpactBadge): 'danger' | 'warning' | 'success' {
  if (selo === 'CRITICO') return 'danger'
  if (selo === 'ATENCAO') return 'warning'
  return 'success'
}

export function CompanyDashboardPage() {
  const { orgId, orgRole } = useAuth()
  const request = useApi()
  const { language, timezone } = useAppliedPreferences()
  const [params, setParams] = useSearchParams()
  const [products, setProducts] = useState(isDashboardMockEnabled() ? mockAccessibleProducts : [])
  const [productsLoading, setProductsLoading] = useState(!isDashboardMockEnabled())
  const [applied, setApplied] = useState(() => deserializeDashboardQuery({
    produto: params.getAll('produto').length ? params.getAll('produto') : params.get('produto'),
    periodo: params.get('periodo'),
    de: params.get('de'),
    ate: params.get('ate'),
    tipo: params.get('tipo'),
  }, defaultDashboardFilter()))
  const [draft, setDraft] = useState(applied)
  const [filterMessage, setFilterMessage] = useState('')
  const [metrics, setMetrics] = useState<CompanyMetrics | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [correlationId, setCorrelationId] = useState('')
  const [businessForbidden, setBusinessForbidden] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  const visibility = resolveDashboardVisibility({
    orgRole,
    allCompanyProducts: products,
    linkedProductIds: products.map((product) => product.id),
  })

  useEffect(() => {
    if (isDashboardMockEnabled()) {
      setProducts(mockAccessibleProducts)
      setProductsLoading(false)
      return
    }
    const controller = new AbortController()
    setProductsLoading(true)
    request<Array<{ id: string, name: string }>>('/api/products', { signal: controller.signal })
      .then((rows) => {
        if (controller.signal.aborted) return
        setProducts(rows.map((row) => ({ id: row.id, name: row.name })))
      })
      .catch((reason) => {
        if (controller.signal.aborted || endsSession(reason)) return
        setProducts([])
      })
      .finally(() => {
        if (!controller.signal.aborted) setProductsLoading(false)
      })
    return () => controller.abort()
  }, [orgId, request])

  useEffect(() => {
    if (visibility.forbidden || visibility.memberWithoutProducts) return
    if (!applied.from || !applied.to) return
    const controller = new AbortController()
    const requestedOrgId = orgId
    setLoading(true)
    setError('')
    setCorrelationId('')
    setBusinessForbidden(false)
    fetchCompanyMetrics({
      request,
      from: applied.from.toISOString(),
      to: applied.to.toISOString(),
      productIds: applied.productIds,
      severities: applied.severities,
      orgId,
      signal: controller.signal,
    })
      .then((body) => {
        if (controller.signal.aborted || orgId !== requestedOrgId) return
        setMetrics(body)
        const raised = withRetentionCeiling(applied, body.retentionDays)
        const check = revalidateAfterRetention(raised, body.retentionDays)
        if (!check.ok) {
          setFilterMessage(dashboardMessage(
            language,
            check.messageKey ?? 'dashboard.filter.invalid',
            check.messageDays ? { days: String(check.messageDays) } : {},
          ))
          return
        }
        if (raised.maxPeriodDays !== applied.maxPeriodDays) {
          setApplied(raised)
          setDraft(raised)
        }
      })
      .catch((reason) => {
        if (controller.signal.aborted || endsSession(reason)) return
        if (reason instanceof ApiError && reason.status === 403 && (reason.serverMessage || reason.code)) {
          setBusinessForbidden(true)
          setError('')
          setMetrics(null)
          return
        }
        const message = reason instanceof Error ? reason.message : dashboardMessage(language, 'dashboard.errorTitle')
        setError(message)
        setCorrelationId(reason instanceof ApiError ? reason.correlationId : '')
        setMetrics(null)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [
    applied.productIds.join(','),
    applied.from?.toISOString(),
    applied.to?.toISOString(),
    applied.severities.join(','),
    orgId,
    reloadKey,
    request,
    visibility.forbidden,
    visibility.memberWithoutProducts,
    language,
  ])

  function commitFilter(nextDraft: DashboardFilter) {
    const result = applyCompanyDashboardFilters({
      current: applied,
      draft: nextDraft,
      authorizedIds: visibility.products.map((product) => product.id),
    })
    if (result.invalid) {
      setFilterMessage(dashboardMessage(
        language,
        result.messageKey ?? 'dashboard.filter.invalid',
        result.messageDays ? { days: String(result.messageDays) } : {},
      ))
      return
    }
    setFilterMessage('')
    setApplied(result.applied)
    setDraft(result.applied)
    setParams(result.searchParams)
  }

  const locale = language === 'en' ? 'en' : 'pt-BR'
  const period = applied.from && applied.to
    ? resolvePeriod({ start: applied.from, end: applied.to, timeZone: timezone })
    : null
  const impacted = metrics ? mostImpactedProducts(metrics.products) : []
  const chartSeries = metrics?.seriesByProduct.map((item, index) => ({
    id: item.productId,
    label: item.productName,
    color: seriesColors[index % seriesColors.length],
    values: item.points.map((point) => point.error),
  })) ?? []
  const occurrencesPending = metrics
    ? metrics.seriesByProduct.every((item) => isOccurrencesPending(item.points))
    : true

  if (productsLoading) return <LoadingState />
  if (visibility.forbidden || businessForbidden) return <DashboardForbidden language={language} />
  if (visibility.memberWithoutProducts) return <MemberEmptyNotice language={language} />

  return (
    <div className="space-y-5">
      <PageHeader
        title={dashboardMessage(language, 'dashboard.companyTitle')}
        description={dashboardMessage(language, 'dashboard.companyDescription')}
        actions={(
          <Link to="/dashboard" className="text-sm font-semibold text-[#0C70F2] hover:underline">
            {dashboardMessage(language, 'dashboard.link.product')}
          </Link>
        )}
      />

      <DashboardFilters
        mode="company"
        language={language}
        draft={draft}
        products={visibility.products}
        invalidMessage={filterMessage}
        onChange={setDraft}
        onApply={() => commitFilter(draft)}
        onRefresh={() => {
          commitFilter(draft)
          setReloadKey((value) => value + 1)
        }}
        onClearProducts={() => {
          const cleared = clearCompanyProductSelection(draft)
          setDraft(cleared)
          commitFilter(cleared)
        }}
      />

      {error && (
        <ErrorState
          title={dashboardMessage(language, 'dashboard.errorTitle')}
          description={[
            error,
            correlationId
              ? dashboardMessage(language, 'dashboard.errorCorrelation', { id: correlationId })
              : '',
          ].filter(Boolean).join(' ')}
          onRetry={() => setReloadKey((value) => value + 1)}
        />
      )}

      {loading && !error && <LoadingState />}

      {!loading && !error && metrics && (
        <>
          {metrics.dadosConsolidadosAte && (
            <p className="text-sm text-slate-600">
              {dashboardMessage(language, 'dashboard.consolidatedUntil', {
                when: formatInTimeZone(
                  metrics.dadosConsolidadosAte,
                  timezone,
                  { dateStyle: 'short', timeStyle: 'short' },
                  locale,
                ),
              })}
            </p>
          )}

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard title={dashboardMessage(language, 'dashboard.card.consolidatedLogs')} value={formatCount(metrics.totals.logs, locale)} tone="blue" />
            <MetricCard title={dashboardMessage(language, 'dashboard.card.logsError')} value={formatCount(metrics.totals.error, locale)} tone="red" />
            <MetricCard title={dashboardMessage(language, 'dashboard.card.alerts')} value={formatCount(metrics.totals.warning, locale)} tone="amber" />
            <MetricCard title={dashboardMessage(language, 'dashboard.card.productsMonitored')} value={formatCount(metrics.totals.productsMonitored, locale)} tone="green" />
          </div>

          {metrics.totals.logs === 0 && metrics.products.length === 0 ? (
            <EmptyState
              title={dashboardMessage(language, 'dashboard.empty')}
              description={dashboardMessage(language, 'dashboard.emptyDescription')}
            />
          ) : (
            <>
              <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(16rem,1fr)]">
                <Card>
                  <h2 className="mb-3 text-sm font-bold text-[#083B7A]">
                    {dashboardMessage(language, 'dashboard.chartCompanyTitle')}
                  </h2>
                  <TimeSeriesChart
                    ariaLabel={dashboardMessage(language, 'dashboard.chartCompanyTitle')}
                    labels={(metrics.seriesByProduct[0]?.points ?? []).map((point) => formatBucketLabel(
                      point.start,
                      period?.bucket ?? metrics.seriesByProduct[0]?.bucket ?? 'day',
                      timezone,
                      locale,
                    ))}
                    series={chartSeries}
                    occurrencesPending={occurrencesPending}
                    occurrencesPendingMessage={dashboardMessage(language, 'dashboard.occurrences.pending')}
                    occurrencesLegendLabel={dashboardMessage(language, 'dashboard.occurrences.legend')}
                  />
                </Card>
                <Card>
                  <h2 className="mb-3 text-sm font-bold text-[#083B7A]">
                    {dashboardMessage(language, 'dashboard.impactTitle')}
                  </h2>
                  <RankingList
                    locale={locale}
                    items={impacted.map((item) => ({
                      id: item.id,
                      label: item.label,
                      value: item.logsError,
                      color: item.selo === 'CRITICO' ? 'red' : item.selo === 'ATENCAO' ? 'amber' : 'blue',
                    }))}
                  />
                  <ul className="mt-3 space-y-2">
                    {impacted.map((item) => (
                      <li key={`selo-${item.id}`} className="flex items-center justify-between gap-2 text-xs">
                        <span className="truncate text-slate-700">{item.label}</span>
                        <Badge variant={badgeVariant(item.selo ?? 'ESTAVEL')}>
                          {dashboardMessage(language, `dashboard.selo.${item.selo ?? 'ESTAVEL'}` as DashboardMessageKey)}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>

              <Card>
                <h2 className="mb-3 text-sm font-bold text-[#083B7A]">
                  {dashboardMessage(language, 'dashboard.tableTitle')}
                </h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-2 py-2">{dashboardMessage(language, 'dashboard.table.product')}</th>
                        <th className="px-2 py-2">{dashboardMessage(language, 'dashboard.table.logs')}</th>
                        <th className="px-2 py-2">{dashboardMessage(language, 'dashboard.table.error')}</th>
                        <th className="px-2 py-2">{dashboardMessage(language, 'dashboard.table.warning')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.products.map((row) => (
                        <tr key={row.productId} className="border-t border-slate-100">
                          <td className="px-2 py-2 font-medium text-[#083B7A]">{row.productName}</td>
                          <td className="px-2 py-2 tabular-nums">{formatCount(row.logs, locale)}</td>
                          <td className="px-2 py-2 tabular-nums">{formatCount(row.error, locale)}</td>
                          <td className="px-2 py-2 tabular-nums">{formatCount(row.warning, locale)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  )
}
