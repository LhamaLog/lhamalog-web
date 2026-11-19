import { EmptyState } from '../../../shared/ui/EmptyState'
import { dashboardMessage } from '../messages'
import type { AppliedLanguage } from '../../profile/types'

export function DashboardForbidden({ language }: { language: AppliedLanguage }) {
  return (
    <EmptyState
      title={dashboardMessage(language, 'dashboard.forbiddenTitle')}
      description={dashboardMessage(language, 'dashboard.forbiddenDescription')}
    />
  )
}
