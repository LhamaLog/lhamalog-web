import { register } from 'node:module'
import { test } from 'node:test'
import assert from 'node:assert/strict'

register(new URL('./resolve-ts.mjs', import.meta.url))

const emptyProfile = { displayName: '', language: 'pt-BR', timezone: 'America/Sao_Paulo', version: null, bio: '', jobTitle: '' }

test('profile response reads timezone and version, and rejects the company timeZone name', async () => {
  const { readUserProfile } = await import('../src/features/profile/contract.ts')
  assert.deepEqual(readUserProfile({ displayName: 'Ana Souza', language: 'en', timezone: 'America/Manaus', version: 2 }), {
    displayName: 'Ana Souza', language: 'en', timezone: 'America/Manaus', version: 2, bio: '', jobTitle: '',
  })
  assert.deepEqual(readUserProfile(emptyProfile), emptyProfile)
  assert.equal(readUserProfile({ displayName: 'Ana', language: 'pt-BR', timeZone: 'America/Sao_Paulo', version: null }), null)
  assert.equal(readUserProfile({ displayName: 'Ana', language: 'pt-BR', timezone: 'America/Sao_Paulo' }), null)
  assert.equal(readUserProfile({ displayName: 1, language: 'pt-BR', timezone: 'UTC', version: null }), null)
})

test('profile read without bio and jobTitle stays valid and empty', async () => {
  const { readUserProfile } = await import('../src/features/profile/contract.ts')
  const legacy = { displayName: 'Ana Souza', language: 'pt-BR', timezone: 'America/Sao_Paulo', version: 3 }
  assert.deepEqual(readUserProfile(legacy), { ...legacy, bio: '', jobTitle: '' })
  assert.deepEqual(readUserProfile({ ...legacy, bio: 12, jobTitle: null }), { ...legacy, bio: '', jobTitle: '' })
  assert.deepEqual(readUserProfile({ ...legacy, bio: 'Observabilidade', jobTitle: 'SRE' }), {
    ...legacy, bio: 'Observabilidade', jobTitle: 'SRE',
  })
})

