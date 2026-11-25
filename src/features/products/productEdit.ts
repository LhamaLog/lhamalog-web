// Editing and archiving a product (spec 009, US3 and US4; Core specs/002-editar-arquivar-produto). Pure functions.
import { memberDisplayName } from '../team/members'
import { cleanContext } from './context'
import { uniqueSorted } from './productListModel'
import type { Product, ProductContext, ProductUiDraft } from './types'

export type GeneralFields = {
  name: string
  description: string
  category: string
  productVersion: string
}

export const partialSaveMessage = 'Os dados gerais foram salvos, mas o contexto não. Confira e salve de novo.'

export const archivedNotice = 'Este produto está arquivado. Desarquive para editar.'

export function generalOf(product?: Product): GeneralFields {
  return {
    name: product?.name ?? '',
    description: product?.description ?? '',
    category: product?.category ?? '',
    productVersion: product?.productVersion ?? '',
  }
}

function trimmed(general: GeneralFields): GeneralFields {
  return {
    name: general.name.trim(),
    description: general.description.trim(),
    category: general.category.trim(),
    productVersion: general.productVersion.trim(),
  }
}

function sameGeneral(left: GeneralFields, right: GeneralFields): boolean {
  const a = trimmed(left)
  const b = trimmed(right)
  return a.name === b.name && a.description === b.description && a.category === b.category && a.productVersion === b.productVersion
}

// The edition sends only what changed (FR-W04): PUT /api/products/{id} and/or PUT .../context.
export function changedParts(product: Product, general: GeneralFields, context: ProductContext): { general: boolean; context: boolean } {
  return {
    general: !sameGeneral(generalOf(product), general),
    context: JSON.stringify(cleanContext(product.context)) !== JSON.stringify(cleanContext(context)),
  }
}

export function generalPayload(general: GeneralFields, version: number) {
  return { ...trimmed(general), version }
}

