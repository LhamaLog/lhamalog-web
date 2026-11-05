import type { CompanyContactDraft, CompanyDocumentDraft, CompanyProfileDraft } from './types'

const storageKey = (companyId: string) => `lhamalog.companyProfile.v1:${companyId}`

export function emptyCompanyProfile(): CompanyProfileDraft {
  return {
    stateRegistration: '',
    website: '',
    timeZone: '(UTC-03:00) Brasília',
    logoFileName: '',
    environmentType: '',
    monitoredSystems: [],
    logVolume: '',
    criticalWindows: '',
    aiObjectives: {
      criticalErrors: true,
      corrections: true,
      customerImpact: true,
      groupSimilar: true,
      recurringAnomalies: true,
    },
    defaultCriticality: 'Alta',
    analysisLanguage: 'Português (Brasil)',
    responsibleTeam: '',
    notifyManagers: true,
    contacts: [],
    reference: '',
    fiscalAddress: true,
    receiveMail: true,
    regionalLanguage: 'Português (Brasil)',
    unitType: 'Sede',
    documents: [],
    currency: 'Real (BRL)',
    dateFormat: 'dd/mm/aaaa',
    detailLevel: 'Alto',
    recommendationTone: 'Objetivo e técnico',
    analysisPriority: 'Criticidade',
    preferences: {
      dailySummary: true,
      autoSuggestions: true,
      criticalCount: false,
      criticalAlerts: true,
      recurringFailures: true,
      probableCause: true,
      correctiveAction: true,
      relateSimilar: true,
      requireMfa: true,
      approvedIntegrations: true,
      maskSensitive: true,
      shareWithAi: false,
    },
  }
}

export function cloneCompanyProfile(profile: CompanyProfileDraft): CompanyProfileDraft {
  return {
    ...profile,
    monitoredSystems: [...profile.monitoredSystems],
    aiObjectives: { ...profile.aiObjectives },
    contacts: profile.contacts.map((contact) => ({ ...contact })),
    documents: profile.documents.map((document) => ({ ...document })),
    preferences: { ...profile.preferences },
  }
}

function asString(value: unknown, fallback: string) {
  return typeof value === 'string' ? value : fallback
}

function asBoolean(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback
}

function asContact(value: unknown): CompanyContactDraft | null {
  if (!value || typeof value !== 'object') return null
  const contact = value as Partial<CompanyContactDraft>
  if (typeof contact.id !== 'string') return null
  return {
    id: contact.id,
    name: asString(contact.name, ''),
    email: asString(contact.email, ''),
    phone: asString(contact.phone, ''),
    role: asString(contact.role, ''),
  }
}

function asDocument(value: unknown): CompanyDocumentDraft | null {
  if (!value || typeof value !== 'object') return null
  const document = value as Partial<CompanyDocumentDraft>
  if (typeof document.id !== 'string' || typeof document.name !== 'string') return null
  return { id: document.id, name: document.name, fileName: asString(document.fileName, '') }
}

