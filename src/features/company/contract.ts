import { cloneCompanySettings, emptyCompanySettings, type CompanyLogo, type CompanySettings } from './model'

type Json = Record<string, unknown>

function objectOf(value: unknown): Json {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Json : {}
}

function text(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function bool(value: unknown) {
  return value === true
}

function versionOf(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function stringList(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string' && item.trim() !== '')
}

function logoOf(value: unknown): CompanyLogo | null {
  const logo = objectOf(value)
  const fileName = text(logo.fileName)
  const mediaType = text(logo.mediaType)
  const dataBase64 = text(logo.dataBase64)
  if (!fileName || !mediaType || !dataBase64) return null
  return { fileName, mediaType, dataBase64 }
}

function applyWire(base: CompanySettings, wire: Json): CompanySettings {
  const data = objectOf(wire.data)
  const context = objectOf(wire.context)
  const address = objectOf(wire.address)
  const preferences = objectOf(wire.preferences)
  const telemetry = objectOf(preferences.telemetry)
  const ai = objectOf(preferences.ai)
  const notifications = objectOf(preferences.notifications)
  const security = objectOf(preferences.security)
  return {
    ...base,
    version: versionOf(wire.version) ?? base.version,
    organizationId: text(wire.organizationId) || base.organizationId,
    data: {
      legalName: text(data.legalName),
      tradeName: text(data.tradeName),
      document: text(data.document),
      email: text(data.email),
      stateRegistration: text(data.stateRegistration),
      sector: text(data.sector),
      description: text(data.description),
      website: text(data.website),
      size: text(data.size),
      timeZone: text(data.timeZone),
      language: text(data.language),
      logo: logoOf(data.logo),
    },
    context: {
      environmentTypes: stringList(context.environmentTypes),
      monitoredSystems: stringList(context.monitoredSystems),
      criticalWindows: text(context.criticalWindows),
      description: text(context.description),
    },
    address: {
      postalCode: text(address.postalCode),
      country: text(address.country),
      street: text(address.street),
      number: text(address.number),
      complement: text(address.complement),
      district: text(address.district),
      city: text(address.city),
      state: text(address.state),
      reference: text(address.reference),
      fiscalAddress: bool(address.fiscalAddress),
    },
    preferences: {
      currency: text(preferences.currency),
      dateFormat: text(preferences.dateFormat),
      timeFormat: text(preferences.timeFormat),
      dailySummary: bool(preferences.dailySummary),
      autoSuggestions: bool(preferences.autoSuggestions),
      telemetry: {
        interval: text(telemetry.interval),
        initialEnvironment: text(telemetry.initialEnvironment),
        logOrder: text(telemetry.logOrder),
        activeProductsOnly: bool(telemetry.activeProductsOnly),
      },
      ai: {
        detailLevel: text(ai.detailLevel),
        tone: text(ai.tone),
        priority: text(ai.priority),
        probableCause: bool(ai.probableCause),
        correctiveAction: bool(ai.correctiveAction),
        relateSimilar: bool(ai.relateSimilar),
      },
      notifications: {
        criticalImmediate: bool(notifications.criticalImmediate),
        recurringFailures: bool(notifications.recurringFailures),
      },
      security: {
        requireMfa: bool(security.requireMfa),
        approvedIntegrations: bool(security.approvedIntegrations),
        maskSensitive: bool(security.maskSensitive),
      },
    },
  }
}

function legacySettings(body: Json, organizationId: string): CompanySettings {
  const data = objectOf(body.data)
  const context = objectOf(body.context)
  const address = objectOf(body.address)
  const settings = emptyCompanySettings(text(body.clerkOrgId) || organizationId)
  settings.version = versionOf(body.version)
  settings.data.legalName = text(data.legalName)
  settings.data.tradeName = text(data.tradeName)
  settings.data.document = text(data.document)
  settings.data.size = text(data.size)
  settings.data.sector = text(context.sector)
  settings.data.language = text(context.language)
  settings.data.description = text(context.mission)
  settings.context.description = text(context.differentiators)
  settings.address = {
    ...settings.address,
    street: text(address.street),
    number: text(address.number),
    complement: text(address.complement),
    district: text(address.district),
    city: text(address.city),
    state: text(address.state),
    country: text(address.country),
    postalCode: text(address.postalCode),
  }
  return settings
}

export function readCompanySettings(body: unknown, organizationId = ''): CompanySettings {
  const record = objectOf(body)
  const nested = objectOf(record.settings)
  if (Object.keys(nested).length > 0) {
    const settings = applyWire(emptyCompanySettings(organizationId), { ...nested, version: record.version ?? nested.version })
    settings.organizationId = text(record.clerkOrgId) || settings.organizationId || organizationId
    settings.version = versionOf(record.version) ?? settings.version
    return settings
  }
  return legacySettings(record, organizationId)
}

export function settingsWire(settings: CompanySettings) {
  const wire = cloneCompanySettings(settings)
  wire.data.sector = settings.data.sector
  wire.data.timeZone = settings.data.timeZone
  wire.data.language = settings.data.language
  return wire
}

export function buildCompanyPut(original: unknown, settings: CompanySettings) {
  const base = objectOf(structuredClone(original ?? {}))
  const data = objectOf(base.data)
  const context = objectOf(base.context)
  const address = objectOf(base.address)
  return {
    ...base,
    version: settings.version,
    data: {
      ...data,
      legalName: settings.data.legalName,
      tradeName: settings.data.tradeName,
      document: settings.data.document,
      size: settings.data.size,
    },
    context: {
      ...context,
      sector: settings.data.sector,
      language: settings.data.language,
    },
    address: {
      ...address,
      street: settings.address.street,
      number: settings.address.number,
      complement: settings.address.complement,
      district: settings.address.district,
      city: settings.address.city,
      state: settings.address.state,
      country: settings.address.country,
      postalCode: settings.address.postalCode,
    },
    settings: settingsWire(settings),
  }
}

function comparable(settings: CompanySettings) {
  const copy = cloneCompanySettings(settings)
  copy.version = null
  copy.organizationId = ''
  copy.context.environmentTypes = [...copy.context.environmentTypes].sort()
  copy.context.monitoredSystems = [...copy.context.monitoredSystems].sort()
  return JSON.stringify(copy)
}

export type CompanyLimitation = {
  code: string
  stored: boolean
  enforced: boolean
  message: string
}

export type CompanyFacts = {
  completion: { filled: number; total: number; percent: number; message: string }
  verified: boolean
  verification: string
  metrics: null
  ingestion: null
  limitations: CompanyLimitation[]
}

export function readCompanyFacts(body: unknown, settings: CompanySettings): CompanyFacts {
  const record = objectOf(body)
  const summary = objectOf(record.summary)
  const completion = objectOf(summary.completion)
  const local = localCompletion(settings)
  const limitations = Array.isArray(record.limitations)
    ? record.limitations.flatMap((item) => {
        const entry = objectOf(item)
        const message = text(entry.message)
        if (!message) return []
        return [{ code: text(entry.code), stored: entry.stored === true, enforced: entry.enforced === true, message }]
      })
    : []
  return {
    completion: typeof completion.percent === 'number'
      ? {
          filled: typeof completion.filled === 'number' ? completion.filled : local.filled,
          total: typeof completion.total === 'number' ? completion.total : local.total,
          percent: completion.percent,
          message: text(completion.message) || local.message,
        }
      : local,
    verified: summary.verified === true,
    verification: text(summary.verification) || 'unavailable',
    metrics: null,
    ingestion: null,
    limitations,
  }
}

function localCompletion(settings: CompanySettings) {
  const tracked = [
    [settings.data.legalName, 'Razão Social'],
    [settings.data.document, 'CNPJ'],
    [settings.data.email, 'Contato principal'],
    [settings.data.sector, 'Ramo de atuação'],
    [settings.address.postalCode, 'CEP'],
    [settings.address.street, 'Logradouro'],
    [settings.address.number, 'Número'],
    [settings.address.district, 'Bairro'],
    [settings.address.city, 'Cidade'],
    [settings.address.state, 'Estado'],
  ] as const
  const missing = tracked.filter(([value]) => !value.trim()).map(([, label]) => label)
  const total = tracked.length
  const filled = total - missing.length
  return {
    filled,
    total,
    percent: Math.round((filled * 100) / total),
    message: missing.length === 0 ? 'Cadastro completo.' : `Faltam: ${missing.join(', ')}.`,
  }
}

export function formField(serverKey: string) {
  const fields: Record<string, string> = {
    'settings.data.legalName': 'data.legalName',
    'settings.data.document': 'data.document',
    'settings.data.email': 'email',
    'settings.data.sector': 'sector',
    'settings.data.description': 'data.description',
    'settings.data.website': 'data.website',
    'settings.data.logo': 'logo',
    'settings.address.postalCode': 'address.postalCode',
    'settings.context.description': 'context.description',
    'settings.context.monitoredSystems': 'context.monitoredSystems',
  }
  return fields[serverKey] ?? serverKey
}

export function serverConfirmedSettings(sent: CompanySettings, response: unknown) {
  const record = objectOf(response)
  if (Object.keys(objectOf(record.settings)).length === 0) return false
  const echoed = readCompanySettings(response, sent.organizationId)
  return comparable(sent) === comparable(echoed)
}
