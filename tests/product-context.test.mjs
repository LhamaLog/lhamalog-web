import { register } from 'node:module'
import { test } from 'node:test'
import assert from 'node:assert/strict'

register(new URL('./resolve-ts.mjs', import.meta.url))

const full = {
  functionalDescription: 'Processa os pagamentos da plataforma.',
  personality: 'DETAILED',
  responseLanguage: 'en-US',
  architecture: ['Java 25', 'Spring Boot'],
  scope: ['Autorização e captura de pagamentos', 'Estornos e cancelamentos'],
  sensitiveData: ['Dados de cartão e financeiros'],
}

function valid(partial = {}) {
  return { ...full, ...partial }
}

test('readProductContext keeps a complete context and fills Core defaults for missing or wrong fields', async () => {
  const { readProductContext } = await import('../src/features/products/context.ts')
  assert.deepEqual(readProductContext(full), full)
  const empty = {
    functionalDescription: '',
    personality: 'STANDARD',
    responseLanguage: 'pt-BR',
    architecture: [],
    scope: [],
    sensitiveData: [],
  }
  assert.deepEqual(readProductContext(undefined), empty)
  assert.deepEqual(readProductContext({}), empty)
  assert.deepEqual(readProductContext({ problemSolved: 'campo antigo', keywords: 'antigo' }), empty)
  assert.deepEqual(
    readProductContext({ functionalDescription: 42, personality: 'LOUD', responseLanguage: '', architecture: 'Java', scope: ['ok', 7, null], sensitiveData: null }),
    { ...empty, scope: ['ok'] },
  )
  assert.equal(readProductContext({ responseLanguage: 'es-419' }).responseLanguage, 'es-419')
})

test('cleanContext trims, drops empty and repeated items ignoring case, and keeps the order', async () => {
  const { cleanContext } = await import('../src/features/products/context.ts')
  const cleaned = cleanContext(valid({
    functionalDescription: '  Processa pagamentos.  ',
    responseLanguage: ' pt-BR ',
    architecture: [' Java ', 'java', '', '   ', 'MongoDB', 'JAVA'],
    scope: ['b', 'a', ' b '],
    sensitiveData: ['  '],
  }))
  assert.equal(cleaned.functionalDescription, 'Processa pagamentos.')
  assert.equal(cleaned.responseLanguage, 'pt-BR')
  assert.deepEqual(cleaned.architecture, ['Java', 'MongoDB'])
  assert.deepEqual(cleaned.scope, ['b', 'a'])
  assert.deepEqual(cleaned.sensitiveData, [])
})

test('contextFieldErrors requires the functional description and mirrors the Core limits', async () => {
  const { contextFieldErrors } = await import('../src/features/products/context.ts')
  assert.deepEqual(contextFieldErrors(valid()), {})
  assert.deepEqual(contextFieldErrors(valid({ functionalDescription: '' })), { 'context.functionalDescription': 'Informe a descrição funcional.' })
  assert.deepEqual(contextFieldErrors(valid({ functionalDescription: '   ' })), { 'context.functionalDescription': 'Informe a descrição funcional.' })
  assert.deepEqual(contextFieldErrors(valid({ functionalDescription: 'a'.repeat(2000) })), {})
  assert.deepEqual(contextFieldErrors(valid({ functionalDescription: 'a'.repeat(2001) })), {
    'context.functionalDescription': 'A descrição funcional excede o limite de 2000 caracteres.',
  })
  const thirty = Array.from({ length: 30 }, (_, index) => `item ${index}`)
  assert.deepEqual(contextFieldErrors(valid({ scope: thirty })), {})
  assert.deepEqual(contextFieldErrors(valid({ scope: [...thirty, 'item 30'] })), { 'context.scope': 'Limite de 30 itens.' })
  assert.deepEqual(contextFieldErrors(valid({ architecture: ['a'.repeat(80)] })), {})
  assert.deepEqual(contextFieldErrors(valid({ architecture: ['a'.repeat(81)] })), { 'context.architecture': 'O item excede o limite de 80 caracteres.' })
  assert.deepEqual(contextFieldErrors(valid({ scope: ['a'.repeat(200)], sensitiveData: ['a'.repeat(200)] })), {})
  assert.deepEqual(contextFieldErrors(valid({ scope: ['a'.repeat(201)] })), { 'context.scope': 'O item excede o limite de 200 caracteres.' })
  assert.deepEqual(contextFieldErrors(valid({ sensitiveData: ['a'.repeat(201)] })), { 'context.sensitiveData': 'O item excede o limite de 200 caracteres.' })
  assert.deepEqual(contextFieldErrors(valid({ responseLanguage: 'português' })), { 'context.responseLanguage': 'Idioma inválido.' })
  assert.deepEqual(contextFieldErrors(valid({ responseLanguage: 'pt-BR-aaaaaaaa-bbbbbbbb' })), { 'context.responseLanguage': 'Idioma inválido.' })
  assert.deepEqual(contextFieldErrors(valid({ responseLanguage: 'es-419' })), {})
  assert.deepEqual(contextFieldErrors(valid({ personality: 'LOUD' })), { 'context.personality': 'Personalidade inválida.' })
})

