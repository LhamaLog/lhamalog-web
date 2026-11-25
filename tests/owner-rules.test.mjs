import { register } from 'node:module'
import { test } from 'node:test'
import assert from 'node:assert/strict'

register(new URL('./resolve-ts.mjs', import.meta.url))

test('the owner row is recognized and protected from demotion and deactivation', async () => {
  const { isOwnerRow, canDemote, canDeactivate, demoteGuard, ownerDemoteMessage, rowRoleLabel } = await import('../src/features/team/ownerRules.ts')
  assert.equal(isOwnerRow('user_ana', 'user_ana'), true)
  assert.equal(isOwnerRow('user_bruno', 'user_ana'), false)
  assert.equal(isOwnerRow(null, 'user_ana'), false)
  assert.equal(isOwnerRow('user_ana', null), false)
  assert.equal(canDemote('user_ana', 'user_ana'), false)
  assert.equal(canDeactivate('user_ana', 'user_ana'), false)
  assert.equal(canDemote('user_bruno', 'user_ana'), true)
  assert.equal(canDeactivate('user_bruno', null), true)
  assert.equal(demoteGuard('user_ana', 'user_ana', 'member'), ownerDemoteMessage)
  assert.equal(ownerDemoteMessage, 'Não é possível rebaixar o Dono da empresa.')
  assert.equal(demoteGuard('user_ana', 'user_ana', 'admin'), null)
  assert.equal(demoteGuard('user_bruno', 'user_ana', 'member'), null)
  assert.equal(rowRoleLabel('org:admin', true), 'Dono')
  assert.equal(rowRoleLabel('org:admin', false), 'Administrador')
  assert.equal(rowRoleLabel('org:member', false), 'Membro')
})

test('only the owner invites administrators once the company has an owner', async () => {
  const { inviteRolesFor } = await import('../src/features/team/ownerRules.ts')
  assert.deepEqual(inviteRolesFor('OWNER', true), ['org:member', 'org:admin'])
  assert.deepEqual(inviteRolesFor('ADMIN', true), ['org:member'])
  assert.deepEqual(inviteRolesFor('MEMBER', true), [])
  assert.deepEqual(inviteRolesFor(null, true), ['org:member'])
})

test('without an owner yet, administrators keep inviting administrators as today (W4)', async () => {
  const { inviteRolesFor } = await import('../src/features/team/ownerRules.ts')
  assert.deepEqual(inviteRolesFor('ADMIN', false), ['org:member', 'org:admin'])
})

test('an administrator cannot resend an administrator invitation once there is an owner', async () => {
  const { resendBlocked } = await import('../src/features/team/ownerRules.ts')
  assert.equal(resendBlocked('ADMIN', true, 'org:admin'), 'Só o Dono reenvia convite de Administrador.')
  assert.equal(resendBlocked('ADMIN', true, 'admin'), 'Só o Dono reenvia convite de Administrador.')
  assert.equal(resendBlocked('ADMIN', true, 'org:member'), null)
  assert.equal(resendBlocked('OWNER', true, 'org:admin'), null)
  assert.equal(resendBlocked('ADMIN', false, 'org:admin'), null)
})

test('the invite help explains how an administrator gets more people as administrators', async () => {
  const { adminInviteHelp, inviteHelpFor } = await import('../src/features/team/ownerRules.ts')
  assert.equal(adminInviteHelp, 'Depois do aceite, você pode promover a pessoa a Administrador.')
  assert.equal(inviteHelpFor(['org:member']), adminInviteHelp)
  assert.equal(inviteHelpFor(['org:member', 'org:admin']), '')
})
