import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { useAppliedPreferences } from '../../profile/preferences'
import { Badge } from '../../../shared/ui/Badge'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { ErrorState } from '../../../shared/ui/ErrorState'
import { LoadingState } from '../../../shared/ui/LoadingState'
import {
  attributeLabel, changedByLabel, countLabel, recurringLabel, sensitiveDataLabel, statusLabel, statusTone, typeLabel,
  typeSeverity,
} from '../labels'
import { chronologicalHistory, formatDateTime, productName } from '../occurrenceView'
import type { OccurrenceDetail } from '../types'
import { useCoreResource } from '../useCoreResource'
import { SeverityIndicator } from './SeverityIndicator'

const notFound = 'Ocorrência não encontrada ou sem acesso'

function canCopy(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.clipboard?.writeText === 'function'
}

// "Copiado" for 2 s; without the clipboard API the button is not shown (spec 008, R8).
function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])
  if (!canCopy()) return null
  return (
    <Button
      size="small"
      variant="outline"
      fullWidth={false}
      aria-label={copied ? 'Copiado' : label}
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true)
          window.clearTimeout(timer.current)
          timer.current = window.setTimeout(() => setCopied(false), 2000)
        }).catch(() => setCopied(false))
      }}
    >
      <span aria-live="polite">{copied ? 'Copiado' : 'Copiar'}</span>
    </Button>
  )
}

function BackLink({ to }: { to: string }) {
  return (
    <Link to={to} className="inline-flex items-center gap-1 text-sm font-semibold text-[#0C70F2] hover:underline">
      <span aria-hidden="true">‹</span> Voltar para ocorrências
    </Link>
  )
}

