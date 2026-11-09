import { Badge } from '../../../shared/ui/Badge'
import { Card } from '../../../shared/ui/Card'
import { ProgressBar } from '../../../shared/ui/ProgressBar'

type CompanySummaryProps = {
  name: string
  logoSrc: string
  verified: boolean
  cnpj: string
  stateRegistration: string
  context?: string
  completion: number
  completionDescription?: string
}

export function CompanySummary({
  name,
  logoSrc,
  verified,
  cnpj,
  stateRegistration,
  context,
  completion,
  completionDescription,
}: CompanySummaryProps) {
  return (
    <Card className="@container">
      <div className="flex flex-col gap-4 @min-[52rem]:flex-row @min-[52rem]:items-center @min-[52rem]:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 p-2">
            <img src={logoSrc} alt="" className="h-full w-full object-contain" />
          </span>
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="break-words text-lg font-bold text-[#083B7A]">{name}</h3>
              {verified && <Badge dot>Empresa verificada</Badge>}
            </div>
            {context && <p className="text-xs text-slate-500">{context}</p>}
            <dl className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
              <div className="flex flex-wrap gap-1"><dt>CNPJ:</dt><dd>{cnpj}</dd></div>
              <div className="flex flex-wrap gap-1"><dt>Inscrição estadual:</dt><dd>{stateRegistration}</dd></div>
            </dl>
          </div>
        </div>
        <div className="min-w-0 rounded-xl bg-slate-50 p-4 @min-[52rem]:w-80 @min-[52rem]:shrink-0">
          <ProgressBar value={completion} label="Conclusão do perfil" />
          {completionDescription && <p className="mt-2 text-xs text-slate-500">{completionDescription}</p>}
        </div>
      </div>
    </Card>
  )
}
