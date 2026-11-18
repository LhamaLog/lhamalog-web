// Spec 007: quando o Core responde subscription_required (empresa sem plano), o Web leva a pessoa à tela de planos.
// O useApi só avisa; quem navega é o CompanyWorkspace. A sessão continua (é recusa de negócio, spec 006).

export const SUBSCRIPTION_REQUIRED_CODE = 'subscription_required'

type Listener = () => void

const listeners = new Set<Listener>()

export function onSubscriptionRequired(listener: Listener): () => void {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

export function notifySubscriptionRequired(): void {
  for (const listener of [...listeners]) listener()
}

export function isSubscriptionRequired(error: unknown): boolean {
  return error !== null && typeof error === 'object' && 'code' in error && error.code === SUBSCRIPTION_REQUIRED_CODE
}
