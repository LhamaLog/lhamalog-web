const pinned = ['UTC', 'America/Sao_Paulo', 'America/Manaus', 'America/Rio_Branco']

function supportedZones(): string[] {
  const intl = Intl as typeof Intl & { supportedValuesOf?: (key: 'timeZone') => string[] }
  const zones = intl.supportedValuesOf?.('timeZone')
  return zones && zones.length > 0 ? [...zones] : [...pinned]
}

let cached: string[] | null = null

export function timeZoneOptions(): string[] {
  if (cached) return cached
  const all = supportedZones()
  const top = pinned.filter((zone) => all.includes(zone))
  const rest = all.filter((zone) => !top.includes(zone)).sort((left, right) => left.localeCompare(right))
  cached = [...top, ...rest]
  return cached
}

export function isSupportedTimeZone(value: string): boolean {
  return timeZoneOptions().includes(value)
}

export function timeZoneOffset(zone: string, now = new Date()): string {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: zone,
      timeZoneName: 'longOffset',
      hour: '2-digit',
    }).formatToParts(now)
    const raw = parts.find((part) => part.type === 'timeZoneName')?.value ?? ''
    if (!raw) return ''
    return raw.replace('GMT', 'UTC')
  } catch {
    return ''
  }
}

function offsetTokens(offset: string): string[] {
  const normalized = offset.replaceAll('−', '-').replaceAll('GMT', 'UTC')
  const match = /^UTC([+-])(\d{2}):(\d{2})$/.exec(normalized)
  if (!match) return [normalized.toLowerCase()]
  const [, sign, hours, minutes] = match
  const hour = String(Number(hours))
  return [
    normalized,
    `${sign}${hours}:${minutes}`,
    `${sign}${hours}`,
    `${sign}${hour}`,
    minutes === '00' ? `${sign}${hour}:00` : '',
    `utc${sign}${hour}`,
    `utc${sign}${hours}`,
    `utc${sign}${hours}:${minutes}`,
    `gmt${sign}${hour}`,
    `gmt${sign}${hours}:${minutes}`,
  ].filter(Boolean).map((token) => token.toLowerCase())
}

export function filterTimeZones(query: string, zones: readonly string[] = timeZoneOptions(), now = new Date()): string[] {
  const needle = query.trim().toLowerCase().replaceAll('−', '-').replaceAll('gmt', 'utc')
  if (!needle) return [...zones]
  return zones.filter((zone) => {
    if (zone.toLowerCase().includes(needle)) return true
    return offsetTokens(timeZoneOffset(zone, now)).includes(needle)
  })
}

export function formatTimeZonePreview(language: string, timezone: string, now: Date): string {
  if (!timezone || !isSupportedTimeZone(timezone)) return ''
  try {
    return new Intl.DateTimeFormat(language, { dateStyle: 'short', timeStyle: 'short', timeZone: timezone }).format(now)
  } catch {
    return ''
  }
}