export function normalizeCompanyProfile(value: unknown): CompanyProfileDraft {
  const empty = emptyCompanyProfile()
  if (!value || typeof value !== 'object') return empty
  const parsed = value as Partial<CompanyProfileDraft>
  const objectives = parsed.aiObjectives ?? empty.aiObjectives
  const preferences = parsed.preferences ?? empty.preferences
  return {
    ...empty,
    stateRegistration: asString(parsed.stateRegistration, empty.stateRegistration),
    website: asString(parsed.website, empty.website),
    timeZone: asString(parsed.timeZone, empty.timeZone) || empty.timeZone,
    logoFileName: asString(parsed.logoFileName, empty.logoFileName),
    environmentType: asString(parsed.environmentType, empty.environmentType),
    monitoredSystems: Array.isArray(parsed.monitoredSystems)
      ? parsed.monitoredSystems.filter((item): item is string => typeof item === 'string').slice(0, 30)
      : [],
    logVolume: asString(parsed.logVolume, empty.logVolume),
    criticalWindows: asString(parsed.criticalWindows, empty.criticalWindows),
    aiObjectives: {
      criticalErrors: asBoolean(objectives.criticalErrors, empty.aiObjectives.criticalErrors),
      corrections: asBoolean(objectives.corrections, empty.aiObjectives.corrections),
      customerImpact: asBoolean(objectives.customerImpact, empty.aiObjectives.customerImpact),
      groupSimilar: asBoolean(objectives.groupSimilar, empty.aiObjectives.groupSimilar),
      recurringAnomalies: asBoolean(objectives.recurringAnomalies, empty.aiObjectives.recurringAnomalies),
    },
    defaultCriticality: asString(parsed.defaultCriticality, empty.defaultCriticality) || empty.defaultCriticality,
    analysisLanguage: asString(parsed.analysisLanguage, empty.analysisLanguage) || empty.analysisLanguage,
    responsibleTeam: asString(parsed.responsibleTeam, empty.responsibleTeam),
    notifyManagers: asBoolean(parsed.notifyManagers, empty.notifyManagers),
    contacts: Array.isArray(parsed.contacts) ? parsed.contacts.map(asContact).filter((item): item is CompanyContactDraft => !!item).slice(0, 20) : [],
    reference: asString(parsed.reference, empty.reference),
    fiscalAddress: asBoolean(parsed.fiscalAddress, empty.fiscalAddress),
    receiveMail: asBoolean(parsed.receiveMail, empty.receiveMail),
    regionalLanguage: asString(parsed.regionalLanguage, empty.regionalLanguage) || empty.regionalLanguage,
    unitType: asString(parsed.unitType, empty.unitType) || empty.unitType,
    documents: Array.isArray(parsed.documents) ? parsed.documents.map(asDocument).filter((item): item is CompanyDocumentDraft => !!item).slice(0, 20) : [],
    currency: asString(parsed.currency, empty.currency) || empty.currency,
    dateFormat: asString(parsed.dateFormat, empty.dateFormat) || empty.dateFormat,
    detailLevel: asString(parsed.detailLevel, empty.detailLevel) || empty.detailLevel,
    recommendationTone: asString(parsed.recommendationTone, empty.recommendationTone) || empty.recommendationTone,
    analysisPriority: asString(parsed.analysisPriority, empty.analysisPriority) || empty.analysisPriority,
    preferences: {
      dailySummary: asBoolean(preferences.dailySummary, empty.preferences.dailySummary),
      autoSuggestions: asBoolean(preferences.autoSuggestions, empty.preferences.autoSuggestions),
      criticalCount: asBoolean(preferences.criticalCount, empty.preferences.criticalCount),
      criticalAlerts: asBoolean(preferences.criticalAlerts, empty.preferences.criticalAlerts),
      recurringFailures: asBoolean(preferences.recurringFailures, empty.preferences.recurringFailures),
      probableCause: asBoolean(preferences.probableCause, empty.preferences.probableCause),
      correctiveAction: asBoolean(preferences.correctiveAction, empty.preferences.correctiveAction),
      relateSimilar: asBoolean(preferences.relateSimilar, empty.preferences.relateSimilar),
      requireMfa: asBoolean(preferences.requireMfa, empty.preferences.requireMfa),
      approvedIntegrations: asBoolean(preferences.approvedIntegrations, empty.preferences.approvedIntegrations),
      maskSensitive: asBoolean(preferences.maskSensitive, empty.preferences.maskSensitive),
      shareWithAi: asBoolean(preferences.shareWithAi, empty.preferences.shareWithAi),
    },
  }
}

function browserStorage() {
  try {
    return typeof sessionStorage === 'undefined' ? null : sessionStorage
  } catch {
    return null
  }
}

export function loadCompanyProfile(companyId: string) {
  const storage = browserStorage()
  if (!storage) return emptyCompanyProfile()
  try {
    const raw = storage.getItem(storageKey(companyId))
    return raw ? normalizeCompanyProfile(JSON.parse(raw)) : emptyCompanyProfile()
  } catch {
    return emptyCompanyProfile()
  }
}

export function saveCompanyProfile(companyId: string, profile: CompanyProfileDraft) {
  const storage = browserStorage()
  if (!storage) return
  try {
    storage.setItem(storageKey(companyId), JSON.stringify(profile))
  } catch {
    // The draft is larger than this browser allows. The API fields are still saved separately.
  }
}
