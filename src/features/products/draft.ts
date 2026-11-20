import { emptyProductDraft } from './types'
import type { ProductUiDraft } from './types'

const storageKey = (id: string) => `lhamalog.productDraft.v1:${id}`

function asString(value: unknown, fallback: string) {
  return typeof value === 'string' ? value : fallback
}

function asTags(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean)
}

function asBoolean(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback
}

export function normalizeProductDraft(value: unknown): ProductUiDraft {
  const empty = emptyProductDraft()
  if (!value || typeof value !== 'object') return empty
  const parsed = value as Partial<ProductUiDraft>
  return {
    productType: asString(parsed.productType, empty.productType),
    environment: asString(parsed.environment, empty.environment),
    owner: asString(parsed.owner, empty.owner),
    teamEmail: asString(parsed.teamEmail, empty.teamEmail),
    tags: asTags(parsed.tags),
    otelEndpoint: asString(parsed.otelEndpoint, empty.otelEndpoint),
    otelProtocol: asString(parsed.otelProtocol, empty.otelProtocol) || empty.otelProtocol,
    otelService: asString(parsed.otelService, empty.otelService),
    otelHeaders: asString(parsed.otelHeaders, empty.otelHeaders),
    otelEnabled: asBoolean(parsed.otelEnabled, empty.otelEnabled),
  }
}

function browserStorage() {
  try {
    return typeof sessionStorage === 'undefined' ? null : sessionStorage
  } catch {
    return null
  }
}

export function loadProductDraft(id: string) {
  const storage = browserStorage()
  if (!storage) return emptyProductDraft()
  try {
    const raw = storage.getItem(storageKey(id))
    return raw ? normalizeProductDraft(JSON.parse(raw)) : emptyProductDraft()
  } catch {
    return emptyProductDraft()
  }
}

export function saveProductDraft(id: string, draft: ProductUiDraft) {
  const storage = browserStorage()
  if (!storage) return
  try {
    storage.setItem(storageKey(id), JSON.stringify(draft))
  } catch {
    // Ignore quota errors. The API payload is saved separately.
  }
}

export function moveProductDraft(fromId: string, toId: string, draft: ProductUiDraft) {
  saveProductDraft(toId, draft)
  const storage = browserStorage()
  try {
    storage?.removeItem(storageKey(fromId))
  } catch {
    // The new key already has the draft.
  }
}
