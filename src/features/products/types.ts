export type ProductContext = {
  problemSolved: string
  targetAudience: string
  differentiators: string
  keywords: string
  restrictions: string
}

export type Product = {
  id: string
  tenantId: string
  name: string
  description: string
  category: string
  productVersion: string
  status: string
  createdAt: string
  context: ProductContext
  version: number
  // TODO: read when present. GET /api/products does not guarantee these fields yet.
  environment?: string
  owner?: string
  sla?: number | null
  lastOccurrence?: string | null
  availability?: number | null
}

// TODO: not part of POST /api/products or PUT /api/products/:id/context.
// Kept in sessionStorage until the core API can store product setup and OpenTelemetry.
export type ProductUiDraft = {
  productType: string
  environment: string
  team: string
  criticality: string
  project: string
  service: string
  logLevel: string
  active: boolean
  otelEndpoint: string
  otelProtocol: string
  otelService: string
  otelHeaders: string
  otelEnabled: boolean
}

export const emptyProductContext: ProductContext = {
  problemSolved: '',
  targetAudience: '',
  differentiators: '',
  keywords: '',
  restrictions: '',
}

export function emptyProductDraft(): ProductUiDraft {
  return {
    productType: '',
    environment: '',
    team: '',
    criticality: '',
    project: '',
    service: '',
    logLevel: 'INFO',
    active: true,
    otelEndpoint: '',
    otelProtocol: 'OTLP/HTTP',
    otelService: '',
    otelHeaders: '',
    otelEnabled: true,
  }
}
