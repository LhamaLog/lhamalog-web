import { register } from 'node:module'
import { test } from 'node:test'
import assert from 'node:assert/strict'

register(new URL('./resolve-ts.mjs', import.meta.url))

// Spec 013 (LLT-179, gerenciar chaves). Fake values only: a real token never goes into a test.
const fakeSecret = 'llt_teste'
const tz = 'America/Sao_Paulo'

function view(overrides = {}) {
  return {
    id: 't-1', name: 'cluster-producao', state: 'ACTIVE', createdAt: '2026-11-20T13:00:00.000Z', createdBy: 'user_a',
    expiresAt: null, revokedAt: null, revokedBy: null, replacedBy: null, ...overrides,
  }
}

const load = () => import('../src/features/products/tokenManagement.ts')

test('each state has its badge label and tone', async () => {
  const { tokenBadge } = await load()
  assert.deepEqual(tokenBadge('ACTIVE'), { label: 'Ativa', variant: 'success' })
  assert.deepEqual(tokenBadge('EXPIRING'), { label: 'Em transição', variant: 'warning' })
  assert.deepEqual(tokenBadge('EXPIRED'), { label: 'Expirada', variant: 'neutral' })
  assert.deepEqual(tokenBadge('REVOKED'), { label: 'Revogada', variant: 'danger' })
})

test('dates are shown as dd/mm/aaaa hh:mm in pt-BR, and invalid dates as empty', async () => {
  const { formatDateTime } = await load()
  assert.equal(formatDateTime('2026-11-20T13:05:00.000Z', 'pt-BR', tz), '20/11/2026 10:05')
  assert.equal(formatDateTime('not a date', 'pt-BR', tz), '')
  assert.equal(formatDateTime(null, 'pt-BR', tz), '')
})

test('revoke shows for active and expiring keys, also on an archived product (K7)', async () => {
  const { tokenActions } = await load()
  for (const archived of [false, true]) {
    assert.equal(tokenActions(view(), archived).revoke, true)
    assert.equal(tokenActions(view({ state: 'EXPIRING', expiresAt: '2026-11-21T13:00:00.000Z' }), archived).revoke, true)
    assert.equal(tokenActions(view({ state: 'EXPIRED', expiresAt: '2026-11-19T13:00:00.000Z' }), archived).revoke, false)
    assert.equal(tokenActions(view({ state: 'REVOKED', revokedAt: '2026-11-20T14:00:00.000Z' }), archived).revoke, false)
  }
})

test('rotate shows only for an active key without expiration, disabled on an archived product', async () => {
  const { tokenActions } = await load()
  assert.equal(tokenActions(view(), false).rotate, 'enabled')
  assert.equal(tokenActions(view(), true).rotate, 'disabled')
  assert.equal(tokenActions(view({ expiresAt: '2026-11-21T13:00:00.000Z' }), false).rotate, 'hidden')
  assert.equal(tokenActions(view({ state: 'EXPIRING', expiresAt: '2026-11-21T13:00:00.000Z' }), false).rotate, 'hidden')
  assert.equal(tokenActions(view({ state: 'EXPIRED' }), false).rotate, 'hidden')
  assert.equal(tokenActions(view({ state: 'REVOKED' }), false).rotate, 'hidden')
})

test('the key name follows the Core: 1 to 100 characters after trimming', async () => {
  const { tokenNameError } = await load()
  assert.equal(tokenNameError('cluster-producao'), undefined)
  assert.equal(tokenNameError('  cluster  '), undefined)
  assert.equal(tokenNameError('a'.repeat(100)), undefined)
  assert.equal(tokenNameError(''), 'Informe o nome da chave.')
  assert.equal(tokenNameError('    '), 'Informe o nome da chave.')
  assert.equal(tokenNameError('a'.repeat(101)), 'O nome da chave pode ter até 100 caracteres.')
})

test('the transition period is a whole number of hours from 1 to 168, and empty means 24 (K4)', async () => {
  const { transitionHoursOf } = await load()
  const error = { error: 'Informe um número inteiro de horas entre 1 e 168.' }
  assert.deepEqual(transitionHoursOf('1'), { hours: 1 })
  assert.deepEqual(transitionHoursOf(' 24 '), { hours: 24 })
  assert.deepEqual(transitionHoursOf('168'), { hours: 168 })
  assert.deepEqual(transitionHoursOf(''), { hours: 24 })
  assert.deepEqual(transitionHoursOf('0'), error)
  assert.deepEqual(transitionHoursOf('169'), error)
  assert.deepEqual(transitionHoursOf('2.5'), error)
  assert.deepEqual(transitionHoursOf('-3'), error)
  assert.deepEqual(transitionHoursOf('duas'), error)
})

