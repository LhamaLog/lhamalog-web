export function profilePhotoSrc(user: { hasImage?: boolean | null, imageUrl?: string | null } | null | undefined): string | null {
  if (!user || user.hasImage !== true) return null
  const url = typeof user.imageUrl === 'string' ? user.imageUrl.trim() : ''
  return url || null
}
