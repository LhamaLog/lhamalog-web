import { register } from 'node:module'
import { test } from 'node:test'
import assert from 'node:assert/strict'

register(new URL('./resolve-ts.mjs', import.meta.url))

const query = () => import('../src/features/occurrences/occurrenceQuery.ts')
const labels = () => import('../src/features/occurrences/labels.ts')

const NOW = new Date('2026-11-20T12:00:00.000Z')

// labels.ts (T003)

test('each type has its label and the tone of the SeverityIndicator', async () => {
  const { typeLabel, typeSeverity } = await labels()
  assert.deepEqual(['ERROR', 'WARNING', 'INFO'].map(typeLabel), ['Erro', 'Alerta', 'Informação'])
  assert.deepEqual(['ERROR', 'WARNING', 'INFO'].map(typeSeverity), ['error', 'warning', 'info'])
})

test('each status has its Portuguese label and badge tone', async () => {
  const { statusLabel, statusTone } = await labels()
  assert.deepEqual(['ABERTA', 'EM_ANALISE', 'FECHADA'].map(statusLabel), ['Aberta', 'Em análise', 'Fechada'])
  assert.deepEqual(['ABERTA', 'EM_ANALISE', 'FECHADA'].map(statusTone), ['danger', 'warning', 'success'])
})

test('the author of a status change is "Sistema" for the system and the id for a person', async () => {
  const { changedByLabel } = await labels()
  assert.equal(changedByLabel({ type: 'SYSTEM', id: 'modulo-ocorrencia' }), 'Sistema')
  assert.equal(changedByLabel({ type: 'USER', id: 'user_1' }), 'user_1')
  assert.equal(changedByLabel({ type: 'USER', id: null }), 'Usuário')
})

test('known attributes get a label and extracted fields keep their name', async () => {
  const { attributeLabel } = await labels()
  assert.deepEqual(['host.name', 'service.name', 'trace_id', 'correlation_id', 'module_id', 'line_number'].map(attributeLabel),
    ['Host', 'Serviço', 'Trace ID', 'Correlation ID', 'Módulo', 'Linha'])
  assert.equal(attributeLabel('http.route'), 'http.route')
})

test('sensitive data is Sim, Não or hidden when unknown', async () => {
  const { sensitiveDataLabel } = await labels()
  assert.equal(sensitiveDataLabel(true), 'Dados sensíveis mascarados: Sim')
  assert.equal(sensitiveDataLabel(false), 'Dados sensíveis mascarados: Não')
  assert.equal(sensitiveDataLabel(null), null)
})

test('the count reads in Portuguese', async () => {
  const { countLabel } = await labels()
  assert.equal(countLabel(1), '1 ocorrência')
  assert.equal(countLabel(1280), '1.280 ocorrências')
})

// occurrenceQuery.ts, page and size (T009)

test('an empty address is the default list', async () => {
  const { readOccurrenceQuery, defaultOccurrenceQuery } = await query()
  assert.deepEqual(readOccurrenceQuery(new URLSearchParams('')), defaultOccurrenceQuery())
  assert.deepEqual(defaultOccurrenceQuery(), { q: '', types: [], statuses: [], productIds: [], period: 'all', page: 1, size: 20, archived: false })
})

test('valid page and size are read; invalid ones fall back to 1 and 20', async () => {
  const { readOccurrenceQuery } = await query()
  const valid = readOccurrenceQuery(new URLSearchParams('page=3&size=50'))
  assert.equal(valid.page, 3)
  assert.equal(valid.size, 50)
  for (const [page, size] of [['abc', '7'], ['0', 'abc'], ['-2', '0'], ['1.5', '20.0']]) {
    const read = readOccurrenceQuery(new URLSearchParams({ page, size }))
    assert.equal(read.page, 1, `page=${page}`)
    assert.equal(read.size, 20, `size=${size}`)
  }
})

test('writing leaves the default values out', async () => {
  const { writeOccurrenceQuery, defaultOccurrenceQuery } = await query()
  assert.equal(writeOccurrenceQuery(defaultOccurrenceQuery()).toString(), '')
  assert.equal(writeOccurrenceQuery({ ...defaultOccurrenceQuery(), page: 2, size: 10 }).toString(), 'page=2&size=10')
})

