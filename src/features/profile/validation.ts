import { isSupportedTimeZone } from './timeZones'
import type { UserProfile } from './types'

const controlCharacters = /[\u0000-\u001F\u007F]/

export type ProfileFieldCode = 'name' | 'control' | 'language' | 'timezone' | 'bio' | 'jobTitle'

type ValidatedProfile = Pick<UserProfile, 'displayName' | 'language' | 'timezone'> & Partial<Pick<UserProfile, 'bio' | 'jobTitle'>>

function textOf(value: string | undefined): string {
  return typeof value === 'string' ? value : ''
}

export function profileFieldErrors(profile: ValidatedProfile): Record<string, ProfileFieldCode> {
  const errors: Record<string, ProfileFieldCode> = {}
  const name = profile.displayName.trim()
  if (controlCharacters.test(profile.displayName)) errors.displayName = 'control'
  else if (name.length < 1 || name.length > 200) errors.displayName = 'name'
  const bio = textOf(profile.bio)
  const bioTrimmed = bio.trim()
  if (controlCharacters.test(bio)) errors.bio = 'control'
  else if (bioTrimmed.length > 160) errors.bio = 'bio'
  const jobTitle = textOf(profile.jobTitle)
  const jobTitleTrimmed = jobTitle.trim()
  if (controlCharacters.test(jobTitle)) errors.jobTitle = 'control'
  else if (jobTitleTrimmed.length > 80) errors.jobTitle = 'jobTitle'
  if (profile.language !== 'pt-BR' && profile.language !== 'en') errors.language = 'language'
  if (!isSupportedTimeZone(profile.timezone)) errors.timezone = 'timezone'
  return errors
}
