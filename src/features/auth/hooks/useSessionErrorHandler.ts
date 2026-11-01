import { useCallback } from 'react'
import { useAuth } from '@clerk/react'

export const SIGNED_OUT_REASON = 'deslogado'

// ADR_032: 401 e 403 são tratados no front do mesmo jeito: encerra a sessão local
// (signOut) e volta ao login com o aviso "Você foi deslogado".
// No 403 quem revoga TODAS as sessões na Clerk é o backend (não o front).
// Pendente na ADR_032: formato do corpo do erro e nome da exceção no front.
export function useSessionErrorHandler() {
  const { signOut } = useAuth()
  return useCallback(
    async (status: number): Promise<boolean> => {
      if (status !== 401 && status !== 403) return false
      await signOut({ redirectUrl: `/sign-in?motivo=${SIGNED_OUT_REASON}` })
      return true
    },
    [signOut],
  )
}
