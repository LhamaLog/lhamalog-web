import { register } from 'node:module'
import { test } from 'node:test'
import assert from 'node:assert/strict'

register(new URL('./resolve-ts.mjs', import.meta.url))

const stream = () => import('../src/features/occurrences/occurrenceStream.ts')
const query = () => import('../src/features/occurrences/occurrenceQuery.ts')

test('the WebSocket address follows the API address', async () => {
  const { wsUrl } = await stream()
  assert.equal(wsUrl('http://localhost:8080'), 'ws://localhost:8080/ws/occurrences')
  assert.equal(wsUrl('https://api.lhamalog.com/'), 'wss://api.lhamalog.com/ws/occurrences')
})

test('the auth message carries the token in the body', async () => {
  const { authMessage } = await stream()
  assert.deepEqual(JSON.parse(authMessage('tok')), { type: 'auth', token: 'tok' })
})

test('server messages are read and anything else is ignored', async () => {
  const { parseServerMessage } = await stream()
  assert.deepEqual(parseServerMessage('{"type":"ready","expiresAt":"2026-11-25T18:00:00Z"}'), { type: 'ready' })
  assert.deepEqual(parseServerMessage('{"type":"occurrence","change":"CREATED","occurrenceId":"o1","productId":"p1","occurrenceType":"ERROR","at":"x"}'),
    { type: 'occurrence', change: 'CREATED', occurrenceId: 'o1', productId: 'p1', occurrenceType: 'ERROR' })
  assert.equal(parseServerMessage('{"type":"occurrence","change":"UPDATED","occurrenceId":"o1","productId":"p1","occurrenceType":"ERROR"}'), null)
  assert.equal(parseServerMessage('{"type":"occurrence","change":"CREATED"}'), null)
  assert.equal(parseServerMessage('não é json'), null)
})

test('a notice counts only for the active list and the product and type filters', async () => {
  const { countsFor } = await stream()
  const { defaultOccurrenceQuery } = await query()
  const notice = { type: 'occurrence', change: 'CREATED', occurrenceId: 'o1', productId: 'p1', occurrenceType: 'ERROR' }
  const base = defaultOccurrenceQuery()
  assert.equal(countsFor(base, notice), true)
  assert.equal(countsFor({ ...base, archived: true }, notice), false)
  assert.equal(countsFor({ ...base, productIds: ['p2'] }, notice), false)
  assert.equal(countsFor({ ...base, productIds: ['p1', 'p2'] }, notice), true)
  assert.equal(countsFor({ ...base, types: ['WARNING'] }, notice), false)
  assert.equal(countsFor({ ...base, statuses: ['FECHADA'] }, notice), false)
  assert.equal(countsFor({ ...base, statuses: ['ABERTA', 'FECHADA'] }, notice), true)
})

test('the notice text is singular or plural', async () => {
  const { noveltyLabel } = await stream()
  assert.equal(noveltyLabel(1), '1 ocorrência nova')
  assert.equal(noveltyLabel(3), '3 ocorrências novas')
})

test('reconnection waits 1, 2, 4… up to 30 seconds', async () => {
  const { backoffSeconds } = await stream()
  assert.deepEqual([1, 2, 3, 4, 5, 6, 7, 10].map(backoffSeconds), [1, 2, 4, 8, 16, 30, 30, 30])
})

test('after reconnecting, a new item on top or a larger total means news', async () => {
  const { hasNovelties } = await stream()
  const shown = { ids: ['a', 'b'], totalItems: 2 }
  assert.equal(hasNovelties(shown, { ids: ['a', 'b'], totalItems: 2 }), false)
  assert.equal(hasNovelties(shown, { ids: ['c', 'a'], totalItems: 3 }), true)
  assert.equal(hasNovelties(shown, { ids: ['a', 'b'], totalItems: 3 }), true)
  assert.equal(hasNovelties({ ids: [], totalItems: 0 }, { ids: ['x'], totalItems: 1 }), true)
})
