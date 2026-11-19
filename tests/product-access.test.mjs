import { register } from 'node:module'
import { test } from 'node:test'
import assert from 'node:assert/strict'

register(new URL('./resolve-ts.mjs', import.meta.url))

test('readProductAccess validates allProducts and productIds', async () => {
  const { readProductAccess } = await import('../src/features/team/productAccess.ts')
  assert.deepEqual(readProductAccess({ userId: 'user_bruno', allProducts: false, productIds: ['p-1', 'p-2'] }),
    { userId: 'user_bruno', allProducts: false, productIds: ['p-1', 'p-2'] })
  assert.equal(readProductAccess({ userId: 'user_ana', allProducts: true, productIds: [] }).allProducts, true)
  assert.equal(readProductAccess({ userId: 'user_bruno', allProducts: 'no', productIds: [] }), null)
  assert.equal(readProductAccess({ userId: 'user_bruno', allProducts: false, productIds: [1] }), null)
  assert.equal(readProductAccess({ allProducts: false, productIds: [] }), null)
})

test('productAccessPath encodes the user and refuses an empty or too long one', async () => {
  const { productAccessPath } = await import('../src/features/team/productAccess.ts')
  assert.equal(productAccessPath('user_bruno'), '/api/company/members/user_bruno/products')
  assert.equal(productAccessPath('a/b c'), '/api/company/members/a%2Fb%20c/products')
  assert.equal(productAccessPath(''), null)
  assert.equal(productAccessPath('u'.repeat(201)), null)
})

test('active and archived products become one list, sorted by name, without repetition', async () => {
  const { productOptions } = await import('../src/features/team/productAccess.ts')
  const active = [{ id: 'p-2', name: 'Pagamentos', archivedAt: null }, { id: 'p-1', name: 'Autenticação' }]
  const archived = [{ id: 'p-3', name: 'Boletos', archivedAt: '2026-11-01T00:00:00Z' }, { id: 'p-1', name: 'Autenticação' }]
  assert.deepEqual(productOptions(active, archived), [
    { id: 'p-1', name: 'Autenticação', archived: false },
    { id: 'p-3', name: 'Boletos', archived: true },
    { id: 'p-2', name: 'Pagamentos', archived: false },
  ])
  assert.equal(productOptions({}, []), null)
  assert.equal(productOptions([{ name: 'Sem id' }], []), null)
})

test('toggling a product adds or removes it', async () => {
  const { toggleProduct } = await import('../src/features/team/productAccess.ts')
  assert.deepEqual(toggleProduct(['p-1'], 'p-2'), ['p-1', 'p-2'])
  assert.deepEqual(toggleProduct(['p-1', 'p-2'], 'p-1'), ['p-2'])
})

test('Core refusals become the screen messages', async () => {
  const { productAccessErrorMessage, fullAccessMessage } = await import('../src/features/team/productAccess.ts')
  assert.equal(fullAccessMessage, 'Acessa todos os Produtos.')
  assert.equal(productAccessErrorMessage('full_access'), fullAccessMessage)
  assert.equal(productAccessErrorMessage('product_not_found'), 'Um produto não existe mais nesta empresa. Confira a lista.')
  assert.equal(productAccessErrorMessage('other'), null)
})
