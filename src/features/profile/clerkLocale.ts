import type { AppliedLanguage } from './types'

type Listener = (language: AppliedLanguage) => void

let current: AppliedLanguage = 'pt-BR'
const listeners = new Set<Listener>()

export function setAppliedClerkLocale(language: string | null) {
  const next: AppliedLanguage = language === 'en' ? 'en' : 'pt-BR'
  current = next
  listeners.forEach((listener) => listener(next))
}

export function subscribeAppliedClerkLocale(listener: Listener) {
  listeners.add(listener)
  listener(current)
  return () => { listeners.delete(listener) }
}
