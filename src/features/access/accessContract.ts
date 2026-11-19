// Contract of the Core access routes (lhamalog-core specs/011-cargos-permissoes, contracts/api.md section 1).
// Pure functions: no React and no Clerk, so tests/*.test.mjs can run them.

export const accessMePath = '/api/company/access/me'
export const accessCatalogPath = '/api/company/access'

export const accessRoles = ['OWNER', 'ADMIN', 'MEMBER'] as const

export type AccessRole = (typeof accessRoles)[number]

export type AccessMe = {
  userId: string
  role: AccessRole
  permissions: string[]
}

export type MatrixRow = {
  permission: string
  roles: AccessRole[]
  note: string | null
}

export type AccessCatalog = {
  ownerUserId: string | null
  roles: { key: AccessRole, label: string }[]
  matrix: MatrixRow[]
}

// ready: Core answered. legacy: Core without LLT-120 (access/me 404), Clerk role used. error: no management allowed.
export type AccessStatus = 'loading' | 'ready' | 'legacy' | 'error'

type Json = Record<string, unknown>

function objectOf(value: unknown): Json | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Json : null
}

function roleOf(value: unknown): AccessRole | null {
  return typeof value === 'string' && (accessRoles as readonly string[]).includes(value) ? value as AccessRole : null
}

function textList(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null
  return value.every((item) => typeof item === 'string') ? value as string[] : null
}

function roleList(value: unknown): AccessRole[] | null {
  if (!Array.isArray(value)) return null
  const roles: AccessRole[] = []
  for (const item of value) {
    const role = roleOf(item)
    if (!role) return null
    roles.push(role)
  }
  return roles
}

export function readMe(value: unknown): AccessMe | null {
  const record = objectOf(value)
  if (!record || typeof record.userId !== 'string' || !record.userId) return null
  const role = roleOf(record.role)
  const permissions = textList(record.permissions)
  if (!role || !permissions) return null
  return { userId: record.userId, role, permissions }
}

export function readCatalog(value: unknown): AccessCatalog | null {
  const record = objectOf(value)
  if (!record) return null
  const owner = record.ownerUserId
  if (owner !== null && owner !== undefined && typeof owner !== 'string') return null
  if (!Array.isArray(record.roles) || !Array.isArray(record.matrix)) return null
  const roles: AccessCatalog['roles'] = []
  for (const item of record.roles) {
    const entry = objectOf(item)
    const key = roleOf(entry?.key)
    if (!entry || !key || typeof entry.label !== 'string') return null
    roles.push({ key, label: entry.label })
  }
  const matrix: MatrixRow[] = []
  for (const item of record.matrix) {
    const entry = objectOf(item)
    const rowRoles = roleList(entry?.roles)
    if (!entry || typeof entry.permission !== 'string' || !rowRoles) return null
    if (entry.note !== undefined && entry.note !== null && typeof entry.note !== 'string') return null
    matrix.push({ permission: entry.permission, roles: rowRoles, note: typeof entry.note === 'string' ? entry.note : null })
  }
  return { ownerUserId: typeof owner === 'string' ? owner : null, roles, matrix }
}

export function can(permissions: readonly string[], permission: string): boolean {
  return permissions.includes(permission)
}

// Same rows as the Core matrix (data-model.md), used only while the Core does not have LLT-120.
const memberPermissions = ['COMPANY_VIEW', 'PRODUCTS_CREATE', 'PRODUCTS_EDIT']
const adminPermissions = [
  'COMPANY_EDIT', 'COMPANY_VIEW', 'INGESTION_TOKENS_MANAGE', 'MEMBERS_DEACTIVATE', 'MEMBERS_INVITE_MEMBER',
  'MEMBERS_PROMOTE_ADMIN', 'MEMBERS_VIEW', 'NOTIFICATION_ROLES_MANAGE', 'PRODUCT_ACCESS_MANAGE', 'PRODUCTS_ARCHIVE',
  'PRODUCTS_CREATE', 'PRODUCTS_EDIT', 'PRODUCTS_VIEW_ALL',
]

export function accessFallback(orgRole: string | null | undefined): { role: AccessRole, permissions: string[] } {
  const admin = (orgRole ?? '').replace(/^org:/, '') === 'admin'
  return admin ? { role: 'ADMIN', permissions: [...adminPermissions] } : { role: 'MEMBER', permissions: [...memberPermissions] }
}

// The Team item shows only when access is known and allows it; while loading or after an error, no management.
export function teamMenuHidden(access: { status: AccessStatus, permissions: readonly string[] }): string[] {
  const known = access.status === 'ready' || access.status === 'legacy'
  return known && can(access.permissions, 'MEMBERS_VIEW') ? [] : ['team']
}
