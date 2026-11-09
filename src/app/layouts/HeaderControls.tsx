import type { ComponentProps } from 'react'
import { Button } from '../../shared/ui/Button'
import { Avatar } from '../../shared/ui/Avatar'

type SystemStatusProps = {
  label: string
  tone?: 'success' | 'warning' | 'danger' | 'neutral'
}

const dotColors = {
  success: 'bg-green-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  neutral: 'bg-slate-400',
}

export function SystemStatus({ label, tone = 'success' }: SystemStatusProps) {
  return (
    <span role="status" className="inline-flex items-center gap-2 text-xs text-[#0C70F2]">
      <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-full ${dotColors[tone]}`} />
      {label}
    </span>
  )
}

type PeriodSelectorProps = Omit<
  ComponentProps<typeof Button>,
  'children' | 'variant' | 'size' | 'fullWidth' | 'className' | 'style'
> & {
  label: string
}

export function PeriodSelector({ label, ...props }: PeriodSelectorProps) {
  return (
    <Button
      {...props}
      variant="outline"
      size="small"
      fullWidth={false}
      aria-label={props['aria-label'] ?? `Selecionar período. Atual: ${label}`}
      className="rounded-md! border-[#083B7A]! text-[#083B7A]! font-normal!"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M7 3v4M17 3v4M3 11h18" />
      </svg>
      {label}
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="shrink-0"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </Button>
  )
}

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

type UserIdentityProps = {
  name: string
  role: string
}

export function UserIdentity({ name, role }: UserIdentityProps) {
  return (
    <div className="inline-flex min-w-0 max-w-64 items-center gap-2">
      <span aria-hidden="true" className="inline-flex shrink-0">
        <Avatar name={name} />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs font-bold text-[#083B7A]" title={name}>
          {name}
        </p>
        <p className="truncate text-[11px] text-slate-500" title={role}>
          {role}
        </p>
      </div>
    </div>
  )
}
