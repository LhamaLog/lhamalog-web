import { Badge } from '../../../shared/ui/Badge'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'

type CompanyInfoCardProps = {
  title: string
  description: string
  iconPath: string
  statusLabel?: string
  fields: { label: string; value: string }[]
  actionLabel: string
  onAction: () => void
}

function CompanyInfoCard({ title, description, iconPath, statusLabel, fields, actionLabel, onAction }: CompanyInfoCardProps) {
  return (
    <Card className="@container flex h-full min-w-0 flex-col gap-4 p-6!">
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#0C70F2]">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={iconPath} /></svg>
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="break-words font-bold text-[#083B7A]">{title}</h3>
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>
        {statusLabel && <Badge dot>{statusLabel}</Badge>}
      </div>
      <dl className="space-y-2 rounded-xl bg-slate-50 p-4 text-sm">
        {fields.map((field) => (
          <div key={field.label} className="flex flex-col gap-1 @min-[28rem]:flex-row @min-[28rem]:justify-between @min-[28rem]:gap-4">
            <dt className="text-slate-500">{field.label}</dt>
            <dd className="min-w-0 break-words font-semibold text-[#083B7A] @min-[28rem]:text-right">{field.value}</dd>
          </div>
        ))}
      </dl>
      <Button variant="soft" onClick={onAction} className="mt-auto rounded-lg! text-sm! font-normal!">
        {actionLabel}<span aria-hidden="true">→</span>
      </Button>
    </Card>
  )
}

type CompanyDataCardProps = {
  legalName: string
  tradeName: string
  cnpj: string
  identityLabel: string
  statusLabel?: string
  onManage: () => void
}

export function CompanyDataCard({ legalName, tradeName, cnpj, identityLabel, statusLabel, onManage }: CompanyDataCardProps) {
  return (
    <CompanyInfoCard
      title="Dados da Empresa"
      description="Identificação cadastral e tributária"
      iconPath="M4 21V5h10v16M14 11h6v10M7 9h4M7 13h4M7 17h4M17 15h1M17 18h1M2 21h20"
      statusLabel={statusLabel}
      fields={[
        { label: 'Razão social:', value: legalName },
        { label: 'Nome fantasia:', value: tradeName },
        { label: 'CNPJ:', value: cnpj },
        { label: 'Identidade visual:', value: identityLabel },
      ]}
      actionLabel="Gerenciar Dados"
      onAction={onManage}
    />
  )
}

type CompanyContextCardProps = {
  segment: string
  environments: string[]
  criticalWindows: string
  monitoredSystems: string
  statusLabel?: string
  onEdit: () => void
}

export function CompanyContextCard({ segment, environments, criticalWindows, monitoredSystems, statusLabel, onEdit }: CompanyContextCardProps) {
  return (
    <CompanyInfoCard
      title="Contexto de Atuação"
      description="Parâmetros operacionais e mercado"
      iconPath="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm4 5-2 6-6 2 2-6Z"
      statusLabel={statusLabel}
      fields={[
        { label: 'Segmento:', value: segment },
        { label: 'Ambientes monitorados:', value: environments.join(' • ') },
        { label: 'Janelas críticas:', value: criticalWindows },
        { label: 'Sistemas monitorados:', value: monitoredSystems },
      ]}
      actionLabel="Editar Contexto"
      onAction={onEdit}
    />
  )
}
