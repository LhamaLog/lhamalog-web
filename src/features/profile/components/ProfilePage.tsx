import { useAuth, useUser } from '@clerk/react'
import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { ApiError } from '../../../shared/services/api'
import { useApi } from '../../../shared/services/useApi'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { ErrorState } from '../../../shared/ui/ErrorState'
import { Input } from '../../../shared/ui/Input'
import { LoadingState } from '../../../shared/ui/LoadingState'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { Select } from '../../../shared/ui/Select'
import { splitDisplayName } from '../clerkName'
import { setAppliedClerkLocale } from '../clerkLocale'
import { buildProfilePut, cloneProfile, readUserProfile, serverConfirmedProfile, userProfilePath } from '../contract'
import { profileMessage } from '../messages'
import { useAppliedPreferences } from '../preferences'
import { isSupportedTimeZone, timeZoneOptions } from '../timeZones'
import type { AppliedLanguage, UserProfile } from '../types'
import { profileFieldErrors } from '../validation'

function languageOf(value: string): AppliedLanguage {
  return value === 'en' ? 'en' : 'pt-BR'
}

function localMessages(language: AppliedLanguage, profile: UserProfile): Record<string, string> {
  const codes = profileFieldErrors(profile)
  const messages: Record<string, string> = {}
  if (codes.displayName === 'control') messages.displayName = profileMessage(language, 'profile.error.nameControl')
  else if (codes.displayName) messages.displayName = profileMessage(language, 'profile.error.name')
  if (codes.language) messages.language = profileMessage(language, 'profile.error.language')
  if (codes.timezone) messages.timezone = profileMessage(language, 'profile.error.timezone')
  return messages
}

function previewClock(language: AppliedLanguage, timezone: string, now: Date) {
  if (!timezone || !isSupportedTimeZone(timezone)) return ''
  try {
    return new Intl.DateTimeFormat(language, { dateStyle: 'short', timeStyle: 'short', timeZone: timezone }).format(now)
  } catch {
    return ''
  }
}

