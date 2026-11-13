import { TaskChooseOrganization } from '@clerk/react'
import { AuthBackground } from './AuthBackground'

// Etapa pós-login "escolher organização" (session task "choose-organization", ADR_026, ADR_030).
export function ChooseOrganizationTask() {
  return (
    <AuthBackground>
      <TaskChooseOrganization redirectUrlComplete="/" />
    </AuthBackground>
  )
}
