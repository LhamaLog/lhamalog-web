import { Badge } from '../../../shared/ui/Badge'
import { IconButton } from '../../../shared/ui/IconButton'
import type { Product } from '../types'
import { useAppliedPreferences } from '../../profile/preferences'
import { environmentLabel, formatPercent, initials, occurrenceText, statusTone } from '../productListModel'

const categoryTones = [
  'bg-amber-50 text-amber-800',
  'bg-sky-50 text-sky-700',
  'bg-violet-50 text-violet-700',
  'bg-emerald-50 text-emerald-700',
  'bg-rose-50 text-rose-700',
]

const knownCategories: Record<string, string> = {
  Financeiro: categoryTones[0],
  'E-commerce': categoryTones[1],
  Plataforma: categoryTones[2],
  Dados: categoryTones[3],
  Comunicação: categoryTones[4],
  Aplicação: 'bg-green-50 text-green-700',
  Infraestrutura: 'bg-slate-100 text-slate-700',
}

const environmentTones: Record<string, string> = {
  Produção: 'bg-blue-50 text-[#0C70F2]',
  Homologação: 'bg-violet-50 text-violet-700',
  Desenvolvimento: 'bg-slate-100 text-slate-600',
}

const iconPaths = [
  'M12 3v18M8 7h8M8 17h5',
  'M4 7h16v13H4zM8 7V4h8v3',
  'M12 12a4 4 0 1 0-4-4M4 20a8 8 0 0 1 16 0',
  'M4 19V5M4 19h16M8 16v-5M12 16V8M16 16v-3',
  'M5 5h14v14H5zM8 9h8M8 13h5',
]

function categoryClass(category: string) {
  if (knownCategories[category]) return knownCategories[category]
  const index = [...category].reduce((sum, char) => sum + char.charCodeAt(0), 0) % categoryTones.length
  return categoryTones[index]
}

export function ProductTable({ products, onEdit }: { products: Product[]; onEdit: (product: Product) => void }) {
  const { language } = useAppliedPreferences()
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[64rem] border-separate border-spacing-0 text-left text-sm">
        <thead>
          <tr className="text-xs text-slate-500">
            {['Produto', 'Categoria', 'Ambiente', 'Status', 'Última ocorrência', 'SLA (30d)', 'Owner', 'Ações'].map((column) => (
              <th key={column} scope="col" className="border-b border-slate-200 px-3 py-3 font-medium">{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {products.map((product, index) => {
            const environment = environmentLabel(product.environment)
            const tone = statusTone(product.status)
            const sla = formatPercent(product.sla, language)
            const slaValue = typeof product.sla === 'number' ? Math.max(0, Math.min(100, product.sla)) : 0
            return (
              <tr key={product.id} className="align-middle hover:bg-slate-50">
                <td className="border-b border-slate-100 px-3 py-3">
                  <div className="flex min-w-48 items-center gap-3">
                    <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#0C70F2]">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                        <path d={iconPaths[index % iconPaths.length]} />
                      </svg>
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-[#083B7A]">{product.name}</span>
                      <span className="block truncate text-xs text-slate-500">{product.description || 'Sem descrição'}</span>
                    </span>
                  </div>
                </td>
                <td className="border-b border-slate-100 px-3 py-3">
                  {product.category ? <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${categoryClass(product.category)}`}>{product.category}</span> : '—'}
                </td>
                <td className="border-b border-slate-100 px-3 py-3">
                  {environment ? <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${environmentTones[environment] ?? 'bg-slate-100 text-slate-600'}`}>{environment}</span> : '—'}
                </td>
                <td className="border-b border-slate-100 px-3 py-3">
                  <Badge variant={tone === 'neutral' ? 'neutral' : tone} dot>{product.status?.trim() || 'Sem status'}</Badge>
                </td>
                <td className="border-b border-slate-100 px-3 py-3 text-slate-600">{occurrenceText(product.lastOccurrence, Date.now(), language)}</td>
                <td className="border-b border-slate-100 px-3 py-3">
                  {sla ? (
                    <span className="block min-w-24">
                      <span className="font-medium text-slate-700">{sla}</span>
                      <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <span className={`block h-full ${slaValue >= 99 ? 'bg-green-500' : slaValue >= 95 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${slaValue}%` }} />
                      </span>
                    </span>
                  ) : '—'}
                </td>
                <td className="border-b border-slate-100 px-3 py-3">
                  {product.owner ? (
                    <span className="flex items-center gap-2">
                      <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[11px] font-bold text-[#0C70F2]">{initials(product.owner, language)}</span>
                      <span className="truncate font-medium text-[#083B7A]">{product.owner}</span>
                    </span>
                  ) : '—'}
                </td>
                <td className="border-b border-slate-100 px-3 py-3">
                  <IconButton aria-label={`Editar ${product.name}`} variant="outline" onClick={() => onEdit(product)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <circle cx="5" cy="12" r="1.6" />
                      <circle cx="12" cy="12" r="1.6" />
                      <circle cx="19" cy="12" r="1.6" />
                    </svg>
                  </IconButton>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