test('the Core path always carries page and size', async () => {
  const { occurrencesPath, defaultOccurrenceQuery } = await query()
  assert.equal(occurrencesPath(defaultOccurrenceQuery(), NOW), '/api/occurrences?page=1&size=20')
  assert.equal(occurrencesPath({ ...defaultOccurrenceQuery(), page: 4, size: 50 }, NOW), '/api/occurrences?page=4&size=50')
})

// occurrenceQuery.ts, filters and search (T015)

test('repeated types, statuses and products are read without unknown or repeated values', async () => {
  const { readOccurrenceQuery } = await query()
  const read = readOccurrenceQuery(new URLSearchParams(
    'type=ERROR&type=XYZ&type=ERROR&type=INFO&status=ABERTA&status=aberta&status=FECHADA&productId=p1&productId=&productId=p1&productId=p2'))
  assert.deepEqual(read.types, ['ERROR', 'INFO'])
  assert.deepEqual(read.statuses, ['ABERTA', 'FECHADA'])
  assert.deepEqual(read.productIds, ['p1', 'p2'])
})

test('the period accepts the presets and anything else is the whole period', async () => {
  const { readOccurrenceQuery } = await query()
  for (const period of ['24h', '7d', '30d']) assert.equal(readOccurrenceQuery(new URLSearchParams({ periodo: period })).period, period)
  assert.equal(readOccurrenceQuery(new URLSearchParams('periodo=1y')).period, 'all')
})

test('the search is cut at 200 characters', async () => {
  const { readOccurrenceQuery } = await query()
  assert.equal(readOccurrenceQuery(new URLSearchParams({ q: 'a'.repeat(250) })).q.length, 200)
})

test('the address of quickstart O19 reads as the default list', async () => {
  const { readOccurrenceQuery, defaultOccurrenceQuery } = await query()
  assert.deepEqual(readOccurrenceQuery(new URLSearchParams('type=XYZ&page=abc&size=7')), defaultOccurrenceQuery())
})

test('the Core path carries every filter and the search, trimmed', async () => {
  const { occurrencesPath, defaultOccurrenceQuery } = await query()
  const path = occurrencesPath({
    ...defaultOccurrenceQuery(), q: '  time out  ', types: ['ERROR'], statuses: ['ABERTA', 'EM_ANALISE'],
    productIds: ['p1', 'p2'], period: '7d', page: 2,
  }, NOW)
  const params = new URL(path, 'http://core').searchParams
  assert.ok(path.startsWith('/api/occurrences?'))
  assert.equal(params.get('page'), '2')
  assert.deepEqual(params.getAll('type'), ['ERROR'])
  assert.deepEqual(params.getAll('status'), ['ABERTA', 'EM_ANALISE'])
  assert.deepEqual(params.getAll('productId'), ['p1', 'p2'])
  assert.equal(params.get('from'), '2026-11-13T12:00:00.000Z')
  assert.equal(params.get('q'), 'time out')
  assert.equal(params.get('to'), null)
})

test('from is computed from the clock for each preset and left out for the whole period', async () => {
  const { occurrencesPath, defaultOccurrenceQuery } = await query()
  const from = period => new URL(occurrencesPath({ ...defaultOccurrenceQuery(), period }, NOW), 'http://core').searchParams.get('from')
  assert.equal(from('24h'), '2026-11-19T12:00:00.000Z')
  assert.equal(from('7d'), '2026-11-13T12:00:00.000Z')
  assert.equal(from('30d'), '2026-10-21T12:00:00.000Z')
  assert.equal(from('all'), null)
})

test('a blank search is not sent to the Core', async () => {
  const { occurrencesPath, defaultOccurrenceQuery } = await query()
  assert.equal(occurrencesPath({ ...defaultOccurrenceQuery(), q: '   ' }, NOW), '/api/occurrences?page=1&size=20')
})

test('writing and reading the address gives the same query back', async () => {
  const { readOccurrenceQuery, writeOccurrenceQuery } = await query()
  const original = { q: 'jwt', types: ['ERROR', 'WARNING'], statuses: ['FECHADA'], productIds: ['p1'], period: '30d', page: 3, size: 10, archived: true }
  assert.deepEqual(readOccurrenceQuery(writeOccurrenceQuery(original)), original)
})

