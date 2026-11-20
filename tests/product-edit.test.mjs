import { register } from 'node:module'
import { test } from 'node:test'
import assert from 'node:assert/strict'

register(new URL('./resolve-ts.mjs', import.meta.url))

const context = { functionalDescription: 'Processa pagamentos.', personality: 'DETAILED', responseLanguage: 'en', architecture: ['Java 25'], scope: ['Captura'], sensitiveData: [] }

function product(overrides = {}) {
  return {
    id: 'p-1', tenantId: 't-1', name: 'API de Pagamentos', description: 'Cobranças', category: 'Financeiro',
    productVersion: '2.4.1', status: 'CONFIGURING', createdAt: '2026-11-01T12:00:00Z', context, version: 3,
    archivedAt: null, ...overrides,
  }
}

test('changedParts tells which part changed, ignoring spaces at the ends', async () => {
  const { changedParts, generalOf } = await import('../src/features/products/productEdit.ts')
  const current = product()
  const general = generalOf(current)
  assert.deepEqual(changedParts(current, general, context), { general: false, context: false })
  assert.deepEqual(changedParts(current, { ...general, name: '  API de Pagamentos ' }, context), { general: false, context: false })
  assert.deepEqual(changedParts(current, { ...general, name: 'API de Cobranças' }, context), { general: true, context: false })
  assert.deepEqual(changedParts(current, general, { ...context, scope: ['Captura', 'Estorno'] }), { general: false, context: true })
  assert.deepEqual(changedParts(current, general, { ...context, scope: [' Captura '] }), { general: false, context: false })
  assert.deepEqual(changedParts(current, { ...general, productVersion: '2.5.0' }, { ...context, personality: 'SIMPLE' }), { general: true, context: true })
})

test('the general payload is trimmed and carries the version', async () => {
  const { generalPayload } = await import('../src/features/products/productEdit.ts')
  assert.deepEqual(generalPayload({ name: ' API ', description: ' x ', category: ' Financeiro ', productVersion: ' 1.0 ' }, 7),
    { name: 'API', description: 'x', category: 'Financeiro', productVersion: '1.0', version: 7 })
})

test('generalOf reads the general fields, empty for a new product', async () => {
  const { generalOf } = await import('../src/features/products/productEdit.ts')
  assert.deepEqual(generalOf(product()), { name: 'API de Pagamentos', description: 'Cobranças', category: 'Financeiro', productVersion: '2.4.1' })
  assert.deepEqual(generalOf(undefined), { name: '', description: '', category: '', productVersion: '' })
})

test('isArchived follows archivedAt', async () => {
  const { isArchived } = await import('../src/features/products/productEdit.ts')
  assert.equal(isArchived(product()), false)
  assert.equal(isArchived(product({ archivedAt: '2026-11-01T12:00:00Z' })), true)
  assert.equal(isArchived(undefined), false)
})

test('the required fields of the Figma and the Core limits give field errors', async () => {
  const { generalFieldErrors } = await import('../src/features/products/productEdit.ts')
  const { emptyProductDraft } = await import('../src/features/products/types.ts')
  const filled = { ...emptyProductDraft(), productType: 'Aplicação web', environment: 'Produção', owner: 'Mariana Costa' }
  const general = { name: 'API', description: '', category: 'Financeiro', productVersion: '' }
  assert.deepEqual(generalFieldErrors(general, filled), {})
  assert.deepEqual(Object.keys(generalFieldErrors({ name: ' ', description: '', category: '', productVersion: '' }, emptyProductDraft())).sort(),
    ['category', 'environment', 'name', 'owner', 'productType'])
  assert.equal(generalFieldErrors({ ...general, name: 'a'.repeat(201) }, filled).name, 'O nome pode ter até 200 caracteres.')
  assert.equal(generalFieldErrors({ ...general, category: 'a'.repeat(201) }, filled).category, 'A área pode ter até 200 caracteres.')
  assert.equal(generalFieldErrors({ ...general, productVersion: 'a'.repeat(201) }, filled).productVersion, 'A versão pode ter até 200 caracteres.')
  assert.equal(generalFieldErrors({ ...general, description: 'a'.repeat(10001) }, filled).description, 'A descrição pode ter até 10000 caracteres.')
  assert.equal(generalFieldErrors(general, { ...filled, teamEmail: 'sem-arroba' }).teamEmail, 'Informe um e-mail válido.')
  assert.deepEqual(generalFieldErrors(general, { ...filled, teamEmail: 'plataforma@empresa.com.br' }), {})
})

test('only organization administrators archive, like the Core', async () => {
  const { canArchive } = await import('../src/features/products/productEdit.ts')
  assert.equal(canArchive('org:admin'), true)
  assert.equal(canArchive('admin'), true)
  assert.equal(canArchive('org:member'), false)
  assert.equal(canArchive(null), false)
})

