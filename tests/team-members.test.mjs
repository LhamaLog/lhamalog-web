import { register } from 'node:module'
import { test } from 'node:test'
import assert from 'node:assert/strict'

register(new URL('./resolve-ts.mjs', import.meta.url))

const listed = {
  members: [
    { userId: 'user_ana', status: 'active', lastAccessAt: '2026-11-15T22:10:00Z' },
    { userId: 'user_bruno', status: 'deactivated', lastAccessAt: null },
  ],
}

test('name falls back to the identifier and email keeps the identifier', async () => {
  const { memberDisplayName, memberEmail } = await import('../src/features/team/members.ts')
  assert.equal(memberDisplayName({ firstName: 'Ana', lastName: 'Souza', identifier: 'ana@empresa.com' }), 'Ana Souza')
  assert.equal(memberDisplayName({ firstName: '   ', lastName: null, identifier: 'ana@empresa.com' }), 'ana@empresa.com')
  assert.equal(memberDisplayName({ firstName: null, lastName: '   ', identifier: '' }), '')
  assert.equal(memberEmail('ana@empresa.com'), 'ana@empresa.com')
  assert.equal(memberEmail('+5511999999999'), '+5511999999999')
  assert.equal(memberEmail(''), '')
  assert.equal(memberEmail(null), '')
})

test('merge keeps a deactivated user and defaults a missing core record to active', async () => {
  const { mergeMember } = await import('../src/features/team/members.ts')
  const deactivated = mergeMember(
    { userId: 'user_bruno', firstName: 'Bruno', lastName: 'Lima', identifier: 'bruno@empresa.com', role: 'org:member' },
    { userId: 'user_bruno', status: 'deactivated', lastAccessAt: null },
  )
  assert.equal(deactivated.userId, 'user_bruno')
  assert.equal(deactivated.status, 'deactivated')
  assert.equal(deactivated.lastAccessAt, null)
  const missing = mergeMember(
    { userId: 'user_ana', firstName: 'Ana', lastName: 'Souza', identifier: 'ana@empresa.com', role: 'org:admin' },
    null,
  )
  assert.equal(missing.status, 'active')
  assert.equal(missing.lastAccessAt, null)
  const withoutId = mergeMember(
    { userId: '  ', firstName: 'Sem', lastName: 'Id', identifier: 'sem@empresa.com', role: 'org:member' },
    { userId: 'user_outro', status: 'deactivated', lastAccessAt: null },
  )
  assert.equal(withoutId.userId, null)
  assert.equal(withoutId.status, 'active')
  assert.equal(withoutId.lastAccessAt, null)
  assert.equal(withoutId.name, 'Sem Id')
})

test('active admin count ignores deactivated admins, members and admins without userId', async () => {
  const { activeAdminCount, lastAdminBlocked, lastAdminMessage } = await import('../src/features/team/members.ts')
  const memberships = [
    { role: 'org:admin', userId: 'user_ana' },
    { role: 'admin', userId: 'user_bia' },
    { role: 'org:admin', userId: 'user_caio' },
    { role: 'org:member', userId: 'user_dani' },
    { role: 'org:admin', userId: null },
    { role: 'admin', userId: '   ' },
  ]
  const core = [
    { userId: 'user_ana', status: 'deactivated', lastAccessAt: null },
    { userId: 'user_bia', status: 'active', lastAccessAt: null },
  ]
  assert.equal(activeAdminCount(memberships, core), 2)
  assert.equal(lastAdminBlocked({ adminCount: 1, targetIsActiveAdmin: true, action: 'demote' }), true)
  assert.equal(lastAdminBlocked({ adminCount: 1, targetIsActiveAdmin: true, action: 'deactivate' }), true)
  assert.equal(lastAdminBlocked({ adminCount: 1, targetIsActiveAdmin: false, action: 'deactivate' }), false)
  assert.equal(lastAdminBlocked({ adminCount: 2, targetIsActiveAdmin: true, action: 'demote' }), false)
  assert.equal(lastAdminBlocked({ adminCount: 2, targetIsActiveAdmin: true, action: 'deactivate' }), false)
  assert.equal(lastAdminMessage('demote'), 'Não é possível rebaixar o último administrador.')
  assert.equal(lastAdminMessage('deactivate'), 'Não é possível desativar o último administrador.')
})

