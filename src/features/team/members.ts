import { isOrganizationAdmin, teamAccessDeniedMessage, teamPageDenied } from './invitations'
import type { CoreMember, MemberRow, MemberStatus } from './types'

export type MemberSource = {
  userId?: string | null
  firstName?: string | null
  lastName?: string | null
  identifier?: string | null
  role?: string | null
}

export type AdminCountMembership = {
  role?: string | null
  userId?: string | null
}

export function memberDisplayName(input: { firstName?: string | null, lastName?: string | null, identifier?: string | null }): string {
  const name = [input.firstName, input.lastName].map((part) => (part ?? '').trim()).filter(Boolean).join(' ')
  if (name) return name
  return (input.identifier ?? '').trim()
}

export function memberEmail(identifier?: string | null): string {
  return identifier ?? ''
}

export function roleToUpdate(role: string): 'admin' | 'member' | null {
  if (role === 'org:admin' || role === 'admin') return 'admin'
  if (role === 'org:member' || role === 'member') return 'member'
  return null
}

export function mergeMember(clerk: MemberSource, core: CoreMember | null): MemberRow {
  const userId = clerk.userId?.trim() ? clerk.userId : null
  const matched = userId && core?.userId === userId ? core : null
  return {
    userId,
    name: memberDisplayName(clerk),
    email: memberEmail(clerk.identifier),
    role: clerk.role ?? '',
    status: matched?.status ?? 'active',
    lastAccessAt: matched?.lastAccessAt ?? null,
  }
}

export function activeAdminCount(memberships: AdminCountMembership[], core: CoreMember[]): number {
  const statusByUser = new Map(core.map((member) => [member.userId, member.status]))
  return memberships.filter((membership) => {
    if (!isOrganizationAdmin(membership.role)) return false
    const userId = membership.userId?.trim()
    if (!userId) return false
    const status = statusByUser.get(userId)
    return status !== 'deactivated'
  }).length
}

export function lastAdminBlocked(input: { adminCount: number, targetIsActiveAdmin: boolean, action: 'demote' | 'deactivate' }): boolean {
  return input.action === 'demote' || input.action === 'deactivate'
    ? input.targetIsActiveAdmin && input.adminCount < 2
    : false
}

export function lastAdminMessage(action: 'demote' | 'deactivate'): string {
  return action === 'demote'
    ? 'Não é possível rebaixar o último administrador.'
    : 'Não é possível desativar o último administrador.'
}

// Decisão da tela antes de organization.updateMember ou do POST. Empresa trocada ou contagem
// indisponível descarta o efeito (FR-012): não chama a ação e não mostra a recusa.
export function localLastAdminGuard(input: {
  action: 'demote' | 'deactivate'
  targetIsActiveAdmin: boolean
  adminCount: number | null
  sameOrganization: boolean
}): { call: false, error: string | null } | { call: true, error: null } {
  if (!input.targetIsActiveAdmin) return { call: true, error: null }
  if (!input.sameOrganization || input.adminCount === null) return { call: false, error: null }
  if (lastAdminBlocked({ adminCount: input.adminCount, targetIsActiveAdmin: true, action: input.action })) {
    return { call: false, error: lastAdminMessage(input.action) }
  }
  return { call: true, error: null }
}

export function isActiveAdmin(role: string, status: MemberStatus): boolean {
  return isOrganizationAdmin(role) && status !== 'deactivated'
}

export type TeamScreen =
  | { mode: 'denied', message: string, offersActions: false, signOut: false }
  | { mode: 'deactivated', message: string, offersActions: false, signOut: false }
  | { mode: 'open', offersActions: true, signOut: false }

export function teamScreen(input: { orgRole: string | null | undefined, blockedMessage: string }): TeamScreen {
  if (teamPageDenied(input.orgRole)) {
    return { mode: 'denied', message: teamAccessDeniedMessage, offersActions: false, signOut: false }
  }
  if (input.blockedMessage) {
    return { mode: 'deactivated', message: input.blockedMessage, offersActions: false, signOut: false }
  }
  return { mode: 'open', offersActions: true, signOut: false }
}

export function deactivatedTeamBlock(error: { code: string, message: string }): string | null {
  if (error.code !== 'user_deactivated') return null
  return error.message
}

export function shouldApplyTeamList(input: {
  active: boolean
  startedOrgId: string | null | undefined
  currentOrgId: string | null | undefined
}): boolean {
  return input.active && input.currentOrgId === input.startedOrgId
}

export function teamListsForCurrentOrganization<T, U>(input: {
  previousOrgId: string | null
  nextOrgId: string | null
  invitations: T[]
  members: U[]
}): { changed: boolean, invitations: T[], members: U[] } {
  if (input.previousOrgId === input.nextOrgId) {
    return { changed: false, invitations: input.invitations, members: input.members }
  }
  return { changed: true, invitations: [], members: [] }
}
