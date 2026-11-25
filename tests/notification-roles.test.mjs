import { register } from 'node:module'
import { test } from 'node:test'
import assert from 'node:assert/strict'

register(new URL('./resolve-ts.mjs', import.meta.url))

const manager = {
  id: 'r-3', name: 'Gestor', defaultKey: 'MANAGER', isDefault: true, immutable: false,
  severities: ['ERROR'], alertTypes: ['OCCURRENCE'], memberUserIds: ['user_bruno'], membersSource: 'EXPLICIT', version: 3,
}

test('readRole and readRoleList accept the Core role and refuse unknown values', async () => {
  const { readRole, readRoleList } = await import('../src/features/notification-roles/roleContract.ts')
  assert.deepEqual(readRole(manager), manager)
  assert.equal(readRole({ ...manager, defaultKey: null, isDefault: false }).defaultKey, null)
  assert.equal(readRole({ ...manager, severities: ['FATAL'] }), null)
  assert.equal(readRole({ ...manager, alertTypes: 'OCCURRENCE' }), null)
  assert.equal(readRole({ ...manager, membersSource: 'MAGIC' }), null)
  assert.equal(readRole({ ...manager, version: '3' }), null)
  assert.equal(readRoleList({ roles: [manager] }).length, 1)
  assert.equal(readRoleList({ roles: [manager, { id: 1 }] }), null)
  assert.equal(readRoleList([manager]), null)
})

test('people roles and paths follow the contract', async () => {
  const { readPersonRoles, personRolesPath, rolePath, roleMemberPath } = await import('../src/features/notification-roles/roleContract.ts')
  assert.deepEqual(readPersonRoles({ userId: 'user_bruno', roles: [{ id: 'r-3', name: 'Gestor' }] }),
    { userId: 'user_bruno', roles: [{ id: 'r-3', name: 'Gestor' }] })
  assert.equal(readPersonRoles({ userId: 'user_bruno', roles: [{ id: 'r-3' }] }), null)
  assert.equal(personRolesPath('user_bruno'), '/api/company/members/user_bruno/notification-roles')
  assert.equal(personRolesPath(''), null)
  assert.equal(rolePath('r 3'), '/api/company/notification-roles/r%203')
  assert.equal(roleMemberPath('r-3', 'user/x'), '/api/company/notification-roles/r-3/members/user%2Fx')
  assert.equal(roleMemberPath('r-3', 'u'.repeat(201)), null)
})

test('owner and administrator roles take members from the access role and get the fixed badge', async () => {
  const { roleBadge, membersFromAccessRole } = await import('../src/features/notification-roles/roleContract.ts')
  assert.equal(roleBadge({ isDefault: true, immutable: true }), 'Padrão, não editável')
  assert.equal(roleBadge({ isDefault: true, immutable: false }), 'Padrão')
  assert.equal(roleBadge({ isDefault: false, immutable: false }), null)
  assert.equal(membersFromAccessRole({ membersSource: 'ACCESS_ROLE' }), true)
  assert.equal(membersFromAccessRole({ membersSource: 'EXPLICIT' }), false)
})

test('name must have 1 to 60 characters and each list at least one value', async () => {
  const { nameError, severitiesError, alertTypesError } = await import('../src/features/notification-roles/roleValidation.ts')
  assert.equal(nameError('Plantão'), undefined)
  assert.equal(nameError('   '), 'Informe o nome do cargo, com até 60 caracteres.')
  assert.equal(nameError('a'.repeat(61)), 'Informe o nome do cargo, com até 60 caracteres.')
  assert.equal(nameError(` ${'a'.repeat(60)} `), undefined)
  assert.equal(severitiesError([]), 'Escolha pelo menos uma gravidade.')
  assert.equal(severitiesError(['ERROR']), undefined)
  assert.equal(alertTypesError([]), 'Escolha pelo menos um tipo.')
  assert.equal(alertTypesError(['SYSTEM_ALERT']), undefined)
})

test('Core role refusals become the screen messages', async () => {
  const { roleErrorMessage } = await import('../src/features/notification-roles/roleContract.ts')
  assert.equal(roleErrorMessage('role_name_in_use'), 'Já existe um cargo com este nome nesta empresa.')
  assert.equal(roleErrorMessage('role_not_found'), 'Cargo não encontrado.')
  assert.equal(roleErrorMessage('immutable_role'), 'Este cargo é padrão e não pode ser alterado.')
  assert.equal(roleErrorMessage('members_from_access_role'), 'As pessoas deste cargo vêm do papel de acesso.')
  assert.equal(roleErrorMessage('role_members_limit'), 'O cargo já tem 200 membros.')
  assert.equal(roleErrorMessage('other'), null)
})

test('apiRequest accepts a 204 without body (role and member deletion)', async () => {
  const { apiRequest } = await import('../src/shared/services/api.ts')
  const original = globalThis.fetch
  globalThis.fetch = async () => new Response(null, { status: 204 })
  try {
    assert.equal(await apiRequest('http://core', '/api/company/notification-roles/r-3', 'token', { method: 'DELETE' }), undefined)
  } finally { globalThis.fetch = original }
})
