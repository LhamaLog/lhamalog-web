import type { ComponentProps } from 'react'
import { Breadcrumbs } from '../../shared/ui/Breadcrumbs'
import { SystemStatus } from '../../shared/ui/SystemStatus'
import { PeriodSelector } from '../../shared/ui/PeriodSelector'
import { NotificationButton } from '../../shared/ui/NotificationButton'
import { UserIdentity } from '../../shared/ui/UserIdentity'

type HeaderProps = {
  breadcrumbs: ComponentProps<typeof Breadcrumbs>
  systemStatus: ComponentProps<typeof SystemStatus>
  period: ComponentProps<typeof PeriodSelector>
  notifications: ComponentProps<typeof NotificationButton>
  user: ComponentProps<typeof UserIdentity>
}

export function Header({ breadcrumbs, systemStatus, period, notifications, user }: HeaderProps) {
  return (
    <header className="flex min-h-14 flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-2">
      <div className="min-w-0">
        <Breadcrumbs {...breadcrumbs} />
      </div>

      <div className="flex min-w-0 flex-wrap items-center gap-4">
        <SystemStatus {...systemStatus} />
        <PeriodSelector {...period} />
        <NotificationButton {...notifications} />
        <UserIdentity {...user} />
      </div>
    </header>
  )
}
