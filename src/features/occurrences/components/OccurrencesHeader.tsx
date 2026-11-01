import { useId } from 'react'
import { FilterButton } from '../../../shared/ui/FilterButton'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { SearchInput } from '../../../shared/ui/SearchInput'

type OccurrencesHeaderProps = {
  search: string
  onSearchChange: (value: string) => void
  onFilterClick: () => void
  filterCount?: number
  headingLevel?: 1 | 2
}

export function OccurrencesHeader({
  search,
  onSearchChange,
  onFilterClick,
  filterCount = 0,
  headingLevel = 1,
}: OccurrencesHeaderProps) {
  const searchId = useId()

  return (
    <div className="space-y-3">
      <PageHeader
        title="Ocorrências"
        headingLevel={headingLevel}
        description="Acompanhe em tempo real os eventos, erros e alertas dos seus projetos."
        actions={<FilterButton count={filterCount} onClick={onFilterClick} />}
      />
      <SearchInput
        id={searchId}
        label="Buscar ocorrências"
        placeholder="Buscar ocorrências..."
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
      />
    </div>
  )
}
