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
  decideProductDashboardLoad,
  deserializeDashboardQuery,
  serializeDashboardFilter,
  shouldReplaceSearchParams,
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
  }, defaultDashboardFilter(now), now)
  assert.deepEqual(restored.productIds, ['prd_1'])
  assert.equal(restored.periodPreset, '24h')
  assert.deepEqual(restored.severities, ['ERROR', 'WARNING'])
  assert.equal(restored.from?.toISOString(), new Date(now.getTime() - 86400000).toISOString())
  assert.equal(restored.to?.toISOString(), now.toISOString())
})

test('deserialize recalculates from/to for known presets (24h and 30d)', () => {
  const now = new Date('2026-11-18T12:00:00.000Z')
  const base = defaultDashboardFilter(now)
  const hours = deserializeDashboardQuery({
    produto: 'prd_billing',
    periodo: '24h',
    tipo: 'ERROR',
  }, base, now)
  assert.equal(hours.periodPreset, '24h')
  assert.deepEqual(hours.severities, ['ERROR'])
  assert.equal(Math.round((hours.to - hours.from) / 3600000), 24)
  assert.notEqual(hours.from?.toISOString(), base.from?.toISOString())

  const month = deserializeDashboardQuery({ periodo: '30d' }, base, now)
  assert.equal(month.periodPreset, '30d')
  assert.equal(Math.round((month.to - month.from) / 86400000), 30)
})

test('30d from URL becomes valid after retentionDays=30 raises the ceiling', () => {
  const now = new Date('2026-11-18T12:00:00.000Z')
  const fromUrl = deserializeDashboardQuery({ periodo: '30d' }, defaultDashboardFilter(now), now)
  assert.equal(fromUrl.maxPeriodDays, SAFE_INITIAL_MAX_PERIOD_DAYS)
  assert.equal(validateDashboardFilter(fromUrl, now).ok, false)
  const afterRetention = revalidateAfterRetention(fromUrl, 30, now)
  assert.equal(afterRetention.ok, true)
  assert.equal(afterRetention.filter?.periodPreset, '30d')
  assert.equal(afterRetention.filter?.maxPeriodDays, 30)
  assert.equal(Math.round((afterRetention.filter.to - afterRetention.filter.from) / 86400000), 30)
})

test('decideProductDashboardLoad selects first authorized product then fetches', () => {
  const now = new Date('2026-11-18T12:00:00.000Z')
  const applied = defaultDashboardFilter(now)
  assert.equal(decideProductDashboardLoad({
    applied,
    authorizedProductIds: [],
    memberWithoutProducts: false,
  }).type, 'idle')
  assert.equal(decideProductDashboardLoad({
    applied,
    authorizedProductIds: ['prd_a'],
    memberWithoutProducts: true,
  }).type, 'idle')

  const select = decideProductDashboardLoad({
    applied,
    authorizedProductIds: ['prd_checkout', 'prd_billing'],
    memberWithoutProducts: false,
  })
  assert.equal(select.type, 'select_default_product')
  assert.deepEqual(select.filter.productIds, ['prd_checkout'])

  const afterSelect = decideProductDashboardLoad({
    applied: select.filter,
    authorizedProductIds: ['prd_checkout', 'prd_billing'],
    memberWithoutProducts: false,
  })
  assert.equal(afterSelect.type, 'fetch')
  assert.deepEqual(afterSelect.filter.productIds, ['prd_checkout'])

  const serialized = serializeDashboardFilter(select.filter)
  assert.equal(serialized.get('produto'), 'prd_checkout')
  assert.equal(serialized.get('periodo'), '7d')
  assert.equal(
    shouldReplaceSearchParams(new URLSearchParams(), serialized),
    true,
  )
  assert.equal(
    shouldReplaceSearchParams(serialized, serializeDashboardFilter(select.filter)),
    false,
  )

  const fetch = decideProductDashboardLoad({
    applied: { ...applied, productIds: ['prd_billing'] },
    authorizedProductIds: ['prd_checkout', 'prd_billing'],
    memberWithoutProducts: false,
  })
  assert.equal(fetch.type, 'fetch')
  assert.deepEqual(fetch.filter.productIds, ['prd_billing'])
})

test('shouldReplaceSearchParams compares query strings stably', () => {
  const a = new URLSearchParams('produto=prd_checkout&periodo=7d')
  const b = new URLSearchParams('produto=prd_checkout&periodo=7d')
  const c = new URLSearchParams('produto=prd_billing&periodo=7d')
  assert.equal(shouldReplaceSearchParams(a, b), false)
  assert.equal(shouldReplaceSearchParams(a, c), true)
})
