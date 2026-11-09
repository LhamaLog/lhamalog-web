import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useApi } from '../../../shared/services/useApi'
import { ApiError } from '../../../shared/services/api'
import { Button } from '../../../shared/ui/Button'
import { ErrorState } from '../../../shared/ui/ErrorState'
import { LoadingState } from '../../../shared/ui/LoadingState'
import { buildCompanyPut, formField, readCompanyFacts, readCompanySettings, serverConfirmedSettings, type CompanyFacts } from '../contract'
import { cloneCompanySettings, companySectionFromParam, companySectionParam, type CompanySection, type CompanySettings } from '../model'
import { errorsForSection } from '../validation'
import { CompanyAddressScreen, CompanyContextScreen, CompanyDataScreen, CompanyOverview, CompanyPreferencesScreen } from './CompanyScreens'

export function CompanyPage({ organizationId }: { organizationId: string }) {
  const request = useApi()
  const [params, setParams] = useSearchParams()
  const section = companySectionFromParam(params.get('secao'))
  const [raw, setRaw] = useState<unknown>(null)
  const [settings, setSettings] = useState<CompanySettings | null>(null)
  const [baseline, setBaseline] = useState<CompanySettings | null>(null)
  const [facts, setFacts] = useState<CompanyFacts | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState<ApiError | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [contextSavedTick, setContextSavedTick] = useState(0)
  const controller = useRef<AbortController | null>(null)

  useEffect(() => () => controller.current?.abort(), [])
  useEffect(() => {
    const current = new AbortController()
    controller.current = current
    setLoading(true)
    setLoadError('')
    request<unknown>('/api/company', { signal: current.signal })
      .then((body) => {
        if (current.signal.aborted) return
        const parsed = readCompanySettings(body, organizationId)
        parsed.organizationId = organizationId || parsed.organizationId
        setRaw(body)
        setSettings(parsed)
        setBaseline(cloneCompanySettings(parsed))
        setFacts(readCompanyFacts(body, parsed))
      })
      .catch((reason) => {
        if (!current.signal.aborted) setLoadError(reason instanceof Error ? reason.message : 'Falha ao carregar a empresa.')
      })
      .finally(() => { if (!current.signal.aborted) setLoading(false) })
    return () => current.abort()
  }, [organizationId, request, reloadKey])

  function open(next: CompanySection) {
    const param = companySectionParam(next)
    const updated = new URLSearchParams(params)
    if (param) updated.set('secao', param)
    else updated.delete('secao')
    setParams(updated, { replace: true })
    setMessage('')
    setError(null)
  }

  function applyServer(body: unknown) {
    const parsed = readCompanySettings(body, organizationId)
    parsed.organizationId = organizationId || parsed.organizationId
    setRaw(body)
    setSettings(parsed)
    setBaseline(cloneCompanySettings(parsed))
    setFacts(readCompanyFacts(body, parsed))
  }

  function presentError(reason: ApiError) {
    const fieldErrors = Object.fromEntries(Object.entries(reason.fieldErrors).map(([key, value]) => [formField(key), value]))
    return new ApiError(reason.message, reason.status, fieldErrors)
  }

  function cancel() {
    if (!baseline) return
    setSettings(cloneCompanySettings(baseline))
    setMessage('')
    setError(null)
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!settings) return
    const localErrors = errorsForSection(settings, section)
    if (Object.keys(localErrors).length > 0) {
      setMessage('')
      setError(new ApiError('Confira os campos destacados.', 400, localErrors))
      return
    }
    const current = new AbortController()
    controller.current = current
    setSaving(true)
    setMessage('')
    setError(null)
    try {
      const saved = await request<unknown>('/api/company', {
        method: 'PUT',
        signal: current.signal,
        body: JSON.stringify(buildCompanyPut(raw, settings)),
      })
      if (current.signal.aborted) return
      if (!serverConfirmedSettings(settings, saved)) {
        applyServer(saved)
        setError(new ApiError('O servidor não confirmou todas as configurações enviadas. A tela voltou ao que ele devolveu.', 0))
        return
      }
      applyServer(saved)
      if (section === 'context') setContextSavedTick((value) => value + 1)
      setMessage('Alterações salvas. Preferências de segurança, IA e telemetria ficam registradas e não entram em vigor por este serviço.')
    } catch (reason) {
      if (!current.signal.aborted) setError(reason instanceof ApiError ? presentError(reason) : new ApiError('Não foi possível salvar.', 0))
    } finally {
      if (!current.signal.aborted) setSaving(false)
    }
  }

  if (loading) return <LoadingState label="Carregando empresa..." />
  if (loadError || !settings || !facts) return <ErrorState description={loadError || 'Não foi possível carregar a empresa.'} onRetry={() => setReloadKey((value) => value + 1)} />
  const fieldErrors = error?.fieldErrors ?? {}

  return (
    <div className="space-y-4">
      {message && <p role="status" className="rounded-lg bg-green-50 p-4 text-sm text-green-800">{message}</p>}
      {error && (
        <div role="alert" className="flex flex-wrap items-center gap-3 rounded-lg bg-red-50 p-4 text-sm text-red-700">
          <span>{error.message}</span>
          {error.status === 409 && <Button onClick={() => setReloadKey((value) => value + 1)} variant="outline" size="small" fullWidth={false}>Recarregar dados</Button>}
        </div>
      )}
      {section === 'overview' && <CompanyOverview settings={settings} facts={facts} onOpen={open} />}
      {section === 'data' && <CompanyDataScreen settings={settings} errors={fieldErrors} saving={saving} onChange={setSettings} onSubmit={submit} onCancel={cancel} onOpen={open} />}
      {section === 'context' && <CompanyContextScreen settings={settings} errors={fieldErrors} saving={saving} onChange={setSettings} onSubmit={submit} onCancel={cancel} onOpen={open} historyRefreshKey={contextSavedTick} />}
      {section === 'address' && <CompanyAddressScreen settings={settings} errors={fieldErrors} saving={saving} onChange={setSettings} onSubmit={submit} onCancel={cancel} onOpen={open} />}
      {section === 'preferences' && <CompanyPreferencesScreen settings={settings} facts={facts} errors={fieldErrors} saving={saving} onChange={setSettings} onSubmit={submit} onCancel={cancel} onOpen={open} />}
    </div>
  )
}
