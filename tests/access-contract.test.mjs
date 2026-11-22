import { register } from 'node:module'
import { test } from 'node:test'
import assert from 'node:assert/strict'

register(new URL('./resolve-ts.mjs', import.meta.url))

test('readMe accepts only a known role and a list of permission names', async () => {
  const { readMe } = await import('../src/features/access/accessContract.ts')
  assert.deepEqual(readMe({ userId: 'user_ana', role: 'OWNER', permissions: ['COMPANY_VIEW', 'SUBSCRIPTION_MANAGE'] }),
    { userId: 'user_ana', role: 'OWNER', permissions: ['COMPANY_VIEW', 'SUBSCRIPTION_MANAGE'] })
  assert.equal(readMe({ userId: 'user_ana', role: 'SUPERADMIN', permissions: [] }), null)
  assert.equal(readMe({ userId: 'user_ana', role: 'ADMIN', permissions: 'COMPANY_VIEW' }), null)
  assert.equal(readMe({ userId: 'user_ana', role: 'ADMIN', permissions: ['COMPANY_VIEW', 3] }), null)
  assert.equal(readMe({ role: 'ADMIN', permissions: [] }), null)
  assert.equal(readMe(null), null)
  assert.equal(readMe([]), null)
})

test('readCatalog accepts a null or text owner and a valid matrix', async () => {
  const { readCatalog } = await import('../src/features/access/accessContract.ts')
  const body = {
    ownerUserId: null,
    roles: [{ key: 'OWNER', label: 'Dono' }, { key: 'ADMIN', label: 'Administrador' }, { key: 'MEMBER', label: 'Membro' }],
    matrix: [
      { permission: 'COMPANY_EDIT', roles: ['OWNER', 'ADMIN'] },
      { permission: 'PRODUCTS_EDIT', roles: ['OWNER', 'ADMIN', 'MEMBER'], note: 'MEMBER só nos produtos liberados' },
    ],
  }
  const catalog = readCatalog(body)
  assert.equal(catalog.ownerUserId, null)
  assert.equal(catalog.roles.length, 3)
  assert.deepEqual(catalog.matrix[0], { permission: 'COMPANY_EDIT', roles: ['OWNER', 'ADMIN'], note: null })
  assert.equal(catalog.matrix[1].note, 'MEMBER só nos produtos liberados')
  assert.equal(readCatalog({ ...body, ownerUserId: 'user_ana' }).ownerUserId, 'user_ana')
  assert.equal(readCatalog({ ...body, ownerUserId: 42 }), null)
  assert.equal(readCatalog({ ...body, matrix: [{ permission: 'X', roles: ['GOD'] }] }), null)
  assert.equal(readCatalog({ ...body, roles: 'all' }), null)
})

test('can checks the permission list', async () => {
  const { can } = await import('../src/features/access/accessContract.ts')
  assert.equal(can(['MEMBERS_VIEW'], 'MEMBERS_VIEW'), true)
  assert.equal(can(['COMPANY_VIEW'], 'MEMBERS_VIEW'), false)
  assert.equal(can([], 'MEMBERS_VIEW'), false)
})

test('a Core without LLT-120 falls back to the Clerk role with the same permissions as the matrix', async () => {
  const { accessFallback } = await import('../src/features/access/accessContract.ts')
  const admin = accessFallback('org:admin')
  assert.equal(admin.role, 'ADMIN')
  assert.ok(admin.permissions.includes('MEMBERS_VIEW'))
  assert.ok(admin.permissions.includes('MEMBERS_INVITE_MEMBER'))
  assert.ok(!admin.permissions.includes('SUBSCRIPTION_MANAGE'))
  assert.equal(accessFallback('admin').role, 'ADMIN')
  const member = accessFallback('org:member')
  assert.equal(member.role, 'MEMBER')
  assert.deepEqual(member.permissions, ['COMPANY_VIEW', 'PRODUCTS_CREATE', 'PRODUCTS_EDIT'])
  assert.equal(accessFallback(null).role, 'MEMBER')
})

