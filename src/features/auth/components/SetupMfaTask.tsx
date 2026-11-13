import { TaskSetupMFA } from '@clerk/react'
import { AuthLayout } from './AuthLayout'
import { authAppearance } from '../theme/appearance'

// Etapa pós-login "configurar MFA" (session task "setup-mfa", ADR_024).
export function SetupMfaTask() {
  return (
    <AuthLayout step="interna">
      <TaskSetupMFA redirectUrlComplete="/" appearance={authAppearance} />
    </AuthLayout>
  )
}
