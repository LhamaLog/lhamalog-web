import { useAuth } from '@clerk/react'
import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useApi } from '../../../shared/services/useApi'
import { ApiError } from '../../../shared/services/api'
import { endsSession } from '../../../shared/services/sessionRedirect'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { Checkbox } from '../../../shared/ui/Checkbox'
import { ErrorState } from '../../../shared/ui/ErrorState'
import { LoadingState } from '../../../shared/ui/LoadingState'
import { profileMessage } from '../../profile/messages'
import type { MessageKey } from '../../profile/messages'
import { useAppliedPreferences } from '../../profile/preferences'
import { confirmedPreferences, preferenceErrors, preferencePayload, preferencesPath, readCatalog, readPreferences, readProducts } from '../model'
import type { Catalog, Option, Preferences, Selection } from '../model'

function Filter({ name, title, allLabel, value, options, onChange, emptyText, unavailableLabel }: {
  name: string; title: string; allLabel: string; value: Selection; options: Option[]
  onChange: (value: Selection) => void; emptyText: string
  unavailableLabel: (id: string) => string
}) {
  const unavailable = value.ids.filter(id => !options.some(option => option.id === id))
  return <fieldset className="space-y-3 rounded-lg border border-slate-200 p-4">
    <legend className="px-1 font-semibold text-[#083B7A]">{title}</legend>
    <Checkbox id={name + '-all'} label={allLabel} checked={value.all}
      disabled={options.length === 0 && value.all}
      onChange={event => onChange({ all: event.target.checked, ids: [] })} />
    {options.length === 0 && <p className="text-sm text-slate-600">{emptyText}</p>}
    {!value.all && <div className="max-h-64 space-y-2 overflow-y-auto">
      {options.map((option, index) => <Checkbox key={option.id} id={name + '-' + index} label={option.label}
        checked={value.ids.includes(option.id)}
        onChange={event => onChange({ all: false, ids: event.target.checked
          ? [...value.ids, option.id] : value.ids.filter(id => id !== option.id) })} />)}
      {unavailable.map((id, index) => <Checkbox key={id} id={name + '-unavailable-' + index}
        label={unavailableLabel(id)} checked
        onChange={() => onChange({ all: false, ids: value.ids.filter(item => item !== id) })} />)}
    </div>}
  </fieldset>
}

export function NotificationPreferences() {
  const { orgId, userId } = useAuth()
  if (!orgId || !userId) return null
  return <PreferencesForm key={orgId + ':' + userId} />
}

