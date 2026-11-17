import { register } from 'node:module'
import { test } from 'node:test'
import assert from 'node:assert/strict'
register(new URL('./resolve-ts.mjs', import.meta.url))
const model = await import('../src/features/notificationPreferences/model.ts')
const all = { all: true, ids: [] }
const defaults = { web: true, email: false, push: false, products: all, types: all, severities: all, version: null }

test('preferences parser rejects malformed responses instead of inventing defaults', () => {
  assert.deepEqual(model.readPreferences(defaults), defaults)
  for (const invalid of [null, [], {}, { ...defaults, web: false }, { ...defaults, email: 'false' },
    { ...defaults, version: -1 }, { ...defaults, version: 0.5 },
    { ...defaults, products: { all: false, ids: [] } },
    { ...defaults, types: { all: true, ids: ['x'] } },
    { ...defaults, severities: { all: false, ids: ['x','x'] } }])
    assert.equal(model.readPreferences(invalid), null)
})
test('empty catalog is valid and different from an invalid catalog response', () => {
  assert.deepEqual(model.readCatalog({ types: [], severities: [] }), { types: [], severities: [] })
  assert.equal(model.readCatalog(null), null)
  assert.equal(model.readCatalog({ types: {}, severities: [] }), null)
  assert.equal(model.readCatalog({ types: [{ id: 'a', label: 'A' }, { id: 'a', label: 'B' }], severities: [] }), null)
  assert.equal(model.readProducts({}), null)
  assert.deepEqual(model.readProducts([{ id: 'p1', name: 'Produto' }]), [{ id: 'p1', label: 'Produto' }])
})
test('specific filters require available selections; all is explicit', () => {
  const catalog = { types: [{ id: 'test-event', label: 'Teste' }], severities: [] }
  const specific = { ...defaults, types: { all: false, ids: ['test-event'] } }
  assert.deepEqual(model.preferenceErrors(specific, catalog, []), [])
  assert.equal(model.preferenceErrors({ ...specific, products: { all: false, ids: ['other-tenant'] } }, catalog, []).length, 1)
  assert.equal(model.preferenceErrors(specific, { types: [], severities: [] }, []).length, 1)
  assert.equal(model.preferenceErrors({ ...defaults, products: { all: false, ids: [] } }, catalog, []).length, 1)
})
test('payload contains only contract fields, and confirmation requires matching data and newer version', () => {
  const payload = model.preferencePayload({ ...defaults, userId: 'forged', tenantId: 'forged' })
  assert.deepEqual(payload, defaults)
  assert.notEqual(payload.products, defaults.products)
  assert.equal(model.confirmedPreferences(payload, { ...payload, version: 0 }), true)
  assert.equal(model.confirmedPreferences(payload, { ...payload, email: true, version: 0 }), false)
  assert.equal(model.confirmedPreferences({ ...payload, version: 3 }, { ...payload, version: 3 }), false)
  assert.equal(model.confirmedPreferences(payload, payload), false)
})