test('TeamPage refuses demoting and deactivating the last administrator and ignores an admin without userId', async () => {
  const { activeAdminCount, localLastAdminGuard } = await import('../src/features/team/members.ts')
  const memberships = [
    { role: 'org:admin', userId: 'user_ana' },
    { role: 'org:admin', userId: null },
    { role: 'admin', userId: '   ' },
    { role: 'org:member', userId: 'user_membro' },
  ]
  const count = activeAdminCount(memberships, [])
  assert.equal(count, 1)
  const demote = localLastAdminGuard({ action: 'demote', targetIsActiveAdmin: true, adminCount: count, sameOrganization: true })
  const deactivate = localLastAdminGuard({ action: 'deactivate', targetIsActiveAdmin: true, adminCount: count, sameOrganization: true })
  assert.deepEqual(demote, { call: false, error: 'Não é possível rebaixar o último administrador.' })
  assert.deepEqual(deactivate, { call: false, error: 'Não é possível desativar o último administrador.' })
  const member = localLastAdminGuard({ action: 'deactivate', targetIsActiveAdmin: false, adminCount: count, sameOrganization: true })
  assert.deepEqual(member, { call: true, error: null })
})

test('two active administrators may be demoted or deactivated, and a changed organization discards the refusal', async () => {
  const { activeAdminCount, localLastAdminGuard } = await import('../src/features/team/members.ts')
  const memberships = [
    { role: 'org:admin', userId: 'user_ana' },
    { role: 'admin', userId: 'user_bia' },
    { role: 'org:admin', userId: null },
  ]
  const count = activeAdminCount(memberships, [
    { userId: 'user_ana', status: 'active', lastAccessAt: null },
  ])
  assert.equal(count, 2)
  assert.deepEqual(
    localLastAdminGuard({ action: 'demote', targetIsActiveAdmin: true, adminCount: count, sameOrganization: true }),
    { call: true, error: null },
  )
  assert.deepEqual(
    localLastAdminGuard({ action: 'deactivate', targetIsActiveAdmin: true, adminCount: count, sameOrganization: true }),
    { call: true, error: null },
  )
  assert.deepEqual(
    localLastAdminGuard({ action: 'demote', targetIsActiveAdmin: true, adminCount: 1, sameOrganization: false }),
    { call: false, error: null },
  )
  assert.deepEqual(
    localLastAdminGuard({ action: 'deactivate', targetIsActiveAdmin: true, adminCount: null, sameOrganization: true }),
    { call: false, error: null },
  )
})

test('role update uses the unprefixed identifiers and the member contract has no body', async () => {
  const { roleToUpdate } = await import('../src/features/team/members.ts')
  const { companyMembersPath, deactivationPath, readMember, readMemberList } = await import('../src/features/team/memberContract.ts')
  assert.equal(roleToUpdate('org:admin'), 'admin')
  assert.equal(roleToUpdate('admin'), 'admin')
  assert.equal(roleToUpdate('org:member'), 'member')
  assert.equal(roleToUpdate('member'), 'member')
  assert.equal(roleToUpdate('org:gestor'), null)
  assert.equal(companyMembersPath, '/api/company/members')
  assert.equal(deactivationPath('user_bruno'), '/api/company/members/user_bruno/deactivation')
  assert.equal(deactivationPath(''), null)
  assert.equal(deactivationPath('x'.repeat(201)), null)
  const members = readMemberList(listed)
  assert.equal(members.length, 2)
  assert.equal(members[0].userId, 'user_ana')
  assert.equal(members[0].status, 'active')
  assert.equal(members[0].lastAccessAt.toISOString(), '2026-11-15T22:10:00.000Z')
  assert.equal(members[1].status, 'deactivated')
  assert.equal(members[1].lastAccessAt, null)
  assert.equal(readMember(listed.members[1]).status, 'deactivated')
  assert.equal(readMemberList({ members: 'no' }), null)
  assert.equal(readMemberList({ members: [{ userId: 'user_ana', status: 'paused', lastAccessAt: null }] }), null)
  assert.equal(readMemberList({ members: [{ userId: '', status: 'active', lastAccessAt: null }] }), null)
  assert.equal(readMemberList({ members: [{ userId: 'x'.repeat(201), status: 'active', lastAccessAt: null }] }), null)
  assert.equal(readMemberList({ members: [{ userId: 'user_ana', status: 'active', lastAccessAt: 1 }] }), null)
})
