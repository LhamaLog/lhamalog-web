import { useAuth, useUser } from '@clerk/react'
import { useEffect, useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
import { NotificationPreferences } from '../../notificationPreferences/components/NotificationPreferences'
import { ApiError } from '../../../shared/services/api'
import { endsSession } from '../../../shared/services/sessionRedirect'
import { useApi } from '../../../shared/services/useApi'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { Select } from '../../../shared/ui/Select'
import { clerkSessionName, fillUnsavedNameIfUntouched, splitDisplayName, withUnsavedClerkName } from '../clerkName'
import { setAppliedClerkLocale } from '../clerkLocale'
import { buildProfilePut, cloneProfile, readUserProfile, serverConfirmedProfile, userProfilePath } from '../contract'
import { profileFieldMessages, profileMessage } from '../messages'
import type { MessageKey } from '../messages'
import { useAppliedPreferences } from '../preferences'
import type { AppliedLanguage, UserProfile } from '../types'
import { AccountSection, ProfileIdentityCard } from './AccountSection'
import { HelpSection } from './HelpSection'
import { PreferencesSection } from './PreferencesSection'
import { SecuritySection } from './SecuritySection'

const sections = ['account', 'preferences', 'notifications', 'security', 'help'] as const
type SectionId = (typeof sections)[number]
type SaveSource = 'account' | 'preferences'

const sectionLabel: Record<SectionId, MessageKey> = {
  account: 'profile.section.account',
  preferences: 'profile.section.preferences',
  notifications: 'profile.section.notifications',
  security: 'profile.section.security',
  help: 'profile.section.help',
}

function languageOf(value: string): AppliedLanguage {
  return value === 'en' ? 'en' : 'pt-BR'
}

function mergeDirty(current: UserProfile | null, previous: UserProfile | null, echoed: UserProfile, source: SaveSource): UserProfile {
  if (!current || !previous) return cloneProfile(echoed)
  if (source === 'account') {
    return {
      ...echoed,
      language: current.language !== previous.language ? current.language : echoed.language,
      timezone: current.timezone !== previous.timezone ? current.timezone : echoed.timezone,
    }
  }
  return {
    ...echoed,
    displayName: current.displayName !== previous.displayName ? current.displayName : echoed.displayName,
    bio: current.bio !== previous.bio ? current.bio : echoed.bio,
    jobTitle: current.jobTitle !== previous.jobTitle ? current.jobTitle : echoed.jobTitle,
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
  const [section, setSection] = useState<SectionId>('account')
  const [editing, setEditing] = useState(false)
  const [savingAccount, setSavingAccount] = useState(false)
  const [savingPreferences, setSavingPreferences] = useState(false)
  const [accountMessage, setAccountMessage] = useState('')
  const [preferencesMessage, setPreferencesMessage] = useState('')
  const [accountError, setAccountError] = useState<ApiError | null>(null)
  const [preferencesError, setPreferencesError] = useState<ApiError | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const flight = useRef<AbortController | null>(null)
  const mounted = useRef(true)
  const sessionName = clerkSessionName(user)
  const sessionNameRef = useRef(sessionName)
  const draftRef = useRef(draft)
  const baselineRef = useRef(baseline)
  sessionNameRef.current = sessionName
  draftRef.current = draft
  baselineRef.current = baseline
  const text = (key: MessageKey) => profileMessage(language, key)
  const saving = savingAccount || savingPreferences

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      flight.current?.abort()
    }
  }, [])

  useEffect(() => {
    if (!orgId) {
      setLoading(false)
      setLoadError('')
      setDraft(null)
      setBaseline(null)
      return
    }
    const current = new AbortController()
    setLoading(true)
    setLoadError('')
    setAccountMessage('')
    setPreferencesMessage('')
    setAccountError(null)
    setPreferencesError(null)
    request<unknown>(userProfilePath, { signal: current.signal })
      .then((body) => {
        if (current.signal.aborted || !mounted.current) return
        const profile = readUserProfile(body)
        if (!profile) {
          setLoadError(text('profile.loadError'))
          setDraft(null)
          setBaseline(null)
          return
        }
        const suggested = withUnsavedClerkName(profile, sessionNameRef.current)
        setDraft(cloneProfile(suggested))
        setBaseline(cloneProfile(suggested))
        setEditing(false)
        applyConfirmed(profile)
      })
      .catch((reason) => {
        if (!current.signal.aborted && mounted.current && !endsSession(reason)) {
          setLoadError(reason instanceof Error ? reason.message : text('profile.loadError'))
          setDraft(null)
          setBaseline(null)
        }
      })
      .finally(() => { if (!current.signal.aborted && mounted.current) setLoading(false) })
    return () => current.abort()
  }, [orgId, request, reloadKey, applyConfirmed])

  useEffect(() => {
    const currentDraft = draftRef.current
    const currentBaseline = baselineRef.current
    if (!currentDraft || !currentBaseline) return
    const filled = fillUnsavedNameIfUntouched(currentDraft, currentBaseline, sessionName)
    if (!filled) return
    setDraft(cloneProfile(filled.draft))
    setBaseline(cloneProfile(filled.baseline))
  }, [sessionName])

  function reload() {
    flight.current?.abort()
    setReloadKey((value) => value + 1)
  }

  function cancelAccount() {
    if (!draft || !baseline) return
    setDraft({ ...draft, displayName: baseline.displayName, bio: baseline.bio, jobTitle: baseline.jobTitle })
    setEditing(false)
    setAccountMessage('')
    setAccountError(null)
  }

  function cancelPreferences() {
    if (!draft || !baseline) return
    setDraft({ ...draft, language: baseline.language, timezone: baseline.timezone })
    setPreferencesMessage('')
    setPreferencesError(null)
  }

  async function persist(next: UserProfile, source: SaveSource) {
    if (!orgId || flight.current) return
    const controller = new AbortController()
    flight.current = controller
    const setSaving = source === 'account' ? setSavingAccount : setSavingPreferences
    const setMessage = source === 'account' ? setAccountMessage : setPreferencesMessage
    const setError = source === 'account' ? setAccountError : setPreferencesError
    setSaving(true)
    setMessage('')
    setError(null)
    try {
      const saved = await request<unknown>(userProfilePath, {
        method: 'PUT',
        signal: controller.signal,
        body: JSON.stringify(buildProfilePut(next)),
      })
      if (!mounted.current || controller.signal.aborted) return
      const echoed = readUserProfile(saved)
      if (!serverConfirmedProfile(next, saved) || !echoed) {
        setError(new ApiError(text('profile.error.notConfirmed'), 0))
        return
      }
      const previous = baselineRef.current
      setBaseline(cloneProfile(echoed))
      setDraft((current) => mergeDirty(current, previous, echoed, source))
      applyConfirmed(echoed)
      const savedLanguage = languageOf(echoed.language)
      setAppliedClerkLocale(savedLanguage)
      setMessage(profileMessage(savedLanguage, 'profile.success'))
      if (source === 'account') setEditing(false)
      if (!user || controller.signal.aborted) return
      try {
        const names = splitDisplayName(echoed.displayName)
        await user.update({ firstName: names.firstName, lastName: names.lastName })
        if (!mounted.current || controller.signal.aborted) return
        try {
          await user.reload()
        } catch {
          if (mounted.current) applyConfirmed(echoed)
        }
      } catch {
        if (mounted.current) applyConfirmed(echoed)
      }
    } catch (reason) {
      if (!mounted.current || controller.signal.aborted || endsSession(reason)) return
      setError(reason instanceof ApiError ? reason : new ApiError(text('profile.error.save'), 0))
    } finally {
      if (flight.current === controller) flight.current = null
      if (mounted.current && !controller.signal.aborted) setSaving(false)
    }
  }

  function submitAccount(event: FormEvent) {
    event.preventDefault()
    if (!draft || !baseline || saving) return
    const next: UserProfile = {
      ...baseline,
      displayName: draft.displayName,
      bio: draft.bio,
      jobTitle: draft.jobTitle,
    }
    const local = profileFieldMessages(language, next)
    if (Object.keys(local).length > 0) {
      setAccountMessage('')
      setAccountError(new ApiError(local.language || local.timezone || text('profile.error.checkFields'), 400, local))
      return
    }
    void persist(next, 'account')
  }

  function submitPreferences(event: FormEvent) {
    event.preventDefault()
    if (!draft || !baseline || saving) return
    const next: UserProfile = {
      ...baseline,
      language: draft.language,
      timezone: draft.timezone,
    }
    const local = profileFieldMessages(language, next)
    if (Object.keys(local).length > 0) {
      setPreferencesMessage('')
      setPreferencesError(new ApiError(local.displayName || local.bio || local.jobTitle || text('profile.error.checkFields'), 400, local))
      return
    }
    void persist(next, 'preferences')
  }

  function onTabsKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const index = sections.indexOf(section)
    const nextIndex = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? sections.length - 1
        : event.key === 'ArrowUp' || event.key === 'ArrowLeft'
          ? (index - 1 + sections.length) % sections.length
          : (index + 1) % sections.length
    const next = sections[nextIndex] ?? 'account'
    setSection(next)
    document.getElementById(`profile-tab-${next}`)?.focus()
  }

  if (!orgId) return null

  return (
    <div className="space-y-4">
      <PageHeader title={text('profile.title')} description={text('profile.description')} />
      <ProfileIdentityCard
        language={language}
        profile={baseline}
        timezone={baseline?.timezone ?? ''}
        editDisabled={!baseline || saving}
        onEdit={() => { setSection('account'); setEditing(true) }}
      />
      <div className="md:grid md:grid-cols-[16rem_minmax(0,1fr)] md:items-start md:gap-6">
        <div className="mb-4 md:hidden">
          <Select
            id="profile-section"
            label={text('profile.sections')}
            value={section}
            onChange={(event) => setSection(event.target.value as SectionId)}
          >
            {sections.map((item) => <option key={item} value={item}>{text(sectionLabel[item])}</option>)}
          </Select>
        </div>
        <div role="tablist" aria-orientation="vertical" aria-label={text('profile.sections')} className="hidden flex-col gap-1 md:flex" onKeyDown={onTabsKeyDown}>
          {sections.map((item) => {
            const selected = item === section
            return (
              <button
                key={item}
                id={`profile-tab-${item}`}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls="profile-panel"
                tabIndex={selected ? 0 : -1}
                className={`rounded-lg px-3 py-2 text-left text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0C70F2] ${selected ? 'bg-blue-50 font-semibold text-[#0C70F2]' : 'text-slate-700 hover:bg-slate-50'}`}
                onClick={() => setSection(item)}
              >
                {text(sectionLabel[item])}
              </button>
            )
          })}
        </div>
        <div role="tabpanel" id="profile-panel" aria-labelledby="profile-section-title" tabIndex={0} className="min-w-0 space-y-4 outline-none">
          <h2 id="profile-section-title" className="text-xl font-semibold text-[#083B7A]">{text(sectionLabel[section])}</h2>
          <div hidden={section !== 'account'}>
            <AccountSection
              language={language}
              draft={draft}
              baseline={baseline}
              loading={loading}
              loadError={loadError}
              editing={editing}
              saving={saving}
              message={accountMessage}
              error={accountError}
              onChange={setDraft}
              onSubmit={submitAccount}
              onCancel={cancelAccount}
              onReload={reload}
            />
          </div>
          <div hidden={section !== 'preferences'}>
            <PreferencesSection
              language={language}
              draft={draft}
              baseline={baseline}
              loading={loading}
              loadError={loadError}
              saving={saving}
              message={preferencesMessage}
              error={preferencesError}
              onChange={setDraft}
              onSubmit={submitPreferences}
              onCancel={cancelPreferences}
              onReload={reload}
            />
          </div>
          <div hidden={section !== 'notifications'}>
            <NotificationPreferences />
          </div>
          <div hidden={section !== 'security'}>
            <SecuritySection language={language} />
          </div>
          <div hidden={section !== 'help'}>
            <HelpSection language={language} />
          </div>
        </div>
      </div>
    </div>
  )
}
