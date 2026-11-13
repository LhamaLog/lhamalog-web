import { SignUp } from '@clerk/react'
import { useLocation } from 'react-router-dom'
import { AuthLayout } from './AuthLayout'
import { authAppearance } from '../theme/appearance'

export function SignUpPage() {
  const { pathname } = useLocation()
  const step = /^\/sign-up\/?$/.test(pathname) ? 'inicio' : 'interna'

  return (
    <AuthLayout step={step} showTerms={step === 'inicio'}>
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        fallbackRedirectUrl="/"
        appearance={authAppearance}
      />
    </AuthLayout>
  )
}
