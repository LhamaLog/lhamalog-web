// "Chaves deste produto" (spec 013, LLT-179): list, revoke, rotate with a chosen period, create with a name and the
// audit of the Core (specs/010-tokens-ingestao). Pure functions: no React and no Clerk, so tests/*.test.mjs run them.
// The secret of a key never passes here: it lives only in the component that shows it once (FR-K09).
import { can } from '../access/accessContract'
import type { AccessStatus } from '../access/accessContract'
import { memberDisplayName } from '../team/members'
import type { TokenState, TokenView } from './tokenContract'

export type BadgeVariant = 'success' | 'warning' | 'neutral' | 'danger'

const badges: Record<TokenState, { label: string; variant: BadgeVariant }> = {
  ACTIVE: { label: 'Ativa', variant: 'success' },
  EXPIRING: { label: 'Em transição', variant: 'warning' },
  EXPIRED: { label: 'Expirada', variant: 'neutral' },
  REVOKED: { label: 'Revogada', variant: 'danger' },
}

export function tokenBadge(state: TokenState): { label: string; variant: BadgeVariant } {
  return { ...badges[state] }
}

// "dd/mm/aaaa hh:mm". `timeZone` is only for tests; the screen uses the browser zone.
export function formatDateTime(value: string | null, locale = 'pt-BR', timeZone?: string): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const parts = new Intl.DateTimeFormat(locale, {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone,
  }).formatToParts(date)
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? ''
  return `${part('day')}/${part('month')}/${part('year')} ${part('hour')}:${part('minute')}`
}

export type TokenActions = { revoke: boolean; rotate: 'hidden' | 'enabled' | 'disabled' }

// Revoke: active or expiring keys, also on an archived product, which is what a leaked key needs (K7).
// Rotate: only an active key without expiration; the Core refuses the others and an archived product with 409.
export function tokenActions(token: TokenView, archived: boolean): TokenActions {
  const revoke = token.state === 'ACTIVE' || token.state === 'EXPIRING'
  const rotatable = token.state === 'ACTIVE' && !token.expiresAt
  return { revoke, rotate: !rotatable ? 'hidden' : archived ? 'disabled' : 'enabled' }
}

export const tokenNameMax = 100

// Same rule as the Core (400): 1 to 100 characters after trimming (K3).
export function tokenNameError(value: string): string | undefined {
  const name = value.trim()
  if (!name) return 'Informe o nome da chave.'
  if (name.length > tokenNameMax) return `O nome da chave pode ter até ${tokenNameMax} caracteres.`
  return undefined
}

export const defaultTransitionHours = 24
export const transitionLimits = { min: 1, max: 168 }

// Whole hours from 1 to 168; an empty field means the default 24 (K4).
export function transitionHoursOf(value: string): { hours: number } | { error: string } {
  const text = value.trim()
  if (!text) return { hours: defaultTransitionHours }
  const hours = /^\d+$/.test(text) ? Number(text) : Number.NaN
  if (!Number.isInteger(hours) || hours < transitionLimits.min || hours > transitionLimits.max) {
    return { error: `Informe um número inteiro de horas entre ${transitionLimits.min} e ${transitionLimits.max}.` }
  }
  return { hours }
}

export function createTokenBody(name: string): { name: string } {
  return { name: name.trim() }
}

// Without a name, the new key inherits the name of the rotated one (Core contract).
export function rotateTokenBody(hours: number): { transitionHours: number } {
  return { transitionHours: hours }
}

export type AuditAction = 'CREATED' | 'ROTATED' | 'REVOKED'

export type AuditEntry = {
  id: string
  tokenId: string
  action: AuditAction
  actorUserId: string | null
  at: string
  relatedTokenId: string | null
  transitionEndsAt: string | null
}

const auditActions: AuditAction[] = ['CREATED', 'ROTATED', 'REVOKED']

const auditLabels: Record<AuditAction, string> = { CREATED: 'Criada', ROTATED: 'Rotacionada', REVOKED: 'Revogada' }

function text(value: unknown): string | null {
  return typeof value === 'string' && value !== '' ? value : null
}

