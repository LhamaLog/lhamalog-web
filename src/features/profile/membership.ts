export type MembershipRoleKey = 'profile.role.admin' | 'profile.role.member'

export function membershipRoleMessageKey(role: string | null | undefined): MembershipRoleKey | null {
  if (role === 'org:admin') return 'profile.role.admin'
  if (role === 'org:member') return 'profile.role.member'
  return null
}

export function membershipStartedAt(createdAt: Date | number | string | null | undefined): Date | null {
  if (createdAt == null || createdAt === '') return null
  const date = createdAt instanceof Date ? createdAt : new Date(createdAt)
  if (Number.isNaN(date.getTime())) return null
  return date
}
