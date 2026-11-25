// Contract of lhamalog-core spec 012 (contracts/api.md), as read by the web (spec 008, data-model).

export const occurrenceTypes = ['ERROR', 'WARNING', 'INFO'] as const
export type OccurrenceType = (typeof occurrenceTypes)[number]

export const occurrenceStatuses = ['ABERTA', 'EM_ANALISE', 'FECHADA'] as const
export type OccurrenceStatus = (typeof occurrenceStatuses)[number]

export type ProductRef = { id: string; name: string | null }

export type OccurrenceListItem = {
  id: string
  type: OccurrenceType
  // Always filled: the Core falls back to the message of the signature.
  title: string
  product: ProductRef
  count: number
  status: OccurrenceStatus
  recurring: boolean
  firstSeenAt: string
  lastSeenAt: string
  // Spec 013 (LLT-136); absent in a Core without the spec 014.
  archived?: boolean
}

export type OccurrencePage = { items: OccurrenceListItem[]; page: number; size: number; totalItems: number }

export type OccurrenceAttribute = { name: string; value: string }

export type OccurrenceStatusChange = {
  from: OccurrenceStatus | null
  to: OccurrenceStatus
  changedAt: string | null
  changedBy: { type: 'USER' | 'SYSTEM' | string; id: string | null }
}

export type OccurrenceDetail = OccurrenceListItem & {
  summary: string | null
  sensitiveData: boolean | null
  // Up to 5, newest first, without dates.
  samples: string[]
  attributes: OccurrenceAttribute[]
  statusHistory: OccurrenceStatusChange[]
  // Spec 013 (LLT-136): null or absent in a Core without the spec 014, which hides the actions.
  revision?: string | null
  archivedAt?: string | null
  archivedBy?: { type: string; id: string | null } | null
}
