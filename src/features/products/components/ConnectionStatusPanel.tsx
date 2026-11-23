import { Badge } from '../../../shared/ui/Badge'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'

const badges = {
  waiting: { label: 'Aguardando primeiro log', variant: 'warning' },
  none: { label: 'Sem integração', variant: 'neutral' },
  unknown: { label: '—', variant: 'neutral' },
} as const

// "Status da conexão" of the Figma. There is no status API yet (spec 011, F1): the badge depends only on the
// active key, the numbers are "—" and "Testar conexão" stays disabled. Never a made-up number.
export function ConnectionStatusPanel({ state, signals }: { state: 'waiting' | 'none' | 'unknown'; signals: string }) {
  const badge = badges[state]
  return (
    <Card className="space-y-4">
      <h3 className="flex items-center gap-2 text-base font-bold text-[#083B7A]">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-[#0C70F2]" aria-hidden="true"><path d="M3 12h4l2-6 4 12 2-6h6" /></svg>
        Status da conexão
      </h3>
      <div className="border-b border-slate-200 pb-3">
        <Badge variant={badge.variant} dot={state !== 'unknown'}>{badge.label}</Badge>
      </div>
      <dl className="space-y-3 text-sm">
        {[
          ['Último log recebido', '—'],
          ['Logs nas últimas 24h', '—'],
          ['Sinais ativos', signals],
        ].map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
            <dt className="text-slate-600">{label}</dt>
            <dd className="font-bold text-slate-900">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="space-y-1">
        <Button type="button" disabled aria-describedby="otel-test-connection-hint">Testar conexão</Button>
        <p id="otel-test-connection-hint" className="text-xs text-slate-500">Disponível quando a verificação existir no servidor.</p>
      </div>
    </Card>
  )
}
