import { register } from 'node:module'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import assert from 'node:assert/strict'

register(new URL('./resolve-ts.mjs', import.meta.url))

const now = new Date('2026-06-15T15:00:00Z')

function memoryStore() {
  const memory = new Map()
  return {
    getItem(key) { return memory.has(key) ? memory.get(key) : null },
    setItem(key, value) { memory.set(key, String(value)) },
    removeItem() { throw new Error('appearance storage must not be removed') },
  }
}

function element() {
  const attrs = new Map()
  return {
    setAttribute(name, value) { attrs.set(name, String(value)) },
    removeAttribute(name) { attrs.delete(name) },
    getAttribute(name) { return attrs.has(name) ? attrs.get(name) : null },
  }
}

test('package test script stays on the existing runner', () => {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
  assert.equal(pkg.scripts.test, 'node --test tests/*.test.mjs')
  assert.equal(pkg.dependencies['@clerk/react'], '6.18.2')
  assert.equal('sk_' in pkg, false)
})

test('appearance is stored only in localStorage and resolves light, dark and system', async () => {
  const appearance = await import('../src/features/profile/appearance.ts')
  const store = memoryStore()
  appearance.writeAppearance({ theme: 'dark', reduceMotion: true, underlineLinks: false, contrast: true }, store)
  assert.equal(store.getItem('lhamalog.theme'), 'dark')
  assert.equal(store.getItem('lhamalog.reduceMotion'), 'true')
  assert.equal(store.getItem('lhamalog.underlineLinks'), 'false')
  assert.equal(store.getItem('lhamalog.contrast'), 'true')
  assert.deepEqual(appearance.readAppearance(store), {
    theme: 'dark', reduceMotion: true, underlineLinks: false, contrast: true,
  })
  appearance.writeAppearance({ theme: 'light', reduceMotion: false, underlineLinks: true, contrast: false }, store)
  assert.equal(appearance.readAppearance(store).theme, 'light')
  assert.equal(store.getItem('lhamalog.underlineLinks'), 'true')
  store.setItem('lhamalog.theme', 'nope')
  assert.equal(appearance.readAppearance(store).theme, 'system')
  assert.equal(appearance.resolvedTheme('light', true), 'light')
  assert.equal(appearance.resolvedTheme('dark', false), 'dark')
  assert.equal(appearance.resolvedTheme('system', true), 'dark')
  assert.equal(appearance.resolvedTheme('system', false), 'light')
  const root = element()
  appearance.applyAppearance(root, { theme: 'system', reduceMotion: true, underlineLinks: false, contrast: true }, true)
  assert.equal(root.getAttribute('data-theme'), 'dark')
  assert.equal(root.getAttribute('data-reduce-motion'), 'true')
  assert.equal(root.getAttribute('data-underline-links'), null)
  assert.equal(root.getAttribute('data-contrast'), 'true')
  appearance.clearAppearance(root)
  assert.equal(root.getAttribute('data-theme'), null)
  assert.equal(root.getAttribute('data-reduce-motion'), null)
  assert.equal(root.getAttribute('data-contrast'), null)
  const memory = new Map()
  globalThis.localStorage = {
    getItem: (key) => memory.has(key) ? memory.get(key) : null,
    setItem: (key, value) => memory.set(String(key), String(value)),
    removeItem() { throw new Error('appearance storage must not be removed') },
    clear() {},
    key() { return null },
    get length() { return memory.size },
  }
  appearance.writeAppearance({ theme: 'dark', reduceMotion: true, underlineLinks: false, contrast: false })
  assert.equal(appearance.readAppearance().theme, 'dark')
  assert.equal(globalThis.localStorage.getItem('lhamalog.reduceMotion'), 'true')
})

