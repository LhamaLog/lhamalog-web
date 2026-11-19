import { register } from 'node:module'
import { test } from 'node:test'
import assert from 'node:assert/strict'

register(new URL('./resolve-ts.mjs', import.meta.url))

const {
  SAFE_INITIAL_MAX_PERIOD_DAYS,
  defaultDashboardFilter,
  maxPeriodDaysFromRetention,
  revalidateAfterRetention,
  validateDashboardFilter,
  withRetentionCeiling,
} = await import('../src/features/dashboard/model/filterPeriod.ts')

const {
  applyDashboardFilters,
  deserializeDashboardQuery,
  serializeDashboardFilter,
} = await import('../src/features/dashboard/model/applyDashboardFilters.ts')

test('default filter uses 7d preset and safe 7-day ceiling', () => {
  const now = new Date('2026-11-18T12:00:00.000Z')
  const filter = defaultDashboardFilter(now)
  assert.equal(filter.periodPreset, '7d')
  assert.equal(filter.maxPeriodDays, SAFE_INITIAL_MAX_PERIOD_DAYS)
  assert.equal(filter.severities.length, 0)
  assert.ok(filter.from && filter.to)
  assert.equal(Math.round((filter.to - filter.from) / 86400000), 7)
})

test('retention ceiling becomes min(30, retentionDays)', () => {
  assert.equal(maxPeriodDaysFromRetention(7), 7)
  assert.equal(maxPeriodDaysFromRetention(15), 15)
  assert.equal(maxPeriodDaysFromRetention(30), 30)
  assert.equal(maxPeriodDaysFromRetention(90), 30)
})

test('30d preset is invalid under the safe initial ceiling', () => {
  const now = new Date('2026-11-18T12:00:00.000Z')
  const draft = { ...defaultDashboardFilter(now), periodPreset: '30d' }
  const result = validateDashboardFilter(draft, now)
  assert.equal(result.ok, false)
  assert.equal(result.messageKey, 'dashboard.filter.periodTooLong')
  assert.equal(result.messageDays, 7)
})

test('after retention response, URL beyond ceiling stays invalid and is not applied', () => {
  const now = new Date('2026-11-18T12:00:00.000Z')
  const applied = defaultDashboardFilter(now)
  const oversized = withRetentionCeiling({
    ...applied,
    periodPreset: '30d',
    from: new Date(now.getTime() - 30 * 86400000),
    to: now,
  }, 7)
  const validation = validateDashboardFilter(oversized, now)
  assert.equal(validation.ok, false)
  const revalidated = revalidateAfterRetention({
    ...applied,
    periodPreset: '30d',
    from: new Date(now.getTime() - 30 * 86400000),
    to: now,
  }, 7, now)
  assert.equal(revalidated.ok, false)
  const keep = applyDashboardFilters({ current: applied, draft: oversized, now })
  assert.equal(keep.invalid, true)
  assert.equal(keep.changed, false)
  assert.equal(keep.applied.periodPreset, '7d')
})

test('custom range requires from < to and duration within ceiling', () => {
  const now = new Date('2026-11-18T12:00:00.000Z')
  const base = defaultDashboardFilter(now)
  const inverted = validateDashboardFilter({
    ...base,
    periodPreset: 'personalizado',
    from: now,
    to: new Date(now.getTime() - 3600000),
  }, now)
  assert.equal(inverted.ok, false)
  assert.equal(inverted.messageKey, 'dashboard.filter.rangeOrder')

  const tooLong = validateDashboardFilter({
    ...base,
    periodPreset: 'personalizado',
    from: new Date(now.getTime() - 10 * 86400000),
    to: now,
  }, now)
  assert.equal(tooLong.ok, false)
  assert.equal(tooLong.messageKey, 'dashboard.filter.periodTooLong')
})

test('serialize and deserialize keep product period and type query params', () => {
  const now = new Date('2026-11-18T12:00:00.000Z')
  const filter = {
    ...defaultDashboardFilter(now),
    productIds: ['prd_1'],
    periodPreset: '24h',
    severities: ['ERROR', 'WARNING'],
  }
  const params = serializeDashboardFilter(filter)
  assert.equal(params.get('produto'), 'prd_1')
  assert.equal(params.get('periodo'), '24h')
  assert.equal(params.get('tipo'), 'ERROR,WARNING')
  const restored = deserializeDashboardQuery({
    produto: params.get('produto'),
    periodo: params.get('periodo'),
    tipo: params.get('tipo'),
  }, defaultDashboardFilter(now))
  assert.deepEqual(restored.productIds, ['prd_1'])
  assert.equal(restored.periodPreset, '24h')
  assert.deepEqual(restored.severities, ['ERROR', 'WARNING'])
})