test('request bodies: create sends the trimmed name; rotate sends only the period, so the name is inherited', async () => {
  const { createTokenBody, rotateTokenBody } = await load()
  assert.deepEqual(createTokenBody('  cluster-producao '), { name: 'cluster-producao' })
  assert.deepEqual(rotateTokenBody(2), { transitionHours: 2 })
  assert.equal('name' in rotateTokenBody(2), false)
})

test('the token paths of the Core contract', async () => {
  const { revokePath, auditPath, rotatePath, tokensPath } = await import('../src/features/products/tokenContract.ts')
  assert.equal(tokensPath('p 1'), '/api/products/p%201/tokens')
  assert.equal(revokePath('p-1', 't/1'), '/api/products/p-1/tokens/t%2F1/revoke')
  assert.equal(rotatePath('p-1', 't-1'), '/api/products/p-1/tokens/t-1/rotate')
  assert.equal(auditPath('p-1'), '/api/products/p-1/tokens/audit')
})

test('after a revoke the list keeps the key, now revoked, in the same place and without any secret', async () => {
  const { tokensAfterRevoke } = await import('../src/features/products/tokenContract.ts')
  const list = [view({ id: 't-2' }), view()]
  const revoked = view({ state: 'REVOKED', revokedAt: '2026-11-20T14:00:00.000Z', revokedBy: 'user_a' })
  const next = tokensAfterRevoke(list, revoked)
  assert.deepEqual(next.map((item) => [item.id, item.state]), [['t-2', 'ACTIVE'], ['t-1', 'REVOKED']])
  assert.equal(JSON.stringify(next).includes(fakeSecret), false)
})

test('the audit list keeps valid entries, newest first, and keeps the Core order on the same instant', async () => {
  const { readAuditList } = await load()
  const at = '2026-11-20T15:00:00.000Z'
  const list = readAuditList([
    { id: 'a-1', tokenId: 't-1', action: 'CREATED', actorUserId: 'user_a', at: '2026-11-20T13:00:00.000Z' },
    { id: 'a-2', tokenId: 't-1', action: 'ROTATED', actorUserId: 'user_a', at, relatedTokenId: 't-2', transitionEndsAt: '2026-11-20T17:00:00.000Z' },
    { id: 'a-3', tokenId: 't-2', action: 'CREATED', actorUserId: 'user_a', at },
    { id: 'a-4', tokenId: 't-2', action: 'REVOKED', actorUserId: 'user_b', at: '2026-11-20T16:00:00.000Z' },
    { id: 'x', tokenId: 't-1', action: 'DELETED', at },
    { id: 'y', action: 'CREATED', at },
    null,
    'x',
  ])
  assert.deepEqual(list.map((item) => item.id), ['a-4', 'a-2', 'a-3', 'a-1'])
  assert.equal(list[1].transitionEndsAt, '2026-11-20T17:00:00.000Z')
  assert.equal(list[1].relatedTokenId, 't-2')
  assert.equal(list[0].relatedTokenId, null)
  assert.deepEqual(readAuditList({}), [])
})

test('an audit line shows the action, the key by name, who did it by name and when, with the end of a transition', async () => {
  const { auditLine, peopleIndex } = await load()
  const people = peopleIndex([{ userId: 'user_a', firstName: 'Pedro', lastName: 'Alvaro', identifier: 'pedro@exemplo.com' }])
  const tokens = [view(), view({ id: 't-2', name: 'cluster-novo' })]
  assert.deepEqual(
    auditLine({ id: 'a-2', tokenId: 't-1', action: 'ROTATED', actorUserId: 'user_a', at: '2026-11-20T15:00:00.000Z', relatedTokenId: 't-2', transitionEndsAt: '2026-11-20T17:00:00.000Z' }, tokens, people, 'pt-BR', tz),
    { action: 'Rotacionada', token: 'cluster-producao', who: 'Pedro Alvaro', when: '20/11/2026 12:00', detail: 'Transição até 20/11/2026 14:00' },
  )
  assert.deepEqual(
    auditLine({ id: 'a-4', tokenId: 'abcdef1234567890', action: 'REVOKED', actorUserId: 'user_x', at: '2026-11-20T16:00:00.000Z', relatedTokenId: null, transitionEndsAt: null }, tokens, people, 'pt-BR', tz),
    { action: 'Revogada', token: 'abcdef12', who: 'Usuário removido', when: '20/11/2026 13:00', detail: '' },
  )
  assert.equal(auditLine({ id: 'a-1', tokenId: 't-1', action: 'CREATED', actorUserId: 'user_a', at: '2026-11-20T13:00:00.000Z', relatedTokenId: null, transitionEndsAt: null }, tokens, people, 'pt-BR', tz).action, 'Criada')
})

