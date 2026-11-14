import type { CompanySettings } from './model'

function pdfEscape(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

function latin(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export function buildCompanyDossier(settings: CompanySettings) {
  const lines = [
    'Dossie da empresa',
    'Documento gerado no navegador com os dados carregados desta tela.',
    'Nao e um registro imutavel nem uma confirmacao operacional do servidor.',
    '',
    `Razao social: ${settings.data.legalName}`,
    `Nome fantasia: ${settings.data.tradeName}`,
    `CNPJ: ${settings.data.document}`,
    `E-mail: ${settings.data.email}`,
    `Inscricao estadual: ${settings.data.stateRegistration}`,
    `Organizacao: ${settings.organizationId}`,
    `Ramo: ${settings.data.sector}`,
    `Descricao: ${settings.data.description}`,
    `Site: ${settings.data.website}`,
    `Tamanho: ${settings.data.size}`,
    `Fuso: ${settings.data.timeZone}`,
    `Idioma: ${settings.data.language}`,
    `Ambientes: ${settings.context.environmentTypes.join(', ')}`,
    `Sistemas: ${settings.context.monitoredSystems.join(', ')}`,
    `Janela critica: ${settings.context.criticalWindows}`,
    `Endereco: ${[settings.address.street, settings.address.number, settings.address.district, settings.address.city, settings.address.state, settings.address.postalCode].filter(Boolean).join(', ')}`,
    `Moeda: ${settings.preferences.currency}`,
    `Formato de data: ${settings.preferences.dateFormat}`,
    `Formato de hora: ${settings.preferences.timeFormat}`,
  ].map(latin)
  const content = ['BT', '/F1 11 Tf', '48 800 Td', ...lines.flatMap((line, index) => [`(${pdfEscape(line.slice(0, 110))}) Tj`, index === lines.length - 1 ? '' : '0 -16 Td']), 'ET'].filter(Boolean).join('\n')
  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n',
    '2 0 obj << /Type /Pages /Count 1 /Kids [3 0 R] >> endobj\n',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj\n',
    `4 0 obj << /Length ${content.length} >> stream\n${content}\nendstream\nendobj\n`,
    '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n',
  ]
  let pdf = '%PDF-1.4\n'
  const offsets = [0]
  for (const object of objects) {
    offsets.push(pdf.length)
    pdf += object
  }
  const xref = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n`
  pdf += '0000000000 65535 f \n'
  for (const offset of offsets.slice(1)) pdf += `${String(offset).padStart(10, '0')} 00000 n \n`
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`
  return new TextEncoder().encode(pdf)
}

export function downloadCompanyDossier(settings: CompanySettings) {
  const bytes = buildCompanyDossier(settings)
  const blob = new Blob([Uint8Array.from(bytes)], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'dossie-empresa.pdf'
  link.click()
  URL.revokeObjectURL(url)
}
