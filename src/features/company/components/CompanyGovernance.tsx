import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'

type CompanyGovernanceProps = {
  description: string
  onExport: () => void
  onSync: () => void
}

export function CompanyGovernance({ description, onExport, onSync }: CompanyGovernanceProps) {
  return (
    <Card className="@container">
      <div className="flex flex-col gap-4 @min-[64rem]:flex-row @min-[64rem]:items-center @min-[64rem]:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#0C70F2]">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M6 3h12v18H6ZM9 7h6M9 11h6M9 15h4" />
            </svg>
          </span>
          <div className="min-w-0">
            <h3 className="font-bold break-words text-[#083B7A]">Governança Corporativa LhamaLog</h3>
            <p className="mt-1 text-xs break-words text-slate-500">{description}</p>
          </div>
        </div>
        <div className="flex flex-col gap-3 @min-[40rem]:flex-row @min-[64rem]:shrink-0">
          <Button variant="outline" onClick={onExport} className="h-auto! min-h-12 py-2 text-sm! @min-[40rem]:w-auto">
            <svg className="shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 3v12m-4-4 4 4 4-4M4 17v4h16v-4" />
            </svg>
            Exportar Dossiê da Empresa (PDF)
          </Button>
          <Button onClick={onSync} className="h-auto! min-h-12 py-2 text-sm! @min-[40rem]:w-auto">
            <svg className="shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 8a8 8 0 0 0-14-2L3 9m0-6v6h6M4 16a8 8 0 0 0 14 2l3-3m0 6v-6h-6" />
            </svg>
            Sincronizar Todas as Áreas
          </Button>
        </div>
      </div>
    </Card>
  )
}
