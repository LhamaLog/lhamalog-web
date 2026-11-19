import type { DashboardFilter, PeriodPreset, Severity } from './types'

export const SAFE_INITIAL_MAX_PERIOD_DAYS = 7
export const MVP_ABSOLUTE_MAX_PERIOD_DAYS = 30
export const DEFAULT_PERIOD_PRESET: PeriodPreset = '7d'

const PRESETS: PeriodPreset[] = ['24h', '7d', '30d', 'personalizado']
const SEVERITIES: Severity[] = ['ERROR', 'WARNING', 'INFO']
const MS_PER_DAY = 24 * 60 * 60 * 1000

export type FilterValidation = {
  ok: boolean
  filter: DashboardFilter | null
  messageKey: 'dashboard.filter.invalid' | 'dashboard.filter.periodTooLong' | 'dashboard.filter.rangeOrder' | null
  messageDays?: number
}

export function defaultDashboardFilter(now = new Date()): DashboardFilter {
  const end = new Date(now)
  const start = new Date(now.getTime() - 7 * MS_PER_DAY)
  return {
    productIds: [],
    periodPreset: DEFAULT_PERIOD_PRESET,
    from: start,
    to: end,
    severities: [],
    maxPeriodDays: SAFE_INITIAL_MAX_PERIOD_DAYS,
  }
}

export function maxPeriodDaysFromRetention(retentionDays: number): number {
  if (!Number.isFinite(retentionDays) || retentionDays <= 0) return SAFE_INITIAL_MAX_PERIOD_DAYS
  return Math.min(MVP_ABSOLUTE_MAX_PERIOD_DAYS, Math.floor(retentionDays))
}

export function withRetentionCeiling(filter: DashboardFilter, retentionDays: number): DashboardFilter {
  return { ...filter, maxPeriodDays: maxPeriodDaysFromRetention(retentionDays) }
}

export function resolvePresetRange(preset: PeriodPreset, now = new Date(), custom?: { from: Date | null, to: Date | null }): { from: Date, to: Date } | null {
  const end = new Date(now)
  if (preset === '24h') return { from: new Date(end.getTime() - MS_PER_DAY), to: end }
  if (preset === '7d') return { from: new Date(end.getTime() - 7 * MS_PER_DAY), to: end }
  if (preset === '30d') return { from: new Date(end.getTime() - 30 * MS_PER_DAY), to: end }
  if (!custom?.from || !custom?.to) return null
  return { from: custom.from, to: custom.to }
}

export function periodDurationDays(from: Date, to: Date): number {
  return (to.getTime() - from.getTime()) / MS_PER_DAY
}

export function isKnownPreset(value: string | null | undefined): value is PeriodPreset {
  return typeof value === 'string' && PRESETS.includes(value as PeriodPreset)
}

export function parseSeverities(value: string | string[] | null | undefined): Severity[] | null {
  if (value == null || value === '') return []
  const parts = Array.isArray(value)
    ? value.flatMap((item) => item.split(','))
    : value.split(',')
  const cleaned = parts.map((part) => part.trim()).filter(Boolean)
  if (cleaned.length === 0) return []
  const result: Severity[] = []
  for (const part of cleaned) {
    if (!SEVERITIES.includes(part as Severity)) return null
    if (!result.includes(part as Severity)) result.push(part as Severity)
  }
  return result
}

export function validateDashboardFilter(candidate: DashboardFilter, now = new Date()): FilterValidation {
  if (!isKnownPreset(candidate.periodPreset)) {
    return { ok: false, filter: null, messageKey: 'dashboard.filter.invalid' }
  }

  const range = resolvePresetRange(candidate.periodPreset, now, {
    from: candidate.from,
    to: candidate.to,
  })
  if (!range) {
    return { ok: false, filter: null, messageKey: 'dashboard.filter.invalid' }
  }
  if (!(range.from.getTime() < range.to.getTime())) {
    return { ok: false, filter: null, messageKey: 'dashboard.filter.rangeOrder' }
  }

  const days = periodDurationDays(range.from, range.to)
  if (days > candidate.maxPeriodDays + 1e-9) {
    return {
      ok: false,
      filter: null,
      messageKey: 'dashboard.filter.periodTooLong',
      messageDays: candidate.maxPeriodDays,
    }
  }

  if (candidate.periodPreset === '30d' && candidate.maxPeriodDays < 30) {
    return {
      ok: false,
      filter: null,
      messageKey: 'dashboard.filter.periodTooLong',
      messageDays: candidate.maxPeriodDays,
    }
  }

  const severities = parseSeverities(candidate.severities)
  if (severities === null) {
    return { ok: false, filter: null, messageKey: 'dashboard.filter.invalid' }
  }

  return {
    ok: true,
    filter: {
      ...candidate,
      from: range.from,
      to: range.to,
      severities,
    },
    messageKey: null,
  }
}

export function revalidateAfterRetention(
  applied: DashboardFilter,
  retentionDays: number,
  now = new Date(),
): FilterValidation {
  const next = withRetentionCeiling(applied, retentionDays)
  return validateDashboardFilter(next, now)
}
