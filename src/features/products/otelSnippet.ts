// "Configuração da aplicação" of the OpenTelemetry tab (spec 011, protocol and gRPC from spec 014). Pure functions.
// The input has no key: the snippet always uses the <sua-chave> placeholder (FR-W03).
// It follows what the Collector accepts: Authorization Bearer (N1), logs and traces, no metrics (N2).

import type { OtelLogLevel } from './types'

// Levels of the "Nível mínimo de log" slider, from the most to the least detailed. Kept in the local draft (F1).
export const logLevels: OtelLogLevel[] = ['DEBUG', 'INFO', 'WARN', 'ERROR']

// "Sinais ativos" of the status panel: Logs is always on, Metrics is never sent (N2).
export function activeSignals(traces: boolean): string {
  return traces ? 'Logs, Traces' : 'Logs'
}

// OTLP/HTTP or OTLP/gRPC (spec 014, I1 and I2).
export type OtelProtocol = 'http' | 'grpc'

export type SnippetInput = {
  // The endpoint of the chosen protocol (endpointFor).
  endpoint: string
  productName: string
  traces: boolean
  // Without it, HTTP, as in spec 011.
  protocol?: OtelProtocol
}

export const keyPlaceholder = '<sua-chave>'

export const endpointNotConfigured = 'Endereço ainda não configurado.'

export const endpointPlaceholder = '<endereço ainda não configurado>'

// OTEL_EXPORTER_OTLP_HEADERS values are URL encoded, so the space after Bearer is %20. On gRPC the metadata name is
// lowercase, which is what the Collector reads (spec 014, I4).
function authorizationHeader(protocol: OtelProtocol): string {
  return `${protocol === 'grpc' ? 'authorization' : 'Authorization'}=Bearer%20${keyPlaceholder}`
}

export function endpointFor(protocol: OtelProtocol, endpoints: { http: string; grpc: string }): string {
  return protocol === 'grpc' ? endpoints.grpc : endpoints.http
}

// "Cabeçalho de autenticação" of the tab and of the public docs (spec 014, FR-I02). Always with the placeholder.
export function authHeaderLines(protocol: OtelProtocol): { intro: string; header: string; refusal: string } {
  return protocol === 'grpc'
    ? { intro: 'Envie a Chave de API na metadata gRPC:', header: `authorization: Bearer ${keyPlaceholder}`, refusal: 'Sem a chave, ou com uma chave revogada ou expirada, o LhamaLog responde UNAUTHENTICATED.' }
    : { intro: 'Envie a Chave de API no cabeçalho HTTP:', header: `Authorization: Bearer ${keyPlaceholder}`, refusal: 'Sem a chave, ou com uma chave revogada ou expirada, o LhamaLog responde 401.' }
}

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

function settings({ endpoint, productName, traces, protocol = 'http' }: SnippetInput): [string, string][] {
  return [
    ['service.name', serviceName(productName)],
    ['exporter.otlp.endpoint', endpoint.trim() || endpointPlaceholder],
    ['exporter.otlp.protocol', protocol === 'grpc' ? 'grpc' : 'http/protobuf'],
    ['exporter.otlp.headers', authorizationHeader(protocol)],
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
