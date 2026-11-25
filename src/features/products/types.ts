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

export type OtelLogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'

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
  // Set while the product is archived (Core specs/002-editar-arquivar-produto); null when active.
  archivedAt?: string | null
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
  // Fields of the Figma that the Core does not store yet (LLT-123, F1).
  owner: string
  teamEmail: string
  tags: string[]
  // OpenTelemetry tab (spec 011, F1): Logs is always on and Metrics always off, so only these two are kept.
  otelTraces: boolean
  otelLogLevel: OtelLogLevel
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
    owner: '',
    teamEmail: '',
    tags: [],
    otelTraces: false,
    otelLogLevel: 'INFO',
  }
}