test('profile put sends bio and jobTitle, trims them, and requires the echo', async () => {
  const { buildProfilePut, serverConfirmedProfile } = await import('../src/features/profile/contract.ts')
  const sent = {
    displayName: '  Ana Souza  ',
    language: 'pt-BR',
    timezone: 'America/Sao_Paulo',
    version: null,
    bio: '  Observabilidade  ',
    jobTitle: '  SRE  ',
  }
  const body = buildProfilePut(sent)
  assert.deepEqual(Object.keys(body).sort(), ['bio', 'displayName', 'jobTitle', 'language', 'timezone', 'version'])
  assert.equal(body.displayName, 'Ana Souza')
  assert.equal(body.bio, 'Observabilidade')
  assert.equal(body.jobTitle, 'SRE')
  assert.equal(body.version, null)
  assert.equal('theme' in body, false)
  assert.equal(serverConfirmedProfile(sent, { ...body, displayName: 'Ana Souza', version: 4 }), true)
  assert.equal(serverConfirmedProfile(sent, { ...body, timezone: 'UTC', version: 4 }), false)
  assert.equal(serverConfirmedProfile(sent, { ...body, language: 'en', version: 4 }), false)
  assert.equal(serverConfirmedProfile(sent, { ...body, bio: 'outra', version: 4 }), false)
  assert.equal(serverConfirmedProfile(sent, { ...body, jobTitle: 'outra', version: 4 }), false)
  const withoutEcho = { displayName: 'Ana Souza', language: 'pt-BR', timezone: 'America/Sao_Paulo', version: 4 }
  assert.equal(serverConfirmedProfile(sent, withoutEcho), false)
  assert.equal(serverConfirmedProfile(sent, { ...withoutEcho, bio: '', jobTitle: 'SRE' }), false)
  const blank = buildProfilePut({ ...sent, bio: '   ', jobTitle: '  ' })
  assert.equal(blank.bio, '')
  assert.equal(blank.jobTitle, '')
  assert.equal(serverConfirmedProfile({ ...sent, bio: '   ', jobTitle: '  ' }, { ...blank, version: 5 }), true)
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

test('profile validation rejects long bio, long job title, line breaks and other control characters', async () => {
  const { profileFieldErrors } = await import('../src/features/profile/validation.ts')
  const { buildProfilePut } = await import('../src/features/profile/contract.ts')
  const base = { displayName: 'Ana', language: 'pt-BR', timezone: 'America/Sao_Paulo', bio: '', jobTitle: '' }
  const errors = (bio, jobTitle = '') => profileFieldErrors({ ...base, bio, jobTitle })
  assert.deepEqual(errors('a'.repeat(160), 'b'.repeat(80)), {})
  assert.deepEqual(errors(`  ${'a'.repeat(160)}  `, `  ${'b'.repeat(80)}  `), {})
  assert.deepEqual(errors('   ', '   '), {})
  assert.equal(buildProfilePut({ ...base, bio: '   ', jobTitle: ' \u0020 ' }).bio, '')
  assert.equal(buildProfilePut({ ...base, bio: '   ', jobTitle: ' \u0020 ' }).jobTitle, '')
  assert.equal(errors('a'.repeat(161)).bio, 'bio')
  assert.equal(errors('', 'b'.repeat(81)).jobTitle, 'jobTitle')
  assert.equal(errors('linha\nnova').bio, 'control')
  assert.equal(errors('ok', 'cargo\nnovo').jobTitle, 'control')
  assert.equal(errors('a\u0000b').bio, 'control')
  assert.equal(errors('ok', 'a\u0000b').jobTitle, 'control')
  assert.equal(errors('a\u001Fb').bio, 'control')
  assert.equal(errors('ok', 'a\u001Fb').jobTitle, 'control')
  assert.equal(errors('a\u007Fb').bio, 'control')
  assert.equal(errors('ok', 'a\u007Fb').jobTitle, 'control')
})

test('unsaved empty profile takes the Clerk session name without replacing a typed name', async () => {
  const { clerkSessionName, fillUnsavedNameIfUntouched, withUnsavedClerkName } = await import('../src/features/profile/clerkName.ts')
  const empty = { displayName: '', language: 'pt-BR', timezone: 'America/Sao_Paulo', version: null }
  assert.equal(clerkSessionName({ fullName: ' Ana Souza ' }), 'Ana Souza')
  assert.equal(clerkSessionName({ fullName: '  ', firstName: 'Ana', lastName: 'Souza' }), 'Ana Souza')
  assert.equal(clerkSessionName({ firstName: 'Ana', lastName: '' }), 'Ana')
  assert.equal(clerkSessionName(null), '')
  const suggested = withUnsavedClerkName(empty, 'Ana Souza')
  assert.equal(suggested.displayName, 'Ana Souza')
  assert.equal(suggested.version, null)
  assert.equal(withUnsavedClerkName({ ...empty, version: 1 }, 'Ana Souza').displayName, '')
  assert.equal(withUnsavedClerkName({ ...empty, displayName: 'Bruno' }, 'Ana Souza').displayName, 'Bruno')
  assert.equal(withUnsavedClerkName(empty, '   '), empty)
  const edited = { ...empty, displayName: 'Jo', language: 'en' }
  assert.equal(fillUnsavedNameIfUntouched(edited, empty, 'Ana Souza'), null)
  const late = fillUnsavedNameIfUntouched({ ...empty, language: 'en' }, empty, 'Ana Souza')
  assert.equal(late.draft.displayName, 'Ana Souza')
  assert.equal(late.draft.language, 'en')
  assert.equal(late.baseline.displayName, 'Ana Souza')
  assert.equal(late.baseline.language, 'pt-BR')
  assert.equal(late.baseline.version, null)
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
