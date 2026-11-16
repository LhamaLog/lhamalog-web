export function splitDisplayName(displayName: string): { firstName: string; lastName: string } {
  const parts = displayName.trim().split(/\s+/).filter(Boolean)
  return { firstName: parts[0] ?? '', lastName: parts.slice(1).join(' ') }
}
