import { Button } from './Button'

type PaginationProps = {
  page: number
  pageSize: number
  totalItems: number
  onPageChange: (page: number) => void
  itemLabel?: string
}

export function Pagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
  itemLabel = 'resultados',
}: PaginationProps) {
  const total = Math.max(0, Math.floor(totalItems))
  const size = Math.max(1, Math.floor(pageSize))
  const totalPages = Math.max(1, Math.ceil(total / size))
  const currentPage = Math.min(totalPages, Math.max(1, Math.floor(page)))
  const firstItem = total === 0 ? 0 : (currentPage - 1) * size + 1
  const lastItem = Math.min(currentPage * size, total)
  const pages = [...new Set([1, currentPage - 1, currentPage, currentPage + 1, totalPages])]
    .filter((number) => number >= 1 && number <= totalPages)
    .sort((a, b) => a - b)

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p aria-live="polite" className="text-xs text-[#0C70F2]">
        Mostrando {firstItem}–{lastItem} de {total} {itemLabel}
      </p>

      <nav aria-label="Paginação" className="flex flex-wrap items-center gap-1">
        <Button
          variant="outline"
          size="small"
          fullWidth={false}
          aria-label="Página anterior"
          disabled={currentPage === 1 || total === 0}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <span aria-hidden="true">‹</span>
        </Button>

        {pages.map((number, index) => (
          <span key={number} className="inline-flex items-center gap-1">
            {index > 0 && number - pages[index - 1] > 1 && (
              <span aria-hidden="true" className="px-1 text-slate-500">…</span>
            )}
            <Button
              variant={number === currentPage ? 'primary' : 'outline'}
              size="small"
              fullWidth={false}
              aria-label={`Página ${number}`}
              aria-current={number === currentPage ? 'page' : undefined}
              disabled={total === 0}
              onClick={() => {
                if (number !== currentPage) onPageChange(number)
              }}
            >
              {number}
            </Button>
          </span>
        ))}

        <Button
          variant="outline"
          size="small"
          fullWidth={false}
          aria-label="Próxima página"
          disabled={currentPage === totalPages || total === 0}
          onClick={() => onPageChange(currentPage + 1)}
        >
          <span aria-hidden="true">›</span>
        </Button>
      </nav>
    </div>
  )
}
