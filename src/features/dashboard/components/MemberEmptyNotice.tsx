import { EmptyState } from '../../../shared/ui/EmptyState'
import { dashboardMessage } from '../messages'
import type { AppliedLanguage } from '../../profile/types'

export function MemberEmptyNotice({ language }: { language: AppliedLanguage }) {
  return (
    <EmptyState
      title={dashboardMessage(language, 'dashboard.memberEmptyTitle')}
      description={dashboardMessage(language, 'dashboard.memberEmptyDescription')}
    />
  )
}
