export class ApiError extends Error {
  status: number
  fieldErrors: Record<string, string>
  constructor(message: string, status: number, fieldErrors: Record<string, string> = {}) {
    super(message)
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

export async function apiRequest<T>(baseUrl: string, path: string, token: string, options: RequestInit = {}): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers, Authorization: `Bearer ${token}` },
    })
  } catch (error) {
    if (options.signal?.aborted) throw error
    throw new ApiError('Não foi possível conectar ao servidor. Tente novamente.', 0)
  }
  const body = await response.json().catch(() => null)
  if (!response.ok) {
    const fallback = response.status === 401 ? 'Sua sessão expirou. Entre novamente.'
      : response.status === 403 ? 'Você não tem acesso. Selecione uma empresa válida.'
        : 'Não foi possível concluir a operação. Tente novamente.'
    throw new ApiError(body?.message ?? fallback, response.status, body?.fieldErrors ?? {})
  }
  if (body === null) throw new ApiError('O servidor retornou uma resposta inválida.', response.status)
  return body as T
}

// This check prevents a request prepared for one organization using another session token.
// Authentication and authorization are always enforced by the backend.
export function tokenMatchesOrganization(token: string, organizationId: string): boolean {
  try {
    const claims = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return (claims.o?.id ?? claims.org_id) === organizationId
  } catch { return false }
}
