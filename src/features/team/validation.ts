import { inviteRoles, type InviteRole } from './types'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase()
}

export function emailFieldError(value: string): string | undefined {
  const email = value.trim()
  if (!email || !emailPattern.test(email)) return 'Informe um e-mail válido.'
}

export function isInviteRole(role: string): role is InviteRole {
  return (inviteRoles as readonly string[]).includes(role)
}

export function roleFieldError(role: string): string | undefined {
  if (!isInviteRole(role)) return 'Escolha Administrador ou Membro.'
}
