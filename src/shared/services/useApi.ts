import { useCallback } from 'react'
import { useAuth } from '@clerk/react'
import { readPublicConfig } from '../config'
import { ApiError, apiRequest, tokenMatchesOrganization } from './api'
import { classifyRejection, signOutOnce } from './sessionRedirect'

export function useApi() {
  const { getToken, orgId, signOut } = useAuth()
  return useCallback(async <T,>(path: string, options: RequestInit = {}): Promise<T> => {
    // Sem empresa selecionada o Core nem é chamado, e a sessão continua (spec 005, FR-004).
    if (!orgId) throw new ApiError('Selecione uma empresa para continuar.', 403, {}, 'no_organization')
    const token = await getToken()
    if (options.signal?.aborted) throw new DOMException('Aborted', 'AbortError')
    if (!token) {
      // Sem token a sessão já acabou na Clerk: sai pelo mesmo caminho do 401, para a tela não ficar sem erro e sem login.
      await signOutOnce(signOut)
      throw new ApiError('Sua sessão expirou. Entre novamente.', 401)
    }
    if (!tokenMatchesOrganization(token, orgId)) throw new ApiError('A empresa mudou. Recarregue os dados.', 409)
    try {
      return await apiRequest<T>(readPublicConfig().apiUrl, path, token, options)
    } catch (error) {
      // 401 e 403 de segurança encerram a sessão local uma vez só e voltam ao login com a rota atual.
      if (error instanceof ApiError && classifyRejection(error.status, error.code, error.serverMessage) === 'session') {
        await signOutOnce(signOut)
      }
      throw error
    }
  }, [getToken, orgId, signOut])
}