export function isArchived(product?: Product): boolean {
  return typeof product?.archivedAt === 'string' && product.archivedAt !== ''
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Required fields of the Figma (02-produto-informacoes.png) and the size limits of the Core.
export function generalFieldErrors(general: GeneralFields, draft: ProductUiDraft): Record<string, string> {
  const errors: Record<string, string> = {}
  const value = trimmed(general)
  if (!value.name) errors.name = 'Informe o nome do produto.'
  else if (value.name.length > 200) errors.name = 'O nome pode ter até 200 caracteres.'
  if (value.description.length > 10000) errors.description = 'A descrição pode ter até 10000 caracteres.'
  if (!draft.productType.trim()) errors.productType = 'Selecione o tipo de produto.'
  if (!draft.environment.trim()) errors.environment = 'Selecione o ambiente.'
  if (!value.category) errors.category = 'Selecione a área.'
  else if (value.category.length > 200) errors.category = 'A área pode ter até 200 caracteres.'
  if (!draft.owner.trim()) errors.owner = 'Selecione o responsável pelo produto.'
  if (draft.teamEmail.trim() && !emailPattern.test(draft.teamEmail.trim())) errors.teamEmail = 'Informe um e-mail válido.'
  if (value.productVersion.length > 200) errors.productVersion = 'A versão pode ter até 200 caracteres.'
  return errors
}

// Same rule as the Core (CompanySession.administrator). With LLT-120 in the Web, this becomes can('PRODUCTS_ARCHIVE') (W2).
export function canArchive(orgRole: string | null | undefined): boolean {
  return (orgRole ?? '').replace(/^org:/, '') === 'admin'
}

export function productPath(id: string): string {
  return `/api/products/${encodeURIComponent(id)}`
}

export function productContextPath(id: string): string {
  return `${productPath(id)}/context`
}

export function archivePath(id: string): string {
  return `${productPath(id)}/archive`
}

export function unarchivePath(id: string): string {
  return `${productPath(id)}/unarchive`
}

export function archiveQuestion(name: string): string {
  return `Arquivar ${name}? O produto sai da lista de ativos e não pode ser editado até ser desarquivado. Os dados e o histórico continuam guardados.`
}

export function archivedMessage(name: string): string {
  return `Produto ${name} arquivado.`
}

export function unarchivedMessage(name: string): string {
  return `Produto ${name} desarquivado.`
}

// Options of "Tipo de produto": the types of the Figma cards (clarify N1). The form adds "Outro" for free text, and an
// old draft with a value outside this list shows as "Outro" with the saved text.
export const productTypes = ['Aplicação web', 'API / Serviço', 'Aplicativo', 'Microsserviço', 'Job / Batch']

export const environmentOptions = ['Produção', 'Homologação', 'Desenvolvimento']

// Names of the organization people for "Responsável pelo produto" (clarify N3), from organization.getMemberships,
// the same call the Equipe page uses. The local draft keeps the name shown (F1).
export function ownerOptions(people: { firstName?: string | null; lastName?: string | null; identifier?: string | null }[]): string[] {
  return uniqueSorted(people.map((person) => memberDisplayName(person)))
}

export const tagLimits = { items: 10, length: 30 }

// Tags of the local draft (F1): trimmed, without repetition (case-insensitive), with the limits above.
export function addTag(tags: string[], value: string): { tags: string[]; error?: string } {
  const tag = value.trim()
  if (!tag) return { tags }
  if (tags.some((item) => item.toLocaleLowerCase('pt-BR') === tag.toLocaleLowerCase('pt-BR'))) return { tags }
  if (tag.length > tagLimits.length) return { tags, error: `A tag pode ter até ${tagLimits.length} caracteres.` }
  if (tags.length >= tagLimits.items) return { tags, error: `Limite de ${tagLimits.items} tags.` }
  return { tags: [...tags, tag] }
}

const localRequired = ['productType', 'environment', 'owner']

// Creating requires every field of the Figma. Editing does not block on the local required fields, because a product
// saved in another browser has no local draft here (F1); the Core fields and the e-mail format are still checked.
export function formFieldErrors(general: GeneralFields, draft: ProductUiDraft, editing: boolean): Record<string, string> {
  const errors = generalFieldErrors(general, draft)
  if (!editing) return errors
  return Object.fromEntries(Object.entries(errors).filter(([key]) => !localRequired.includes(key)))
}

export type SaveRequest = <T>(path: string, options?: RequestInit) => Promise<T>

export type SaveResult =
  | { kind: 'unchanged' }
  | { kind: 'saved'; product: Product }
  // The general data was saved and the context was refused: the form keeps the new version (W1).
  | { kind: 'partial'; product: Product; error: unknown }

// Edition of an existing product (US3, FR-W04): only the parts that changed go to the Core, the general data first,
// and the context with the version the general save returned. Nothing changed: no call.
export async function saveEdits(request: SaveRequest, product: Product, general: GeneralFields, context: ProductContext, signal?: AbortSignal): Promise<SaveResult> {
  const parts = changedParts(product, general, context)
  if (!parts.general && !parts.context) return { kind: 'unchanged' }
  let current = product
  if (parts.general) {
    current = await request<Product>(productPath(product.id), { method: 'PUT', signal, body: JSON.stringify(generalPayload(general, current.version)) })
  }
  if (parts.context) {
    try {
      current = await request<Product>(productContextPath(product.id), { method: 'PUT', signal, body: JSON.stringify({ context: cleanContext(context), version: current.version }) })
    } catch (error) {
      if (parts.general) return { kind: 'partial', product: current, error }
      throw error
    }
  }
  return { kind: 'saved', product: current }
}

export function unarchiveQuestion(name: string): string {
  return `Desarquivar ${name}? O produto volta para a lista de ativos e pode ser editado de novo.`
}

// POST .../archive or .../unarchive with the version (US4). Archiving what is already archived answers 200 without a
// change, and that is a success too (edge case of the spec).
export function setArchived(request: SaveRequest, product: Product, archived: boolean, signal?: AbortSignal): Promise<Product> {
  return request<Product>(archived ? archivePath(product.id) : unarchivePath(product.id), {
    method: 'POST',
    signal,
    body: JSON.stringify({ version: product.version }),
  })
}
