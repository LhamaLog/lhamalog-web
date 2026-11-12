import type { UserProfile } from './types'

export const userProfilePath = '/api/user/profile'

type Json = Record<string, unknown>

function objectOf(value: unknown): Json {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Json : {}
}

function versionOf(value: unknown): number | null | undefined {
  if (value === null) return null
  if (typeof value === 'number' && Number.isFinite(value)) return value
  return undefined
}

export function readUserProfile(body: unknown): UserProfile | null {
  const record = objectOf(body)
  if (typeof record.displayName !== 'string') return null
  if (typeof record.language !== 'string') return null
  if (typeof record.timezone !== 'string') return null
  const version = versionOf(record.version)
  if (version === undefined) return null
  return { displayName: record.displayName, language: record.language, timezone: record.timezone, version }
}

export function buildProfilePut(profile: UserProfile) {
  return {
    displayName: profile.displayName.trim(),
    language: profile.language,
    timezone: profile.timezone,
    version: profile.version,
  }
}

export function serverConfirmedProfile(sent: UserProfile, response: unknown): boolean {
  const echoed = readUserProfile(response)
  if (!echoed) return false
  const put = buildProfilePut(sent)
  return echoed.displayName.trim() === put.displayName && echoed.language === put.language && echoed.timezone === put.timezone
}

export function cloneProfile(profile: UserProfile): UserProfile {
  return { ...profile }
}
