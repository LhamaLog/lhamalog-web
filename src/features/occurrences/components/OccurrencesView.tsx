import type { ComponentProps } from 'react'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { Pagination } from '../../../shared/ui/Pagination'
import { OccurrencesHeader } from './OccurrencesHeader'
import { OccurrenceList } from './OccurrenceCard'
import { OccurrencePanels } from './OccurrencePanels'

type OccurrencesViewProps = {
  header: ComponentProps<typeof OccurrencesHeader>
  list: ComponentProps<typeof OccurrenceList>
  pagination: ComponentProps<typeof Pagination>
  panels: ComponentProps<typeof OccurrencePanels>
}

export function OccurrencesView({ header, list, pagination, panels }: OccurrencesViewProps) {
  return (
    <div className="@container rounded-xl bg-slate-50 p-4">
      <div className="grid min-w-0 gap-5 @min-[64rem]:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="min-w-0 space-y-4">
          <OccurrencesHeader {...header} />
          {list.occurrences.length > 0 ? (
            <OccurrenceList {...list} />
          ) : (
            <EmptyState title="Nenhuma ocorrência encontrada" description="Revise o termo de busca para encontrar os exemplos." />
          )}
          <Pagination {...pagination} />
        </div>
        <div className="min-w-0"><OccurrencePanels {...panels} /></div>
      </div>
    </div>
  )
}
