// Owner and invitation rules of the Team screen (spec 012, US2 and US3). Pure functions.
import type { AccessRole } from '../access/accessContract'
import { roleLabel } from './invitations'
import type { InviteRole } from './types'

export const ownerDemoteMessage = 'Não é possível rebaixar o Dono da empresa.'

export const ownerDeactivateMessage = 'Não é possível desativar o Dono da empresa.'

export const adminResendBlockedMessage = 'Só o Dono reenvia convite de Administrador.'

export const adminInviteHelp = 'Depois do aceite, você pode promover a pessoa a Administrador.'

export function isOwnerRow(rowUserId: string | null, ownerUserId: string | null): boolean {
  return rowUserId !== null && ownerUserId !== null && rowUserId === ownerUserId
}

export function canDemote(rowUserId: string | null, ownerUserId: string | null): boolean {
  return !isOwnerRow(rowUserId, ownerUserId)
}

export function canDeactivate(rowUserId: string | null, ownerUserId: string | null): boolean {
  return !isOwnerRow(rowUserId, ownerUserId)
}

// Blocks a demotion of the owner before any call to Clerk (US2, scenario 3).
export function demoteGuard(rowUserId: string | null, ownerUserId: string | null, nextRole: 'admin' | 'member'): string | null {
  return nextRole === 'member' && isOwnerRow(rowUserId, ownerUserId) ? ownerDemoteMessage : null
}

export function rowRoleLabel(clerkRole: string, owner: boolean): string {
  return owner ? 'Dono' : roleLabel(clerkRole)
}

function isAdminInvitation(role: string): boolean {
  return role.replace(/^org:/, '') === 'admin'
}

// Roles offered in the invitation (ADR_114, USID_029.1 FA03). While the company has no owner (no purchase flow
// yet), administrators keep inviting administrators, as before LLT-120 (clarify W4).
export function inviteRolesFor(role: AccessRole | null, ownerExists: boolean): InviteRole[] {
  if (role === 'MEMBER') return []
  if (role === 'OWNER' || (role === 'ADMIN' && !ownerExists)) return ['org:member', 'org:admin']
  return ['org:member']
}

export function inviteHelpFor(options: InviteRole[]): string {
  return options.includes('org:admin') ? '' : adminInviteHelp
}

export function resendBlocked(role: AccessRole | null, ownerExists: boolean, invitationRole: string): string | null {
  return ownerExists && role !== 'OWNER' && isAdminInvitation(invitationRole) ? adminResendBlockedMessage : null
}
