// Public docs of the OpenTelemetry integration (spec 014, I6): path, index, endpoints and examples. Pure functions.
// The examples come from the same functions as the tab, with a generic service name and never with a key (I5).
import { collectorSnippet } from './collectorSnippet'
import { envSnippet, javaSnippet } from './otelSnippet'
import type { OtelProtocol } from './otelSnippet'

export const docsPath = '/docs/opentelemetry'

export const docsSections: { id: string; title: string }[] = [
  { id: 'como-funciona', title: 'Como funciona' },
  { id: 'endpoints', title: 'Endpoints' },
  { id: 'autenticacao', title: 'Autenticação' },
  { id: 'chaves', title: 'Chaves de API: gerar, rotacionar e revogar' },
  { id: 'variaveis', title: 'SDK por variáveis de ambiente' },
  { id: 'java', title: 'Java (agente)' },
  { id: 'collector', title: 'OpenTelemetry Collector' },
  { id: 'sinais', title: 'Sinais aceitos' },
  { id: 'respostas', title: 'Limites e respostas do LhamaLog' },
  { id: 'problemas', title: 'Problemas comuns' },
]

export const askAdministrator = 'consulte o administrador do LhamaLog'

export function docsEndpoint(value: string): string {
  return value.trim() || askAdministrator
}

type ProtocolExamples = { env: string; java: string; collector: string }

// Examples of the docs: empty product name (meu-servico), traces on, both protocols.
export function docsExamples(config: { otlpEndpoint: string; otlpGrpcEndpoint: string }): Record<OtelProtocol, ProtocolExamples> {
  const examples = (protocol: OtelProtocol, endpoint: string): ProtocolExamples => {
    const input = { endpoint, productName: '', traces: true, protocol }
    return { env: envSnippet(input), java: javaSnippet(input), collector: collectorSnippet(input) }
  }
  return { http: examples('http', config.otlpEndpoint), grpc: examples('grpc', config.otlpGrpcEndpoint) }
}
