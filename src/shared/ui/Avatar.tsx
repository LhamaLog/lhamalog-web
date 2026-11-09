type AvatarProps = {
  name: string
}

export function Avatar({ name }: AvatarProps) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  const firstInitial = words[0]?.[0] ?? ''
  const lastInitial = words.length > 1 ? words[words.length - 1][0] : ''
  const initials = (firstInitial + lastInitial).toLocaleUpperCase('pt-BR') || '?'

  return (
    <span
      role="img"
      aria-label={name.trim() || 'Usuário sem nome'}
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0C70F2] text-xs font-semibold text-white"
    >
      {initials}
    </span>
  )
}
