import { register } from 'node:module'
import { test } from 'node:test'
import assert from 'node:assert/strict'

register(new URL('./resolve-ts.mjs', import.meta.url))

// Fake values only. A real token never goes into a test.
const fakeSecret = 'llt_teste'

function view(overrides = {}) {
  return {
    id: 't-1', name: 'API de Pagamentos', state: 'ACTIVE', createdAt: '2026-11-20T10:00:00.000Z', createdBy: 'user_a',
    expiresAt: null, revokedAt: null, revokedBy: null, replacedBy: null, ...overrides,
  }
}

test('readTokenList keeps valid views and drops invalid items', async () => {
  const { readTokenList } = await import('../src/features/products/tokenContract.ts')
  const list = readTokenList([view(), { id: 't-2', state: 'WRONG', createdAt: '2026-11-20T10:00:00.000Z' }, { state: 'ACTIVE' }, null, 'x', view({ id: 't-3', state: 'EXPIRING', expiresAt: '2026-11-21T10:00:00.000Z' })])
  assert.deepEqual(list.map((item) => [item.id, item.state]), [['t-1', 'ACTIVE'], ['t-3', 'EXPIRING']])
  assert.deepEqual(readTokenList({ not: 'a list' }), [])
})

test('the current key is the most recent ACTIVE token, and the previous one is the most recent EXPIRING', async () => {
  const { activeToken, expiringToken, readTokenList } = await import('../src/features/products/tokenContract.ts')
  const list = readTokenList([
    view({ id: 'old', createdAt: '2026-11-01T10:00:00.000Z' }),
    view({ id: 'new', createdAt: '2026-11-19T10:00:00.000Z' }),
    view({ id: 'prev', state: 'EXPIRING', createdAt: '2026-11-10T10:00:00.000Z', expiresAt: '2026-11-21T10:00:00.000Z' }),
    view({ id: 'gone', state: 'REVOKED', createdAt: '2026-11-20T10:00:00.000Z' }),
  ])
  assert.equal(activeToken(list)?.id, 'new')
  assert.equal(expiringToken(list)?.id, 'prev')
  assert.equal(activeToken(readTokenList([view({ state: 'EXPIRED' })])), null)
  assert.equal(expiringToken([]), null)
})

test('readCreatedToken and readRotation read the secret once, with the notice of the Core', async () => {
  const { readCreatedToken, readRotation } = await import('../src/features/products/tokenContract.ts')
  const created = { token: view(), secret: fakeSecret, notice: 'Copie o token agora: ele não será exibido de novo.' }
  assert.deepEqual(readCreatedToken(created), { token: view(), secret: fakeSecret, notice: created.notice })
  assert.equal(readCreatedToken({ token: view(), secret: '' }), null)
  assert.equal(readCreatedToken({ secret: fakeSecret }), null)
  const rotation = readRotation({ created, previous: view({ id: 't-0', state: 'EXPIRING', expiresAt: '2026-11-21T10:00:00.000Z' }) })
  assert.equal(rotation.created.secret, fakeSecret)
  assert.equal(rotation.previous.state, 'EXPIRING')
  assert.equal(readRotation({ created }), null)
})

test('paths, default name and confirmation text (F5)', async () => {
  const { tokensPath, rotatePath, defaultTokenName, rotateQuestion, rotateBody } = await import('../src/features/products/tokenContract.ts')
  assert.equal(tokensPath('a/b'), '/api/products/a%2Fb/tokens')
  assert.equal(rotatePath('p-1', 't/1'), '/api/products/p-1/tokens/t%2F1/rotate')
  assert.equal(defaultTokenName('  API de Pagamentos  '), 'API de Pagamentos')
  assert.equal(defaultTokenName('x'.repeat(120)).length, 100)
  assert.equal(defaultTokenName('   '), 'Chave de API')
  assert.equal(rotateQuestion, 'Gerar uma nova chave? A chave atual continua funcionando por 24 horas e depois para. Atualize suas aplicações nesse prazo.')
  assert.deepEqual(rotateBody, { transitionHours: 24 })
})

test('the status panel is neutral and depends only on the active key (F1)', async () => {
  const { connectionState } = await import('../src/features/products/tokenContract.ts')
  assert.equal(connectionState(true, true), 'waiting')
  assert.equal(connectionState(true, false), 'none')
  assert.equal(connectionState(false, false), 'unknown')
})

test('"Gerar nova" creates without an active key and rotates with one (F5)', async () => {
  const { generateMode } = await import('../src/features/products/tokenContract.ts')
  assert.equal(generateMode(null), 'create')
  assert.equal(generateMode(view()), 'rotate')
})

test('the previous key in transition shows when it stops working (US2.6)', async () => {
  const { expiringHint } = await import('../src/features/products/tokenContract.ts')
  assert.equal(expiringHint(view({ state: 'EXPIRING', expiresAt: '2026-11-21T13:30:00.000Z' }), 'pt-BR', 'UTC'), 'A chave anterior para de funcionar em 21/11/2026, 13:30.')
  assert.equal(expiringHint(null), '')
  assert.equal(expiringHint(view({ state: 'EXPIRING', expiresAt: null })), '')
})

test('after creating or rotating, the list changes without asking the Core again', async () => {
  const { tokensAfterCreate, tokensAfterRotation, activeToken, expiringToken } = await import('../src/features/products/tokenContract.ts')
  const created = { token: view({ id: 'new', createdAt: '2026-11-20T12:00:00.000Z' }), secret: fakeSecret, notice: '' }
  assert.deepEqual(tokensAfterCreate([], created).map((item) => item.id), ['new'])
  const old = view({ id: 'old', createdAt: '2026-11-01T10:00:00.000Z' })
  const previous = { ...old, state: 'EXPIRING', expiresAt: '2026-11-21T12:00:00.000Z', replacedBy: 'new' }
  const list = tokensAfterRotation([old, view({ id: 'gone', state: 'REVOKED' })], { created, previous })
  assert.deepEqual(list.map((item) => [item.id, item.state]), [['new', 'ACTIVE'], ['old', 'EXPIRING'], ['gone', 'REVOKED']])
  assert.equal(activeToken(list)?.id, 'new')
  assert.equal(expiringToken(list)?.id, 'old')
  // The list of views never carries the secret.
  assert.equal(JSON.stringify(list).includes(fakeSecret), false)
})
