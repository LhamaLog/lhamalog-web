import type { Company, CompanyTab } from './types'

// Address stays optional: PUT /api/company already accepts a partial address.
// The asterisks in the form follow the mock and are not a save blocker.
export function companyFieldErrors(company: Company) {
  const errors: Record<string, string> = {}
  if (!company.data.legalName.trim()) errors['data.legalName'] = 'Informe a razão social.'
  if (!company.data.document.trim()) errors['data.document'] = 'Informe o CNPJ.'
  if (!company.context.sector.trim()) errors['context.sector'] = 'Informe o ramo de atuação.'
  return errors
}

export function tabForCompanyField(field: string): CompanyTab {
  if (field.startsWith('address.')) return 'address'
  if (field === 'data.registrationDate') return 'documents'
  if (field.startsWith('context.') && field !== 'context.sector' && field !== 'context.language' && field !== 'context.mission') return 'context'
  return 'data'
}
