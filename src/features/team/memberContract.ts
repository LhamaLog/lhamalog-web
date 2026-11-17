import type { CoreMember, MemberStatus } from './types'

export const companyMembersPath = '/api/company/members'

type Json = Record<string, unknown>

function objectOf(value: unknown): Json | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Json : null
}

function statusOf(value: unknown): MemberStatus | null {
  return value === 'active' || value === 'deactivated' ? value : null
}

function userIdOf(value: unknown): string | null {
  return typeof value === 'string' && value.length >= 1 && value.length <= 200 ? value : null
}

function lastAccessOf(value: unknown): Date | null | undefined {
  if (value === null) return null
  if (typeof value !== 'string') return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date
}

export function readMember(value: unknown): CoreMember | null {
  const record = objectOf(value)
  if (!record) return null
  const userId = userIdOf(record.userId)
  const status = statusOf(record.status)
  const lastAccessAt = lastAccessOf(record.lastAccessAt)
  if (!userId || !status || lastAccessAt === undefined) return null
  return { userId, status, lastAccessAt }
}

export function readMemberList(body: unknown): CoreMember[] | null {
  const record = objectOf(body)
  if (!record || !Array.isArray(record.members)) return null
  const members: CoreMember[] = []
  for (const item of record.members) {
    const member = readMember(item)
    if (!member) return null
    members.push(member)
  }
  return members
}

export function deactivationPath(userId: string): string | null {
  if (userId.length < 1 || userId.length > 200) return null
  return `${companyMembersPath}/${encodeURIComponent(userId)}/deactivation`
}
