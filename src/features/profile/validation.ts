import { isSupportedTimeZone } from './timeZones'
import type { UserProfile } from './types'

const controlCharacters = /[\u0000-\u001F\u007F]/

export function profileFieldErrors(profile: Pick<UserProfile, 'displayName' | 'language' | 'timezone'>): Record<string, 'name' | 'control' | 'language' | 'timezone'> {
  const errors: Record<string, 'name' | 'control' | 'language' | 'timezone'> = {}
  const name = profile.displayName.trim()
  if (controlCharacters.test(profile.displayName)) errors.displayName = 'control'
  else if (name.length < 1 || name.length > 200) errors.displayName = 'name'
  if (profile.language !== 'pt-BR' && profile.language !== 'en') errors.language = 'language'
  if (!isSupportedTimeZone(profile.timezone)) errors.timezone = 'timezone'
  return errors
}