export function ProfilePage() {
  const { orgId } = useAuth()
  const { user } = useUser()
  const request = useApi()
  const { language, applyConfirmed } = useAppliedPreferences()
  const [draft, setDraft] = useState<UserProfile | null>(null)
  const [baseline, setBaseline] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState<ApiError | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [now, setNow] = useState(() => new Date())
  const controller = useRef<AbortController | null>(null)
  const text = (key: Parameters<typeof profileMessage>[1]) => profileMessage(language, key)

  useEffect(() => () => controller.current?.abort(), [])
  useEffect(() => {
    if (!orgId) {
      setLoading(false)
      setLoadError('')
      setDraft(null)
      return
    }
    const current = new AbortController()
    controller.current = current
    setLoading(true)
    setLoadError('')
    request<unknown>(userProfilePath, { signal: current.signal })
      .then((body) => {
        if (current.signal.aborted) return
        const profile = readUserProfile(body)
        if (!profile) {
          setLoadError(text('profile.loadError'))
          return
        }
        setDraft(cloneProfile(profile))
        setBaseline(cloneProfile(profile))
        applyConfirmed(profile)
      })
      .catch((reason) => {
        if (!current.signal.aborted) setLoadError(reason instanceof Error ? reason.message : text('profile.loadError'))
      })
      .finally(() => { if (!current.signal.aborted) setLoading(false) })
    return () => current.abort()
  }, [orgId, request, reloadKey, applyConfirmed])

  useEffect(() => {
    setNow(new Date())
    const timer = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(timer)
  }, [draft?.timezone])

  function cancel() {
    if (!baseline) return
    setDraft(cloneProfile(baseline))
    setMessage('')
    setError(null)
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!draft || !orgId || saving) return
    const localErrors = localMessages(language, draft)
    if (Object.keys(localErrors).length > 0) {
      setMessage('')
      setError(new ApiError(text('profile.error.checkFields'), 400, localErrors))
      return
    }
    const current = new AbortController()
    controller.current = current
    setSaving(true)
    setMessage('')
    setError(null)
    try {
      const saved = await request<unknown>(userProfilePath, {
        method: 'PUT',
        signal: current.signal,
        body: JSON.stringify(buildProfilePut(draft)),
      })
      if (current.signal.aborted) return
      const echoed = readUserProfile(saved)
      if (!serverConfirmedProfile(draft, saved) || !echoed) {
        if (echoed) {
          setDraft(cloneProfile(echoed))
          setBaseline(cloneProfile(echoed))
          applyConfirmed(echoed)
        }
        setError(new ApiError(text('profile.error.notConfirmed'), 0))
        return
      }
      setDraft(cloneProfile(echoed))
      setBaseline(cloneProfile(echoed))
      applyConfirmed(echoed)
      const savedLanguage = languageOf(echoed.language)
      setAppliedClerkLocale(savedLanguage)
      setMessage(profileMessage(savedLanguage, 'profile.success'))
      if (!user) return
      try {
        const names = splitDisplayName(echoed.displayName)
        await user.update({ firstName: names.firstName, lastName: names.lastName })
        try {
          await user.reload()
        } catch {
          applyConfirmed(echoed)
        }
      } catch {
        applyConfirmed(echoed)
      }
    } catch (reason) {
      if (current.signal.aborted) return
      setError(reason instanceof ApiError ? reason : new ApiError(text('profile.error.save'), 0))
    } finally {
      if (!current.signal.aborted) setSaving(false)
    }
  }

  if (!orgId) return null
  if (loading) return <LoadingState label={text('profile.loading')} />
  if (loadError || !draft) return <ErrorState description={loadError || text('profile.loadError')} onRetry={() => setReloadKey((value) => value + 1)} />

  const fieldErrors = error?.fieldErrors ?? {}
  const zones = timeZoneOptions()
  const zoneChoices = draft.timezone && !zones.includes(draft.timezone) ? [draft.timezone, ...zones] : zones
  const languageChoices = draft.language === 'pt-BR' || draft.language === 'en' ? ['pt-BR', 'en'] : [draft.language, 'pt-BR', 'en']
  const clock = previewClock(language, draft.timezone, now)

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <PageHeader title={text('profile.title')} description={text('profile.description')} />
      {message && <p role="status" className="rounded-lg bg-green-50 p-4 text-sm text-green-800">{message}</p>}
      {error && (
        <div role="alert" className="flex flex-wrap items-center gap-3 rounded-lg bg-red-50 p-4 text-sm text-red-700">
          <span>{error.message}</span>
          {error.status === 409 && <Button type="button" onClick={() => setReloadKey((value) => value + 1)} variant="outline" size="small" fullWidth={false}>{text('profile.reload')}</Button>}
        </div>
      )}
      <fieldset disabled={saving} className="m-0 space-y-4 border-0 p-0">
        <Card className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input id="profile-name" label={text('profile.name')} requiredMark compact maxLength={200} value={draft.displayName} error={fieldErrors.displayName} onChange={(event) => setDraft({ ...draft, displayName: event.target.value })} />
            <Select id="profile-language" label={text('profile.language')} requiredMark value={draft.language} error={fieldErrors.language} onChange={(event) => setDraft({ ...draft, language: event.target.value })}>
              {languageChoices.map((choice) => (
                <option key={choice} value={choice}>{choice === 'pt-BR' ? text('profile.language.ptBR') : choice === 'en' ? text('profile.language.en') : choice}</option>
              ))}
            </Select>
            <Select id="profile-timezone" label={text('profile.timezone')} requiredMark value={draft.timezone} error={fieldErrors.timezone} onChange={(event) => setDraft({ ...draft, timezone: event.target.value })}>
              {!draft.timezone && <option value="">{text('profile.selectPlaceholder')}</option>}
              {zoneChoices.map((zone) => <option key={zone} value={zone}>{zone}</option>)}
            </Select>
          </div>
          <p className="text-sm text-slate-600">
            <span className="font-semibold text-[#083B7A]">{text('profile.preview')}. </span>
            {text('profile.previewNow')}: {clock || '—'}
          </p>
        </Card>
        <div className="flex flex-wrap justify-end gap-3">
          <Button type="button" variant="outline" fullWidth={false} onClick={cancel} disabled={saving}>{text('profile.cancel')}</Button>
          <Button type="submit" fullWidth={false} disabled={saving}>{saving ? text('profile.saving') : text('profile.save')}</Button>
        </div>
      </fieldset>
    </form>
  )
}
