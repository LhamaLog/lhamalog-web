import { TaskResetPassword } from '@clerk/react'
import { AuthLayout } from './AuthLayout'
import { authAppearance } from '../theme/appearance'

// Etapa pós-login "redefinir senha" (session task "reset-password").
export function ResetPasswordTask() {
  return (
    <AuthLayout step="interna">
      <TaskResetPassword redirectUrlComplete="/" appearance={authAppearance} />
    </AuthLayout>
  )
}
