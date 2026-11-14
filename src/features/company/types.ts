export type Company = {
  id: string
  clerkOrgId: string
  version: number | null
  data: { legalName: string; tradeName: string; document: string; registrationDate: string | null; size: string }
  context: { sector: string; mission: string; targetAudience: string; differentiators: string; language: string }
  address: { street: string; number: string; complement: string; district: string; city: string; state: string; country: string; postalCode: string }
}

export type CompanyTab = 'overview' | 'data' | 'context' | 'address' | 'preferences'

export type CompanyContactDraft = {
  id: string
  name: string
  email: string
  phone: string
  role: string
}

export type CompanyDocumentDraft = {
  id: string
  name: string
  fileName: string
}

// TODO: these fields are not part of PUT /api/company yet. They stay in this browser
// (sessionStorage) until the core API exposes them. Do not send this object to the API.
export type CompanyProfileDraft = {
  stateRegistration: string
  website: string
  timeZone: string
  logoFileName: string
  environmentType: string
  monitoredSystems: string[]
  logVolume: string
  criticalWindows: string
  aiObjectives: {
    criticalErrors: boolean
    corrections: boolean
    customerImpact: boolean
    groupSimilar: boolean
    recurringAnomalies: boolean
  }
  defaultCriticality: string
  analysisLanguage: string
  responsibleTeam: string
  notifyManagers: boolean
  contacts: CompanyContactDraft[]
  reference: string
  fiscalAddress: boolean
  receiveMail: boolean
  regionalLanguage: string
  unitType: string
  documents: CompanyDocumentDraft[]
  currency: string
  dateFormat: string
  detailLevel: string
  recommendationTone: string
  analysisPriority: string
  preferences: {
    dailySummary: boolean
    autoSuggestions: boolean
    criticalCount: boolean
    criticalAlerts: boolean
    recurringFailures: boolean
    probableCause: boolean
    correctiveAction: boolean
    relateSimilar: boolean
    requireMfa: boolean
    approvedIntegrations: boolean
    maskSensitive: boolean
    shareWithAi: boolean
  }
}
