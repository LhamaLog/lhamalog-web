import { ApiError } from '../../../shared/services/api'
import { parseCompanyMetrics } from '../contract/parseDashboardMetrics'
import type { CompanyMetrics, Severity } from '../model/types'
import { isDashboardMockEnabled, mockCompanyMetrics } from './mockDashboardMetrics'

export type DashboardRequest = <T>(path: string, options?: RequestInit) => Promise<T>

function buildQuery(from: string, to: string, productIds: string[], severities: Severity[]): string {
  const params = new URLSearchParams({ from, to })
  if (productIds.length > 0) params.set('productIds', productIds.join(','))
  if (severities.length > 0 && severities.length < 3) {
    params.set('severities', severities.join(','))
  }
  return params.toString()
}

export async function fetchCompanyMetrics(input: {
  request: DashboardRequest
  from: string
  to: string
  productIds?: string[]
  severities?: Severity[]
  orgId: string | null | undefined
  signal?: AbortSignal
}): Promise<CompanyMetrics> {
  const productIds = input.productIds ?? []
  const severities = input.severities ?? []
  if (isDashboardMockEnabled()) {
    if (input.signal?.aborted) throw new DOMException('Aborted', 'AbortError')
    const body = mockCompanyMetrics({
      from: input.from,
      to: input.to,
      productIds,
      severities,
    })
    return parseCompanyMetrics(body)
  }
  const path = `/api/dashboard/company/metrics?${buildQuery(input.from, input.to, productIds, severities)}`
  const requestedOrgId = input.orgId
  try {
    const body = await input.request<unknown>(path, { signal: input.signal })
    if (input.orgId !== requestedOrgId) {
      throw new DOMException('Aborted', 'AbortError')
    }
    return parseCompanyMetrics(body)
  } catch (error) {
    if (error instanceof ApiError) throw error
    throw error
  }
}
