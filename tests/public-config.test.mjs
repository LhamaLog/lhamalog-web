import { test } from 'node:test'
import assert from 'node:assert/strict'
import { resolvePublicConfig } from '../src/shared/config.ts'

const publishable = 'pk_test_validateonly1234'

test('runtime config overrides Vite build-time values', () => {
  const config = resolvePublicConfig(
    { clerkPublishableKey: publishable, apiUrl: 'https://api.example.com/' },
    { clerkPublishableKey: 'pk_test_buildtimevalue', apiUrl: 'http://localhost:8080' },
  )
  assert.equal(config.clerkPublishableKey, publishable)
  assert.equal(config.apiUrl, 'https://api.example.com')
})

test('empty runtime values fall back to the Vite build and then to localhost:8080', () => {
  const config = resolvePublicConfig(
    { clerkPublishableKey: '  ', apiUrl: '' },
    { clerkPublishableKey: `  ${publishable}  ` },
  )
  assert.equal(config.clerkPublishableKey, publishable)
  assert.equal(config.apiUrl, 'http://localhost:8080')
})

test('accepts a live publishable key and rejects secret keys without echoing them', () => {
  assert.equal(resolvePublicConfig({ clerkPublishableKey: 'pk_live_validateonly1234' }, {}).clerkPublishableKey, 'pk_live_validateonly1234')
  const secret = 'sk_test_shouldnotappear'
  assert.throws(() => resolvePublicConfig({ clerkPublishableKey: secret }, {}), (error) => {
    assert.match(error.message, /chave secreta/)
    assert.equal(error.message.includes(secret), false)
    return true
  })
  assert.throws(() => resolvePublicConfig({}, {}), /Falta VITE_CLERK_PUBLISHABLE_KEY/)
  assert.throws(() => resolvePublicConfig({ clerkPublishableKey: 'pk_test_short' }, {}), /chave publicável/)
})

test('api url must be a browser origin', () => {
  assert.throws(() => resolvePublicConfig({ clerkPublishableKey: publishable, apiUrl: 'http://user:secret@localhost:8080' }, {}), /usuário ou senha/)
  assert.throws(() => resolvePublicConfig({ clerkPublishableKey: publishable, apiUrl: 'http://localhost:8080/api' }, {}), /sem caminho/)
  assert.throws(() => resolvePublicConfig({ clerkPublishableKey: publishable, apiUrl: 'javascript:alert(1)' }, {}), /http ou https/)
})
