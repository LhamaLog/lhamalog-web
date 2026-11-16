import { useEffect, useState } from 'react'
import { ApiError } from '../../../shared/services/api'
import { useApi } from '../../../shared/services/useApi'
import { Button } from '../../../shared/ui/Button'
import { ErrorState } from '../../../shared/ui/ErrorState'
import { LoadingState } from '../../../shared/ui/LoadingState'
import { useAppliedPreferences } from '../../profile/preferences'
import { formatRevisionDate, readContextRevision, readContextRevisions, type CompanyContextRevision } from '../contextRevisions'

export function ContextRevisionHistory({ refreshKey }: { refreshKey: number }) {
  const request = useApi()
  const { language } = useAppliedPreferences()
  const [open, setOpen] = useState(false)
  const [reload, setReload] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [revisions, setRevisions] = useState<CompanyContextRevision[] | null>(null)
  const [selected, setSelected] = useState<CompanyContextRevision | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')

  useEffect(() => {
    if (!open) return
    const controller = new AbortController()
    setLoading(true)
    setError('')
    request<unknown>('/api/company/context/revisions', { signal: controller.signal })
      .then((body) => { if (!controller.signal.aborted) setRevisions(readContextRevisions(body)) })
      .catch((reason) => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Não foi possível carregar o histórico.') })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [open, refreshKey, reload, request])

  async function viewRevision(revision: number) {
    setDetailLoading(true)
    setDetailError('')
    setSelected(null)
    try {
      const body = await request<unknown>(`/api/company/context/revisions/${revision}`)
      const parsed = readContextRevision(body)
      if (!parsed) {
        setDetailError('O servidor devolveu uma revisão inválida.')
        return
      }
      setSelected(parsed)
    } catch (reason) {
      setDetailError(reason instanceof ApiError && reason.status === 404
        ? 'Revisão de contexto não encontrada.'
        : reason instanceof Error ? reason.message : 'Não foi possível abrir a revisão.')
    } finally {
      setDetailLoading(false)
    }
  }

  return (
    <details className="rounded-xl border border-slate-200 bg-white p-4" onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary className="cursor-pointer text-sm font-semibold text-[#083B7A]">Histórico do contexto</summary>
      {open && (
        <div className="mt-4 space-y-3">
          <p className="text-xs text-slate-500">Revisões gravadas pelo servidor, da mais recente para a mais antiga. Esta lista não restaura o formulário.</p>
          {loading && <LoadingState label="Carregando histórico..." rows={2} />}
          {!loading && error && <ErrorState description={error} onRetry={() => setReload((value) => value + 1)} />}
          {!loading && !error && revisions?.length === 0 && <p className="text-sm text-slate-600">Nenhuma revisão de contexto.</p>}
          {!loading && !error && revisions && revisions.length > 0 && (
            <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
              {revisions.map((revision) => (
                <li key={revision.revision} className="flex flex-wrap items-center justify-between gap-3 px-3 py-2 text-sm">
                  <div>
                    <p className="font-semibold text-[#083B7A]">Revisão {revision.revision}</p>
                    <p className="text-xs text-slate-500">{formatRevisionDate(revision.createdAt, language)} · {revision.actorUserId || 'Autor indisponível'}</p>
                  </div>
                  <Button type="button" variant="outline" size="small" fullWidth={false} onClick={() => viewRevision(revision.revision)}>Ver conteúdo</Button>
                </li>
              ))}
            </ul>
          )}
          {detailLoading && <LoadingState label="Carregando revisão..." rows={1} />}
          {detailError && <p role="alert" className="text-sm text-red-600">{detailError}</p>}
          {selected && (
            <dl className="space-y-2 rounded-lg bg-slate-50 p-4 text-sm">
              <div><dt className="text-slate-500">Ramo</dt><dd className="font-semibold text-[#083B7A]">{selected.context.sector || 'Não informado'}</dd></div>
              <div><dt className="text-slate-500">Ambientes</dt><dd className="font-semibold text-[#083B7A]">{selected.context.environments.join(', ') || 'Nenhum'}</dd></div>
              <div><dt className="text-slate-500">Sistemas</dt><dd className="font-semibold text-[#083B7A]">{selected.context.monitoredSystems.join(', ') || 'Nenhum'}</dd></div>
              <div><dt className="text-slate-500">Janelas críticas</dt><dd className="font-semibold text-[#083B7A]">{selected.context.criticalWindows || 'Não informado'}</dd></div>
              <div><dt className="text-slate-500">Descrição</dt><dd className="font-semibold break-words text-[#083B7A]">{selected.context.description || 'Não informado'}</dd></div>
            </dl>
          )}
        </div>
      )}
    </details>
  )
}
