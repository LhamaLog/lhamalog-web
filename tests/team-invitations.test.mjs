import { register } from 'node:module'
import { test } from 'node:test'
import assert from 'node:assert/strict'

register(new URL('./resolve-ts.mjs', import.meta.url))

test('email and role follow the company email rule and the two invite roles', async () => {
  const { emailFieldError, normalizeEmail, roleFieldError } = await import('../src/features/team/validation.ts')
  assert.equal(emailFieldError(''), 'Informe um e-mail válido.')
  assert.equal(emailFieldError('   '), 'Informe um e-mail válido.')
  assert.equal(emailFieldError('sem-arroba'), 'Informe um e-mail válido.')
  assert.equal(emailFieldError('ana@empresa.com'), undefined)
  assert.equal(normalizeEmail('  Ana@Empresa.com '), 'ana@empresa.com')
  assert.equal(normalizeEmail('ana@empresa.com'), normalizeEmail('Ana@Empresa.com'))
  assert.equal(roleFieldError('org:gestor'), 'Escolha Administrador ou Membro.')
  assert.equal(roleFieldError('org:admin'), undefined)
  assert.equal(roleFieldError('org:member'), undefined)
})

test('administrator is org:admin or admin, and expiry is seven days unless the invitation already has one', async () => {
  const { invitationExpiry, invitationOutcomeCopy, isOrganizationAdmin } = await import('../src/features/team/invitations.ts')
  assert.equal(isOrganizationAdmin('org:admin'), true)
  assert.equal(isOrganizationAdmin('admin'), true)
  assert.equal(isOrganizationAdmin('org:member'), false)
  assert.equal(isOrganizationAdmin(''), false)
  assert.equal(isOrganizationAdmin(undefined), false)
  assert.equal(isOrganizationAdmin('org:gestor'), false)
  const created = new Date('2026-11-01T12:00:00.000Z')
  assert.equal(invitationExpiry({ id: 'a', emailAddress: 'ana@empresa.com', createdAt: created }).toISOString(), '2026-11-08T12:00:00.000Z')
  const explicit = new Date('2026-11-03T00:00:00.000Z')
  assert.equal(invitationExpiry({ id: 'b', emailAddress: 'ana@empresa.com', createdAt: created, expiresAt: explicit }).toISOString(), explicit.toISOString())
  assert.equal(invitationOutcomeCopy('expired'), 'Este convite expirou e não pode ser usado.')
  assert.equal(invitationOutcomeCopy('revoked'), 'Este convite foi revogado e não pode ser usado.')
  assert.notEqual(invitationOutcomeCopy('expired'), invitationOutcomeCopy('revoked'))
})

test('ticket errors use the Clerk unstable__errors keys and the Portuguese messages', async () => {
  const { ptBR } = await import('@clerk/localizations')
  const { invitationTicketErrors } = await import('../src/features/team/invitations.ts')
  assert.equal('ticket_expired_code' in ptBR.unstable__errors, true)
  assert.equal('ticket_invalid_code' in ptBR.unstable__errors, true)
  assert.equal(invitationTicketErrors.ticket_expired_code, 'Este convite expirou e não pode ser usado.')
  assert.equal(invitationTicketErrors.ticket_invalid_code, 'Este convite foi revogado e não pode ser usado.')
})

test('Equipe stays in the menu for an admin and the direct page is allowed', async () => {
  const { teamAccessDeniedMessage, teamMenuHiddenItems, teamNavItemId, teamPageDenied } = await import('../src/features/team/invitations.ts')
  const { filterNavItems } = await import('../src/app/layouts/navVisibility.ts')
  const items = [{ id: 'dashboard' }, { id: teamNavItemId }, { id: 'company' }]
  const adminItems = filterNavItems(items, undefined, teamMenuHiddenItems('org:admin')).map((item) => item.id)
  const memberItems = filterNavItems(items, undefined, teamMenuHiddenItems('org:member')).map((item) => item.id)
  const plainAdminItems = filterNavItems(items, undefined, teamMenuHiddenItems('admin')).map((item) => item.id)
  assert.deepEqual(adminItems, ['dashboard', 'team', 'company'])
  assert.deepEqual(plainAdminItems, ['dashboard', 'team', 'company'])
  assert.deepEqual(memberItems, ['dashboard', 'company'])
  assert.equal(teamPageDenied('org:admin'), false)
  assert.equal(teamPageDenied('admin'), false)
  assert.equal(teamPageDenied('org:member'), true)
  assert.equal(teamPageDenied(undefined), true)
  assert.equal(teamAccessDeniedMessage, 'Você não tem acesso. Selecione uma empresa válida.')
})

test('a usable pending invitation blocks a new send, and resend revokes every pending id before one invite', async () => {
  const { hasUsablePending, membershipBlocksInvite, resendPlan } = await import('../src/features/team/invitations.ts')
  const now = new Date('2026-11-12T12:00:00.000Z')
  const pending = [
    { id: 'new', emailAddress: 'Ana@Empresa.com', role: 'org:member', createdAt: new Date('2026-11-10T12:00:00.000Z') },
    { id: 'old', emailAddress: 'ana@empresa.com', role: 'org:member', createdAt: new Date('2026-11-01T12:00:00.000Z') },
    { id: 'other', emailAddress: 'outra@empresa.com', role: 'org:admin', createdAt: new Date('2026-11-11T12:00:00.000Z') },
  ]
  assert.equal(hasUsablePending(pending, 'ana@empresa.com', now), true)
  assert.equal(hasUsablePending([pending[1]], 'ana@empresa.com', now), false)
  assert.equal(hasUsablePending(pending, 'livre@empresa.com', now), false)
  const plan = resendPlan({ pending, email: 'ana@empresa.com', role: 'org:member', revokeFailed: false })
  assert.deepEqual(plan.revokeIds, ['new', 'old'])
  assert.deepEqual(plan.invite, { emailAddress: 'ana@empresa.com', role: 'org:member' })
  const failed = resendPlan({ pending, email: 'ana@empresa.com', role: 'org:member', revokeFailed: true })
  assert.deepEqual(failed.revokeIds, ['new', 'old'])
  assert.equal(failed.invite, null)
  assert.equal(membershipBlocksInvite(['Ana@Empresa.com'], 'ana@empresa.com'), true)
  assert.equal(membershipBlocksInvite(['outra@empresa.com'], 'ana@empresa.com'), false)
})
