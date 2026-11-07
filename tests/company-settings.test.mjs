import { register } from 'node:module'
import { test } from 'node:test'
import assert from 'node:assert/strict'

register(new URL('./resolve-ts.mjs', import.meta.url))

const legacy = {
  id: 'company',
  clerkOrgId: 'org_clerk',
  version: 3,
  data: { legalName: 'LhamaLog Tecnologia LTDA', tradeName: 'LhamaLog', document: '12.345.678/0001-90', registrationDate: '2020-01-02', size: '11 - 50 colaboradores' },
  context: { sector: 'Tecnologia da Informação', mission: 'Monitoramento', targetAudience: 'Times de operação', differentiators: 'Vários serviços', language: 'Português (Brasil)' },
  address: { street: 'Avenida Brasil', number: '1234', complement: 'Sala 502', district: 'Centro', city: 'Maringá', state: 'Paraná', country: 'Brasil', postalCode: '87000-000' },
  preserved: { historical: true },
}

test('legacy company response maps saved fields and leaves unknown preferences empty', async () => {
  const { readCompanySettings } = await import('../src/features/company/contract.ts')
  const settings = readCompanySettings(legacy, 'org_fallback')
  assert.equal(settings.organizationId, 'org_clerk')
  assert.equal(settings.version, 3)
  assert.equal(settings.data.legalName, 'LhamaLog Tecnologia LTDA')
  assert.equal(settings.data.sector, 'Tecnologia da Informação')
  assert.equal(settings.data.language, 'Português (Brasil)')
  assert.equal(settings.data.description, 'Monitoramento')
  assert.equal(settings.context.description, 'Vários serviços')
  assert.equal(settings.address.city, 'Maringá')
  assert.equal(settings.data.email, '')
  assert.equal(settings.data.logo, null)
  assert.equal(settings.preferences.security.requireMfa, false)
  assert.equal(settings.preferences.telemetry.interval, '')
})

test('put keeps historical fields and asks the server to echo the full settings', async () => {
  const { buildCompanyPut, readCompanySettings, serverConfirmedSettings } = await import('../src/features/company/contract.ts')
  const settings = readCompanySettings(legacy)
  settings.data.email = 'contato@lhamalog.com.br'
  settings.data.timeZone = '(UTC-03:00) Brasília'
  settings.data.sector = 'Tecnologia / SaaS'
  settings.context.environmentTypes = ['Produção', 'Homologação']
  settings.context.monitoredSystems = ['API', 'Backend']
  settings.preferences.timeFormat = '24 horas'
  settings.preferences.security.requireMfa = true
  const body = buildCompanyPut(legacy, settings)
  assert.equal(body.preserved.historical, true)
  assert.equal(body.data.registrationDate, '2020-01-02')
  assert.equal(body.context.targetAudience, 'Times de operação')
  assert.equal(body.context.sector, 'Tecnologia / SaaS')
  assert.equal(body.context.mission, 'Monitoramento')
  assert.equal(body.context.targetAudience, 'Times de operação')
  assert.equal(body.context.differentiators, 'Vários serviços')
  assert.equal(body.data.registrationDate, '2020-01-02')
  assert.equal(body.settings.data.email, 'contato@lhamalog.com.br')
  assert.equal(body.settings.data.sector, 'Tecnologia / SaaS')
  assert.equal(body.settings.preferences.timeFormat, '24 horas')
  assert.equal(serverConfirmedSettings(settings, body), true)
  const dropped = { ...body, settings: undefined }
  assert.equal(serverConfirmedSettings(settings, dropped), false)
  const again = buildCompanyPut(body, readCompanySettings(body))
  assert.equal(again.data.registrationDate, '2020-01-02')
  assert.equal(again.context.targetAudience, 'Times de operação')
  assert.equal(again.settings.data.email, 'contato@lhamalog.com.br')
  assert.equal(again.settings.context.monitoredSystems.join(','), 'API,Backend')
})

test('cancel restores the last server snapshot and sections stay on the company route', async () => {
  const { cloneCompanySettings, companySectionFromParam, emptyCompanySettings } = await import('../src/features/company/model.ts')
  const saved = emptyCompanySettings('org_clerk')
  saved.data.legalName = 'Original'
  const draft = cloneCompanySettings(saved)
  draft.data.legalName = 'Rascunho'
  draft.data.timeZone = '(UTC-03:00) Brasília'
  const cancelled = cloneCompanySettings(saved)
  assert.equal(cancelled.data.legalName, 'Original')
  assert.equal(cancelled.data.timeZone, '')
  assert.equal(draft.data.timeZone, '(UTC-03:00) Brasília')
  assert.equal(companySectionFromParam('dados'), 'data')
  assert.equal(companySectionFromParam('contexto'), 'context')
  assert.equal(companySectionFromParam('endereco'), 'address')
  assert.equal(companySectionFromParam('preferencias'), 'preferences')
  assert.equal(companySectionFromParam(null), 'overview')
  assert.equal(companySectionFromParam('contatos'), 'overview')
})