test('each filter group counts 1 and the search does not count', async () => {
  const { activeFilterCount, defaultOccurrenceQuery } = await query()
  assert.equal(activeFilterCount(defaultOccurrenceQuery()), 0)
  assert.equal(activeFilterCount({ ...defaultOccurrenceQuery(), q: 'timeout' }), 0)
  assert.equal(activeFilterCount({
    ...defaultOccurrenceQuery(), types: ['ERROR', 'INFO'], statuses: ['ABERTA'], productIds: ['p1', 'p2'], period: '7d',
  }), 4)
})

test('clearing removes search and filters, goes back to page 1 and keeps the page size', async () => {
  const { clearFilters, defaultOccurrenceQuery, hasFiltersOrSearch } = await query()
  const cleared = clearFilters({ q: 'x', types: ['ERROR'], statuses: ['ABERTA'], productIds: ['p1'], period: '24h', page: 5, size: 50 })
  assert.deepEqual(cleared, { ...defaultOccurrenceQuery(), size: 50 })
  assert.equal(hasFiltersOrSearch(cleared), false)
  assert.equal(hasFiltersOrSearch({ ...cleared, q: 'a' }), true)
})

// occurrenceView.ts

const view = () => import('../src/features/occurrences/occurrenceView.ts')

const item = {
  id: 'o-1', type: 'WARNING', title: 'Fila com alto volume', product: { id: 'p-1', name: 'queue-worker' }, count: 310,
  status: 'EM_ANALISE', recurring: true, firstSeenAt: '2026-11-18T10:00:00Z', lastSeenAt: '2026-11-20T15:04:00Z',
}

test('a Core item becomes the card with type tone, status badge, count, recurring and product', async () => {
  const { toCardItem } = await view()
  const card = toCardItem(item, 'pt-BR', 'America/Sao_Paulo')
  assert.equal(card.severity, 'warning')
  assert.equal(card.severityLabel, 'Alerta')
  assert.deepEqual(card.status, { label: 'Em análise', tone: 'warning' })
  assert.equal(card.recurringLabel, 'Recorrente')
  assert.equal(card.countLabel, '310 ocorrências')
  assert.equal(card.project, 'queue-worker')
  assert.equal(card.timeLabel, '12:04')
  assert.equal(card.dateTime, '2026-11-20T15:04:00Z')
  assert.equal(toCardItem({ ...item, recurring: false }, 'pt-BR').recurringLabel, undefined)
})

test('dates use the time zone of the profile and an invalid zone falls back to the browser', async () => {
  const { formatDateTime } = await view()
  assert.equal(formatDateTime('2026-11-20T15:04:00Z', 'pt-BR', 'Asia/Tokyo').time, '00:04')
  assert.ok(formatDateTime('2026-11-20T15:04:00Z', 'pt-BR', 'Nada/Zona'))
  assert.equal(formatDateTime(null, 'pt-BR'), null)
  assert.equal(formatDateTime('não é data', 'pt-BR'), null)
})

test('the status history is chronological', async () => {
  const { chronologicalHistory } = await view()
  const changes = [
    { from: 'ABERTA', to: 'EM_ANALISE', changedAt: '2026-11-19T10:00:00Z', changedBy: { type: 'USER', id: 'u' } },
    { from: null, to: 'ABERTA', changedAt: '2026-11-18T10:00:00Z', changedBy: { type: 'SYSTEM', id: 'm' } },
  ]
  assert.deepEqual(chronologicalHistory(changes).map(change => change.to), ['ABERTA', 'EM_ANALISE'])
})

// Spec 013 (LLT-136): situação da lista

