import { emptyProductContext } from './types'
import type { ContextListField, Personality, ProductContext } from './types'

// Limits mirror the Core (lhamalog-core specs/009-contexto-produto, research.md).
export const contextLimits = {
  functionalDescription: 2000,
  items: 30,
  itemLength: { architecture: 80, scope: 200, sensitiveData: 200 } satisfies Record<ContextListField, number>,
  responseLanguage: 20,
}

const languagePattern = /^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$/
const listFields: ContextListField[] = ['architecture', 'scope', 'sensitiveData']

export const personalityOptions: { value: Personality; label: string }[] = [
  { value: 'SIMPLE', label: 'Simples' },
  { value: 'STANDARD', label: 'Padrão' },
  { value: 'DETAILED', label: 'Detalhado' },
]

const languages = [
  { value: 'pt-BR', label: 'Português (Brasil)' },
  { value: 'en-US', label: 'English (US)' },
  { value: 'es-ES', label: 'Español' },
]

export type ProductTab = 'info' | 'context' | 'otel'

export function readProductContext(value: unknown): ProductContext {
  const base = emptyProductContext()
  if (!value || typeof value !== 'object') return base
  const record = value as Record<string, unknown>
  const personality = personalityOptions.find((option) => option.value === record.personality)?.value
  return {
    functionalDescription: typeof record.functionalDescription === 'string' ? record.functionalDescription : base.functionalDescription,
    personality: personality ?? base.personality,
    responseLanguage: typeof record.responseLanguage === 'string' && record.responseLanguage.trim() ? record.responseLanguage.trim() : base.responseLanguage,
    architecture: textList(record.architecture),
    scope: textList(record.scope),
    sensitiveData: textList(record.sensitiveData),
  }
}

export function cleanContext(context: ProductContext): ProductContext {
  return {
    ...context,
    functionalDescription: context.functionalDescription.trim(),
    responseLanguage: context.responseLanguage.trim() || 'pt-BR',
    architecture: cleanList(context.architecture),
    scope: cleanList(context.scope),
    sensitiveData: cleanList(context.sensitiveData),
  }
}

export function contextFieldErrors(context: ProductContext): Record<string, string> {
  const errors: Record<string, string> = {}
  const description = context.functionalDescription.trim()
  if (!description) errors['context.functionalDescription'] = 'Informe a descrição funcional.'
  else if (description.length > contextLimits.functionalDescription) {
    errors['context.functionalDescription'] = `A descrição funcional excede o limite de ${contextLimits.functionalDescription} caracteres.`
  }
  if (!personalityOptions.some((option) => option.value === context.personality)) errors['context.personality'] = 'Personalidade inválida.'
  const language = context.responseLanguage.trim()
  if (language && (language.length > contextLimits.responseLanguage || !languagePattern.test(language))) errors['context.responseLanguage'] = 'Idioma inválido.'
  for (const field of listFields) {
    const error = listError(context[field], field)
    if (error) errors[`context.${field}`] = error
  }
  return errors
}

// Core field errors may point to an item, as in "context.scope[1]".
export function contextErrorFor(errors: Record<string, string>, field: keyof ProductContext) {
  const key = Object.keys(errors).find((name) => name === `context.${field}` || name.startsWith(`context.${field}[`))
  return key ? errors[key] : undefined
}

export function addListItem(list: string[], value: string, field: ContextListField): { list: string[]; error?: string } {
  const item = value.trim()
  if (!item) return { list }
  if (list.some((current) => sameItem(current, item))) return { list, error: 'O item já está na lista.' }
  if (list.length >= contextLimits.items) return { list, error: `Limite de ${contextLimits.items} itens.` }
  const max = contextLimits.itemLength[field]
  if (item.length > max) return { list, error: `O item excede o limite de ${max} caracteres.` }
  return { list: [...list, item] }
}

export function removeListItem(list: string[], index: number) {
  if (index < 0 || index >= list.length) return [...list]
  return list.filter((_, position) => position !== index)
}

export function moveListItem(list: string[], from: number, to: number) {
  if (from < 0 || from >= list.length || to < 0 || to >= list.length || from === to) return [...list]
  const next = [...list]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

export function languageOptions(current: string) {
  const value = current.trim()
  if (!value || languages.some((option) => option.value === value)) return [...languages]
  return [...languages, { value, label: value }]
}

export function firstTabWithError(errors: Record<string, string>): ProductTab | null {
  const keys = Object.keys(errors)
  if (keys.some((key) => !key.startsWith('context.') && !key.startsWith('otel'))) return 'info'
  if (keys.some((key) => key.startsWith('context.'))) return 'context'
  if (keys.length > 0) return 'otel'
  return null
}

function listError(list: string[], field: ContextListField) {
  if (list.length > contextLimits.items) return `Limite de ${contextLimits.items} itens.`
  const max = contextLimits.itemLength[field]
  if (list.some((item) => item.trim().length > max)) return `O item excede o limite de ${max} caracteres.`
  return undefined
}

function textList(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function cleanList(list: string[]) {
  const result: string[] = []
  for (const raw of list) {
    const item = raw.trim()
    if (item && !result.some((current) => sameItem(current, item))) result.push(item)
  }
  return result
}

function sameItem(a: string, b: string) {
  return a.trim().toLocaleLowerCase('pt-BR') === b.trim().toLocaleLowerCase('pt-BR')
}
