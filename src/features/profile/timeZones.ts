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
