import { ApiError } from '../../shared/services/api'
import type { OccurrenceStatus } from './types'

// Lifecycle actions of the spec 013 (LLT-136) on the Core of the spec 014: every call carries the revision the user
// sees, and a stale one comes back as 409 occurrence_changed.

export type OccurrenceAction = 'status' | 'archive' | 'unarchive'

export type ActionRequest = { path: string; method: 'PUT' | 'POST'; body: Record<string, string> }

export type ActionFailure =
  | { kind: 'conflict'; message: string }
  | { kind: 'not-found' }
  | { kind: 'invalid'; message: string }
  | { kind: 'error'; message: string }

const base = (id: string) => `/api/occurrences/${encodeURIComponent(id)}`

export function statusAction(id: string, status: OccurrenceStatus, revision: string): ActionRequest {
  return { path: `${base(id)}/status`, method: 'PUT', body: { status, revision } }
}

export function archiveAction(id: string, revision: string): ActionRequest {
  return { path: `${base(id)}/archive`, method: 'POST', body: { revision } }
}

export function unarchiveAction(id: string, revision: string): ActionRequest {
  return { path: `${base(id)}/unarchive`, method: 'POST', body: { revision } }
}

const fallback = 'Não foi possível concluir a ação. Tente novamente.'

// Security refusals never get here as a screen state: useApi already ends the session (spec 006).
export function actionFailure(reason: unknown): ActionFailure {
  if (!(reason instanceof ApiError)) return { kind: 'error', message: fallback }
  if (reason.status === 409 && reason.code === 'occurrence_changed') return { kind: 'conflict', message: reason.message }
  if (reason.status === 404) return { kind: 'not-found' }
  if (reason.status === 400) {
    const field = Object.values(reason.fieldErrors ?? {}).find(value => typeof value === 'string' && value)
    return { kind: 'invalid', message: field ?? reason.message }
  }
  return { kind: 'error', message: reason.message || fallback }
}

export function successMessage(action: OccurrenceAction): string {
  if (action === 'archive') return 'Ocorrência arquivada'
  if (action === 'unarchive') return 'Ocorrência desarquivada'
  return 'Status alterado'
}
