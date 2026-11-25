// Contract of the Core notification role routes (lhamalog-core specs/011-cargos-permissoes, contracts/api.md
// section 3). Pure functions.
import { alertTypeCodes, severityCodes } from '../access/labels'

export const notificationRolesPath = '/api/company/notification-roles'

export type Severity = (typeof severityCodes)[number]
export type AlertType = (typeof alertTypeCodes)[number]
export type MembersSource = 'ACCESS_ROLE' | 'EXPLICIT'

export type NotificationRole = {
  id: string
  name: string
  defaultKey: string | null
  isDefault: boolean
  immutable: boolean
  severities: Severity[]
  alertTypes: AlertType[]
  memberUserIds: string[]
  membersSource: MembersSource
  version: number
}

export type PersonRoles = {
  userId: string
  roles: { id: string, name: string }[]
}

type Json = Record<string, unknown>

function objectOf(value: unknown): Json | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Json : null
}

function codes<T extends string>(value: unknown, allowed: readonly T[]): T[] | null {
  if (!Array.isArray(value)) return null
  return value.every((item) => typeof item === 'string' && (allowed as readonly string[]).includes(item)) ? value as T[] : null
}

function texts(value: unknown): string[] | null {
  return Array.isArray(value) && value.every((item) => typeof item === 'string') ? value as string[] : null
}

export function readRole(value: unknown): NotificationRole | null {
  const record = objectOf(value)
  if (!record || typeof record.id !== 'string' || typeof record.name !== 'string') return null
  if (record.defaultKey !== null && record.defaultKey !== undefined && typeof record.defaultKey !== 'string') return null
  if (typeof record.isDefault !== 'boolean' || typeof record.immutable !== 'boolean') return null
  if (record.membersSource !== 'ACCESS_ROLE' && record.membersSource !== 'EXPLICIT') return null
  if (typeof record.version !== 'number') return null
  const severities = codes(record.severities, severityCodes)
  const alertTypes = codes(record.alertTypes, alertTypeCodes)
  const memberUserIds = texts(record.memberUserIds)
  if (!severities || !alertTypes || !memberUserIds) return null
  return {
    id: record.id,
    name: record.name,
    defaultKey: typeof record.defaultKey === 'string' ? record.defaultKey : null,
    isDefault: record.isDefault,
    immutable: record.immutable,
    severities,
    alertTypes,
    memberUserIds,
    membersSource: record.membersSource,
    version: record.version,
  }
}

export function readRoleList(value: unknown): NotificationRole[] | null {
  const record = objectOf(value)
  if (!record || !Array.isArray(record.roles)) return null
  const roles: NotificationRole[] = []
  for (const item of record.roles) {
    const role = readRole(item)
    if (!role) return null
    roles.push(role)
  }
  return roles
}

export function readPersonRoles(value: unknown): PersonRoles | null {
  const record = objectOf(value)
  if (!record || typeof record.userId !== 'string' || !Array.isArray(record.roles)) return null
  const roles: PersonRoles['roles'] = []
  for (const item of record.roles) {
    const entry = objectOf(item)
    if (!entry || typeof entry.id !== 'string' || typeof entry.name !== 'string') return null
    roles.push({ id: entry.id, name: entry.name })
  }
  return { userId: record.userId, roles }
}

function validUserId(userId: string): boolean {
  return userId.length >= 1 && userId.length <= 200
}

export function rolePath(roleId: string): string {
  return `${notificationRolesPath}/${encodeURIComponent(roleId)}`
}

export function roleMembersPath(roleId: string): string {
  return `${rolePath(roleId)}/members`
}

export function roleMemberPath(roleId: string, userId: string): string | null {
  return validUserId(userId) ? `${roleMembersPath(roleId)}/${encodeURIComponent(userId)}` : null
}

export function personRolesPath(userId: string): string | null {
  return validUserId(userId) ? `/api/company/members/${encodeURIComponent(userId)}/notification-roles` : null
}

export function roleBadge(role: Pick<NotificationRole, 'isDefault' | 'immutable'>): string | null {
  if (role.immutable) return 'Padrão, não editável'
  return role.isDefault ? 'Padrão' : null
}

export function membersFromAccessRole(role: Pick<NotificationRole, 'membersSource'>): boolean {
  return role.membersSource === 'ACCESS_ROLE'
}

const errorMessages: Record<string, string> = {
  role_name_in_use: 'Já existe um cargo com este nome nesta empresa.',
  role_not_found: 'Cargo não encontrado.',
  immutable_role: 'Este cargo é padrão e não pode ser alterado.',
  members_from_access_role: 'As pessoas deste cargo vêm do papel de acesso.',
  role_members_limit: 'O cargo já tem 200 membros.',
}

export function roleErrorMessage(code: string): string | null {
  return errorMessages[code] ?? null
}
