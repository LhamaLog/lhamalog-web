// "OpenTelemetry Collector" example of the OpenTelemetry tab and of the public docs (spec 014, I3 and I7).
// Pure function. The input has no key: the YAML reads it from the LHAMALOG_TOKEN variable of the Collector server (I5).
import { endpointPlaceholder, serviceName } from './otelSnippet'
import type { SnippetInput } from './otelSnippet'

export const collectorTokenVariable = 'LHAMALOG_TOKEN'

// The gRPC exporter of the Collector refuses an address without a port ("missing port in address", seen with
// otelcol-contrib validate). Without one, the default port of the scheme is added.
function grpcAddress(address: string): string {
  let url: URL
  try {
    url = new URL(address)
  } catch {
    return address
  }
  if (url.port || (url.protocol !== 'http:' && url.protocol !== 'https:')) return address
  const port = url.protocol === 'https:' ? '443' : '80'
  const path = url.pathname === '/' ? '' : url.pathname
  return `${url.protocol}//${url.hostname}:${port}${path}`
}

// A minimal and valid config.yaml: OTLP receiver, service.name only when the app did not send one (insert), batch,
// the exporter of the chosen protocol with the Bearer header, logs and, with traces, traces. Never metrics (N2).
export function collectorSnippet({ endpoint, productName, traces, protocol = 'http' }: SnippetInput): string {
  const configured = endpoint.trim()
  const address = !configured ? endpointPlaceholder : protocol === 'grpc' ? grpcAddress(configured) : configured
  const exporter = protocol === 'grpc' ? 'otlp/lhamalog' : 'otlphttp/lhamalog'
  // The gRPC exporter uses TLS by default; a plain http:// receiver (like the local Collector) needs insecure.
  const tls = protocol === 'grpc' && address.startsWith('http://') ? ['    tls:', '      insecure: true'] : []
  const pipeline = (signal: string) => [
    `    ${signal}:`,
    '      receivers: [otlp]',
    '      processors: [resource, batch]',
    `      exporters: [${exporter}]`,
  ]
  return [
    '# config.yaml do OpenTelemetry Collector (otelcol-contrib).',
    `# Defina a variável de ambiente ${collectorTokenVariable} com a Chave de API no servidor do Collector.`,
    'receivers:',
    '  otlp:',
    '    protocols:',
    '      grpc:',
    '        endpoint: 0.0.0.0:4317',
    '      http:',
    '        endpoint: 0.0.0.0:4318',
    '',
    'processors:',
    '  resource:',
    '    attributes:',
    '      - key: service.name',
    `        value: ${serviceName(productName)}`,
    '        action: insert',
    '  batch: {}',
    '',
    'exporters:',
    `  ${exporter}:`,
    `    endpoint: ${address}`,
    ...tls,
    '    headers:',
    `      authorization: "Bearer \${env:${collectorTokenVariable}}"`,
    '',
    'service:',
    '  pipelines:',
    ...pipeline('logs'),
    ...(traces ? pipeline('traces') : []),
  ].join('\n')
}
