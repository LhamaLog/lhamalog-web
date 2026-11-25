import { useOrganization, useUser } from '@clerk/react'
import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { ApiError } from '../../../shared/services/api'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { ErrorState } from '../../../shared/ui/ErrorState'
import { Input } from '../../../shared/ui/Input'
import { LoadingState } from '../../../shared/ui/LoadingState'
import { clerkFailureMessage } from '../clerkError'
import { clerkSessionName } from '../clerkName'
import { membershipRoleMessageKey, membershipStartedAt } from '../membership'
import { profileMessage } from '../messages'
import type { MessageKey } from '../messages'
import { profilePhotoSrc } from '../photo'
import type { AppliedLanguage, UserProfile } from '../types'
import { Avatar } from '../../../shared/ui/Avatar'

type IdentityProps = {
  language: AppliedLanguage
  profile: UserProfile | null
  timezone: string
  editDisabled: boolean
  onEdit: () => void
}

function formatSince(language: string, date: Date, timezone: string) {
  const options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }
  try {
    return new Intl.DateTimeFormat(language, timezone ? { ...options, timeZone: timezone } : options).format(date)
  } catch {
    return new Intl.DateTimeFormat(language, options).format(date)
  }
}

function Fact({ label, value }: { label: string, value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold text-slate-500">{label}</dt>
      <dd className="min-h-5 break-words text-sm text-slate-900">{value}</dd>
    </div>
  )
}

export function ProfileIdentityCard({ language, profile, timezone, editDisabled, onEdit }: IdentityProps) {
  const { user } = useUser()
  const { organization } = useOrganization()
  const fileRef = useRef<HTMLInputElement>(null)
  const [photoError, setPhotoError] = useState('')
  const [photoBusy, setPhotoBusy] = useState(false)
  const [membership, setMembership] = useState<{ role: string, createdAt: Date | null } | null>(null)
  const [membershipError, setMembershipError] = useState(false)
  const [membershipLoaded, setMembershipLoaded] = useState(false)
  const [membershipReload, setMembershipReload] = useState(0)
  const text = (key: MessageKey, values?: Record<string, string>) => profileMessage(language, key, values)
  const sessionName = clerkSessionName(user)
  const name = profile?.displayName.trim() || sessionName || text('shell.userFallback')
  const email = user?.primaryEmailAddress?.emailAddress ?? ''
  const photo = profilePhotoSrc(user)
  const roleKey = membership ? membershipRoleMessageKey(membership.role) : null
  const role = membership ? (roleKey ? text(roleKey) : membership.role) : '—'
  const since = membership?.createdAt
    ? formatSince(language, membership.createdAt, timezone)
    : membershipLoaded ? text('profile.memberSinceUnavailable') : '—'

  useEffect(() => {
    if (!user || !organization?.id) {
      setMembership(null)
      setMembershipError(false)
      setMembershipLoaded(false)
      return
    }
    let cancelled = false
    setMembershipError(false)
    const organizationId = organization.id
    const apply = (role: string, createdAt: Date | number | string | null | undefined) => {
      setMembership({ role, createdAt: membershipStartedAt(createdAt) })
      setMembershipLoaded(true)
    }
    const local = user.organizationMemberships.find((item) => item.organization.id === organizationId)
    if (local && membershipReload === 0) {
      apply(local.role, local.createdAt)
      return
    }
    user.getOrganizationMemberships({ pageSize: 100 })
      .then((page) => {
        if (cancelled) return
        const found = page.data.find((item) => item.organization.id === organizationId)
        if (!found) {
          setMembership(null)
          setMembershipLoaded(true)
          return
        }
        apply(found.role, found.createdAt)
      })
      .catch(() => {
        if (!cancelled) {
          setMembershipError(true)
          setMembershipLoaded(true)
        }
      })
    return () => { cancelled = true }
  }, [user, organization?.id, membershipReload])

  async function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !user || photoBusy) return
    setPhotoBusy(true)
    setPhotoError('')
    try {
      await user.setProfileImage({ file })
      try { await user.reload() } catch { /* a foto nova já foi aceita */ }
    } catch (reason) {
      setPhotoError(clerkFailureMessage(reason, text('profile.photo.error')))
    } finally {
      setPhotoBusy(false)
    }
  }

  return (
    <Card className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex flex-col items-start gap-3">
          <Avatar name={name} imageUrl={photo} size="lg" />
          <input ref={fileRef} id="profile-photo" type="file" accept="image/*" className="sr-only" aria-label={text('profile.photo.change')} onChange={onFile} />
          <Button type="button" variant="outline" size="small" fullWidth={false} disabled={photoBusy || !user} onClick={() => fileRef.current?.click()}>
            {text('profile.photo.change')}
          </Button>
        </div>
        <dl className="grid flex-1 gap-3 sm:grid-cols-2">
          <Fact label={text('profile.name')} value={profile ? profile.displayName : name} />
          <Fact label={text('profile.email')} value={email} />
          <Fact label={text('profile.role')} value={role} />
          <Fact label={text('profile.company')} value={organization?.name ?? ''} />
          <Fact label={text('profile.memberSince')} value={since} />
          <Fact label={text('profile.jobTitle')} value={profile?.jobTitle ?? ''} />
          <Fact label={text('profile.bio')} value={profile?.bio ?? ''} />
        </dl>
      </div>
      {photoError && <p role="alert" className="text-sm text-red-700">{photoError}</p>}
      {membershipError && (
        <div role="alert" className="flex flex-wrap items-center gap-3 text-sm text-red-700">
          <span>{text('profile.membershipError')}</span>
          <Button type="button" variant="outline" size="small" fullWidth={false} onClick={() => setMembershipReload((value) => value + 1)}>{text('profile.security.retry')}</Button>
        </div>
      )}
      <div className="flex justify-end">
        <Button type="button" fullWidth={false} disabled={editDisabled} onClick={onEdit}>{text('profile.edit')}</Button>
      </div>
    </Card>
  )
}

