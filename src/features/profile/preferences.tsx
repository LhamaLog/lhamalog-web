import { useAuth, useUser } from '@clerk/react'
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useApi } from '../../shared/services/useApi'
import { setAppliedClerkLocale } from './clerkLocale'
import { readUserProfile, userProfilePath } from './contract'
import { profileMessage } from './messages'
import type { AppliedLanguage, UserProfile } from './types'

type AppliedPreferences = {
  language: AppliedLanguage
  displayName: string
  timezone: string
  headerName: string
  applyConfirmed: (profile: UserProfile) => void
}

const AppliedPreferencesContext = createContext<AppliedPreferences | null>(null)

export function useAppliedPreferences(): AppliedPreferences {
  const value = useContext(AppliedPreferencesContext)
  if (value) return value
  return {
    language: 'pt-BR',
    displayName: '',
    timezone: '',
    headerName: profileMessage('pt-BR', 'shell.userFallback'),
    applyConfirmed: () => undefined,
  }
}

function appliedLanguage(language: string, current: AppliedLanguage): AppliedLanguage {
  if (language === 'pt-BR' || language === 'en') return language
  return current
}

export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const { orgId } = useAuth()
  const { user } = useUser()
  const request = useApi()
  const [language, setLanguage] = useState<AppliedLanguage>('pt-BR')
  const [displayName, setDisplayName] = useState('')
  const [timezone, setTimezone] = useState('')
  const sessionName = user?.fullName || user?.primaryEmailAddress?.emailAddress || profileMessage(language, 'shell.userFallback')
  const versionRef = useRef<number | null | undefined>(undefined)

  const apply = useCallback((profile: UserProfile, force: boolean) => {
    if (!force && versionRef.current != null && (profile.version === null || (profile.version != null && profile.version < versionRef.current))) return
    versionRef.current = profile.version
    setLanguage((current) => appliedLanguage(profile.language, current))
    if (profile.language === 'pt-BR' || profile.language === 'en') setAppliedClerkLocale(profile.language)
    setDisplayName(profile.displayName.trim())
    setTimezone(profile.timezone)
  }, [])

  const applyConfirmed = useCallback((profile: UserProfile) => apply(profile, true), [apply])

  useEffect(() => {
    if (!orgId) {
      versionRef.current = undefined
      setLanguage('pt-BR')
      setDisplayName('')
      setTimezone('')
      setAppliedClerkLocale('pt-BR')
      return
    }
    const controller = new AbortController()
    request<unknown>(userProfilePath, { signal: controller.signal })
      .then((body) => {
        if (controller.signal.aborted) return
        const profile = readUserProfile(body)
        if (profile) apply(profile, false)
      })
      .catch(() => undefined)
    return () => controller.abort()
  }, [orgId, request, apply])

  const headerName = displayName.trim() || sessionName
  return (
    <AppliedPreferencesContext.Provider value={{ language, displayName, timezone, headerName, applyConfirmed }}>
      {children}
    </AppliedPreferencesContext.Provider>
  )
}
