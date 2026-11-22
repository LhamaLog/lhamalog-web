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

test('distinguishes member access codes without signing the caller out', async () => {
  const original = globalThis.fetch
  const cases = [
    [{ message: 'Seu acesso a esta empresa foi desativado.', code: 'user_deactivated' }, 403, 'user_deactivated', 'Seu acesso a esta empresa foi desativado.'],
    [{ code: 'user_deactivated' }, 403, 'user_deactivated', 'Seu acesso a esta empresa foi desativado.'],
    [{ message: 'Não é possível desativar o último administrador.', code: 'last_admin' }, 403, 'last_admin', 'Não é possível desativar o último administrador.'],
    [{ message: 'Somente o administrador da empresa pode gerenciar os usuários.', code: 'not_admin' }, 403, 'not_admin', 'Somente o administrador da empresa pode gerenciar os usuários.'],
    [{}, 403, '', 'Você não tem acesso a esta empresa.'],
  ]
  try {
    for (const [body, status, code, message] of cases) {
      globalThis.fetch = async () => new Response(JSON.stringify(body), { status })
      await assert.rejects(apiRequest('', '/api/company/members', 'token'), (error) => {
        assert.equal(error.status, status)
        assert.notEqual(error.status, 401)
        assert.equal(error.code, code)
        assert.equal(error.message, message)
        return true
      })
    }
  } finally { globalThis.fetch = original }
})

test('keeps the message sent by the Core apart from the fallback text', async () => {
  const original = globalThis.fetch
  const cases = [
    [{ error: 'forbidden' }, '', '', 'Você não tem acesso a esta empresa.'],
    [{ code: 'not_admin', message: 'Somente o administrador da empresa pode gerenciar os usuários.' }, 'not_admin', 'Somente o administrador da empresa pode gerenciar os usuários.', 'Somente o administrador da empresa pode gerenciar os usuários.'],
    [{ message: 'Somente o administrador da empresa pode alterar este cadastro.' }, '', 'Somente o administrador da empresa pode alterar este cadastro.', 'Somente o administrador da empresa pode alterar este cadastro.'],
    [{ message: '   ' }, '', '', 'Você não tem acesso a esta empresa.'],
  ]
  try {
    for (const [body, code, serverMessage, message] of cases) {
      globalThis.fetch = async () => new Response(JSON.stringify(body), { status: 403 })
      await assert.rejects(apiRequest('', '/api/company', 'token'), (error) => {
        assert.equal(error.code, code)
        assert.equal(error.serverMessage, serverMessage)
        assert.equal(error.message, message)
        return true
      })
    }
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
