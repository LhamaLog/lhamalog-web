export class ApiError extends Error {
  status: number
  fieldErrors: Record<string, string>
  code: string
  // Mensagem enviada pelo Core, ou vazio. A classificação da recusa usa esta, não o texto de reserva (spec 006).
  serverMessage: string
  correlationId: string
  constructor(
    message: string,
    status: number,
    fieldErrors: Record<string, string> = {},
    code = '',
    serverMessage = '',
    correlationId = '',
  ) {
    super(message)
    this.status = status
    this.fieldErrors = fieldErrors
    this.code = code
    this.serverMessage = serverMessage
    this.correlationId = correlationId
  }
}

function usableMessage(value: unknown): string {
  return typeof value === 'string' && value.trim() ? value : ''
}

function messageFor(status: number, code: string): string {
  if (code === 'user_deactivated') return 'Seu acesso a esta empresa foi desativado.'
  if (code === 'last_admin') return 'Não é possível desativar o último administrador.'
  if (code === 'not_admin') return 'Somente o administrador da empresa pode gerenciar os usuários.'
  if (status === 401) return 'Sua sessão expirou. Entre novamente.'
  if (status === 403) return 'Você não tem acesso a esta empresa.'
  return 'Não foi possível concluir a operação. Tente novamente.'
}

export function createCorrelationId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `corr-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function readHeader(headers: HeadersInit | undefined, name: string): string {
  if (!headers) return ''
  if (headers instanceof Headers) return headers.get(name) ?? ''
  if (Array.isArray(headers)) {
    const found = headers.find(([key]) => key.toLowerCase() === name.toLowerCase())
    return found?.[1] ?? ''
  }
  const record = headers as Record<string, string>
  const direct = record[name] ?? record[name.toLowerCase()]
  if (typeof direct === 'string') return direct
  for (const [key, value] of Object.entries(record)) {
    if (key.toLowerCase() === name.toLowerCase() && typeof value === 'string') return value
  }
  return ''
}

export async function apiRequest<T>(baseUrl: string, path: string, token: string, options: RequestInit = {}): Promise<T> {
  const correlationId = readHeader(options.headers, 'X-Correlation-Id') || createCorrelationId()
  let response: Response
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
        Authorization: `Bearer ${token}`,
        'X-Correlation-Id': correlationId,
      },
    })
  } catch (error) {
    if (options.signal?.aborted) throw error
    throw new ApiError('Não foi possível conectar ao servidor. Tente novamente.', 0, {}, '', '', correlationId)
  }
  const echoed = response.headers.get('X-Correlation-Id')?.trim() || correlationId
  const body = await response.json().catch(() => null)
  if (!response.ok) {
    const code = typeof body?.code === 'string' ? body.code : ''
    const serverMessage = usableMessage(body?.message)
    const message = serverMessage || messageFor(response.status, code)
    throw new ApiError(message, response.status, body?.fieldErrors ?? {}, code, serverMessage, echoed)
  }
  if (body === null) throw new ApiError('O servidor retornou uma resposta inválida.', response.status, {}, '', '', echoed)
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