// /ocorrencias/:id (spec 008, US3). Log text is always rendered as text, never as HTML (FR-011).
export function OccurrenceDetailPage() {
  const { id = '' } = useParams()
  const location = useLocation()
  const { language, timezone } = useAppliedPreferences()
  const from = (location.state as { from?: unknown } | null)?.from
  const back = typeof from === 'string' && from.startsWith('?') ? `/ocorrencias${from}` : '/ocorrencias'
  const resource = useCoreResource<OccurrenceDetail>(`/api/occurrences/${encodeURIComponent(id)}`)
  const when = (iso: string | null) => formatDateTime(iso, language, timezone)?.full ?? 'Data desconhecida'

  if (resource.error) {
    return (
      <div className="space-y-4">
        <BackLink to={back} />
        {resource.error.status === 404
          ? <EmptyState title={notFound} description="Ela pode ter sido removida, ser de outra empresa ou de um produto a que você não tem acesso." action={<Link to={back} className="text-sm font-semibold text-[#0C70F2] hover:underline">Voltar para ocorrências</Link>} />
          : <ErrorState title="Não foi possível carregar a ocorrência" description={resource.error.message} onRetry={resource.reload} retrying={resource.loading} />}
      </div>
    )
  }
  const occurrence = resource.data
  if (!occurrence || (resource.loading && occurrence.id !== id)) return <div className="space-y-4"><BackLink to={back} /><LoadingState label="Carregando ocorrência..." rows={3} /></div>

  const sensitive = sensitiveDataLabel(occurrence.sensitiveData)
  const history = chronologicalHistory(occurrence.statusHistory)
  return (
    <div className="space-y-4">
      <BackLink to={back} />

      <Card className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <SeverityIndicator severity={typeSeverity(occurrence.type)} label={typeLabel(occurrence.type)} />
        <div className="min-w-0 flex-1 space-y-2">
          <h1 className="break-words text-lg font-bold text-[#083B7A]">{occurrence.title}</h1>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="break-all">ID: <code className="text-slate-700">{occurrence.id}</code></span>
            <CopyButton text={occurrence.id} label="Copiar o ID da ocorrência" />
          </div>
          <dl className="grid gap-2 text-sm sm:grid-cols-3">
            <div><dt className="text-xs text-slate-500">Produto</dt><dd className="break-words font-semibold text-[#083B7A]">{productName(occurrence.product)}</dd></div>
            <div><dt className="text-xs text-slate-500">Primeira vez</dt><dd className="font-semibold text-[#083B7A]"><time dateTime={occurrence.firstSeenAt}>{when(occurrence.firstSeenAt)}</time></dd></div>
            <div><dt className="text-xs text-slate-500">Última vez</dt><dd className="font-semibold text-[#083B7A]"><time dateTime={occurrence.lastSeenAt}>{when(occurrence.lastSeenAt)}</time></dd></div>
          </dl>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="min-w-0 space-y-3">
          <h2 className="text-sm font-bold text-[#083B7A]">Dados da ocorrência</h2>
          <div className="flex flex-wrap gap-2">
            <Badge variant={statusTone(occurrence.status)} dot>{statusLabel(occurrence.status)}</Badge>
            {occurrence.recurring && <Badge variant="neutral">{recurringLabel}</Badge>}
            <Badge variant="neutral">{countLabel(occurrence.count)}</Badge>
          </div>
          {sensitive && <p className="text-sm text-slate-600">{sensitive}</p>}
          <h3 className="text-xs font-semibold uppercase text-slate-500">Atributos</h3>
          {occurrence.attributes.length === 0
            ? <p className="text-sm text-slate-500">Nenhum atributo técnico registrado.</p>
            : (
              <dl className="grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)] gap-x-3 gap-y-1 text-sm">
                {occurrence.attributes.map((attribute, index) => (
                  <div key={`${index}-${attribute.name}`} className="contents">
                    <dt className="break-words text-slate-500">{attributeLabel(attribute.name)}</dt>
                    <dd className="break-all font-mono text-xs leading-5 text-slate-800">{attribute.value}</dd>
                  </div>
                ))}
              </dl>
            )}
        </Card>

        <Card className="min-w-0 space-y-3">
          <h2 className="text-sm font-bold text-[#083B7A]">Mensagem e contexto</h2>
          {occurrence.summary
            ? <p className="break-words text-sm text-slate-700">{occurrence.summary}</p>
            : <p className="text-sm text-slate-500">Sem resumo registrado.</p>}
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-semibold uppercase text-slate-500">Exemplos de log</h3>
            {occurrence.samples.length > 0 && <CopyButton text={occurrence.samples.join('\n')} label="Copiar os exemplos de log" />}
          </div>
          {occurrence.samples.length === 0
            ? <p className="text-sm text-slate-500">Nenhum exemplo de log registrado.</p>
            : <pre className="max-h-80 overflow-auto rounded-lg bg-slate-900 p-3 text-xs leading-5 text-slate-100">{occurrence.samples.join('\n')}</pre>}
        </Card>
      </div>

      <Card className="space-y-3">
        <h2 className="text-sm font-bold text-[#083B7A]">Histórico de status</h2>
        {history.length === 0
          ? <p className="text-sm text-slate-500">Nenhuma mudança de status registrada.</p>
          : (
            <ol className="space-y-2">
              {history.map((change, index) => (
                <li key={index} className="flex flex-col gap-1 rounded-lg bg-slate-50 p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <span className="flex flex-wrap items-center gap-2">
                    {change.from ? <Badge variant={statusTone(change.from)}>{statusLabel(change.from)}</Badge> : <span className="text-slate-500">Criada</span>}
                    <span aria-hidden="true">→</span><span className="sr-only">para</span>
                    <Badge variant={statusTone(change.to)}>{statusLabel(change.to)}</Badge>
                  </span>
                  <span className="text-xs text-slate-500">
                    <time dateTime={change.changedAt ?? undefined}>{when(change.changedAt)}</time> · {changedByLabel(change.changedBy)}
                  </span>
                </li>
              ))}
            </ol>
          )}
      </Card>
    </div>
  )
}
