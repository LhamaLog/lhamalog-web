import { countLabel, recurringLabel, statusLabel, statusTone, typeLabel, typeSeverity } from './labels'
import type { OccurrenceItem } from './components/OccurrenceCard'
import type { OccurrenceListItem, OccurrenceStatusChange } from './types'

// Date and time in the language and time zone of the profile; an empty or unknown zone uses the browser's.
export function formatDateTime(iso: string | null, locale: string, timeZone?: string): { date: string; time: string; full: string } | null {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  const zone = validTimeZone(timeZone)
  const format = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(locale, { ...options, timeZone: zone }).format(date)
  return {
    date: format({ day: '2-digit', month: 'short', year: 'numeric' }),
    time: format({ hour: '2-digit', minute: '2-digit' }),
    full: format({ dateStyle: 'short', timeStyle: 'medium' }),
  }
}

function validTimeZone(timeZone?: string): string | undefined {
  if (!timeZone) return undefined
  try {
    new Intl.DateTimeFormat('en', { timeZone })
    return timeZone
  } catch {
    return undefined
  }
}

export function productName(product: { id: string; name: string | null }): string {
  return product.name || 'Produto sem nome'
}

// One list item of the Core as the props of the OccurrenceCard.
export function toCardItem(item: OccurrenceListItem, locale: string, timeZone?: string): OccurrenceItem {
  const last = formatDateTime(item.lastSeenAt, locale, timeZone)
  return {
    id: item.id,
    severity: typeSeverity(item.type),
    severityLabel: typeLabel(item.type),
    title: item.title,
    dateTime: item.lastSeenAt,
    timeLabel: last ? last.time : '—',
    dateLabel: last ? last.date : 'Data desconhecida',
    project: productName(item.product),
    countLabel: countLabel(item.count),
    status: { label: statusLabel(item.status), tone: statusTone(item.status) },
    recurringLabel: item.recurring ? recurringLabel : undefined,
  }
}

// Oldest first, as the Core sends it; entries without date go first.
export function chronologicalHistory(history: OccurrenceStatusChange[]): OccurrenceStatusChange[] {
  return [...history].sort((a, b) => (a.changedAt ? Date.parse(a.changedAt) : -Infinity) - (b.changedAt ? Date.parse(b.changedAt) : -Infinity))
}