test('contextErrorFor sends indexed Core errors to the field', async () => {
  const { contextErrorFor } = await import('../src/features/products/context.ts')
  const errors = { 'context.scope[1]': 'O item excede o limite.', name: 'Informe o nome do produto.' }
  assert.equal(contextErrorFor(errors, 'scope'), 'O item excede o limite.')
  assert.equal(contextErrorFor({ 'context.architecture': 'Limite de 30 itens.' }, 'architecture'), 'Limite de 30 itens.')
  assert.equal(contextErrorFor({ 'context.functionalDescription': 'Obrigatório.' }, 'functionalDescription'), 'Obrigatório.')
  assert.equal(contextErrorFor(errors, 'sensitiveData'), undefined)
  assert.equal(contextErrorFor({ 'context.scopeExtra': 'outro' }, 'scope'), undefined)
})

test('addListItem appends to the end and refuses empty, repeated, the 31st item and long items', async () => {
  const { addListItem } = await import('../src/features/products/context.ts')
  assert.deepEqual(addListItem(['Java'], '  MongoDB ', 'architecture'), { list: ['Java', 'MongoDB'] })
  assert.deepEqual(addListItem(['Java'], '   ', 'architecture'), { list: ['Java'] })
  assert.deepEqual(addListItem(['Java'], ' java ', 'architecture'), { list: ['Java'], error: 'O item já está na lista.' })
  const thirty = Array.from({ length: 30 }, (_, index) => `item ${index}`)
  assert.deepEqual(addListItem(thirty, 'novo', 'scope'), { list: thirty, error: 'Limite de 30 itens.' })
  assert.deepEqual(addListItem([], 'a'.repeat(81), 'architecture'), { list: [], error: 'O item excede o limite de 80 caracteres.' })
  assert.deepEqual(addListItem([], 'a'.repeat(200), 'scope'), { list: ['a'.repeat(200)] })
  assert.deepEqual(addListItem([], 'a'.repeat(201), 'sensitiveData'), { list: [], error: 'O item excede o limite de 200 caracteres.' })
})

test('removeListItem and moveListItem keep the other items in order', async () => {
  const { removeListItem, moveListItem } = await import('../src/features/products/context.ts')
  const list = ['a', 'b', 'c']
  assert.deepEqual(removeListItem(list, 1), ['a', 'c'])
  assert.deepEqual(removeListItem(list, 5), ['a', 'b', 'c'])
  assert.deepEqual(moveListItem(list, 0, 2), ['b', 'c', 'a'])
  assert.deepEqual(moveListItem(list, 2, 0), ['c', 'a', 'b'])
  assert.deepEqual(moveListItem(list, 1, 0), ['b', 'a', 'c'])
  assert.deepEqual(moveListItem(list, 0, -1), ['a', 'b', 'c'])
  assert.deepEqual(moveListItem(list, 2, 3), ['a', 'b', 'c'])
  assert.deepEqual(list, ['a', 'b', 'c'])
})

test('languageOptions offers pt-BR, en-US and es-ES and keeps a stored code outside the list', async () => {
  const { languageOptions, personalityOptions } = await import('../src/features/products/context.ts')
  assert.deepEqual(languageOptions('pt-BR').map((option) => option.value), ['pt-BR', 'en-US', 'es-ES'])
  assert.equal(languageOptions('pt-BR')[0].label, 'Português (Brasil)')
  assert.deepEqual(languageOptions('es-419').map((option) => option.value), ['pt-BR', 'en-US', 'es-ES', 'es-419'])
  assert.deepEqual(personalityOptions.map((option) => [option.value, option.label]), [['SIMPLE', 'Simples'], ['STANDARD', 'Padrão'], ['DETAILED', 'Detalhado']])
})

test('firstTabWithError opens the first tab with an error in tab order', async () => {
  const { firstTabWithError } = await import('../src/features/products/context.ts')
  assert.equal(firstTabWithError({ name: 'x', 'context.functionalDescription': 'y' }), 'info')
  assert.equal(firstTabWithError({ 'context.functionalDescription': 'y' }), 'context')
  assert.equal(firstTabWithError({ 'context.scope[0]': 'y' }), 'context')
  assert.equal(firstTabWithError({}), null)
})
