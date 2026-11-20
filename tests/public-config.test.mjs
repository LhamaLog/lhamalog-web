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

test('the OTLP endpoint is optional, runtime first, without the trailing slash (F4, N4)', () => {
  assert.equal(resolvePublicConfig({ clerkPublishableKey: publishable }, {}).otlpEndpoint, '')
  assert.equal(resolvePublicConfig({ clerkPublishableKey: publishable, otlpEndpoint: 'https://otlp.example.com/' }, { otlpEndpoint: 'http://localhost:4328' }).otlpEndpoint, 'https://otlp.example.com')
  assert.equal(resolvePublicConfig({ clerkPublishableKey: publishable, otlpEndpoint: ' ' }, { otlpEndpoint: 'http://localhost:4328' }).otlpEndpoint, 'http://localhost:4328')
  assert.equal(resolvePublicConfig({ clerkPublishableKey: publishable, otlpEndpoint: 'https://example.com/otlp' }, {}).otlpEndpoint, 'https://example.com/otlp')
})

test('the OTLP endpoint must be http or https, without user, password, query or hash', () => {
  assert.throws(() => resolvePublicConfig({ clerkPublishableKey: publishable, otlpEndpoint: 'ftp://otlp.example.com' }, {}), /VITE_OTLP_ENDPOINT/)
  assert.throws(() => resolvePublicConfig({ clerkPublishableKey: publishable, otlpEndpoint: 'https://user:secret@otlp.example.com' }, {}), /usuário ou senha/)
  assert.throws(() => resolvePublicConfig({ clerkPublishableKey: publishable, otlpEndpoint: 'https://otlp.example.com/?a=1' }, {}), /VITE_OTLP_ENDPOINT/)
  assert.throws(() => resolvePublicConfig({ clerkPublishableKey: publishable, otlpEndpoint: 'não é url' }, {}), /VITE_OTLP_ENDPOINT/)
})