test('the current session is marked and cannot be revoked', async () => {
  const { markSessions, sessionsAfterRevoke, sessionHasTask } = await import('../src/features/profile/sessions.ts')
  const rows = markSessions([{ id: 'current' }, { id: 'other' }], 'current')
  assert.deepEqual(rows.find((row) => row.id === 'current'), { id: 'current', current: true, revocable: false })
  assert.deepEqual(rows.find((row) => row.id === 'other'), { id: 'other', current: false, revocable: true })
  assert.equal(markSessions([{ id: 'other' }], '').every((row) => row.current === false && row.revocable), true)
  assert.deepEqual(sessionsAfterRevoke([{ id: 'current' }, { id: 'other' }], 'other').map((row) => row.id), ['current'])
  assert.equal(sessionHasTask({ currentTask: { key: 'reset-password' } }, 'reset-password'), true)
  assert.equal(sessionHasTask({ tasks: [{ key: 'reset-password' }] }, 'reset-password'), true)
  assert.equal(sessionHasTask({ currentTask: { key: 'setup-mfa' }, tasks: [] }, 'reset-password'), false)
  assert.equal(sessionHasTask(null, 'reset-password'), false)
})

test('profile photo is returned only when hasImage is true', async () => {
  const { profilePhotoSrc } = await import('../src/features/profile/photo.ts')
  assert.equal(profilePhotoSrc({ hasImage: false, imageUrl: 'https://cdn.example/avatar.png' }), null)
  assert.equal(profilePhotoSrc({ hasImage: true, imageUrl: ' https://cdn.example/avatar.png ' }), 'https://cdn.example/avatar.png')
  assert.equal(profilePhotoSrc({ hasImage: true, imageUrl: '   ' }), null)
  assert.equal(profilePhotoSrc(null), null)
  assert.equal(profilePhotoSrc(undefined), null)
})

test('time zones filter by name or offset and expose the current offset', async () => {
  const { filterTimeZones, timeZoneOffset, formatTimeZonePreview, timeZoneOptions } = await import('../src/features/profile/timeZones.ts')
  assert.equal(timeZoneOffset('America/Sao_Paulo', now), 'UTC-03:00')
  assert.equal(timeZoneOffset('UTC', now), 'UTC+00:00')
  assert.equal(timeZoneOffset('Asia/Kolkata', now), 'UTC+05:30')
  const byName = filterTimeZones('Sao_Paulo', undefined, now)
  assert.ok(byName.includes('America/Sao_Paulo'))
  assert.ok(byName.every((zone) => zone.toLowerCase().includes('sao_paulo')))
  for (const query of ['-03:00', 'UTC-3', 'utc-03:00', 'GMT-3']) {
    assert.ok(filterTimeZones(query, undefined, now).includes('America/Sao_Paulo'), query)
  }
  assert.ok(filterTimeZones('-3', undefined, now).includes('America/Sao_Paulo'))
  assert.equal(filterTimeZones('-3', undefined, now).includes('Pacific/Kiritimati'), false)
  assert.deepEqual(filterTimeZones('   ', ['UTC', 'America/Sao_Paulo'], now), ['UTC', 'America/Sao_Paulo'])
  assert.ok(timeZoneOptions().includes('America/Sao_Paulo'))
  assert.notEqual(formatTimeZonePreview('pt-BR', 'America/Sao_Paulo', now), '')
  assert.equal(formatTimeZonePreview('pt-BR', 'Brasilia', now), '')
})

test('organization roles map to message keys and a missing date stays empty', async () => {
  const { membershipRoleMessageKey, membershipStartedAt } = await import('../src/features/profile/membership.ts')
  assert.equal(membershipRoleMessageKey('org:admin'), 'profile.role.admin')
  assert.equal(membershipRoleMessageKey('org:member'), 'profile.role.member')
  assert.equal(membershipRoleMessageKey('custom:role'), null)
  assert.equal(membershipRoleMessageKey(''), null)
  assert.equal(membershipStartedAt(null), null)
  assert.equal(membershipStartedAt(undefined), null)
  assert.equal(membershipStartedAt(''), null)
  assert.equal(membershipStartedAt('not-a-date'), null)
  assert.equal(membershipStartedAt(new Date('2024-01-02T00:00:00.000Z'))?.toISOString(), '2024-01-02T00:00:00.000Z')
  assert.equal(membershipStartedAt('2024-03-04T12:00:00.000Z')?.toISOString(), '2024-03-04T12:00:00.000Z')
})

