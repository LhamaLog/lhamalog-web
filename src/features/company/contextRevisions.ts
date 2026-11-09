export type CompanyContextRevision = {
  revision: number
  createdAt: string
  actorUserId: string
  context: {
    sector: string
    environments: string[]
    monitoredSystems: string[]
    criticalWindows: string
    description: string
  }
}

function recordOf(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function text(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function strings(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

export function readContextRevision(value: unknown): CompanyContextRevision | null {
  const record = recordOf(value)
  const context = recordOf(record.context)
  if (typeof record.revision !== 'number' || !Number.isInteger(record.revision)) return null
  return {
    revision: record.revision,
    createdAt: text(record.createdAt),
    actorUserId: text(record.actorUserId),
    context: {
      sector: text(context.sector),
      environments: strings(context.environments),
      monitoredSystems: strings(context.monitoredSystems),
      criticalWindows: text(context.criticalWindows),
      description: text(context.description),
    },
  }
}

export function readContextRevisions(body: unknown) {
  const revisions = recordOf(body).revisions
  if (!Array.isArray(revisions)) return []
  return revisions.flatMap((item) => {
    const revision = readContextRevision(item)
    return revision ? [revision] : []
  })
}

export function formatRevisionDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value || 'Data indisponível'
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(date)
}
