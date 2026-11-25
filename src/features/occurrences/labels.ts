import type { OccurrenceStatus, OccurrenceType } from './types'

export type BadgeTone = 'info' | 'success' | 'warning' | 'danger' | 'neutral'
export type Severity = 'error' | 'warning' | 'info'

const types: Record<OccurrenceType, { label: string; severity: Severity }> = {
  ERROR: { label: 'Erro', severity: 'error' },
  WARNING: { label: 'Alerta', severity: 'warning' },
  INFO: { label: 'Informação', severity: 'info' },
}

const statuses: Record<OccurrenceStatus, { label: string; tone: BadgeTone }> = {
  ABERTA: { label: 'Aberta', tone: 'danger' },
  EM_ANALISE: { label: 'Em análise', tone: 'warning' },
  FECHADA: { label: 'Fechada', tone: 'success' },
}

const attributes: Record<string, string> = {
  'host.name': 'Host',
  'service.name': 'Serviço',
  trace_id: 'Trace ID',
  correlation_id: 'Correlation ID',
  module_id: 'Módulo',
  line_number: 'Linha',
}

export function typeLabel(type: OccurrenceType): string {
  return types[type]?.label ?? type
}

// Tone of the SeverityIndicator: the occurrence type, never a severity (that is not in the Core yet).
export function typeSeverity(type: OccurrenceType): Severity {
  return types[type]?.severity ?? 'info'
}

export function statusLabel(status: OccurrenceStatus): string {
  return statuses[status]?.label ?? status
}

export function statusTone(status: OccurrenceStatus): BadgeTone {
  return statuses[status]?.tone ?? 'neutral'
}

export const recurringLabel = 'Recorrente'

// Known technical attributes get a label; extracted fields keep their own name.
export function attributeLabel(name: string): string {
  return attributes[name] ?? name
}

// Who changed the status: "Sistema" for the system, otherwise the member name when known, else the id.
export function changedByLabel(changedBy: { type: string; id: string | null }, names?: ReadonlyMap<string, string>): string {
  if (changedBy.type === 'SYSTEM') return 'Sistema'
  if (changedBy.id && names?.get(changedBy.id)) return names.get(changedBy.id) as string
  return changedBy.id || 'Usuário'
}

export const archivedLabel = 'Arquivada'

export const situationLabels = { active: 'Ativas', archived: 'Arquivadas' } as const

// null means unknown: the line is not shown.
export function sensitiveDataLabel(value: boolean | null): string | null {
  if (value === true) return 'Dados sensíveis mascarados: Sim'
  if (value === false) return 'Dados sensíveis mascarados: Não'
  return null
}

export function countLabel(count: number): string {
  return count === 1 ? '1 ocorrência' : `${count.toLocaleString('pt-BR')} ocorrências`
}
