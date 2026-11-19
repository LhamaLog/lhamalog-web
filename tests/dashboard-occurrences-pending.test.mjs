import { register } from 'node:module'
import { test } from 'node:test'
import assert from 'node:assert/strict'

register(new URL('./resolve-ts.mjs', import.meta.url))

const {
  isOccurrencesPending,
  seriesHasOccurrences,
} = await import('../src/features/dashboard/contract/parseDashboardMetrics.ts')

const {
  dashboardMessage,
  occurrencesPendingMessage,
} = await import('../src/features/dashboard/messages.ts')

test('occurrences stay pending and expose the not-implemented message when data is absent', () => {
  const pointsWithout = [
    { start: '2026-11-11T00:00:00.000Z', end: '2026-11-12T00:00:00.000Z', error: 1, warning: 2 },
    { start: '2026-11-12T00:00:00.000Z', end: '2026-11-13T00:00:00.000Z', error: 3, warning: 1 },
  ]
  assert.equal(seriesHasOccurrences(pointsWithout), false)
  assert.equal(isOccurrencesPending(pointsWithout), true)
  assert.equal(isOccurrencesPending([]), true)
  assert.equal(isOccurrencesPending(null), true)

  const pendingPt = occurrencesPendingMessage('pt-BR')
  const pendingEn = occurrencesPendingMessage('en')
  assert.equal(pendingPt, 'não implementado ainda')
  assert.equal(pendingEn, 'not implemented yet')
  assert.equal(dashboardMessage('pt-BR', 'dashboard.occurrences.pending'), pendingPt)

  const legend = `${dashboardMessage('pt-BR', 'dashboard.occurrences.legend')}: ${pendingPt}`
  assert.match(legend, /não implementado ainda/)
})

test('occurrences leave pending state when at least one bucket has values', () => {
  const points = [
    { start: 'a', end: 'b', error: 1, warning: 0, occurrences: 2 },
    { start: 'c', end: 'd', error: 0, warning: 1 },
  ]
  assert.equal(isOccurrencesPending(points), false)
  assert.equal(seriesHasOccurrences(points), true)
})
