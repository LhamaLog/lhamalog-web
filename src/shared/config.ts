export type PublicConfigInput = {
  clerkPublishableKey?: string
  apiUrl?: string
}

export type PublicConfig = {
  clerkPublishableKey: string
  apiUrl: string
}

const DEFAULT_API_URL = 'http://localhost:8080'
const PUBLISHABLE_KEY = /^pk_(test|live)_[A-Za-z0-9+/=_-]{8,292}$/

declare global {
  interface Window {
    __LHAMALOG_CONFIG__?: PublicConfigInput
  }
}

// Runtime values come from /config.js (Docker/Nginx). Build-time values are what Vite
// inlined from import.meta.env when the dev server started or when the bundle was built.
export function resolvePublicConfig(runtime: PublicConfigInput | undefined, buildTime: PublicConfigInput): PublicConfig {
  const clerkPublishableKey = firstNonEmpty(runtime?.clerkPublishableKey, buildTime.clerkPublishableKey)
  const apiUrl = stripTrailingSlashes(firstNonEmpty(runtime?.apiUrl, buildTime.apiUrl, DEFAULT_API_URL))
  assertPublishableKey(clerkPublishableKey)
  assertApiUrl(apiUrl)
  return { clerkPublishableKey, apiUrl }
}

export function readPublicConfig(): PublicConfig {
  const runtime = typeof window === 'undefined' ? undefined : window.__LHAMALOG_CONFIG__
  return resolvePublicConfig(runtime, {
    clerkPublishableKey: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
    apiUrl: import.meta.env.VITE_API_URL,
  })
}

function firstNonEmpty(...values: Array<string | undefined>): string {
  for (const value of values) {
    const trimmed = value?.trim()
    if (trimmed) return trimmed
  }
  return ''
}

function stripTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, '')
}

function assertPublishableKey(key: string): void {
  if (key.startsWith('sk_') || key.includes('sk_live') || key.includes('sk_test')) {
    throw new Error(
      'A chave secreta da Clerk não pode ir para o frontend. Use somente a chave publicável (pk_test_ ou pk_live_).',
    )
  }
  if (!key) {
    throw new Error(
      'Falta VITE_CLERK_PUBLISHABLE_KEY. Copie .env.example para .env e informe a chave publicável (pk_test_ ou pk_live_). A CLERK_SECRET_KEY não entra no frontend.',
    )
  }
  if (!PUBLISHABLE_KEY.test(key)) {
    throw new Error('VITE_CLERK_PUBLISHABLE_KEY deve ser a chave publicável, começando com pk_test_ ou pk_live_.')
  }
}

function assertApiUrl(apiUrl: string): void {
  let url: URL
  try {
    url = new URL(apiUrl)
  } catch {
    throw new Error('VITE_API_URL deve ser uma URL http ou https alcançável pelo navegador.')
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('VITE_API_URL deve usar http ou https.')
  }
  if (url.username || url.password) {
    throw new Error('VITE_API_URL não pode incluir usuário ou senha.')
  }
  if (url.pathname !== '/' || url.search !== '' || url.hash !== '') {
    throw new Error('VITE_API_URL deve ser só a origem (esquema, host e porta), sem caminho.')
  }
}
