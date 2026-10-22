import type { ComponentProps } from 'react'
import { Button } from './Button'

type NotificationButtonProps = Omit<
  ComponentProps<typeof Button>,
  'children' | 'variant' | 'size' | 'fullWidth' | 'className' | 'style'
> & {
  count?: number
}

export function NotificationButton({ count = 0, ...props }: NotificationButtonProps) {
  const unreadCount = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0
  const label = unreadCount === 0
    ? 'Notificações, nenhuma não lida'
    : `Notificações, ${unreadCount} ${unreadCount === 1 ? 'não lida' : 'não lidas'}`

  return (
    <Button
      {...props}
      variant="outline"
      size="icon"
      fullWidth={false}
      aria-label={props['aria-label'] ?? label}
      className="relative shrink-0 border-transparent! text-[#083B7A]!"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
      </svg>
      {unreadCount > 0 && (
        <span
          aria-hidden="true"
          className="absolute -right-1 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-medium text-white"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Button>
  )
}
