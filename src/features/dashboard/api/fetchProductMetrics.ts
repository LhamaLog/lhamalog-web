import { ApiError } from '../../../shared/services/api'
import { parseProductMetrics } from '../contract/parseDashboardMetrics'
import type { ProductMetrics, Severity } from '../model/types'
import { isDashboardMockEnabled, mockProductMetrics } from './mockDashboardMetrics'

export type DashboardRequest = <T>(path: string, options?: RequestInit) => Promise<T>

function buildQuery(from: string, to: string, severities: Severity[]): string {
  const params = new URLSearchParams({ from, to })
  if (severities.length > 0 && severities.length < 3) {
    params.set('severities', severities.join(','))
  }
  return params.toString()
}

export async function fetchProductMetrics(input: {
  request: DashboardRequest
  productId: string
  from: string
  to: string
  severities?: Severity[]
  orgId: string | null | undefined
  signal?: AbortSignal
}): Promise<ProductMetrics> {
  const severities = input.severities ?? []
  if (isDashboardMockEnabled()) {
    if (input.signal?.aborted) throw new DOMException('Aborted', 'AbortError')
    const body = mockProductMetrics({
      productId: input.productId,
      from: input.from,
      to: input.to,
      severities,
    })
    return parseProductMetrics(body)
  }
  const path = `/api/dashboard/products/${encodeURIComponent(input.productId)}/metrics?${buildQuery(input.from, input.to, severities)}`
  const requestedOrgId = input.orgId
  try {
    const body = await input.request<unknown>(path, { signal: input.signal })
    if (input.orgId !== requestedOrgId) {
      throw new DOMException('Aborted', 'AbortError')
    }
    return parseProductMetrics(body)
  } catch (error) {
    if (error instanceof ApiError) throw error
    throw error
  }
}
