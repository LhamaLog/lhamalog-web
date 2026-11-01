import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { Show, useClerk } from '@clerk/react'

// Faz o mesmo que o <RedirectToSignIn /> da Clerk, mas não redireciona se a página já está no login.
// Ao clicar em "Sair", a Clerk leva para /sign-in (afterSignOutUrl) antes desta rota desmontar; o
// RedirectToSignIn lia essa URL e gerava ?redirect_url=/sign-in, e o login seguinte ficava com o card vazio.
function RedirectToSignIn() {
  const clerk = useClerk()
  useEffect(() => {
    if (window.location.pathname.startsWith('/sign-in')) return
    void clerk.redirectToSignIn()
  }, [clerk])
  return null
}

// Sessão "pending" (MFA ainda não cadastrado) conta como deslogada (ADR_024, ADR_032).
export function ProtectedRoute({ children }: { children: ReactNode }) {
  return (
    <>
      <Show when="signed-in">{children}</Show>
      <Show when="signed-out">
        <RedirectToSignIn />
      </Show>
    </>
  )
}
