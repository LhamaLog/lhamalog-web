import { register } from 'node:module'
import { test } from 'node:test'
import assert from 'node:assert/strict'

register(new URL('./resolve-ts.mjs', import.meta.url))

const {
  DEFAULT_DASHBOARD_TIMEZONE,
  bucketForDurationHours,
  formatBucketLabel,
  resolvePeriod,
  resolveTimeZone,
} = await import('../src/features/dashboard/model/timezoneBuckets.ts')

test('duration up to 48h uses hour buckets; above 48h uses day buckets', () => {
  assert.equal(bucketForDurationHours(24), 'hour')
  assert.equal(bucketForDurationHours(48), 'hour')
  assert.equal(bucketForDurationHours(48.01), 'day')
  assert.equal(bucketForDurationHours(7 * 24), 'day')
})

test('missing or invalid timezone falls back to America/Sao_Paulo', () => {
  assert.equal(resolveTimeZone(''), DEFAULT_DASHBOARD_TIMEZONE)
  assert.equal(resolveTimeZone(null), DEFAULT_DASHBOARD_TIMEZONE)
  assert.equal(resolveTimeZone('Not/AZone'), DEFAULT_DASHBOARD_TIMEZONE)
  assert.equal(resolveTimeZone('America/Manaus'), 'America/Manaus')
})

test('resolvePeriod carries bucket and timezone for labels', () => {
  const start = new Date('2026-11-17T12:00:00.000Z')
  const end = new Date('2026-11-18T12:00:00.000Z')
  const period = resolvePeriod({ start, end, timeZone: 'America/Sao_Paulo' })
  assert.equal(period.bucket, 'hour')
  assert.equal(period.timeZone, 'America/Sao_Paulo')
  const label = formatBucketLabel(start, period.bucket, period.timeZone, 'pt-BR')
  assert.ok(label.length > 0)
  const long = resolvePeriod({
    start: new Date('2026-11-01T00:00:00.000Z'),
    end: new Date('2026-11-18T00:00:00.000Z'),
    timeZone: '',
  })
  assert.equal(long.bucket, 'day')
  assert.equal(long.timeZone, DEFAULT_DASHBOARD_TIMEZONE)
})
