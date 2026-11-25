import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { ApiError } from '../../../shared/services/api'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { ErrorState } from '../../../shared/ui/ErrorState'
import { LoadingState } from '../../../shared/ui/LoadingState'
import { SearchInput } from '../../../shared/ui/SearchInput'
import { Select } from '../../../shared/ui/Select'
import { Toggle } from '../../../shared/ui/Toggle'
import { readAppearance, subscribeAppearance, themeChoices, writeAppearance } from '../appearance'
import type { Appearance, ThemeChoice } from '../appearance'
import { profileMessage } from '../messages'
import type { MessageKey } from '../messages'
import { filterTimeZones, formatTimeZonePreview, timeZoneOffset, timeZoneOptions } from '../timeZones'
import type { AppliedLanguage, UserProfile } from '../types'

type PreferencesSectionProps = {
  language: AppliedLanguage
  draft: UserProfile | null
  baseline: UserProfile | null
  loading: boolean
  loadError: string
  saving: boolean
  message: string
  error: ApiError | null
  onChange: (profile: UserProfile) => void
  onSubmit: (event: FormEvent) => void
  onCancel: () => void
  onReload: () => void
}

export function PreferencesSection({
  language, draft, baseline, loading, loadError, saving, message, error, onChange, onSubmit, onCancel, onReload,
}: PreferencesSectionProps) {
  const text = (key: MessageKey) => profileMessage(language, key)
  const [query, setQuery] = useState('')
  const [appearance, setAppearance] = useState<Appearance>(() => readAppearance())
  const [now, setNow] = useState(() => new Date())

  useEffect(() => subscribeAppearance(() => setAppearance(readAppearance())), [])
  useEffect(() => {
    setNow(new Date())
    const timer = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(timer)
  }, [draft?.timezone])

  function updateAppearance(next: Appearance) {
    writeAppearance(next)
  }

  if (loading) return <LoadingState label={text('profile.loading')} />
  if (loadError || !baseline || !draft) return <ErrorState description={loadError || text('profile.loadError')} onRetry={onReload} />

  const fieldErrors = error?.fieldErrors ?? {}
  const zones = timeZoneOptions()
  const filtered = filterTimeZones(query, zones, now)
  const choices = draft.timezone && !filtered.includes(draft.timezone) ? [draft.timezone, ...filtered] : filtered
  const languageChoices = draft.language === 'pt-BR' || draft.language === 'en' ? ['pt-BR', 'en'] : [draft.language, 'pt-BR', 'en']
  const clock = formatTimeZonePreview(language, draft.timezone, now)
  const offset = draft.timezone ? timeZoneOffset(draft.timezone, now) : ''

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {message && <p role="status" className="rounded-lg bg-green-50 p-4 text-sm text-green-800">{message}</p>}
      {error && (
        <div role="alert" className="flex flex-wrap items-center gap-3 rounded-lg bg-red-50 p-4 text-sm text-red-700">
          <span>{error.message}</span>
          {error.status === 409 && <Button type="button" onClick={onReload} variant="outline" size="small" fullWidth={false}>{text('profile.reload')}</Button>}
        </div>
      )}
      <Card className="space-y-4">
        <fieldset disabled={saving} className="m-0 space-y-4 border-0 p-0">
          <Select id="profile-language" label={text('profile.language')} requiredMark value={draft.language} error={fieldErrors.language} onChange={(event) => onChange({ ...draft, language: event.target.value })}>
            {languageChoices.map((choice) => (
              <option key={choice} value={choice}>{choice === 'pt-BR' ? text('profile.language.ptBR') : choice === 'en' ? text('profile.language.en') : choice}</option>
            ))}
          </Select>
          <SearchInput id="profile-timezone-search" label={text('profile.timezoneSearch')} placeholder={text('profile.timezoneSearch')} value={query} onChange={(event) => setQuery(event.target.value)} />
          <Select id="profile-timezone" label={text('profile.timezone')} requiredMark value={draft.timezone} error={fieldErrors.timezone} onChange={(event) => onChange({ ...draft, timezone: event.target.value })}>
            {!draft.timezone && <option value="">{text('profile.selectPlaceholder')}</option>}
            {choices.map((zone) => <option key={zone} value={zone}>{zone} ({timeZoneOffset(zone, now) || '—'})</option>)}
          </Select>
          <p className="text-sm text-slate-600">{text('profile.timezoneOffset')}: {offset || '—'}</p>
          <p className="text-sm text-slate-600">
            <span className="font-semibold text-[#083B7A]">{text('profile.preview')}. </span>
            {text('profile.previewNow')}: {clock || '—'}
          </p>
        </fieldset>
        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-slate-900">{text('profile.theme')}</legend>
          <div className="flex flex-wrap gap-4">
            {themeChoices.map((choice) => (
              <label key={choice} className="inline-flex items-center gap-2 text-sm text-slate-900">
                <input type="radio" name="profile-theme" value={choice} checked={appearance.theme === choice} onChange={() => updateAppearance({ ...appearance, theme: choice satisfies ThemeChoice })} />
                {text(`profile.theme.${choice}`)}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-slate-900">{text('profile.accessibility')}</legend>
          <div className="flex items-center justify-between gap-4">
            <span id="profile-reduce-motion-label" className="text-sm text-slate-900">{text('profile.reduceMotion')}</span>
            <Toggle label={text('profile.reduceMotion')} checked={appearance.reduceMotion} onChange={(checked) => updateAppearance({ ...appearance, reduceMotion: checked })} />
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-slate-900">{text('profile.underlineLinks')}</span>
            <Toggle label={text('profile.underlineLinks')} checked={appearance.underlineLinks} onChange={(checked) => updateAppearance({ ...appearance, underlineLinks: checked })} />
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-slate-900">{text('profile.contrast')}</span>
            <Toggle label={text('profile.contrast')} checked={appearance.contrast} onChange={(checked) => updateAppearance({ ...appearance, contrast: checked })} />
          </div>
          <p className="text-sm text-slate-600">{text('profile.appearanceLocal')}</p>
        </fieldset>
      </Card>
      <div className="flex flex-wrap justify-end gap-3">
        <Button type="button" variant="outline" fullWidth={false} onClick={onCancel} disabled={saving}>{text('profile.cancel')}</Button>
        <Button type="submit" fullWidth={false} disabled={saving}>{saving ? text('profile.saving') : text('profile.save')}</Button>
      </div>
    </form>
  )
}