test('help reuses the footer destinations', async () => {
  const { footerLinks } = await import('../src/app/layouts/footerLinks.ts')
  assert.deepEqual(footerLinks.map((link) => link.href), ['#privacidade', '#termos', '#suporte'])
  assert.deepEqual(footerLinks.map((link) => link.labelKey), ['shell.privacy', 'shell.terms', 'shell.support'])
})

test('hub and notification phrases exist in both catalogs and pairing phrases do not', async () => {
  const { messageCatalogKeys, profileMessage } = await import('../src/features/profile/messages.ts')
  const required = [
    'profile.edit', 'profile.bio', 'profile.jobTitle', 'profile.email', 'profile.role', 'profile.company',
    'profile.memberSince', 'profile.memberSinceUnavailable', 'profile.role.admin', 'profile.role.member',
    'profile.sections', 'profile.section.account', 'profile.section.preferences', 'profile.section.notifications',
    'profile.section.security', 'profile.section.help', 'profile.error.bio', 'profile.error.bioControl',
    'profile.error.jobTitle', 'profile.error.jobTitleControl', 'profile.photo.change', 'profile.photo.error',
    'profile.timezoneSearch', 'profile.timezoneOffset', 'profile.theme', 'profile.theme.light', 'profile.theme.dark',
    'profile.theme.system', 'profile.accessibility', 'profile.reduceMotion', 'profile.underlineLinks',
    'profile.contrast', 'profile.appearanceLocal', 'profile.security.status', 'profile.security.active',
    'profile.security.inactive', 'profile.security.statusError', 'profile.security.retry',
    'profile.security.currentPassword', 'profile.security.newPassword', 'profile.security.disable',
    'profile.security.disableError', 'profile.security.password', 'profile.security.changePassword',
    'profile.security.passwordSaved', 'profile.security.passwordError', 'profile.security.sessions',
    'profile.security.currentSession', 'profile.security.otherSession', 'profile.security.noOtherSessions',
    'profile.security.revoke', 'profile.security.revokeError', 'profile.security.sessionsError',
    'notifications.title', 'notifications.description', 'notifications.loading', 'notifications.loadError',
    'notifications.invalid', 'notifications.saved', 'notifications.notConfirmed', 'notifications.saveError',
    'notifications.reload', 'notifications.channels', 'notifications.web', 'notifications.email',
    'notifications.push', 'notifications.products', 'notifications.allProducts', 'notifications.productsEmpty',
    'notifications.types', 'notifications.allTypes', 'notifications.typesEmpty', 'notifications.severities',
    'notifications.allSeverities', 'notifications.severitiesEmpty', 'notifications.unavailable',
    'notifications.cancel', 'notifications.saving', 'notifications.save',
  ]
  const portuguese = messageCatalogKeys('pt-BR')
  const english = messageCatalogKeys('en')
  assert.deepEqual(portuguese, english)
  for (const key of required) assert.ok(portuguese.includes(key), key)
  const forbidden = /pareamento|pairing|qrcode|(^|[._])qr($|[._])|(^|[._])uri($|[._])|codigo|(^|[._])code($|[._])|secret|totp|otp/i
  for (const key of portuguese) assert.equal(forbidden.test(key), false, key)
  for (const key of ['profile.section.account', 'profile.section.help', 'notifications.title', 'notifications.web', 'profile.security.disable', 'profile.security.currentPassword', 'profile.security.newPassword', 'profile.security.statusError']) {
    assert.notEqual(profileMessage('pt-BR', key), profileMessage('en', key), key)
  }
  assert.equal(profileMessage('en', 'notifications.unavailable', { id: 'tipo-1' }), 'Unavailable item (tipo-1) — uncheck to remove')
})
