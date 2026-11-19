import type { AccessibleProduct, DashboardRole, DashboardVisibility } from './types'

export type AccessInput = {
  orgRole: string | null | undefined
  memberRole?: string | null | undefined
  allCompanyProducts: AccessibleProduct[]
  linkedProductIds: string[] | null | undefined
  companyDashboardAllowed?: boolean
}

function normalizeRoleToken(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase().replace(/^org:/, '')
}

export function resolveDashboardRole(orgRole: string | null | undefined, memberRole?: string | null | undefined): DashboardRole {
  const tokens = [normalizeRoleToken(orgRole), normalizeRoleToken(memberRole)]
  if (tokens.includes('dono') || tokens.includes('owner')) return 'DONO'
  if (tokens.includes('admin')) return 'ADMIN'
  return 'MEMBRO'
}

export function visibleProductsForRole(input: {
  role: DashboardRole
  allCompanyProducts: AccessibleProduct[]
  linkedProductIds: string[] | null | undefined
}): AccessibleProduct[] {
  if (input.role === 'DONO' || input.role === 'ADMIN') {
    return [...input.allCompanyProducts]
  }
  const allowed = new Set((input.linkedProductIds ?? []).map((id) => id.trim()).filter(Boolean))
  return input.allCompanyProducts.filter((product) => allowed.has(product.id))
}

export function resolveDashboardVisibility(input: AccessInput): DashboardVisibility {
  const role = resolveDashboardRole(input.orgRole, input.memberRole)
  const products = visibleProductsForRole({
    role,
    allCompanyProducts: input.allCompanyProducts,
    linkedProductIds: input.linkedProductIds,
  })
  const memberWithoutProducts = role === 'MEMBRO' && products.length === 0
  const companyAllowed = input.companyDashboardAllowed !== false && !memberWithoutProducts
  const forbidden = input.companyDashboardAllowed === false
  return {
    role,
    products,
    companyAllowed: companyAllowed && !forbidden,
    memberWithoutProducts,
    forbidden,
  }
}

export function canAccessProduct(visibility: DashboardVisibility, productId: string): boolean {
  if (visibility.forbidden) return false
  if (visibility.memberWithoutProducts) return false
  return visibility.products.some((product) => product.id === productId)
}

export function filterAuthorizedProductIds(
  visibility: DashboardVisibility,
  requestedIds: string[],
): { ok: boolean, productIds: string[] } {
  if (visibility.forbidden) return { ok: false, productIds: [] }
  if (visibility.memberWithoutProducts) {
    return requestedIds.length === 0 ? { ok: true, productIds: [] } : { ok: false, productIds: [] }
  }
  if (requestedIds.length === 0) return { ok: true, productIds: [] }
  const allowed = new Set(visibility.products.map((product) => product.id))
  if (requestedIds.some((id) => !allowed.has(id))) return { ok: false, productIds: [] }
  return { ok: true, productIds: [...requestedIds] }
}
