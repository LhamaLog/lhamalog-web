import { useCallback } from 'react'
import { useAuth } from '@clerk/react'
import { ApiError } from '../../../shared/services/api'
import { classifyRejection, SIGNED_OUT_REASON, signOutOnce } from '../../../shared/services/sessionRedirect'

export { SIGNED_OUT_REASON }

// ADR_032 e spec 006: 401 e 403 de segurança (sem código e sem mensagem do Core) encerram a sessão local e voltam ao
// login com o aviso "Você foi deslogado" e a rota atual. 403 com código ou mensagem do Core é recusa de negócio e
// mantém a sessão. No 403 de segurança quem revoga TODAS as sessões na Clerk é o Core, não o front.
// `sessionExpired` cobre erros da própria Clerk (sessão expirada no SDK), que também encerram a sessão.
export function useSessionErrorHandler() {
  const { signOut } = useAuth()
  return useCallback(
    async (error: unknown, sessionExpired = false): Promise<boolean> => {
      const ended = sessionExpired
        || (error instanceof ApiError && classifyRejection(error.status, error.code, error.serverMessage) === 'session')
      if (!ended) return false
      await signOutOnce(signOut)
      return true
    },
    [signOut],
  )
}
