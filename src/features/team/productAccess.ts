// Products a member can access (spec 012, US4; Core contracts/api.md section 2). Pure functions.
import { companyMembersPath } from './memberContract'

export type MemberProductAccess = {
  userId: string
  allProducts: boolean
  productIds: string[]
}

export type ProductOption = {
  id: string
  name: string
  archived: boolean
}

export const fullAccessMessage = 'Acessa todos os Produtos.'

export const productNotFoundMessage = 'Um produto não existe mais nesta empresa. Confira a lista.'

export const productsPath = '/api/products'

export const archivedProductsPath = '/api/products?archived=true'

type Json = Record<string, unknown>

function objectOf(value: unknown): Json | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Json : null
}

export function readProductAccess(value: unknown): MemberProductAccess | null {
  const record = objectOf(value)
  if (!record || typeof record.userId !== 'string' || !record.userId) return null
  if (typeof record.allProducts !== 'boolean' || !Array.isArray(record.productIds)) return null
  if (!record.productIds.every((id) => typeof id === 'string')) return null
  return { userId: record.userId, allProducts: record.allProducts, productIds: record.productIds as string[] }
}

export function productAccessPath(userId: string): string | null {
  if (userId.length < 1 || userId.length > 200) return null
  return `${companyMembersPath}/${encodeURIComponent(userId)}/products`
}

function readProducts(value: unknown): ProductOption[] | null {
  if (!Array.isArray(value)) return null
  const products: ProductOption[] = []
  for (const item of value) {
    const record = objectOf(item)
    if (!record || typeof record.id !== 'string' || typeof record.name !== 'string') return null
    products.push({ id: record.id, name: record.name, archived: typeof record.archivedAt === 'string' })
  }
  return products
}

// The panel lists active and archived products: releasing an archived one is allowed (Core FR-008).
export function productOptions(active: unknown, archived: unknown): ProductOption[] | null {
  const activeList = readProducts(active)
  const archivedList = readProducts(archived)
  if (!activeList || !archivedList) return null
  const byId = new Map<string, ProductOption>()
  for (const product of [...activeList, ...archivedList]) {
    if (!byId.has(product.id)) byId.set(product.id, product)
  }
  return [...byId.values()].sort((left, right) => left.name.localeCompare(right.name, 'pt-BR'))
}

export function toggleProduct(selected: string[], productId: string): string[] {
  return selected.includes(productId) ? selected.filter((id) => id !== productId) : [...selected, productId]
}

export function productAccessErrorMessage(code: string): string | null {
  if (code === 'full_access') return fullAccessMessage
  if (code === 'product_not_found') return productNotFoundMessage
  return null
}
