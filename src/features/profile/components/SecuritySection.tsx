import { useSession, useUser, useReverification } from '@clerk/react'
import { isReverificationCancelledError } from '@clerk/react/errors'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { PasswordInput } from '../../../shared/ui/PasswordInput'
import { clerkFailureMessage } from '../clerkError'
import { profileMessage } from '../messages'
import type { MessageKey } from '../messages'
import { markSessions, sessionHasTask, sessionsAfterRevoke } from '../sessions'
import type { AppliedLanguage } from '../types'

type ActiveSession = {
  id: string
  lastActiveAt: Date
  latestActivity: { browserName?: string, city?: string, country?: string }
  revoke: () => Promise<unknown>
}

export function SecuritySection({ language }: { language: AppliedLanguage }) {
  const { isLoaded, user } = useUser()
  const { session } = useSession()
  const navigate = useNavigate()
  const text = (key: MessageKey) => profileMessage(language, key)
  const [unreadable, setUnreadable] = useState(false)
  const [reading, setReading] = useState(false)
  const [disabling, setDisabling] = useState(false)
  const [disableError, setDisableError] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordBusy, setPasswordBusy] = useState(false)
  const [sessions, setSessions] = useState<ActiveSession[]>([])
  const [sessionsError, setSessionsError] = useState('')
  const [sessionsLoaded, setSessionsLoaded] = useState(false)
  const [sessionReload, setSessionReload] = useState(0)
  const [revokingId, setRevokingId] = useState('')
  const [revokeErrors, setRevokeErrors] = useState<Record<string, string>>({})
  const currentId = session?.id ?? ''
  const resetByTask = sessionHasTask(session, 'reset-password')
  const statusKnown = isLoaded && !!user && typeof user.twoFactorEnabled === 'boolean' && !unreadable
  const enabled = statusKnown ? user.twoFactorEnabled : null

  const disableVerification = useReverification(async () => {
    if (!user) throw new Error('missing user')
    await user.disableTOTP()
  })
  const changePassword = useReverification(async (current: string, next: string) => {
    if (!user) throw new Error('missing user')
    // A sessão em uso termina pelo Sair, não por esta troca.
    await user.updatePassword({ currentPassword: current, newPassword: next })
  })

  useEffect(() => {
    if (!user) return
    let cancelled = false
    setSessionsError('')
    user.getSessions()
      .then((list) => {
        if (!cancelled) setSessions(list)
      })
      .catch((reason) => {
        if (!cancelled) setSessionsError(clerkFailureMessage(reason, text('profile.security.sessionsError')))
      })
      .finally(() => {
        if (!cancelled) setSessionsLoaded(true)
      })
    return () => { cancelled = true }
  }, [user, sessionReload, language])

  async function retryStatus() {
    if (!user) {
      setUnreadable(true)
      return
    }
    setReading(true)
    try {
      await user.reload()
      setUnreadable(typeof user.twoFactorEnabled !== 'boolean')
    } catch {
      setUnreadable(true)
    } finally {
      setReading(false)
    }
  }

  async function onDisable() {
    if (disabling || enabled !== true) return
    setDisabling(true)
    setDisableError('')
    try {
      await disableVerification()
      try {
        await user?.reload()
        setUnreadable(typeof user?.twoFactorEnabled !== 'boolean')
      } catch {
        setUnreadable(true)
      }
    } catch (reason) {
      if (!isReverificationCancelledError(reason)) setDisableError(clerkFailureMessage(reason, text('profile.security.disableError')))
    } finally {
      setDisabling(false)
    }
  }

  async function onPassword(event: FormEvent) {
    event.preventDefault()
    if (passwordBusy) return
    setPasswordMessage('')
    setPasswordError('')
    if (!currentPassword || !newPassword) {
      setPasswordError(text('profile.security.passwordError'))
      return
    }
    setPasswordBusy(true)
    try {
      await changePassword(currentPassword, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setPasswordMessage(text('profile.security.passwordSaved'))
    } catch (reason) {
      if (!isReverificationCancelledError(reason)) setPasswordError(clerkFailureMessage(reason, text('profile.security.passwordError')))
    } finally {
      setPasswordBusy(false)
    }
  }

  async function revoke(item: ActiveSession) {
    const mark = markSessions([item], currentId)[0]
    if (!mark?.revocable || revokingId) return
    setRevokingId(item.id)
    setRevokeErrors((current) => {
      const next = { ...current }
      delete next[item.id]
      return next
    })
    try {
      await item.revoke()
      setSessions((current) => sessionsAfterRevoke(current, item.id))
    } catch (reason) {
      setRevokeErrors((current) => ({ ...current, [item.id]: clerkFailureMessage(reason, text('profile.security.revokeError')) }))
    } finally {
      setRevokingId('')
    }
  }

  const marked = markSessions(sessions, currentId)
  const others = marked.filter((item) => !item.current)

  function sessionLabel(item: ActiveSession, current: boolean) {
    if (current) return text('profile.security.currentSession')
    const place = [item.latestActivity?.browserName, item.latestActivity?.city, item.latestActivity?.country].filter(Boolean).join(' · ')
    let when = ''
    try {
      when = item.lastActiveAt ? new Intl.DateTimeFormat(language, { dateStyle: 'short', timeStyle: 'short' }).format(item.lastActiveAt) : ''
    } catch {
      when = ''
    }
    return [place || text('profile.security.otherSession'), when].filter(Boolean).join(' — ')
  }

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <h3 className="text-base font-semibold text-[#083B7A]">{text('profile.security.status')}</h3>
        {!isLoaded || reading ? <p className="text-sm text-slate-600">{text('profile.loading')}</p> : null}
        {isLoaded && !reading && enabled === null && (
          <div role="alert" className="flex flex-wrap items-center gap-3 text-sm text-red-700">
            <span>{text('profile.security.statusError')}</span>
            <Button type="button" variant="outline" size="small" fullWidth={false} onClick={retryStatus}>{text('profile.security.retry')}</Button>
          </div>
        )}
        {enabled !== null && <p className="text-sm text-slate-900">{enabled ? text('profile.security.active') : text('profile.security.inactive')}</p>}
        {enabled === true && (
          <Button type="button" variant="outline" fullWidth={false} disabled={disabling} onClick={onDisable}>
            {disabling ? text('profile.saving') : text('profile.security.disable')}
          </Button>
        )}
        {disableError && <p role="alert" className="text-sm text-red-700">{disableError}</p>}
      </Card>

      <Card className="space-y-3">
        <h3 className="text-base font-semibold text-[#083B7A]">{text('profile.security.password')}</h3>
        {resetByTask ? (
          <Button type="button" fullWidth={false} onClick={() => navigate('/tarefas/redefinir-senha')}>{text('profile.security.changePassword')}</Button>
        ) : (
          <form onSubmit={onPassword} noValidate className="space-y-4">
            {passwordMessage && <p role="status" className="text-sm text-green-700">{passwordMessage}</p>}
            {passwordError && <p role="alert" className="text-sm text-red-700">{passwordError}</p>}
            <PasswordInput id="profile-current-password" label={text('profile.security.currentPassword')} autoComplete="current-password" compact value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
            <PasswordInput id="profile-new-password" label={text('profile.security.newPassword')} autoComplete="new-password" compact value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
            <Button type="submit" fullWidth={false} disabled={passwordBusy}>{passwordBusy ? text('profile.saving') : text('profile.security.changePassword')}</Button>
          </form>
        )}
      </Card>

      <Card className="space-y-3">
        <h3 className="text-base font-semibold text-[#083B7A]">{text('profile.security.sessions')}</h3>
        {currentId && <p className="text-sm font-semibold text-slate-900">{text('profile.security.currentSession')}</p>}
        {sessionsError && (
          <div role="alert" className="flex flex-wrap items-center gap-3 text-sm text-red-700">
            <span>{sessionsError}</span>
            <Button type="button" variant="outline" size="small" fullWidth={false} onClick={() => setSessionReload((value) => value + 1)}>{text('profile.security.retry')}</Button>
          </div>
        )}
        {sessionsLoaded && !sessionsError && others.length === 0 && <p className="text-sm text-slate-600">{text('profile.security.noOtherSessions')}</p>}
        <ul className="space-y-3">
          {sessions.map((item) => {
            const mark = marked.find((row) => row.id === item.id)
            const current = mark?.current === true
            return (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-3">
                <span className="text-sm text-slate-900">{sessionLabel(item, current)}</span>
                {mark?.revocable && (
                  <Button type="button" variant="outline" size="small" fullWidth={false} disabled={revokingId === item.id} onClick={() => revoke(item)}>
                    {revokingId === item.id ? text('profile.saving') : text('profile.security.revoke')}
                  </Button>
                )}
                {revokeErrors[item.id] && <p role="alert" className="w-full text-sm text-red-700">{revokeErrors[item.id]}</p>}
              </li>
            )
          })}
        </ul>
      </Card>
    </div>
  )
}
