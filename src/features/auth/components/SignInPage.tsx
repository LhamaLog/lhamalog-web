import { SignIn } from '@clerk/react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { AuthLayout } from './AuthLayout'
import { SIGNED_OUT_REASON } from '../hooks/useSessionErrorHandler'
import { authAppearance } from '../theme/appearance'

export function SignInPage() {
  const [params] = useSearchParams()
  const { pathname } = useLocation()
  const signedOut = params.get('motivo') === SIGNED_OUT_REASON
  // /sign-in é a primeira etapa; /sign-in/factor-one, /factor-two etc. são as verificações.
  const step = /^\/sign-in\/?$/.test(pathname) ? 'inicio' : 'interna'

  return (
    <AuthLayout step={step} showTerms={step === 'inicio'}>
      {signedOut && (
        <p role="alert" className="lh-aviso">
          Você foi deslogado. Entre novamente.
        </p>
      )}
      {/* Formulário da Clerk (ADR_023). Visual: authAppearance + auth.css. */}
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        fallbackRedirectUrl="/"
        appearance={authAppearance}
      />
    </AuthLayout>
  )
}