test('the situation is read from situacao=arquivadas and anything else is the active list', async () => {
  const { readOccurrenceQuery, writeOccurrenceQuery, defaultOccurrenceQuery } = await query()
  assert.equal(defaultOccurrenceQuery().archived, false)
  assert.equal(readOccurrenceQuery(new URLSearchParams('situacao=arquivadas')).archived, true)
  assert.equal(readOccurrenceQuery(new URLSearchParams('situacao=todas')).archived, false)
  assert.equal(writeOccurrenceQuery({ ...defaultOccurrenceQuery(), archived: true }).toString(), 'situacao=arquivadas')
  assert.equal(writeOccurrenceQuery(defaultOccurrenceQuery()).toString(), '')
})

test('the Core path asks for the archived ones only when chosen, and the situation is not an active filter', async () => {
  const { occurrencesPath, activeFilterCount, clearFilters, defaultOccurrenceQuery } = await query()
  assert.equal(occurrencesPath({ ...defaultOccurrenceQuery(), archived: true }, NOW), '/api/occurrences?page=1&size=20&archived=true')
  assert.equal(occurrencesPath(defaultOccurrenceQuery(), NOW), '/api/occurrences?page=1&size=20')
  assert.equal(activeFilterCount({ ...defaultOccurrenceQuery(), archived: true }), 0)
  assert.equal(clearFilters({ ...defaultOccurrenceQuery(), archived: true, types: ['ERROR'] }).archived, false)
})

// Spec 013 (LLT-136): ações

const actions = () => import('../src/features/occurrences/occurrenceActions.ts')

test('each action has its route, method and body with the revision seen', async () => {
  const { statusAction, archiveAction, unarchiveAction } = await actions()
  assert.deepEqual(statusAction('o/1', 'FECHADA', 'rev-1'), { path: '/api/occurrences/o%2F1/status', method: 'PUT', body: { status: 'FECHADA', revision: 'rev-1' } })
  assert.deepEqual(archiveAction('o1', 'rev-2'), { path: '/api/occurrences/o1/archive', method: 'POST', body: { revision: 'rev-2' } })
  assert.deepEqual(unarchiveAction('o1', 'rev-3'), { path: '/api/occurrences/o1/unarchive', method: 'POST', body: { revision: 'rev-3' } })
})

test('the answer of an action is classified for the screen', async () => {
  const { actionFailure } = await actions()
  const { ApiError } = await import('../src/shared/services/api.ts')
  assert.deepEqual(actionFailure(new ApiError('A ocorrência mudou desde que você abriu. Recarregue e tente de novo.', 409, {}, 'occurrence_changed', 'A ocorrência mudou desde que você abriu. Recarregue e tente de novo.')),
    { kind: 'conflict', message: 'A ocorrência mudou desde que você abriu. Recarregue e tente de novo.' })
  assert.deepEqual(actionFailure(new ApiError('x', 404)), { kind: 'not-found' })
  assert.deepEqual(actionFailure(new ApiError('Confira os campos', 400, { status: 'Status desconhecido.' })), { kind: 'invalid', message: 'Status desconhecido.' })
  assert.deepEqual(actionFailure(new ApiError('Falhou', 500)), { kind: 'error', message: 'Falhou' })
  assert.deepEqual(actionFailure(new Error('rede')), { kind: 'error', message: 'Não foi possível concluir a ação. Tente novamente.' })
})

test('the success message names what changed', async () => {
  const { successMessage } = await actions()
  assert.equal(successMessage('status'), 'Status alterado')
  assert.equal(successMessage('archive'), 'Ocorrência arquivada')
  assert.equal(successMessage('unarchive'), 'Ocorrência desarquivada')
})

test('the author of a user change shows the member name when known', async () => {
  const { changedByLabel } = await labels()
  const names = new Map([['user_1', 'Ana Souza']])
  assert.equal(changedByLabel({ type: 'USER', id: 'user_1' }, names), 'Ana Souza')
  assert.equal(changedByLabel({ type: 'USER', id: 'user_2' }, names), 'user_2')
  assert.equal(changedByLabel({ type: 'SYSTEM', id: 'modulo-ocorrencia' }, names), 'Sistema')
})

test('an archived item shows the Arquivada badge on its card', async () => {
  const { toCardItem } = await view()
  assert.equal(toCardItem({ ...item, archived: true }, 'pt-BR').archivedLabel, 'Arquivada')
  assert.equal(toCardItem(item, 'pt-BR').archivedLabel, undefined)
})
