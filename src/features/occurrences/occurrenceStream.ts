import type { OccurrenceQuery } from './occurrenceQuery'

// Occurrence WebSocket of the Core (spec 015 of the core, spec 014 here): everything that does not need React.

export type OccurrenceNotice = {
  type: 'occurrence'
  change: 'CREATED' | 'REOPENED'
  occurrenceId: string
  productId: string
  occurrenceType: string
}

export type ServerMessage = { type: 'ready' } | OccurrenceNotice

// 4403 is a valid token without access: trying again would not help.
export const ACCESS_DENIED = 4403

export function wsUrl(apiUrl: string): string {
  const base = apiUrl.replace(/\/+$/, '').replace(/^http/, 'ws')
  return `${base}/ws/occurrences`
}

// The token goes in the message, never in the address (spec 015, clarify).
export function authMessage(token: string): string {
  return JSON.stringify({ type: 'auth', token })
}

export function parseServerMessage(data: unknown): ServerMessage | null {
  if (typeof data !== 'string') return null
  let message: Record<string, unknown>
  try {
    message = JSON.parse(data)
  }
  catch {
    return null
  }
  if (!message || typeof message !== 'object') return null
  if (message.type === 'ready') return { type: 'ready' }
  if (message.type !== 'occurrence') return null
  const { change, occurrenceId, productId, occurrenceType } = message
  if ((change !== 'CREATED' && change !== 'REOPENED') || typeof occurrenceId !== 'string' || typeof productId !== 'string'
    || typeof occurrenceType !== 'string') return null
  return { type: 'occurrence', change, occurrenceId, productId, occurrenceType }
}

// New and reopened occurrences are ABERTA and active: they count only where the list could show them.
export function countsFor(query: OccurrenceQuery, notice: OccurrenceNotice): boolean {
  if (query.archived) return false
  if (query.productIds.length > 0 && !query.productIds.includes(notice.productId)) return false
  if (query.types.length > 0 && !(query.types as string[]).includes(notice.occurrenceType)) return false
  if (query.statuses.length > 0 && !query.statuses.includes('ABERTA')) return false
  return true
}

export function noveltyLabel(count: number): string {
  return count === 1 ? '1 ocorrência nova' : `${count} ocorrências novas`
}

export function backoffSeconds(attempt: number): number {
  return Math.min(30, 2 ** Math.max(0, attempt - 1))
}

export type ListSnapshot = { ids: string[]; totalItems: number }

// After a reconnection: anything the shown list did not have means news (spec 014, FR-006).
export function hasNovelties(shown: ListSnapshot, current: ListSnapshot): boolean {
  if (current.totalItems > shown.totalItems) return true
  return current.ids.some(id => !shown.ids.includes(id))
}
