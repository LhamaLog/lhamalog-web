import type { ResolvedPeriod, SeriesBucket } from './types'

export const DEFAULT_DASHBOARD_TIMEZONE = 'America/Sao_Paulo'

export function resolveTimeZone(profileTimeZone: string | null | undefined): string {
  const value = profileTimeZone?.trim()
  if (!value) return DEFAULT_DASHBOARD_TIMEZONE
  try {
    Intl.DateTimeFormat(undefined, { timeZone: value })
    return value
  } catch {
    return DEFAULT_DASHBOARD_TIMEZONE
  }
}

export function bucketForDurationHours(durationHours: number): SeriesBucket {
  return durationHours <= 48 ? 'hour' : 'day'
}

export function resolvePeriod(input: {
  start: Date
  end: Date
  timeZone?: string | null
}): ResolvedPeriod {
  const start = input.start
  const end = input.end
  const durationHours = Math.max(0, (end.getTime() - start.getTime()) / (60 * 60 * 1000))
  return {
    start,
    end,
    durationHours,
    bucket: bucketForDurationHours(durationHours),
    timeZone: resolveTimeZone(input.timeZone),
  }
}

export function formatInTimeZone(
  value: Date | string,
  timeZone: string | null | undefined,
  options: Intl.DateTimeFormatOptions,
  locale = 'pt-BR',
): string {
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(locale, {
    ...options,
    timeZone: resolveTimeZone(timeZone),
  }).format(date)
}

export function formatBucketLabel(
  start: Date | string,
  bucket: SeriesBucket,
  timeZone: string | null | undefined,
  locale = 'pt-BR',
): string {
  if (bucket === 'hour') {
    return formatInTimeZone(start, timeZone, {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }, locale)
  }
  return formatInTimeZone(start, timeZone, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }, locale)
}
