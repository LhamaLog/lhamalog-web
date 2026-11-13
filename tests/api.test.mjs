import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ApiError, apiRequest, tokenMatchesOrganization } from '../src/shared/services/api.ts'

test('sends Bearer token and returns persisted response', async () => {
  const original = globalThis.fetch
  globalThis.fetch = async (url, options) => {
    assert.equal(url, 'http://api.test/api/company')
    assert.equal(options.headers.Authorization, 'Bearer session-token')
    assert.equal(options.method, 'PUT')
    assert.deepEqual(JSON.parse(options.body), { version: 1 })
    return new Response(JSON.stringify({ version: 2 }), { status: 200 })
  }
  try { assert.deepEqual(await apiRequest('http://api.test', '/api/company', 'session-token', { method: 'PUT', body: '{"version":1}' }), { version: 2 }) }
  finally { globalThis.fetch = original }
})

test('preserves validation errors and does not retry a mutation', async () => {
  const original = globalThis.fetch
  let calls = 0
  globalThis.fetch = async () => { calls++; return new Response(JSON.stringify({ message: 'Confira os campos.', fieldErrors: { name: 'Obrigatório' } }), { status: 400 }) }
  try {
    await assert.rejects(apiRequest('', '/api/products', 'token', { method: 'POST' }), error => error instanceof ApiError && error.status === 400 && error.fieldErrors.name === 'Obrigatório')
    assert.equal(calls, 1)
  } finally { globalThis.fetch = original }
})

test('handles unauthorized and non-JSON errors without leaking details', async () => {
  const original = globalThis.fetch
  globalThis.fetch = async () => new Response('<html>private error details</html>', { status: 401 })
  try { await assert.rejects(apiRequest('', '/api/company', 'token'), error => error.status === 401 && !error.message.includes('private')) }
  finally { globalThis.fetch = original }
})

test('does not convert cancellation into a server failure', async () => {
  const original = globalThis.fetch
  const controller = new AbortController()
  controller.abort()
  globalThis.fetch = async () => { throw new DOMException('Aborted', 'AbortError') }
  try { await assert.rejects(apiRequest('', '/api/company', 'token', { signal: controller.signal }), { name: 'AbortError' }) }
  finally { globalThis.fetch = original }
})

test('rejects stale organization token before sending a request', () => {
  const token = claims => `header.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.signature`
  assert.equal(tokenMatchesOrganization(token({ o: { id: 'org_a' } }), 'org_a'), true)
  assert.equal(tokenMatchesOrganization(token({ org_id: 'org_a' }), 'org_a'), true)
  assert.equal(tokenMatchesOrganization(token({ o: { id: 'org_b' } }), 'org_a'), false)
  assert.equal(tokenMatchesOrganization('invalid', 'org_a'), false)
})
