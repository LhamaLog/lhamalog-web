import { register } from 'node:module'
import { test } from 'node:test'
import assert from 'node:assert/strict'

register(new URL('./resolve-ts.mjs', import.meta.url))

const { BYTES_PER_GIB, formatVolumeGiB } = await import('../src/features/dashboard/model/format.ts')

test('1 GiB is 2^30 bytes', () => {
  assert.equal(BYTES_PER_GIB, 1073741824)
})

test('formatVolumeGiB formats exact GiB in pt-BR', () => {
  assert.equal(formatVolumeGiB(1073741824, 'pt-BR'), '1 GiB')
})

test('formatVolumeGiB formats 1.5 GiB with locale decimal separator', () => {
  assert.equal(formatVolumeGiB(1610612736, 'pt-BR'), '1,5 GiB')
})

test('formatVolumeGiB formats zero', () => {
  assert.equal(formatVolumeGiB(0, 'pt-BR'), '0 GiB')
})

test('formatVolumeGiB rejects negative and non-finite as 0 GiB', () => {
  assert.equal(formatVolumeGiB(-1, 'pt-BR'), '0 GiB')
  assert.equal(formatVolumeGiB(Number.NaN, 'pt-BR'), '0 GiB')
})
