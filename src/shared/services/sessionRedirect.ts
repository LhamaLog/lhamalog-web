// Leitura das recusas do Core e saída da sessão (spec 006, ADR_032).
// 401 e 403 de segurança ({"error":"forbidden"}, sem código e sem mensagem) encerram a sessão local; o Core já
// revogou as sessões na Clerk. 403 com código ou mensagem do Core é recusa de negócio e mantém a pessoa na tela.

export const SIGNED_OUT_REASON = 'deslogado'

export type RejectionClass = 'session' | 'keep'

export function classifyRejection(status: number, code = '', serverMessage = ''): RejectionClass {
  if (status === 401) return 'session'
  if (status !== 403) return 'keep'
  return code.trim() || serverMessage.trim() ? 'keep' : 'session'
}

// Verdadeiro quando o erro é uma recusa que encerra a sessão: a tela não mostra erro, porque a saída já está em
// andamento (SC-001). Lê o erro pela forma (status, code, serverMessage) para não depender do cliente HTTP.
export function endsSession(error: unknown): boolean {
  if (!error || typeof error !== 'object' || !('status' in error) || typeof error.status !== 'number') return false
  const code = 'code' in error && typeof error.code === 'string' ? error.code : ''
  const serverMessage = 'serverMessage' in error && typeof error.serverMessage === 'string' ? error.serverMessage : ''
  return classifyRejection(error.status, code, serverMessage) === 'session'
}

const AUTH_ROUTE = /^\/(sign-in|sign-up|tarefas|organizacoes\/nova)(?=$|[/?#])/
const CONTROL = /[\u0000-\u001f\u007f]/

// Destino de volta depois do login: só rotas internas que não são de autenticação; o resto vira "/".
// Com `origin`, uma URL absoluta da mesma origem (o redirect_url que a própria Clerk gera) vira o caminho interno.
export function safeReturnPath(value: string | null | undefined, origin?: string): string {
  if (typeof value !== 'string' || value.length === 0 || value.length > 2048) return '/'
  if (origin && /^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value)
      if (url.origin !== origin) return '/'
      return safeReturnPath(`${url.pathname}${url.search}${url.hash}`)
    } catch {
      return '/'
    }
  }
  if (!value.startsWith('/') || value.startsWith('//')) return '/'
  if (value.includes('\\') || CONTROL.test(value)) return '/'
  if (AUTH_ROUTE.test(value)) return '/'
  return value
}

export function signInUrl(returnPath?: string | null): string {
  const destination = safeReturnPath(returnPath)
  const base = `/sign-in?motivo=${SIGNED_OUT_REASON}`
  return destination === '/' ? base : `${base}&redirect_url=${encodeURIComponent(destination)}`
}

export function currentReturnPath(): string {
  if (typeof window === 'undefined') return '/'
  const { pathname, search, hash } = window.location
  return `${pathname}${search}${hash}`
}

type SignOut = (options: { redirectUrl: string }) => Promise<unknown>

let pending: Promise<void> | null = null

// Várias recusas ao mesmo tempo geram uma única saída e um único aviso (FR-005).
export function signOutOnce(signOut: SignOut, returnPath: string | null = currentReturnPath()): Promise<void> {
  if (pending) return pending
  const current = (async () => {
    try {
      await signOut({ redirectUrl: signInUrl(returnPath) })
    } finally {
      pending = null
    }
  })()
  pending = current
  return current
}