test('people show by name, or by e-mail without a name; unknown ids and an unread list show "Usuário removido" (K5)', async () => {
  const { peopleIndex, personLabel } = await load()
  const people = peopleIndex([
    { userId: 'user_a', firstName: 'Pedro', lastName: null, identifier: 'pedro@exemplo.com' },
    { userId: 'user_b', firstName: null, lastName: null, identifier: 'bruno@exemplo.com' },
    { firstName: 'Sem id' },
  ])
  assert.equal(personLabel('user_a', people), 'Pedro')
  assert.equal(personLabel('user_b', people), 'bruno@exemplo.com')
  assert.equal(personLabel('user_c', people), 'Usuário removido')
  assert.equal(personLabel(null, people), 'Usuário removido')
  assert.equal(personLabel('user_a', null), 'Usuário removido')
  assert.equal(people.size, 2)
})

test('the token details: created by, and the end of a transition, an expiration or a revoke', async () => {
  const { tokenDetails, peopleIndex } = await load()
  const people = peopleIndex([{ userId: 'user_a', firstName: 'Pedro', lastName: 'Alvaro' }])
  assert.deepEqual(tokenDetails(view(), people, 'pt-BR', tz), { created: 'Criada em 20/11/2026 10:00 por Pedro Alvaro', end: '' })
  assert.equal(tokenDetails(view({ state: 'EXPIRING', expiresAt: '2026-11-20T15:00:00.000Z' }), people, 'pt-BR', tz).end, 'Expira em 20/11/2026 12:00')
  assert.equal(tokenDetails(view({ state: 'EXPIRED', expiresAt: '2026-11-20T15:00:00.000Z' }), people, 'pt-BR', tz).end, 'Expirou em 20/11/2026 12:00')
  assert.equal(tokenDetails(view({ state: 'REVOKED', revokedAt: '2026-11-20T16:00:00.000Z', revokedBy: 'user_z' }), people, 'pt-BR', tz).end, 'Revogada em 20/11/2026 13:00 por Usuário removido')
})

test('who manages keys: only with INGESTION_TOKENS_MANAGE and a known access (K6)', async () => {
  const { canManageTokens } = await load()
  const { accessFallback } = await import('../src/features/access/accessContract.ts')
  assert.equal(canManageTokens({ status: 'ready', permissions: ['INGESTION_TOKENS_MANAGE'] }), true)
  assert.equal(canManageTokens({ status: 'ready', permissions: ['PRODUCTS_EDIT'] }), false)
  assert.equal(canManageTokens({ status: 'loading', permissions: ['INGESTION_TOKENS_MANAGE'] }), false)
  assert.equal(canManageTokens({ status: 'error', permissions: [] }), false)
  // Core without LLT-120: the fallback of spec 012 gives the permission to the admin only.
  assert.equal(canManageTokens({ status: 'legacy', ...accessFallback('org:admin') }), true)
  assert.equal(canManageTokens({ status: 'legacy', ...accessFallback('org:member') }), false)
})

test('the confirmation texts (K8 and K4)', async () => {
  const { revokeQuestion, rotateQuestionFor, rotateHint } = await load()
  assert.equal(revokeQuestion('cluster-producao'), 'Revogar a chave "cluster-producao"? A chave deixa de ser aceita em até 30 segundos. As aplicações que usam essa chave param de enviar logs.')
  assert.equal(rotateQuestionFor('cluster-producao', 1), 'Rotacionar a chave "cluster-producao"? A chave atual continua funcionando por 1 hora e depois para. Atualize suas aplicações nesse prazo.')
  assert.equal(rotateQuestionFor('cluster-producao', 24), 'Rotacionar a chave "cluster-producao"? A chave atual continua funcionando por 24 horas e depois para. Atualize suas aplicações nesse prazo.')
  assert.equal(rotateHint, 'Durante esse período, a chave antiga e a nova funcionam. Depois, só a nova.')
})
