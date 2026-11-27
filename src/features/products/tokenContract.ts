// Ingestion tokens of the Core (spec 011, LLT-179; Core specs/010-tokens-ingestao). Pure functions.
// The secret of a token is never stored: it only lives in the state of the API key field (FR-W03).
import { productPath } from './productEdit'

export type TokenState = 'ACTIVE' | 'EXPIRING' | 'EXPIRED' | 'REVOKED'

export type TokenView = {
  id: string
  name: string
  state: TokenState
  createdAt: string
  createdBy: string | null
  expiresAt: string | null
  revokedAt: string | null
  revokedBy: string | null
  replacedBy: string | null
}

export type CreatedToken = { token: TokenView; secret: string; notice: string }

export type Rotation = { created: CreatedToken; previous: TokenView }

const states: TokenState[] = ['ACTIVE', 'EXPIRING', 'EXPIRED', 'REVOKED']

function text(value: unknown): string | null {
  return typeof value === 'string' && value !== '' ? value : null
}

export function readTokenView(value: unknown): TokenView | null {
  if (!value || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  const id = text(record.id)
  const createdAt = text(record.createdAt)
  const state = states.find((item) => item === record.state)
  if (!id || !createdAt || !state) return null
  return {
    id,
    name: text(record.name) ?? '',
    state,
    createdAt,
    createdBy: text(record.createdBy),
    expiresAt: text(record.expiresAt),
    revokedAt: text(record.revokedAt),
    revokedBy: text(record.revokedBy),
    replacedBy: text(record.replacedBy),
  }
}

export function readTokenList(value: unknown): TokenView[] {
  if (!Array.isArray(value)) return []
  return value.map(readTokenView).filter((item): item is TokenView => item !== null)
}

function mostRecent(list: TokenView[], state: TokenState): TokenView | null {
  return list
    .filter((item) => item.state === state)
    .reduce<TokenView | null>((latest, item) => (!latest || Date.parse(item.createdAt) > Date.parse(latest.createdAt) ? item : latest), null)
}

// The key of the screen: the most recent ACTIVE token (F5). More than one can exist when created by other means.
export function activeToken(list: TokenView[]): TokenView | null {
  return mostRecent(list, 'ACTIVE')
}

// The previous key, still working until expiresAt after a rotation (US2.6).
export function expiringToken(list: TokenView[]): TokenView | null {
  return mostRecent(list, 'EXPIRING')
}

export function readCreatedToken(value: unknown): CreatedToken | null {
  if (!value || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  const token = readTokenView(record.token)
  const secret = text(record.secret)
  if (!token || !secret) return null
  return { token, secret, notice: text(record.notice) ?? '' }
}

export function readRotation(value: unknown): Rotation | null {
  if (!value || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  const created = readCreatedToken(record.created)
  const previous = readTokenView(record.previous)
  return created && previous ? { created, previous } : null
}

export function tokensPath(productId: string): string {
  return `${productPath(productId)}/tokens`
}

export function rotatePath(productId: string, tokenId: string): string {
  return `${tokensPath(productId)}/${encodeURIComponent(tokenId)}/rotate`
}

// Spec 013: revoke one key and read the audit of the product.
export function revokePath(productId: string, tokenId: string): string {
  return `${tokensPath(productId)}/${encodeURIComponent(tokenId)}/revoke`
}

export function auditPath(productId: string): string {
  return `${tokensPath(productId)}/audit`
}
// The Core accepts names up to 100 characters.
export function defaultTokenName(productName: string): string {
  return productName.trim().slice(0, 100) || 'Chave de API'
}

export const rotateBody = { transitionHours: 24 }

export const rotateQuestion = 'Gerar uma nova chave? A chave atual continua funcionando por 24 horas e depois para. Atualize suas aplicações nesse prazo.'

export const archivedTokenMessage = 'Produto arquivado não pode receber tokens novos.'

export const notAdminTokenHint = 'Somente donos e administradores podem gerar a chave.'

export const unsavedProductTokenHint = 'Salve o produto para gerar a chave.'

// Badge of the "Status da conexão" panel (F1). Without the token list (not admin), the state is unknown.
export function connectionState(tokensKnown: boolean, hasActiveKey: boolean): 'waiting' | 'none' | 'unknown' {
  if (!tokensKnown) return 'unknown'
  return hasActiveKey ? 'waiting' : 'none'
}

export function generateMode(active: TokenView | null): 'create' | 'rotate' {
  return active ? 'rotate' : 'create'
}

// "A chave anterior para de funcionar em {expiresAt}." (US2.6). `timeZone` is only for tests.
export function expiringHint(previous: TokenView | null, locale = 'pt-BR', timeZone?: string): string {
  if (!previous?.expiresAt) return ''
  const date = new Date(previous.expiresAt)
  if (Number.isNaN(date.getTime())) return ''
  const when = new Intl.DateTimeFormat(locale, { dateStyle: 'short', timeStyle: 'short', timeZone }).format(date)
  return `A chave anterior para de funcionar em ${when}.`
}

// The lists keep only views: the secret stays in the field that shows it once (FR-W03).
export function tokensAfterCreate(list: TokenView[], created: CreatedToken): TokenView[] {
  return [created.token, ...list.filter((item) => item.id !== created.token.id)]
}

export function tokensAfterRotation(list: TokenView[], rotation: Rotation): TokenView[] {
  const others = list.filter((item) => item.id !== rotation.created.token.id && item.id !== rotation.previous.id)
  return [rotation.created.token, rotation.previous, ...others]
}

// A revoked key stays in the list, in the same place (spec 013, US2.1).
export function tokensAfterRevoke(list: TokenView[], revoked: TokenView): TokenView[] {
  return list.map((item) => (item.id === revoked.id ? revoked : item))
}
