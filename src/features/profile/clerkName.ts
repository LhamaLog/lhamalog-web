export function splitDisplayName(displayName: string): { firstName: string; lastName: string } {
  const parts = displayName.trim().split(/\s+/).filter(Boolean)
  return { firstName: parts[0] ?? '', lastName: parts.slice(1).join(' ') }
}

export function clerkSessionName(user: {
  fullName?: string | null
  firstName?: string | null
  lastName?: string | null
} | null | undefined): string {
  const fullName = user?.fullName?.trim() ?? ''
  if (fullName) return fullName
  return [user?.firstName, user?.lastName].map((part) => (part ?? '').trim()).filter(Boolean).join(' ')
}

export function withUnsavedClerkName<T extends { displayName: string, version: number | null }>(profile: T, sessionName: string): T {
  if (profile.version !== null || profile.displayName.trim() !== '') return profile
  const name = sessionName.trim()
  if (!name) return profile
  return { ...profile, displayName: name }
}

export function fillUnsavedNameIfUntouched<T extends { displayName: string, version: number | null }>(
  draft: T,
  baseline: T,
  sessionName: string,
): { draft: T, baseline: T } | null {
  if (draft.displayName !== baseline.displayName) return null
  const nextBaseline = withUnsavedClerkName(baseline, sessionName)
  if (nextBaseline.displayName === baseline.displayName) return null
  return { baseline: nextBaseline, draft: { ...draft, displayName: nextBaseline.displayName } }
}