function readAuditEntry(value: unknown): AuditEntry | null {
  if (!value || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  const id = text(record.id)
  const tokenId = text(record.tokenId)
  const at = text(record.at)
  const action = auditActions.find((item) => item === record.action)
  if (!id || !tokenId || !at || !action) return null
  return {
    id, tokenId, action, at,
    actorUserId: text(record.actorUserId),
    relatedTokenId: text(record.relatedTokenId),
    transitionEndsAt: text(record.transitionEndsAt),
  }
}

// Newest first. The sort is stable, so the order of the Core stays on the same instant: a rotation writes
// "Rotacionada" and "Criada" at the same time (R8).
export function readAuditList(value: unknown): AuditEntry[] {
  if (!Array.isArray(value)) return []
  return value
    .map(readAuditEntry)
    .filter((item): item is AuditEntry => item !== null)
    .map((entry, index) => ({ entry, index, time: Date.parse(entry.at) }))
    .sort((a, b) => (b.time - a.time) || (a.index - b.index))
    .map((item) => item.entry)
}

export type PeopleIndex = Map<string, string>

export type MembershipPerson = { userId?: string | null; firstName?: string | null; lastName?: string | null; identifier?: string | null }

// userId → name (or e-mail without a name), from organization.getMemberships, as the Equipe page shows it (K5).
export function peopleIndex(people: MembershipPerson[]): PeopleIndex {
  const index: PeopleIndex = new Map()
  for (const person of people) {
    const name = memberDisplayName(person)
    if (person.userId && name) index.set(person.userId, name)
  }
  return index
}

export const removedPerson = 'Usuário removido'

// Someone outside the organization (or a list that could not be read) never shows an e-mail (K5).
export function personLabel(userId: string | null, people: PeopleIndex | null): string {
  return (userId && people?.get(userId)) || removedPerson
}

// The key by its name in the list; without it, the short id.
export function tokenLabel(tokenId: string, tokens: TokenView[]): string {
  return tokens.find((item) => item.id === tokenId)?.name || tokenId.slice(0, 8)
}

export function auditLine(entry: AuditEntry, tokens: TokenView[], people: PeopleIndex | null, locale = 'pt-BR', timeZone?: string) {
  const ends = entry.action === 'ROTATED' ? formatDateTime(entry.transitionEndsAt, locale, timeZone) : ''
  return {
    action: auditLabels[entry.action],
    token: tokenLabel(entry.tokenId, tokens),
    who: personLabel(entry.actorUserId, people),
    when: formatDateTime(entry.at, locale, timeZone),
    detail: ends ? `Transição até ${ends}` : '',
  }
}

export function tokenDetails(token: TokenView, people: PeopleIndex | null, locale = 'pt-BR', timeZone?: string): { created: string; end: string } {
  const created = `Criada em ${formatDateTime(token.createdAt, locale, timeZone)} por ${personLabel(token.createdBy, people)}`
  if (token.state === 'REVOKED' && token.revokedAt) {
    return { created, end: `Revogada em ${formatDateTime(token.revokedAt, locale, timeZone)} por ${personLabel(token.revokedBy, people)}` }
  }
  if (token.state === 'EXPIRING' && token.expiresAt) return { created, end: `Expira em ${formatDateTime(token.expiresAt, locale, timeZone)}` }
  if (token.state === 'EXPIRED' && token.expiresAt) return { created, end: `Expirou em ${formatDateTime(token.expiresAt, locale, timeZone)}` }
  return { created, end: '' }
}

// Who sees and uses the keys: the INGESTION_TOKENS_MANAGE permission of LLT-120, only with a known access (K6).
// In the legacy mode (Core without LLT-120), the fallback of spec 012 gives it to the admin.
export function canManageTokens(access: { status: AccessStatus; permissions: readonly string[] }): boolean {
  return (access.status === 'ready' || access.status === 'legacy') && can(access.permissions, 'INGESTION_TOKENS_MANAGE')
}

export function revokeQuestion(name: string): string {
  return `Revogar a chave "${name}"? A chave deixa de ser aceita em até 30 segundos. As aplicações que usam essa chave param de enviar logs.`
}

export function rotateQuestionFor(name: string, hours: number): string {
  const period = hours === 1 ? '1 hora' : `${hours} horas`
  return `Rotacionar a chave "${name}"? A chave atual continua funcionando por ${period} e depois para. Atualize suas aplicações nesse prazo.`
}

export const rotateHint = 'Durante esse período, a chave antiga e a nova funcionam. Depois, só a nova.'

export const emptyTokensMessage = 'Nenhuma chave gerada ainda.'
