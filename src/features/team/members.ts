import { isOrganizationAdmin } from './invitations'
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

export function isActiveAdmin(role: string, status: MemberStatus): boolean {
  return isOrganizationAdmin(role) && status !== 'deactivated'
}
