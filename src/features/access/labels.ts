// Portuguese labels for the codes the Core sends (spec 012, FR-W07). Unknown codes are shown as they come.

const roles: Record<string, string> = { OWNER: 'Dono', ADMIN: 'Administrador', MEMBER: 'Membro' }

const severities: Record<string, string> = { ERROR: 'Erro', WARNING: 'Alerta', INFO: 'Informação' }

const alertTypes: Record<string, string> = {
  OCCURRENCE: 'Ocorrência',
  CRITICAL_STATE: 'Estado crítico',
  SYSTEM_ALERT: 'Alerta do sistema',
}

const permissions: Record<string, string> = {
  COMPANY_VIEW: 'Ver a empresa',
  COMPANY_EDIT: 'Editar a empresa',
  MEMBERS_VIEW: 'Ver a equipe',
  MEMBERS_INVITE_MEMBER: 'Convidar Membro',
  MEMBERS_INVITE_ADMIN: 'Convidar Administrador',
  MEMBERS_PROMOTE_ADMIN: 'Promover a Administrador',
  MEMBERS_DEACTIVATE: 'Desativar e reativar pessoas',
  PRODUCT_ACCESS_MANAGE: 'Liberar produtos para Membros',
  PRODUCTS_VIEW_ALL: 'Ver todos os produtos',
  PRODUCTS_CREATE: 'Cadastrar produto',
  PRODUCTS_EDIT: 'Editar produto',
  PRODUCTS_ARCHIVE: 'Arquivar e desarquivar produto',
  INGESTION_TOKENS_MANAGE: 'Gerenciar tokens de ingestão',
  OCCURRENCES_MANAGE: 'Alterar status e arquivar ocorrências',
  NOTIFICATION_ROLES_MANAGE: 'Gerenciar cargos de notificação',
  SUBSCRIPTION_MANAGE: 'Gerenciar a assinatura',
  PENDING_ACCESS_APPROVE: 'Aprovar acessos pendentes',
}

export const severityCodes = ['ERROR', 'WARNING', 'INFO'] as const

export const alertTypeCodes = ['OCCURRENCE', 'CRITICAL_STATE', 'SYSTEM_ALERT'] as const

export function roleLabel(code: string): string {
  return roles[code] ?? code
}

export function severityLabel(code: string): string {
  return severities[code] ?? code
}

export function alertTypeLabel(code: string): string {
  return alertTypes[code] ?? code
}

export function permissionLabel(code: string): string {
  return permissions[code] ?? code
}

// The Core note names the role code; the screen says it in plain words (spec 012, US7).
export function matrixNote(note: string | null): string {
  if (!note) return ''
  return note.startsWith('MEMBER só nos produtos liberados') ? 'Só nos produtos liberados' : note
}
