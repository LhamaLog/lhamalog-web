import { register } from 'node:module'
import { test } from 'node:test'
import assert from 'node:assert/strict'

register(new URL('./resolve-ts.mjs', import.meta.url))

const nameInUse = 'Já existe um produto com este nome nesta empresa. Ele pode estar arquivado.'

// Same shape as ApiError (status, serverMessage); the function reads the error by its shape.
function refusal(status, serverMessage) {
  return { status, serverMessage, message: serverMessage, fieldErrors: {}, code: '' }
}

test('the 409 with the message of the contract is the name in use (clarify W1)', async () => {
  const { isNameInUse } = await import('../src/features/products/productErrors.ts')
  assert.equal(isNameInUse(refusal(409, nameInUse)), true)
  assert.equal(isNameInUse(refusal(409, ` ${nameInUse} `)), true)
})

test('the other 409 of product and other statuses are not the name in use', async () => {
  const { isNameInUse } = await import('../src/features/products/productErrors.ts')
  assert.equal(isNameInUse(refusal(409, 'Os dados foram alterados. Recarregue antes de salvar novamente.')), false)
  assert.equal(isNameInUse(refusal(409, 'Produto arquivado não pode ser editado.')), false)
  assert.equal(isNameInUse(refusal(400, nameInUse)), false)
  assert.equal(isNameInUse(refusal(409, '')), false)
  assert.equal(isNameInUse(new Error(nameInUse)), false)
  assert.equal(isNameInUse(null), false)
})

test('the refusal becomes the error of the name field and the notice that nothing was saved (clarify N1)', async () => {
  const { nameInUseErrors, nameInUseNotice } = await import('../src/features/products/productErrors.ts')
  assert.equal(nameInUseNotice, 'Nada foi salvo: confira o nome do produto.')
  assert.deepEqual(nameInUseErrors(refusal(409, nameInUse)), { name: nameInUse })
})

test('a name refusal in an edition with two parts stops before the context (FR-W04)', async () => {
  const { saveEdits, generalOf } = await import('../src/features/products/productEdit.ts')
  const { isNameInUse } = await import('../src/features/products/productErrors.ts')
  const context = { functionalDescription: 'Processa.', personality: 'STANDARD', responseLanguage: 'pt-BR', architecture: [], scope: [], sensitiveData: [] }
  const product = { id: 'p-1', tenantId: 't-1', name: 'API', description: '', category: 'Financeiro', productVersion: '', status: 'CONFIGURING', createdAt: '', context, version: 3, archivedAt: null }
  const calls = []
  const request = async (path) => {
    calls.push(path)
    throw refusal(409, nameInUse)
  }
  await assert.rejects(
    saveEdits(request, product, { ...generalOf(product), name: 'API Pagamentos' }, { ...context, scope: ['Estorno'] }),
    (error) => isNameInUse(error),
  )
  assert.deepEqual(calls, ['/api/products/p-1'])
})
