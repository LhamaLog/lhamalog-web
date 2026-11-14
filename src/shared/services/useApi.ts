import { useCallback } from 'react'
import { useAuth } from '@clerk/react'
import { readPublicConfig } from '../config'
import { ApiError, apiRequest, tokenMatchesOrganization } from './api'

export function useApi() {
  const { getToken, orgId, signOut } = useAuth()
  return useCallback(async <T,>(path: string, options: RequestInit = {}): Promise<T> => {
    if (!orgId) throw new ApiError('Selecione uma empresa para continuar.', 403)
    const token = await getToken()
    if (options.signal?.aborted) throw new DOMException('Aborted', 'AbortError')
    if (!token) throw new ApiError('Sua sessão expirou. Entre novamente.', 401)
    if (!tokenMatchesOrganization(token, orgId)) throw new ApiError('A empresa mudou. Recarregue os dados.', 409)
    try {
      return await apiRequest<T>(readPublicConfig().apiUrl, path, token, options)
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        await signOut({ redirectUrl: '/sign-in?motivo=deslogado' })
      }
      throw error
    }
  }, [getToken, orgId, signOut])
}