type AccountSectionProps = {
  language: AppliedLanguage
  draft: UserProfile | null
  baseline: UserProfile | null
  loading: boolean
  loadError: string
  editing: boolean
  saving: boolean
  message: string
  error: ApiError | null
  onChange: (profile: UserProfile) => void
  onSubmit: (event: FormEvent) => void
  onCancel: () => void
  onReload: () => void
}

export function AccountSection({
  language, draft, baseline, loading, loadError, editing, saving, message, error, onChange, onSubmit, onCancel, onReload,
}: AccountSectionProps) {
  const text = (key: MessageKey) => profileMessage(language, key)
  if (loading) return <LoadingState label={text('profile.loading')} />
  if (loadError || !baseline || !draft) return <ErrorState description={loadError || text('profile.loadError')} onRetry={onReload} />
  const fieldErrors = error?.fieldErrors ?? {}

  if (!editing) {
    return (
      <div className="space-y-4">
        {message && <p role="status" className="rounded-lg bg-green-50 p-4 text-sm text-green-800">{message}</p>}
        <Card>
          <dl className="grid gap-3 sm:grid-cols-2">
            <Fact label={text('profile.name')} value={baseline.displayName} />
            <Fact label={text('profile.jobTitle')} value={baseline.jobTitle} />
            <Fact label={text('profile.bio')} value={baseline.bio} />
          </dl>
        </Card>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {message && <p role="status" className="rounded-lg bg-green-50 p-4 text-sm text-green-800">{message}</p>}
      {error && (
        <div role="alert" className="flex flex-wrap items-center gap-3 rounded-lg bg-red-50 p-4 text-sm text-red-700">
          <span>{error.message}</span>
          {error.status === 409 && <Button type="button" onClick={onReload} variant="outline" size="small" fullWidth={false}>{text('profile.reload')}</Button>}
        </div>
      )}
      <fieldset disabled={saving} className="m-0 space-y-4 border-0 p-0">
        <Card className="space-y-4">
          <Input id="profile-name" label={text('profile.name')} requiredMark compact maxLength={200} value={draft.displayName} error={fieldErrors.displayName} onChange={(event) => onChange({ ...draft, displayName: event.target.value })} />
          <Input id="profile-bio" label={text('profile.bio')} compact value={draft.bio} error={fieldErrors.bio} hint={`${draft.bio.trim().length}/160`} onChange={(event) => onChange({ ...draft, bio: event.target.value })} />
          <Input id="profile-job-title" label={text('profile.jobTitle')} compact value={draft.jobTitle} error={fieldErrors.jobTitle} hint={`${draft.jobTitle.trim().length}/80`} onChange={(event) => onChange({ ...draft, jobTitle: event.target.value })} />
        </Card>
        <div className="flex flex-wrap justify-end gap-3">
          <Button type="button" variant="outline" fullWidth={false} onClick={onCancel} disabled={saving}>{text('profile.cancel')}</Button>
          <Button type="submit" fullWidth={false} disabled={saving}>{saving ? text('profile.saving') : text('profile.save')}</Button>
        </div>
      </fieldset>
    </form>
  )
}
