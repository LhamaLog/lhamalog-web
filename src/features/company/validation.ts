import { companyDescriptionLimit, contextDescriptionLimit, type CompanySection, type CompanySettings } from './model'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const websitePattern = /^https?:\/\/\S+$/

export function companyFieldErrors(settings: CompanySettings) {
  const errors: Record<string, string> = {}
  const document = settings.data.document.trim()
  if (document && !cnpj(document)) errors['data.document'] = 'Informe um CNPJ válido.'
  const email = settings.data.email.trim()
  if (email && !emailPattern.test(email)) errors.email = 'Informe um e-mail válido.'
  const website = settings.data.website.trim()
  if (website && !websitePattern.test(website)) errors['data.website'] = 'Informe um site http ou https.'
  const postal = settings.address.postalCode.replace(/\D/g, '')
  if (settings.address.postalCode.trim() && !/^\d{8}$/.test(postal)) errors['address.postalCode'] = 'Informe um CEP com 8 dígitos.'
  if (settings.data.description.length > companyDescriptionLimit) errors['data.description'] = `A descrição da empresa aceita até ${companyDescriptionLimit} caracteres.`
  if (settings.context.description.length > contextDescriptionLimit) errors['context.description'] = 'O texto excede o limite permitido.'
  return errors
}

export function cnpj(value: string) {
  const digits = value.replace(/\D/g, '')
  if (!/^\d{14}$/.test(digits) || new Set(digits).size === 1) return false
  const numbers = [...digits].map((char) => Number(char))
  return numbers[12] === checkDigit(numbers, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
    && numbers[13] === checkDigit(numbers, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
}

function checkDigit(numbers: number[], weights: number[]) {
  const sum = weights.reduce((total, weight, index) => total + numbers[index] * weight, 0)
  const remainder = sum % 11
  return remainder < 2 ? 0 : 11 - remainder
}

const sectionFields: Record<Exclude<CompanySection, 'overview'>, string[]> = {
  data: ['data.legalName', 'data.document', 'email', 'sector', 'data.description', 'data.website', 'logo'],
  context: ['context.description', 'context.monitoredSystems'],
  address: ['address.postalCode'],
  preferences: [],
}

export function errorsForSection(settings: CompanySettings, section: CompanySection) {
  if (section === 'overview') return {}
  const all = companyFieldErrors(settings)
  const fields = new Set(sectionFields[section])
  return Object.fromEntries(Object.entries(all).filter(([field]) => fields.has(field)))
}

export function tabForCompanyField(field: string): Exclude<CompanySection, 'overview'> {
  if (field.startsWith('address.')) return 'address'
  if (field.startsWith('context.')) return 'context'
  if (field.startsWith('preferences.')) return 'preferences'
  return 'data'
}
