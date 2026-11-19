export function formatBytes(value: number, locale = 'pt-BR'): string {
  if (!Number.isFinite(value) || value < 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let amount = value
  let unit = 0
  while (amount >= 1024 && unit < units.length - 1) {
    amount /= 1024
    unit += 1
  }
  return `${amount.toLocaleString(locale, { maximumFractionDigits: amount >= 10 ? 0 : 1 })} ${units[unit]}`
}

export function formatCount(value: number, locale = 'pt-BR'): string {
  return (Number.isFinite(value) ? value : 0).toLocaleString(locale)
}
