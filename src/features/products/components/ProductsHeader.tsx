import { useId } from 'react'
import { Button } from '../../../shared/ui/Button'
import { FilterButton } from '../../../shared/ui/FilterButton'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { SearchInput } from '../../../shared/ui/SearchInput'

type ProductsHeaderProps = {
  search: string
  onSearchChange: (value: string) => void
  onFilterClick: () => void
  onCreateClick: () => void
  filterCount?: number
  headingLevel?: 1 | 2
}

export function ProductsHeader({
  search,
  onSearchChange,
  onFilterClick,
  onCreateClick,
  filterCount = 0,
  headingLevel = 1,
}: ProductsHeaderProps) {
  const searchId = useId()

  return (
    <div className="space-y-3">
      <PageHeader
        title="Produtos"
        headingLevel={headingLevel}
        description="Acompanhe os produtos cadastrados, o status da integração e o último log recebido pelo LhamaLog."
        actions={
          <>
            <FilterButton count={filterCount} onClick={onFilterClick} />
            <Button size="small" fullWidth={false} onClick={onCreateClick}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Cadastrar produto
            </Button>
          </>
        }
      />
      <SearchInput
        id={searchId}
        label="Buscar produtos"
        placeholder="Buscar produtos..."
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
      />
    </div>
  )
}