function PreferencesForm() {
  const request = useApi()
  const { language } = useAppliedPreferences()
  const text = (key: MessageKey, values?: Record<string, string>) => profileMessage(language, key, values)
  const [draft, setDraft] = useState<Preferences | null>(null)
  const [baseline, setBaseline] = useState<Preferences | null>(null)
  const [catalog, setCatalog] = useState<Catalog>({ types: [], severities: [] })
  const [products, setProducts] = useState<Option[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [reload, setReload] = useState(0)
  const lifetime = useRef<AbortController | null>(null)
  const savingRef = useRef(false)

  useEffect(() => {
    const controller = new AbortController()
    lifetime.current = controller
    savingRef.current = false
    setSaving(false)
    setLoading(true)
    setLoadError('')
    setError('')
    setMessage('')
    Promise.all([
      request<unknown>(preferencesPath, { signal: controller.signal }),
      request<unknown>(preferencesPath + '/catalog', { signal: controller.signal }),
      request<unknown>('/api/products', { signal: controller.signal }),
    ]).then(([raw, rawCatalog, rawProducts]) => {
      if (controller.signal.aborted) return
      const value = readPreferences(raw), options = readCatalog(rawCatalog), availableProducts = readProducts(rawProducts)
      if (!value || !options || !availableProducts) throw new Error(text('notifications.invalid'))
      setDraft(value)
      setBaseline(value)
      setCatalog(options)
      setProducts(availableProducts)
    }).catch(reason => {
      if (!controller.signal.aborted && !endsSession(reason)) setLoadError(reason instanceof Error ? reason.message : text('notifications.loadError'))
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false)
    })
    return () => controller.abort()
  }, [request, reload])

  async function submit(event: FormEvent) {
    event.preventDefault()
    const controller = lifetime.current
    if (!draft || savingRef.current || !controller || controller.signal.aborted) return
    const errors = preferenceErrors(draft, catalog, products)
    setMessage('')
    setError('')
    if (errors.length) { setError(errors.join(' ')); return }
    savingRef.current = true
    setSaving(true)
    const sent = preferencePayload(draft)
    try {
      const raw = await request<unknown>(preferencesPath, {
        method: 'PUT', body: JSON.stringify(sent), signal: controller.signal,
      })
      if (controller.signal.aborted) return
      const saved = readPreferences(raw)
      if (!saved || !confirmedPreferences(sent, saved))
        throw new Error(text('notifications.notConfirmed'))
      setDraft(saved)
      setBaseline(saved)
      setMessage(text('notifications.saved'))
    } catch (reason) {
      if (controller.signal.aborted || endsSession(reason)) return
      const details = reason instanceof ApiError ? Object.values(reason.fieldErrors).join(' ') : ''
      setError((reason instanceof Error ? reason.message : text('notifications.saveError')) + (details ? ' ' + details : ''))
    } finally {
      if (lifetime.current === controller && !controller.signal.aborted) {
        savingRef.current = false
        setSaving(false)
      }
    }
  }

  return <Card className="space-y-4">
    <div>
      <h3 className="text-xl font-semibold text-[#083B7A]">{text('notifications.title')}</h3>
      <p className="mt-1 text-sm text-slate-600">{text('notifications.description')}</p>
    </div>
    {loading ? <LoadingState label={text('notifications.loading')} />
      : loadError || !draft ? <ErrorState description={loadError || text('notifications.loadError')} onRetry={() => setReload(value => value + 1)} />
      : <form onSubmit={submit} className="space-y-4">
        {message && <p role="status" className="text-sm text-green-700">{message}</p>}
        {error && <div role="alert" className="space-y-2 text-sm text-red-700">
          <p>{error}</p>
          <Button type="button" variant="outline" fullWidth={false} disabled={saving}
            onClick={() => setReload(value => value + 1)}>{text('notifications.reload')}</Button>
        </div>}
        <fieldset disabled={saving} className="space-y-4">
          <fieldset className="space-y-3">
            <legend className="mb-2 font-semibold text-[#083B7A]">{text('notifications.channels')}</legend>
            <Checkbox id="notifications-web" label={text('notifications.web')} checked disabled />
            <Checkbox id="notifications-email" label={text('notifications.email')} checked={draft.email}
              onChange={event => { setMessage(''); setDraft({ ...draft, email: event.target.checked }) }} />
            <Checkbox id="notifications-push" label={text('notifications.push')} checked={draft.push}
              onChange={event => { setMessage(''); setDraft({ ...draft, push: event.target.checked }) }} />
          </fieldset>
          <Filter name="notification-products" title={text('notifications.products')} allLabel={text('notifications.allProducts')}
            value={draft.products} options={products} emptyText={text('notifications.productsEmpty')}
            unavailableLabel={id => text('notifications.unavailable', { id })}
            onChange={products => { setMessage(''); setDraft({ ...draft, products }) }} />
          <Filter name="notification-types" title={text('notifications.types')} allLabel={text('notifications.allTypes')}
            value={draft.types} options={catalog.types} emptyText={text('notifications.typesEmpty')}
            unavailableLabel={id => text('notifications.unavailable', { id })}
            onChange={types => { setMessage(''); setDraft({ ...draft, types }) }} />
          <Filter name="notification-severities" title={text('notifications.severities')} allLabel={text('notifications.allSeverities')}
            value={draft.severities} options={catalog.severities} emptyText={text('notifications.severitiesEmpty')}
            unavailableLabel={id => text('notifications.unavailable', { id })}
            onChange={severities => { setMessage(''); setDraft({ ...draft, severities }) }} />
          <div className="flex flex-wrap justify-end gap-3">
            <Button type="button" variant="outline" fullWidth={false} onClick={() => { setDraft(baseline); setError(''); setMessage('') }}>{text('notifications.cancel')}</Button>
            <Button type="submit" fullWidth={false}>{saving ? text('notifications.saving') : text('notifications.save')}</Button>
          </div>
        </fieldset>
      </form>}
  </Card>
}