test('a failed access/me becomes legacy on 404, unsubscribed on subscription_required and error otherwise', async () => {
  const { accessFailureStatus, teamMenuHidden } = await import('../src/features/access/accessContract.ts')
  assert.equal(accessFailureStatus({ status: 404, code: '' }), 'legacy')
  // Company without a plan (LLT-289): the plans screen takes over; no access error on top of it.
  assert.equal(accessFailureStatus({ status: 403, code: 'subscription_required' }), 'unsubscribed')
  assert.equal(accessFailureStatus({ status: 403, code: 'not_admin' }), 'error')
  assert.equal(accessFailureStatus({ status: 500, code: '' }), 'error')
  assert.equal(accessFailureStatus(new Error('rede')), 'error')
  assert.equal(accessFailureStatus(null), 'error')
  assert.deepEqual(teamMenuHidden({ status: 'unsubscribed', permissions: [] }), ['team'])
})

test('the Team page opens by the MEMBERS_VIEW permission of the Core, not by the Clerk role', async () => {
  const { teamPageGate } = await import('../src/features/access/accessContract.ts')
  assert.equal(teamPageGate({ status: 'loading', permissions: [] }), 'loading')
  assert.equal(teamPageGate({ status: 'ready', permissions: ['MEMBERS_VIEW'] }), 'open')
  assert.equal(teamPageGate({ status: 'legacy', permissions: ['MEMBERS_VIEW'] }), 'open')
  assert.equal(teamPageGate({ status: 'ready', permissions: ['COMPANY_VIEW', 'PRODUCTS_CREATE'] }), 'denied')
  // After an error or without a plan, the workspace already shows why; the page offers no management.
  assert.equal(teamPageGate({ status: 'error', permissions: [] }), 'hidden')
  assert.equal(teamPageGate({ status: 'unsubscribed', permissions: [] }), 'hidden')
})

test('the team menu shows only when access is known and allows it', async () => {
  const { teamMenuHidden } = await import('../src/features/access/accessContract.ts')
  assert.deepEqual(teamMenuHidden({ status: 'ready', permissions: ['MEMBERS_VIEW'] }), [])
  assert.deepEqual(teamMenuHidden({ status: 'legacy', permissions: ['MEMBERS_VIEW'] }), [])
  assert.deepEqual(teamMenuHidden({ status: 'ready', permissions: ['COMPANY_VIEW'] }), ['team'])
  assert.deepEqual(teamMenuHidden({ status: 'loading', permissions: [] }), ['team'])
  assert.deepEqual(teamMenuHidden({ status: 'error', permissions: ['MEMBERS_VIEW'] }), ['team'])
})

test('matrix notes are shown in plain Portuguese', async () => {
  const { matrixNote } = await import('../src/features/access/labels.ts')
  assert.equal(matrixNote('MEMBER só nos produtos liberados'), 'Só nos produtos liberados')
  assert.equal(matrixNote('Aplicada no Web, pela Clerk.'), 'Aplicada no Web, pela Clerk.')
  assert.equal(matrixNote(null), '')
})

test('labels are in Portuguese for roles, permissions, severities and alert types', async () => {
  const { roleLabel, permissionLabel, severityLabel, alertTypeLabel } = await import('../src/features/access/labels.ts')
  assert.equal(roleLabel('OWNER'), 'Dono')
  assert.equal(roleLabel('ADMIN'), 'Administrador')
  assert.equal(roleLabel('MEMBER'), 'Membro')
  assert.equal(severityLabel('ERROR'), 'Erro')
  assert.equal(severityLabel('WARNING'), 'Alerta')
  assert.equal(severityLabel('INFO'), 'Informação')
  assert.equal(alertTypeLabel('OCCURRENCE'), 'Ocorrência')
  assert.equal(alertTypeLabel('CRITICAL_STATE'), 'Estado crítico')
  assert.equal(alertTypeLabel('SYSTEM_ALERT'), 'Alerta do sistema')
  assert.equal(permissionLabel('MEMBERS_VIEW'), 'Ver a equipe')
  assert.equal(permissionLabel('UNKNOWN_ONE'), 'UNKNOWN_ONE')
})
