export const inviteRoles = ['org:admin', 'org:member'] as const

export type InviteRole = (typeof inviteRoles)[number]

export type InviteDraft = {
  emailAddress: string
  role: InviteRole
}

export type InvitationStatus = 'pending' | 'accepted' | 'revoked' | 'expired'

export type InvitationRow = {
  id: string
  emailAddress: string
  role: string
  createdAt: Date
  expiresAt: Date | null
  status: InvitationStatus
}

export const memberStatuses = ['active', 'deactivated'] as const

export type MemberStatus = (typeof memberStatuses)[number]

export type CoreMember = {
  userId: string
  status: MemberStatus
  lastAccessAt: Date | null
}

export type MemberRow = {
  userId: string | null
  name: string
  email: string
  role: string
  status: MemberStatus
  lastAccessAt: Date | null
}
