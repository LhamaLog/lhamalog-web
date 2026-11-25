import { useState } from 'react'

type AvatarProps = {
  name: string
  imageUrl?: string | null
  size?: 'sm' | 'lg'
}

export function Avatar({ name, imageUrl, size = 'sm' }: AvatarProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const words = name.trim().split(/\s+/).filter(Boolean)
  const firstInitial = words[0]?.[0] ?? ''
  const lastInitial = words.length > 1 ? words[words.length - 1]?.[0] ?? '' : ''
  const initials = (firstInitial + lastInitial).toLocaleUpperCase('pt-BR') || '?'
  const dimension = size === 'lg' ? 'h-24 w-24 text-2xl' : 'h-9 w-9 text-xs'
  const label = name.trim() || 'Usuário sem nome'

  if (imageUrl && failedUrl !== imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={label}
        className={`${dimension} shrink-0 rounded-full object-cover`}
        onError={() => setFailedUrl(imageUrl)}
      />
    )
  }

  return (
    <span
      role="img"
      aria-label={label}
      className={`inline-flex ${dimension} shrink-0 items-center justify-center rounded-full bg-[#0C70F2] font-semibold text-white`}
    >
      {initials}
    </span>
  )
}
