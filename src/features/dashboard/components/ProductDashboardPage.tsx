import { useAuth } from '@clerk/react'
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ApiError } from '../../../shared/services/api'
import { endsSession } from '../../../shared/services/sessionRedirect'
import { useApi } from '../../../shared/services/useApi'
import { Card } from '../../../shared/ui/Card'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { ErrorState } from '../../../shared/ui/ErrorState'
import { LoadingState } from '../../../shared/ui/LoadingState'
import { MetricCard } from '../../../shared/ui/MetricCard'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { RankingList } from '../../../shared/ui/RankingList'
import { TimeSeriesChart } from '../../../shared/ui/TimeSeriesChart'
import { useAppliedPreferences } from '../../profile/preferences'
import { fetchProductMetrics } from '../api/fetchProductMetrics'
import { isDashboardMockEnabled, mockAccessibleProducts } from '../api/mockDashboardMetrics'
import { isOccurrencesPending } from '../contract/parseDashboardMetrics'
import { dashboardMessage } from '../messages'
import { resolveDashboardVisibility } from '../model/accessVisibility'
import {
  applyDashboardFilters,
  deserializeDashboardQuery,
  serializeDashboardFilter,
} from '../model/applyDashboardFilters'
import {
  defaultDashboardFilter,
  revalidateAfterRetention,
  withRetentionCeiling,
} from '../model/filterPeriod'
import { formatBytes, formatCount } from '../model/format'
import { formatBucketLabel, formatInTimeZone, resolvePeriod } from '../model/timezoneBuckets'
import type { DashboardFilter, ProductMetrics } from '../model/types'
import { DashboardFilters } from './DashboardFilters'
import { MemberEmptyNotice } from './MemberEmptyNotice'

export function ProductDashboardPage() {
  const { orgId, orgRole } = useAuth()
  const request = useApi()
  const { language, timezone } = useAppliedPreferences()
  const [params, setParams] = useSearchParams()
  const [products, setProducts] = useState(isDashboardMockEnabled() ? mockAccessibleProducts : [])
  const [productsLoading, setProductsLoading] = useState(!isDashboardMockEnabled())
  const [applied, setApplied] = useState(() => deserializeDashboardQuery({
    produto: params.getAll('produto').length > 1 ? params.getAll('produto') : params.get('produto'),
    periodo: params.get('periodo'),
    de: params.get('de'),
    ate: params.get('ate'),
    tipo: params.get('tipo'),
  }))
  const [draft, setDraft] = useState(applied)
  const [filterMessage, setFilterMessage] = useState('')
  const [metrics, setMetrics] = useState<ProductMetrics | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [correlationId, setCorrelationId] = useState('')
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
    if (visibility.memberWithoutProducts) return
    if (!applied.productIds[0] && visibility.products[0]) {
      const next = { ...applied, productIds: [visibility.products[0].id] }
      setApplied(next)
      setDraft(next)
      setParams(serializeDashboardFilter(next), { replace: true })
      return
    }
    if (!applied.productIds[0] || !applied.from || !applied.to) return
    const controller = new AbortController()
    const requestedOrgId = orgId
    setLoading(true)
    setError('')
    setCorrelationId('')
    fetchProductMetrics({
      request,
      productId: applied.productIds[0],
      from: applied.from.toISOString(),
      to: applied.to.toISOString(),
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
        const message = reason instanceof Error ? reason.message : dashboardMessage(language, 'dashboard.errorTitle')
        setError(message)
        setCorrelationId(reason instanceof ApiError ? reason.correlationId : '')
        setMetrics(null)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [applied.productIds.join(','), applied.from?.toISOString(), applied.to?.toISOString(), applied.severities.join(','), orgId, reloadKey, request, visibility.memberWithoutProducts, visibility.products.map((product) => product.id).join(','), language, setParams])

  function commitFilter(nextDraft: DashboardFilter) {
    const result = applyDashboardFilters({ current: applied, draft: nextDraft })
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

  if (productsLoading) return <LoadingState />
  if (visibility.memberWithoutProducts) return <MemberEmptyNotice language={language} />

  return (
    <div className="space-y-5">
      <PageHeader
        title={dashboardMessage(language, 'dashboard.productTitle')}
        description={dashboardMessage(language, 'dashboard.productDescription')}
        actions={(
          <Link to="/dashboard/empresa" className="text-sm font-semibold text-[#0C70F2] hover:underline">
            {dashboardMessage(language, 'dashboard.link.company')}
          </Link>
        )}
      />

      <DashboardFilters
        mode="product"
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

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <MetricCard title={dashboardMessage(language, 'dashboard.card.totalLogs')} value={formatCount(metrics.totals.logs, locale)} tone="blue" />
            <MetricCard title={dashboardMessage(language, 'dashboard.card.logsError')} value={formatCount(metrics.totals.error, locale)} tone="red" />
            <MetricCard title={dashboardMessage(language, 'dashboard.card.logsWarning')} value={formatCount(metrics.totals.warning, locale)} tone="amber" />
            <MetricCard title={dashboardMessage(language, 'dashboard.card.traces')} value={formatCount(metrics.totals.traces, locale)} tone="green" />
            <MetricCard
              title={dashboardMessage(language, 'dashboard.card.volume')}
              value={formatBytes(metrics.totals.volumeUsedBytes, locale)}
              variation={dashboardMessage(language, 'dashboard.volumeOf', {
                used: formatBytes(metrics.totals.volumeUsedBytes, locale),
                quota: formatBytes(metrics.volumeIngestaoBytes, locale),
              })}
              tone="neutral"
            />
          </div>

          {metrics.totals.logs === 0 ? (
            <EmptyState
              title={dashboardMessage(language, 'dashboard.empty')}
              description={dashboardMessage(language, 'dashboard.emptyDescription')}
            />
          ) : (
            <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(16rem,1fr)]">
              <Card>
                <h2 className="mb-3 text-sm font-bold text-[#083B7A]">
                  {dashboardMessage(language, 'dashboard.chartTitle')}
                </h2>
                <TimeSeriesChart
                  ariaLabel={dashboardMessage(language, 'dashboard.chartTitle')}
                  labels={metrics.series.points.map((point) => formatBucketLabel(
                    point.start,
                    period?.bucket ?? metrics.series.bucket,
                    timezone,
                    locale,
                  ))}
                  series={[
                    {
                      id: 'error',
                      label: dashboardMessage(language, 'dashboard.card.logsError'),
                      color: '#DC2626',
                      values: metrics.series.points.map((point) => point.error),
                    },
                    {
                      id: 'warning',
                      label: dashboardMessage(language, 'dashboard.card.logsWarning'),
                      color: '#D97706',
                      values: metrics.series.points.map((point) => point.warning),
                    },
                  ]}
                  occurrencesPending={isOccurrencesPending(metrics.series.points)}
                  occurrences={metrics.series.points
                    .map((point) => point.occurrences)
                    .filter((value): value is number => typeof value === 'number')}
                  occurrencesPendingMessage={dashboardMessage(language, 'dashboard.occurrences.pending')}
                  occurrencesLegendLabel={dashboardMessage(language, 'dashboard.occurrences.legend')}
                />
              </Card>
              <Card>
                <h2 className="mb-3 text-sm font-bold text-[#083B7A]">
                  {dashboardMessage(language, 'dashboard.rankingTitle')}
                </h2>
                <RankingList
                  locale={locale}
                  items={metrics.serviceRanking.map((item) => ({
                    id: item.serviceName,
                    label: item.serviceName,
                    value: item.error,
                    color: 'red' as const,
                  }))}
                />
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  )
}