test('paths encode the product id', async () => {
  const { productPath, productContextPath, archivePath, unarchivePath } = await import('../src/features/products/productEdit.ts')
  assert.equal(productPath('p 1'), '/api/products/p%201')
  assert.equal(productContextPath('p/1'), '/api/products/p%2F1/context')
  assert.equal(archivePath('p-1'), '/api/products/p-1/archive')
  assert.equal(unarchivePath('p-1'), '/api/products/p-1/unarchive')
})

test('texts of the archive flow come from the spec', async () => {
  const { archiveQuestion, archivedMessage, unarchivedMessage, partialSaveMessage, archivedNotice } = await import('../src/features/products/productEdit.ts')
  assert.equal(archiveQuestion('API'), 'Arquivar API? O produto sai da lista de ativos e não pode ser editado até ser desarquivado. Os dados e o histórico continuam guardados.')
  assert.equal(archivedMessage('API'), 'Produto API arquivado.')
  assert.equal(unarchivedMessage('API'), 'Produto API desarquivado.')
  assert.equal(partialSaveMessage, 'Os dados gerais foram salvos, mas o contexto não. Confira e salve de novo.')
  assert.equal(archivedNotice, 'Este produto está arquivado. Desarquive para editar.')
})

test('the local draft keeps the new Figma fields and drops nothing it can still use', async () => {
  const { normalizeProductDraft } = await import('../src/features/products/draft.ts')
  const draft = normalizeProductDraft({ productType: 'API / Serviço', environment: 'Produção', owner: 'Mariana', teamEmail: 'a@b.com', tags: ['pagamentos', 3, ' backend '], otelTraces: true })
  assert.equal(draft.owner, 'Mariana')
  assert.equal(draft.teamEmail, 'a@b.com')
  assert.deepEqual(draft.tags, ['pagamentos', 'backend'])
  // The OpenTelemetry tab keeps traces in the draft (spec 011); its old fields left with the LLT-179.
  assert.equal(draft.otelTraces, true)
  assert.deepEqual(normalizeProductDraft({}).tags, [])
})

test('product type options are the ones of the Figma cards (clarify N1)', async () => {
  const { productTypes } = await import('../src/features/products/productEdit.ts')
  assert.deepEqual(productTypes, ['Aplicação web', 'API / Serviço', 'Aplicativo', 'Microsserviço', 'Job / Batch'])
})

test('owner options are the names of the organization people, without repetition and sorted (clarify N3)', async () => {
  const { ownerOptions } = await import('../src/features/products/productEdit.ts')
  assert.deepEqual(ownerOptions([
    { firstName: 'Mariana', lastName: 'Costa', identifier: 'mariana@empresa.com' },
    { firstName: '', lastName: '', identifier: 'ana@empresa.com' },
    { firstName: 'Mariana', lastName: 'Costa', identifier: 'mariana2@empresa.com' },
    { firstName: null, lastName: null, identifier: null },
  ]), ['ana@empresa.com', 'Mariana Costa'])
})

test('a tag is trimmed, repeated tags are ignored and the limits give a message', async () => {
  const { addTag, tagLimits } = await import('../src/features/products/productEdit.ts')
  assert.deepEqual(addTag(['backend'], '  pagamentos '), { tags: ['backend', 'pagamentos'] })
  assert.deepEqual(addTag(['backend'], 'Backend'), { tags: ['backend'] })
  assert.deepEqual(addTag(['backend'], '   '), { tags: ['backend'] })
  assert.equal(addTag([], 'x'.repeat(tagLimits.length + 1)).error, `A tag pode ter até ${tagLimits.length} caracteres.`)
  const full = Array.from({ length: tagLimits.items }, (_, index) => `t${index}`)
  assert.equal(addTag(full, 'nova').error, `Limite de ${tagLimits.items} tags.`)
})

test('creating requires the local fields of the Figma; editing an old product does not block on them', async () => {
  const { formFieldErrors, generalOf } = await import('../src/features/products/productEdit.ts')
  const { emptyProductDraft } = await import('../src/features/products/types.ts')
  const general = { ...generalOf(), name: 'API', category: 'Financeiro' }
  assert.deepEqual(Object.keys(formFieldErrors(general, emptyProductDraft(), false)).sort(), ['environment', 'owner', 'productType'])
  assert.deepEqual(formFieldErrors(general, emptyProductDraft(), true), {})
  assert.deepEqual(Object.keys(formFieldErrors({ ...general, name: ' ' }, { ...emptyProductDraft(), teamEmail: 'sem-arroba' }, true)).sort(), ['name', 'teamEmail'])
})

