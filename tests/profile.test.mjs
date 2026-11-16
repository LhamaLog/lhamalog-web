import { register } from 'node:module'
import { test } from 'node:test'
import assert from 'node:assert/strict'

register(new URL('./resolve-ts.mjs', import.meta.url))

const emptyProfile = { displayName: '', language: 'pt-BR', timezone: 'America/Sao_Paulo', version: null }

test('profile response reads timezone and version, and rejects the company timeZone name', async () => {
  const { readUserProfile } = await import('../src/features/profile/contract.ts')
  assert.deepEqual(readUserProfile({ displayName: 'Ana Souza', language: 'en', timezone: 'America/Manaus', version: 2 }), {
    displayName: 'Ana Souza', language: 'en', timezone: 'America/Manaus', version: 2,
  })
  assert.deepEqual(readUserProfile(emptyProfile), emptyProfile)
  assert.equal(readUserProfile({ displayName: 'Ana', language: 'pt-BR', timeZone: 'America/Sao_Paulo', version: null }), null)
  assert.equal(readUserProfile({ displayName: 'Ana', language: 'pt-BR', timezone: 'America/Sao_Paulo' }), null)
  assert.equal(readUserProfile({ displayName: 1, language: 'pt-BR', timezone: 'UTC', version: null }), null)
})

test('profile put sends only the four contract fields and trims the name', async () => {
  const { buildProfilePut, serverConfirmedProfile } = await import('../src/features/profile/contract.ts')
  const sent = { displayName: '  Ana Souza  ', language: 'pt-BR', timezone: 'America/Sao_Paulo', version: null }
  const body = buildProfilePut(sent)
  assert.deepEqual(Object.keys(body).sort(), ['displayName', 'language', 'timezone', 'version'])
  assert.equal(body.displayName, 'Ana Souza')
  assert.equal(body.version, null)
  assert.equal(serverConfirmedProfile(sent, { ...body, displayName: 'Ana Souza', version: 4 }), true)
  assert.equal(serverConfirmedProfile(sent, { ...body, timezone: 'UTC', version: 4 }), false)
  assert.equal(serverConfirmedProfile(sent, { ...body, language: 'en', version: 4 }), false)
})

test('profile validation accepts one and 200 characters and rejects the rest', async () => {
  const { profileFieldErrors } = await import('../src/features/profile/validation.ts')
  const valid = (displayName, language = 'pt-BR', timezone = 'America/Sao_Paulo') => profileFieldErrors({ displayName, language, timezone })
  assert.deepEqual(valid('A'), {})
  assert.deepEqual(valid('a'.repeat(200)), {})
  assert.deepEqual(valid('en', 'en'), {})
  assert.ok(valid('').displayName)
  assert.ok(valid('   ').displayName)
  assert.ok(valid('a'.repeat(201)).displayName)
  assert.equal(valid('Ana\nSouza').displayName, 'control')
  assert.ok(valid('Ana', 'en-US').language)
  assert.ok(valid('Ana', 'pt').language)
  assert.ok(valid('Ana', 'pt-BR', 'Brasilia').timezone)
})

test('display name splits into Clerk first and last name', async () => {
  const { splitDisplayName } = await import('../src/features/profile/clerkName.ts')
  assert.deepEqual(splitDisplayName('Ana Souza Silva'), { firstName: 'Ana', lastName: 'Souza Silva' })
  assert.deepEqual(splitDisplayName('Ana'), { firstName: 'Ana', lastName: '' })
  assert.deepEqual(splitDisplayName('  Ana   Souza  '), { firstName: 'Ana', lastName: 'Souza' })
})

test('profile message catalogs share the same keys', async () => {
  const { messageCatalogKeys } = await import('../src/features/profile/messages.ts')
  assert.deepEqual(messageCatalogKeys('pt-BR'), messageCatalogKeys('en'))
  assert.ok(messageCatalogKeys('pt-BR').length > 10)
})

test('percent format follows locale and does not take a time zone', async () => {
  const { formatPercent } = await import('../src/features/products/productListModel.ts')
  const pt = formatPercent(1234.5, 'pt-BR')
  const en = formatPercent(1234.5, 'en')
  assert.notEqual(pt, en)
  assert.match(pt, /1\.234,50/)
  assert.match(en, /1,234\.50/)
})
