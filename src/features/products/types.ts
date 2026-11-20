export type Personality = 'SIMPLE' | 'STANDARD' | 'DETAILED'

// Same fields as the Core product context (lhamalog-core specs/009-contexto-produto).
export type ProductContext = {
  functionalDescription: string
  personality: Personality
  responseLanguage: string
  architecture: string[]
  scope: string[]
  sensitiveData: string[]
}

export type ContextListField = 'architecture' | 'scope' | 'sensitiveData'

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

export function emptyProductContext(): ProductContext {
  return {
    functionalDescription: '',
    personality: 'STANDARD',
    responseLanguage: 'pt-BR',
    architecture: [],
    scope: [],
    sensitiveData: [],
  }
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
