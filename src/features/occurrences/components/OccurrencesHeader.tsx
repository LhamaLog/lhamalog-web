import { useId } from 'react'
import { FilterButton } from '../../../shared/ui/FilterButton'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { SearchInput } from '../../../shared/ui/SearchInput'
import { Select } from '../../../shared/ui/Select'

type OccurrencesHeaderProps = {
  search: string
  onSearchChange: (value: string) => void
  onFilterClick: () => void
  filterCount?: number
  headingLevel?: 1 | 2
  description?: string
  searchMaxLength?: number
  // Page size selector, shown only when both are given (spec 008, FR-004).
  pageSize?: number
  pageSizes?: readonly number[]
  onPageSizeChange?: (size: number) => void
}

export function OccurrencesHeader({
  search,
  onSearchChange,
  onFilterClick,
  filterCount = 0,
  headingLevel = 1,
  description = 'Acompanhe em tempo real os eventos, erros e alertas dos seus projetos.',
  searchMaxLength,
  pageSize,
  pageSizes,
  onPageSizeChange,
}: OccurrencesHeaderProps) {
  const searchId = useId()
  const sizeId = useId()
  const showSize = pageSize !== undefined && pageSizes && onPageSizeChange

  return (
    <div className="space-y-3">
      <PageHeader
        title="Ocorrências"
        headingLevel={headingLevel}
        description={description}
        actions={<FilterButton count={filterCount} onClick={onFilterClick} />}
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <SearchInput
            id={searchId}
            label="Buscar ocorrências"
            placeholder="Buscar ocorrências..."
            value={search}
            maxLength={searchMaxLength}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>
        {showSize && (
          <div className="flex items-center gap-2 sm:w-44">
            <Select id={sizeId} label="Itens por página" hideLabel value={String(pageSize)} onChange={(event) => onPageSizeChange(Number(event.target.value))}>
              {pageSizes.map((size) => <option key={size} value={size}>{size} por página</option>)}
            </Select>
          </div>
        )}
      </div>
    </div>
  )
}
