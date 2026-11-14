import { normalizeEmail } from './validation'

const sevenDaysMs = 7 * 24 * 60 * 60 * 1000

export type InvitationRef = {
  id: string
  emailAddress: string
  role?: string
  createdAt: Date | string | number
  expiresAt?: Date | string | number | null
}

export type ResendPlan = {
  revokeIds: string[]
  invite: { emailAddress: string, role: string } | null
}

function asDate(value: Date | string | number | null | undefined): Date | null {
  if (value == null || value === '') return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function isOrganizationAdmin(orgRole: string | null | undefined): boolean {
  if (!orgRole) return false
  return orgRole.replace(/^org:/, '') === 'admin'
}

export function invitationExpiry(invitation: Pick<InvitationRef, 'createdAt' | 'expiresAt'>): Date {
  const explicit = asDate(invitation.expiresAt)
  if (explicit) return explicit
  const created = asDate(invitation.createdAt)
  if (!created) throw new Error('Convite sem data de criação.')
  return new Date(created.getTime() + sevenDaysMs)
}

export function isUsablePending(invitation: InvitationRef, now = new Date()): boolean {
  return invitationExpiry(invitation).getTime() > now.getTime()
}

export function hasUsablePending(invitations: InvitationRef[], email: string, now = new Date()): boolean {
  const target = normalizeEmail(email)
  return invitations.some((item) => normalizeEmail(item.emailAddress) === target && isUsablePending(item, now))
}

export function resendPlan(input: {
  pending: InvitationRef[]
  email: string
  role: string
  revokeFailed: boolean
}): ResendPlan {
  const target = normalizeEmail(input.email)
  const revokeIds = input.pending.filter((item) => normalizeEmail(item.emailAddress) === target).map((item) => item.id)
  if (input.revokeFailed || revokeIds.length === 0) return { revokeIds, invite: null }
  return { revokeIds, invite: { emailAddress: target, role: input.role } }
}

export function membershipBlocksInvite(identifiers: string[], email: string): boolean {
  const target = normalizeEmail(email)
  if (!target) return false
  return identifiers.some((item) => normalizeEmail(item) === target)
}

export function invitationOutcomeCopy(kind: 'expired' | 'revoked'): string {
  if (kind === 'expired') return 'Este convite expirou e não pode ser usado.'
  return 'Este convite foi revogado e não pode ser usado.'
}

// Chaves de unstable__errors em @clerk/shared (localization.d.ts) e em @clerk/localizations 4.24.2.
// ticket_expired_code: ticket expirado. ticket_invalid_code: ticket inválido, inclusive convite revogado.
export const invitationTicketErrors = {
  ticket_expired_code: invitationOutcomeCopy('expired'),
  ticket_invalid_code: invitationOutcomeCopy('revoked'),
} as const

export const teamNavItemId = 'team'

export const teamAccessDeniedMessage = 'Você não tem acesso. Selecione uma empresa válida.'

export function teamMenuHiddenItems(orgRole: string | null | undefined): string[] {
  return isOrganizationAdmin(orgRole) ? [] : [teamNavItemId]
}

export function teamPageDenied(orgRole: string | null | undefined): boolean {
  return !isOrganizationAdmin(orgRole)
}

export function roleLabel(role: string): string {
  if (role === 'org:admin') return 'Administrador'
  if (role === 'org:member') return 'Membro'
  return role
}

export function isClerkSessionExpired(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const status = 'status' in error ? error.status : undefined
  if (status === 401) return true
  const errors = 'errors' in error && Array.isArray(error.errors) ? error.errors : []
  return errors.some((item) => {
    if (!item || typeof item !== 'object' || !('code' in item)) return false
    return item.code === 'authentication_invalid' || item.code === 'signed_out'
  })
}

export function clerkErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'errors' in error && Array.isArray(error.errors)) {
    const first = error.errors.find((item) => item && typeof item === 'object')
    if (first && typeof first === 'object') {
      if ('longMessage' in first && typeof first.longMessage === 'string' && first.longMessage) return first.longMessage
      if ('message' in first && typeof first.message === 'string' && first.message) return first.message
    }
  }
  if (error instanceof Error && error.message) return error.message
  return 'Não foi possível concluir a operação. Tente novamente.'
}
