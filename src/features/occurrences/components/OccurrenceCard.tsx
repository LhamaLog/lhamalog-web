import { Badge } from '../../../shared/ui/Badge'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { SeverityIndicator } from './SeverityIndicator'

export type OccurrenceItem = {
  id: string
  severity: 'error' | 'warning' | 'info'
  title: string
  description: string
  tags: string[]
  dateTime: string
  dateLabel: string
  timeLabel: string
  project: string
}

type OccurrenceCardProps = {
  occurrence: OccurrenceItem
  onOpen?: () => void
}

export function OccurrenceCard({ occurrence, onOpen }: OccurrenceCardProps) {
  return (
    <Card className="flex flex-col gap-4 @min-[38rem]/occurrence:flex-row @min-[38rem]/occurrence:items-center">
      <SeverityIndicator severity={occurrence.severity} />
      <div className="min-w-0 flex-1 space-y-1">
        <h3 className="break-words text-sm font-bold text-[#083B7A]">{occurrence.title}</h3>
        <p className="break-words text-xs text-slate-500">{occurrence.description}</p>
        <div className="flex flex-wrap gap-2">
          {occurrence.tags.map((tag, index) => <Badge key={`${index}-${tag}`}>{tag}</Badge>)}
        </div>
      </div>
      <div className="flex items-center gap-2 @min-[38rem]/occurrence:shrink-0">
        <dl className="min-w-0 flex-1 space-y-2 border-t border-slate-200 pt-3 text-xs @min-[38rem]/occurrence:w-40 @min-[38rem]/occurrence:border-l @min-[38rem]/occurrence:border-t-0 @min-[38rem]/occurrence:pl-3 @min-[38rem]/occurrence:pt-0">
          <div>
            <dt className="sr-only">Data e horário</dt>
            <dd>
              <time dateTime={occurrence.dateTime} className="block font-bold text-[#083B7A]">{occurrence.timeLabel}</time>
              <span className="block text-[11px] text-slate-500">{occurrence.dateLabel}</span>
            </dd>
          </div>
          <div>
            <dt className="text-[11px] text-slate-500">Projeto</dt>
            <dd className="break-words font-bold text-[#083B7A]">{occurrence.project}</dd>
          </div>
        </dl>
        {onOpen && (
          <Button size="icon" fullWidth={false} variant="outline" className="shrink-0 border-transparent! text-[#0C70F2]!" aria-label={`Ver detalhes de ${occurrence.title}`} onClick={onOpen}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg>
          </Button>
        )}
      </div>
    </Card>
  )
}

type OccurrenceListProps = {
  occurrences: OccurrenceItem[]
  onOpen?: (id: string) => void
}

export function OccurrenceList({ occurrences, onOpen }: OccurrenceListProps) {
  return (
    <ul aria-label="Ocorrências" className="space-y-2">
      {occurrences.map((occurrence) => (
        <li key={occurrence.id} className="@container/occurrence">
          <OccurrenceCard occurrence={occurrence} onOpen={onOpen ? () => onOpen(occurrence.id) : undefined} />
        </li>
      ))}
    </ul>
  )
}
