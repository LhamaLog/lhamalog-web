import { Badge } from '../../../shared/ui/Badge'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'

type CompanyAddressCardProps = {
  street: string
  district: string
  postalCode: string
  city: string
  state: string
  referencePoint?: string
  statusLabel?: string
  onUpdate: () => void
}

export function CompanyAddressCard({ street, district, postalCode, city, state, referencePoint, statusLabel, onUpdate }: CompanyAddressCardProps) {
  const location = `${city} – ${state}`

  return (
    <Card className="flex h-full min-w-0 flex-col gap-4 p-6!">
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#0C70F2]">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2.5" />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-[#083B7A]">Endereço Principal</h3>
          <p className="mt-1 text-xs text-slate-500">Sede e faturamento</p>
        </div>
        {statusLabel && <Badge dot>{statusLabel}</Badge>}
      </div>
      <div className="relative overflow-hidden rounded-xl bg-slate-100">
        <svg className="h-40 w-full" viewBox="0 0 640 160" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <path fill="#E7EDF2" d="M0 0h640v160H0z" />
          <path fill="#DCE3EA" d="m180 22 200-8 135 35-55 80-190 8-160-35Z" />
          <g fill="#DCEEE3">
            <rect x="32" y="12" width="102" height="34" rx="8" />
            <rect x="448" y="9" width="88" height="26" rx="8" />
            <rect x="510" y="88" width="98" height="40" rx="8" />
            <rect x="50" y="114" width="116" height="38" rx="8" />
          </g>
          <g fill="none" stroke="#CFD6DE" strokeWidth="2">
            <path d="m64 0 48 72-36 88M330 0l42 160M550 0l28 160M0 30l330 10L640 18M0 100l640-8" />
          </g>
          <g fill="none" stroke="#CFD6DE" strokeWidth="7">
            <path d="m192-8 66 66 36 110M440-8l-44 80 104 96M-8 65l228 7 428-25M-8 133l264-23 392 24" />
          </g>
          <g fill="none" stroke="white" strokeWidth="4">
            <path d="m192-8 66 66 36 110M440-8l-44 80 104 96M-8 65l228 7 428-25M-8 133l264-23 392 24" />
          </g>
          <circle cx="320" cy="77" r="22" fill="#0C70F2" opacity=".2" />
          <path d="M330 73c0 7-10 17-10 17s-10-10-10-17a10 10 0 1 1 20 0Z" fill="#0C70F2" stroke="white" strokeWidth="2" />
          <circle cx="320" cy="73" r="3" fill="white" />
        </svg>
        <span className="absolute bottom-3 left-3 max-w-[calc(100%-1.5rem)] rounded bg-white px-2 py-1 text-xs font-semibold break-words text-[#083B7A]">
          {location} · Ilustração
        </span>
      </div>
      <address className="space-y-1 rounded-xl bg-slate-50 p-4 text-sm not-italic break-words">
        <p className="font-semibold text-[#083B7A]">{street}</p>
        <p className="text-slate-500">{district} · CEP {postalCode} · {location}</p>
        {referencePoint && <p className="text-xs text-slate-500">Ponto de referência: {referencePoint}</p>}
      </address>
      <Button variant="soft" onClick={onUpdate} className="mt-auto rounded-lg! text-sm! font-normal!">
        Atualizar Endereço<span aria-hidden="true">→</span>
      </Button>
    </Card>
  )
}
