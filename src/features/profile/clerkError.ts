export function clerkFailureMessage(error: unknown, fallback: string): string {
  if (!error || typeof error !== 'object') return fallback
  if ('errors' in error && Array.isArray(error.errors)) {
    for (const item of error.errors) {
      if (!item || typeof item !== 'object') continue
      if ('longMessage' in item && typeof item.longMessage === 'string' && item.longMessage.trim()) return item.longMessage
      if ('message' in item && typeof item.message === 'string' && item.message.trim()) return item.message
    }
  }
  if (error instanceof Error && error.message.trim()) return error.message
  return fallback
}
