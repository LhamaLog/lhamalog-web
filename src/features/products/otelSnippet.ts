// "Configuração da aplicação" of the OpenTelemetry tab (spec 011). Pure functions.
// The input has no key: the snippet always uses the <sua-chave> placeholder (FR-W03).
// It follows what the Collector accepts: Authorization Bearer (N1), logs and traces, no metrics (N2).

import type { OtelLogLevel } from './types'

// Levels of the "Nível mínimo de log" slider, from the most to the least detailed. Kept in the local draft (F1).
export const logLevels: OtelLogLevel[] = ['DEBUG', 'INFO', 'WARN', 'ERROR']

// "Sinais ativos" of the status panel: Logs is always on, Metrics is never sent (N2).
export function activeSignals(traces: boolean): string {
  return traces ? 'Logs, Traces' : 'Logs'
}

export type SnippetInput = {
  endpoint: string
  productName: string
  traces: boolean
}

export const keyPlaceholder = '<sua-chave>'

export const endpointNotConfigured = 'Endereço ainda não configurado.'

export const endpointPlaceholder = '<endereço ainda não configurado>'

// OTEL_EXPORTER_OTLP_HEADERS values are URL encoded, so the space after Bearer is %20.
const authorizationHeader = `Authorization=Bearer%20${keyPlaceholder}`

// Like the Figma: "Gateway de Pagamentos" becomes gateway-de-pagamentos (N3).
export function serviceName(productName: string): string {
  const slug = productName
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 63)
    .replace(/-+$/g, '')
  return slug || 'meu-servico'
}

function settings({ endpoint, productName, traces }: SnippetInput): [string, string][] {
  return [
    ['service.name', serviceName(productName)],
    ['exporter.otlp.endpoint', endpoint.trim() || endpointPlaceholder],
    ['exporter.otlp.protocol', 'http/protobuf'],
    ['exporter.otlp.headers', authorizationHeader],
    ['logs.exporter', 'otlp'],
    ['traces.exporter', traces ? 'otlp' : 'none'],
    ['metrics.exporter', 'none'],
  ]
}

export function envSnippet(input: SnippetInput): string {
  return settings(input).map(([key, value]) => `OTEL_${key.replace(/\./g, '_').toUpperCase()}=${value}`).join('\n')
}

export function javaSnippet(input: SnippetInput): string {
  const properties = settings(input).map(([key, value]) => `  -Dotel.${key}=${value} \\`)
  return ['java -javaagent:opentelemetry-javaagent.jar \\', ...properties, '  -jar app.jar'].join('\n')
}
