export const companyDescriptionLimit = 500
export const contextDescriptionLimit = 2000

export const environmentChoices = ['Produção', 'Homologação', 'Desenvolvimento'] as const

export const monitoredSystemTiles = [
  { id: 'API', title: 'API', detail: 'Gateway e REST' },
  { id: 'Backend', title: 'Backend', detail: 'Serviços Core' },
  { id: 'Frontend', title: 'Frontend', detail: 'SPA Web' },
  { id: 'Banco de Dados', title: 'Banco de Dados', detail: 'Cluster relacional' },
  { id: 'Workers', title: 'Workers', detail: 'Assíncronos' },
] as const

export const timeFormats = ['24 horas', '12 horas'] as const
export const telemetryIntervals = ['Últimas 24 horas', 'Últimas 7 dias', 'Últimas 30 dias'] as const
export const telemetryEnvironments = ['Todos os ambientes', 'Produção', 'Homologação', 'Desenvolvimento'] as const
export const logOrders = ['Mais recentes primeiro', 'Mais antigos primeiro'] as const

export type CompanyLogo = {
  fileName: string
  mediaType: string
  dataBase64: string
}

export type CompanySettings = {
  version: number | null
  organizationId: string
  data: {
    legalName: string
    tradeName: string
    document: string
    email: string
    stateRegistration: string
    sector: string
    description: string
    website: string
    size: string
    timeZone: string
    language: string
    logo: CompanyLogo | null
  }
  context: {
    environmentTypes: string[]
    monitoredSystems: string[]
    criticalWindows: string
    description: string
  }
  address: {
    postalCode: string
    country: string
    street: string
    number: string
    complement: string
    district: string
    city: string
    state: string
    reference: string
    fiscalAddress: boolean
  }
  preferences: {
    currency: string
    dateFormat: string
    timeFormat: string
    dailySummary: boolean
    autoSuggestions: boolean
    telemetry: {
      interval: string
      initialEnvironment: string
      logOrder: string
      activeProductsOnly: boolean
    }
    ai: {
      detailLevel: string
      tone: string
      priority: string
      probableCause: boolean
      correctiveAction: boolean
      relateSimilar: boolean
    }
    notifications: {
      criticalImmediate: boolean
      recurringFailures: boolean
    }
    security: {
      requireMfa: boolean
      approvedIntegrations: boolean
      maskSensitive: boolean
    }
  }
}

export type CompanySection = 'overview' | 'data' | 'context' | 'address' | 'preferences'

export const companySections: { id: CompanySection; label: string; param: string | null }[] = [
  { id: 'overview', label: 'Empresa', param: null },
  { id: 'data', label: 'Dados da Empresa', param: 'dados' },
  { id: 'context', label: 'Contexto de Atuação', param: 'contexto' },
  { id: 'address', label: 'Endereço', param: 'endereco' },
  { id: 'preferences', label: 'Preferências', param: 'preferencias' },
]

export function companySectionFromParam(value: string | null): CompanySection {
  return companySections.find((section) => section.param === value)?.id ?? 'overview'
}

export function companySectionParam(section: CompanySection) {
  return companySections.find((item) => item.id === section)?.param ?? null
}

export function emptyCompanySettings(organizationId = ''): CompanySettings {
  return {
    version: null,
    organizationId,
    data: {
      legalName: '',
      tradeName: '',
      document: '',
      email: '',
      stateRegistration: '',
      sector: '',
      description: '',
      website: '',
      size: '',
      timeZone: '',
      language: '',
      logo: null,
    },
    context: {
      environmentTypes: [],
      monitoredSystems: [],
      criticalWindows: '',
      description: '',
    },
    address: {
      postalCode: '',
      country: '',
      street: '',
      number: '',
      complement: '',
      district: '',
      city: '',
      state: '',
      reference: '',
      fiscalAddress: false,
    },
    preferences: {
      currency: '',
      dateFormat: '',
      timeFormat: '',
      dailySummary: false,
      autoSuggestions: false,
      telemetry: {
        interval: '',
        initialEnvironment: '',
        logOrder: '',
        activeProductsOnly: false,
      },
      ai: {
        detailLevel: '',
        tone: '',
        priority: '',
        probableCause: false,
        correctiveAction: false,
        relateSimilar: false,
      },
      notifications: {
        criticalImmediate: false,
        recurringFailures: false,
      },
      security: {
        requireMfa: false,
        approvedIntegrations: false,
        maskSensitive: false,
      },
    },
  }
}

export function cloneCompanySettings(settings: CompanySettings): CompanySettings {
  return {
    ...settings,
    data: { ...settings.data, logo: settings.data.logo ? { ...settings.data.logo } : null },
    context: {
      ...settings.context,
      environmentTypes: [...settings.context.environmentTypes],
      monitoredSystems: [...settings.context.monitoredSystems],
    },
    address: { ...settings.address },
    preferences: {
      ...settings.preferences,
      telemetry: { ...settings.preferences.telemetry },
      ai: { ...settings.preferences.ai },
      notifications: { ...settings.preferences.notifications },
      security: { ...settings.preferences.security },
    },
  }
}

export function displayOrEmpty(value: string, empty = 'Não informado') {
  const text = value.trim()
  return text || empty
}