// Fake Core: records each call and answers with the product one version ahead, or fails on the given path.
function fakeCore(start, failOn) {
  const calls = []
  let current = start
  async function request(path, options = {}) {
    const body = options.body ? JSON.parse(options.body) : undefined
    calls.push({ path, method: options.method ?? 'GET', body })
    if (failOn && path.endsWith(failOn)) throw Object.assign(new Error('Os dados foram alterados. Recarregue antes de salvar novamente.'), { status: 409 })
    current = { ...current, ...(body?.context ? { context: body.context } : {}), ...(body?.name ? { name: body.name } : {}), version: current.version + 1 }
    return current
  }
  return { request, calls }
}

test('saving only the general data sends only PUT /api/products/{id} with the version (US3)', async () => {
  const { saveEdits, generalOf } = await import('../src/features/products/productEdit.ts')
  const start = product()
  const core = fakeCore(start)
  const result = await saveEdits(core.request, start, { ...generalOf(start), name: ' API Nova ' }, start.context)
  assert.deepEqual(core.calls, [{ path: '/api/products/p-1', method: 'PUT', body: { name: 'API Nova', description: 'Cobranças', category: 'Financeiro', productVersion: '2.4.1', version: 3 } }])
  assert.equal(result.kind, 'saved')
  assert.equal(result.product.version, 4)
})

test('saving only the context sends only PUT .../context', async () => {
  const { saveEdits, generalOf } = await import('../src/features/products/productEdit.ts')
  const start = product()
  const core = fakeCore(start)
  await saveEdits(core.request, start, generalOf(start), { ...start.context, scope: ['Captura', 'Estorno'] })
  assert.deepEqual(core.calls.map((call) => [call.method, call.path, call.body.version]), [['PUT', '/api/products/p-1/context', 3]])
})

test('saving both sends the general data first and chains the new version into the context (W1)', async () => {
  const { saveEdits, generalOf } = await import('../src/features/products/productEdit.ts')
  const start = product()
  const core = fakeCore(start)
  const result = await saveEdits(core.request, start, { ...generalOf(start), name: 'API Nova' }, { ...start.context, scope: ['Estorno'] })
  assert.deepEqual(core.calls.map((call) => [call.path, call.body.version]), [['/api/products/p-1', 3], ['/api/products/p-1/context', 4]])
  assert.equal(result.product.version, 5)
})

test('nothing changed: the Core is not called', async () => {
  const { saveEdits, generalOf } = await import('../src/features/products/productEdit.ts')
  const start = product()
  const core = fakeCore(start)
  assert.deepEqual(await saveEdits(core.request, start, generalOf(start), start.context), { kind: 'unchanged' })
  assert.deepEqual(core.calls, [])
})

test('general data saved and context refused: partial result with the new version (W1)', async () => {
  const { saveEdits, generalOf } = await import('../src/features/products/productEdit.ts')
  const start = product()
  const core = fakeCore(start, '/context')
  const result = await saveEdits(core.request, start, { ...generalOf(start), name: 'API Nova' }, { ...start.context, scope: ['Estorno'] })
  assert.equal(result.kind, 'partial')
  assert.equal(result.product.version, 4)
  assert.equal(result.product.name, 'API Nova')
  assert.equal(result.error.status, 409)
})

test('a refused general save or a refused context-only save is thrown as is', async () => {
  const { saveEdits, generalOf } = await import('../src/features/products/productEdit.ts')
  const start = product()
  await assert.rejects(saveEdits(fakeCore(start, '/p-1').request, start, { ...generalOf(start), name: 'X' }, start.context), { status: 409 })
  await assert.rejects(saveEdits(fakeCore(start, '/context').request, start, generalOf(start), { ...start.context, scope: [] }), { status: 409 })
})

test('archive and unarchive send POST with the version and return the product of the Core (US4)', async () => {
  const { setArchived } = await import('../src/features/products/productEdit.ts')
  const calls = []
  const request = async (path, options) => {
    calls.push({ path, method: options.method, body: JSON.parse(options.body) })
    return product({ version: 4, archivedAt: path.endsWith('/archive') ? '2026-11-20T10:00:00Z' : null })
  }
  const archived = await setArchived(request, product({ id: 'a/b' }), true)
  assert.equal(archived.archivedAt, '2026-11-20T10:00:00Z')
  await setArchived(request, product({ version: 4, archivedAt: '2026-11-20T10:00:00Z' }), false)
  assert.deepEqual(calls, [
    { path: '/api/products/a%2Fb/archive', method: 'POST', body: { version: 3 } },
    { path: '/api/products/p-1/unarchive', method: 'POST', body: { version: 4 } },
  ])
})

test('the confirmation texts name the product (US4)', async () => {
  const { archiveQuestion, unarchiveQuestion } = await import('../src/features/products/productEdit.ts')
  assert.equal(archiveQuestion('API'), 'Arquivar API? O produto sai da lista de ativos e não pode ser editado até ser desarquivado. Os dados e o histórico continuam guardados.')
  assert.equal(unarchiveQuestion('API'), 'Desarquivar API? O produto volta para a lista de ativos e pode ser editado de novo.')
})