test('full company response keeps echoed settings, null logo and unenforced limitations', async () => {
  const { readCompanyFacts, readCompanySettings, serverConfirmedSettings } = await import('../src/features/company/contract.ts')
  const { logoRejection } = await import('../src/features/company/logo.ts')
  const sent = readCompanySettings({
    version: null,
    settings: {
      data: { legalName: 'LhamaLog Tecnologia LTDA', tradeName: 'LhamaLog', document: '11.444.777/0001-61', email: 'contato@example.com', stateRegistration: '123', sector: 'Tecnologia / SaaS', description: 'Monitoramento', website: 'https://example.com', size: '11 - 50 colaboradores', timeZone: '(UTC-03:00) Brasília', language: 'Português (Brasil)', logo: null },
      context: { environmentTypes: ['Produção', 'Homologação'], monitoredSystems: ['API', 'Backend'], criticalWindows: 'Horário comercial e deploys', description: 'Vários serviços' },
      address: { postalCode: '87000-000', country: 'Brasil', street: 'Avenida Brasil', number: '1234', complement: 'Sala 502', district: 'Centro', city: 'Maringá', state: 'Paraná', reference: 'Praça', fiscalAddress: true },
      preferences: { currency: 'Real (BRL)', dateFormat: 'dd/mm/aaaa', timeFormat: '24 horas', dailySummary: true, autoSuggestions: false, telemetry: { interval: 'Últimas 24 horas', initialEnvironment: 'Todos os ambientes', logOrder: 'Mais recentes primeiro', activeProductsOnly: true }, ai: { detailLevel: 'Alto', tone: 'Objetivo e técnico', priority: 'Criticidade', probableCause: true, correctiveAction: true, relateSimilar: false }, notifications: { criticalImmediate: true, recurringFailures: false }, security: { requireMfa: true, approvedIntegrations: false, maskSensitive: true } },
    },
  })
  const response = {
    id: 'ignored-client-id',
    clerkOrgId: 'org_from_token',
    organizationId: 'org_from_token',
    version: 1,
    summary: { verified: false, verification: 'unavailable', metrics: null, ingestion: null, completion: { filled: 10, total: 10, percent: 100, message: 'Cadastro completo.' } },
    limitations: [{ code: 'MANAGER_MFA', stored: true, enforced: false, message: 'A preferência não altera o MFA da Clerk.' }],
    settings: responseSettings(sent),
  }
  assert.equal(serverConfirmedSettings(sent, response), true)
  const facts = readCompanyFacts(response, sent)
  assert.equal(facts.verified, false)
  assert.equal(facts.metrics, null)
  assert.equal(facts.ingestion, null)
  assert.equal(facts.limitations[0].enforced, false)
  assert.equal(facts.completion.percent, 100)
  const reloaded = readCompanySettings(response, 'org_other')
  assert.equal(reloaded.organizationId, 'org_from_token')
  assert.equal(reloaded.data.logo, null)
  assert.equal(reloaded.preferences.security.requireMfa, true)
  assert.match(logoRejection('image/svg+xml', new TextEncoder().encode('<svg><script>alert(1)</script></svg>')), /segurança/)
  assert.equal(logoRejection('image/png', Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0])), null)
})

function responseSettings(sent) {
  return { ...sent, version: 99, organizationId: 'org_from_token' }
}

test('dossier pdf contains the company name and does not invent a hash', async () => {
  const { buildCompanyDossier } = await import('../src/features/company/dossier.ts')
  const { emptyCompanySettings } = await import('../src/features/company/model.ts')
  const settings = emptyCompanySettings('org_clerk')
  settings.data.legalName = 'LhamaLog Tecnologia LTDA'
  const pdf = new TextDecoder().decode(buildCompanyDossier(settings))
  assert.match(pdf, /^%PDF-1\.4/)
  assert.match(pdf, /LhamaLog Tecnologia LTDA/)
  assert.equal(pdf.includes('sha256'), false)
})
