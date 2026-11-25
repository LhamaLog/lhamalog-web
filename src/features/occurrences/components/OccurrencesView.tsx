import type { ComponentProps, ReactNode } from 'react'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { Pagination } from '../../../shared/ui/Pagination'
import { OccurrencesHeader } from './OccurrencesHeader'
import { OccurrenceList } from './OccurrenceCard'
import { OccurrencePanels } from './OccurrencePanels'

type OccurrencesViewProps = {
  header: ComponentProps<typeof OccurrencesHeader>
  list: ComponentProps<typeof OccurrenceList>
  // Hidden when absent (empty list without filters, loading, error).
  pagination?: ComponentProps<typeof Pagination>
  // Without panels the list takes the whole width (spec 008: no metrics on the real screen).
  panels?: ComponentProps<typeof OccurrencePanels>
  emptyState?: ReactNode
  // Replaces the list while loading or on error.
  status?: ReactNode
}

const defaultEmpty = <EmptyState title="Nenhuma ocorrência encontrada" description="Revise o termo de busca para encontrar os exemplos." />

export function OccurrencesView({ header, list, pagination, panels, emptyState = defaultEmpty, status }: OccurrencesViewProps) {
  return (
    <div className="@container rounded-xl bg-slate-50 p-4">
      <div className={`grid min-w-0 gap-5 ${panels ? '@min-[64rem]:grid-cols-[minmax(0,1fr)_24rem]' : ''}`}>
        <div className="min-w-0 space-y-4">
          <OccurrencesHeader {...header} />
          {status ?? (list.occurrences.length > 0 ? <OccurrenceList {...list} /> : emptyState)}
          {!status && pagination && <Pagination {...pagination} />}
        </div>
        {panels && <div className="min-w-0"><OccurrencePanels {...panels} /></div>}
      </div>
    </div>
  )
}
