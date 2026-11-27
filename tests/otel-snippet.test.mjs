import { register } from 'node:module'
import { test } from 'node:test'
import assert from 'node:assert/strict'

register(new URL('./resolve-ts.mjs', import.meta.url))

const fakeSecret = 'llt_teste'

test('the service name comes from the product name, like the Figma (clarify N3)', async () => {
  const { serviceName } = await import('../src/features/products/otelSnippet.ts')
  assert.equal(serviceName('Gateway de Pagamentos'), 'gateway-de-pagamentos')
  assert.equal(serviceName('  Ação & Reação / API  '), 'acao-reacao-api')
  assert.equal(serviceName('   '), 'meu-servico')
  assert.equal(serviceName('a'.repeat(80)).length, 63)
})

test('environment variables use the endpoint, Bearer with the placeholder, logs and no metrics (N1, N2)', async () => {
  const { envSnippet } = await import('../src/features/products/otelSnippet.ts')
  assert.equal(envSnippet({ endpoint: 'https://otlp.lhamalog.com', productName: 'Gateway de Pagamentos', traces: false }), [
    'OTEL_SERVICE_NAME=gateway-de-pagamentos',
    'OTEL_EXPORTER_OTLP_ENDPOINT=https://otlp.lhamalog.com',
    'OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf',
    'OTEL_EXPORTER_OTLP_HEADERS=Authorization=Bearer%20<sua-chave>',
    'OTEL_LOGS_EXPORTER=otlp',
    'OTEL_TRACES_EXPORTER=none',
    'OTEL_METRICS_EXPORTER=none',
  ].join('\n'))
  assert.match(envSnippet({ endpoint: 'https://otlp.lhamalog.com', productName: 'API', traces: true }), /^OTEL_TRACES_EXPORTER=otlp$/m)
})

test('the Java command has the same settings as -Dotel properties', async () => {
  const { javaSnippet } = await import('../src/features/products/otelSnippet.ts')
  const command = javaSnippet({ endpoint: 'https://otlp.lhamalog.com', productName: 'Gateway de Pagamentos', traces: true })
  assert.match(command, /^java -javaagent:opentelemetry-javaagent\.jar \\$/m)
  for (const line of ['-Dotel.service.name=gateway-de-pagamentos', '-Dotel.exporter.otlp.endpoint=https://otlp.lhamalog.com', '-Dotel.exporter.otlp.protocol=http/protobuf', '-Dotel.exporter.otlp.headers=Authorization=Bearer%20<sua-chave>', '-Dotel.logs.exporter=otlp', '-Dotel.traces.exporter=otlp', '-Dotel.metrics.exporter=none']) {
    assert.ok(command.includes(line), line)
  }
  assert.match(command, /-jar app\.jar$/)
})

test('the snippet never contains the real key, even when it is passed by mistake (FR-W03)', async () => {
  const { envSnippet, javaSnippet } = await import('../src/features/products/otelSnippet.ts')
  const input = { endpoint: 'https://otlp.lhamalog.com', productName: 'API', traces: true, secret: fakeSecret }
  for (const text of [envSnippet(input), javaSnippet(input)]) {
    assert.equal(text.includes(fakeSecret), false)
    assert.ok(text.includes('<sua-chave>'))
  }
})

test('an empty endpoint becomes the not configured text (F4)', async () => {
  const { envSnippet, endpointNotConfigured, endpointPlaceholder } = await import('../src/features/products/otelSnippet.ts')
  assert.equal(endpointNotConfigured, 'Endereço ainda não configurado.')
  assert.match(envSnippet({ endpoint: '  ', productName: 'API', traces: false }), new RegExp(`^OTEL_EXPORTER_OTLP_ENDPOINT=${endpointPlaceholder}$`, 'm'))
})

test('the local draft keeps traces and the minimum level, and drops the old OpenTelemetry fields (F1)', async () => {
  const { normalizeProductDraft } = await import('../src/features/products/draft.ts')
  const { emptyProductDraft } = await import('../src/features/products/types.ts')
  assert.equal(emptyProductDraft().otelTraces, false)
  assert.equal(emptyProductDraft().otelLogLevel, 'INFO')
  const draft = normalizeProductDraft({ otelTraces: true, otelLogLevel: 'WARN', otelEndpoint: 'https://x', otelProtocol: 'OTLP/gRPC', otelService: 's', otelHeaders: 'h', otelEnabled: false })
  assert.equal(draft.otelTraces, true)
  assert.equal(draft.otelLogLevel, 'WARN')
  assert.deepEqual(['otelEndpoint', 'otelProtocol', 'otelService', 'otelHeaders', 'otelEnabled'].filter((key) => key in draft), [])
  assert.equal(normalizeProductDraft({ otelLogLevel: 'TRACE', otelTraces: 'sim' }).otelLogLevel, 'INFO')
  assert.equal(normalizeProductDraft({ otelTraces: 'sim' }).otelTraces, false)
})

test('levels of the slider and the active signals of the status panel', async () => {
  const { logLevels, activeSignals } = await import('../src/features/products/otelSnippet.ts')
  assert.deepEqual(logLevels, ['DEBUG', 'INFO', 'WARN', 'ERROR'])
  assert.equal(activeSignals(false), 'Logs')
  assert.equal(activeSignals(true), 'Logs, Traces')
})

// Spec 014 (LLT-180): protocol selector, gRPC and the authentication block (I2, I4, FR-I02).
test('with gRPC, the SDK snippets use the grpc protocol, the gRPC endpoint and the lowercase metadata (I4)', async () => {
  const { envSnippet, javaSnippet } = await import('../src/features/products/otelSnippet.ts')
  const input = { endpoint: 'http://localhost:4327', productName: 'Gateway de Pagamentos', traces: false, protocol: 'grpc' }
  assert.equal(envSnippet(input), [
    'OTEL_SERVICE_NAME=gateway-de-pagamentos',
    'OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4327',
    'OTEL_EXPORTER_OTLP_PROTOCOL=grpc',
    'OTEL_EXPORTER_OTLP_HEADERS=authorization=Bearer%20<sua-chave>',
    'OTEL_LOGS_EXPORTER=otlp',
    'OTEL_TRACES_EXPORTER=none',
    'OTEL_METRICS_EXPORTER=none',
  ].join('\n'))
  const command = javaSnippet({ ...input, traces: true })
  for (const line of ['-Dotel.exporter.otlp.protocol=grpc', '-Dotel.exporter.otlp.headers=authorization=Bearer%20<sua-chave>', '-Dotel.traces.exporter=otlp', '-Dotel.metrics.exporter=none']) {
    assert.ok(command.includes(line), line)
  }
  // Without a protocol, HTTP, as in spec 011.
  assert.match(envSnippet({ endpoint: 'http://localhost:4328', productName: 'API', traces: false }), /^OTEL_EXPORTER_OTLP_PROTOCOL=http\/protobuf$/m)
})

test('the endpoint of the chosen protocol (I2)', async () => {
  const { endpointFor } = await import('../src/features/products/otelSnippet.ts')
  const endpoints = { http: 'http://localhost:4328', grpc: 'http://localhost:4327' }
  assert.equal(endpointFor('http', endpoints), 'http://localhost:4328')
  assert.equal(endpointFor('grpc', endpoints), 'http://localhost:4327')
  assert.equal(endpointFor('grpc', { http: 'http://localhost:4328', grpc: '' }), '')
})

test('the authentication block of each protocol always uses the placeholder (FR-I02)', async () => {
  const { authHeaderLines } = await import('../src/features/products/otelSnippet.ts')
  assert.deepEqual(authHeaderLines('http'), {
    intro: 'Envie a Chave de API no cabeçalho HTTP:',
    header: 'Authorization: Bearer <sua-chave>',
    refusal: 'Sem a chave, ou com uma chave revogada ou expirada, o LhamaLog responde 401.',
  })
  assert.deepEqual(authHeaderLines('grpc'), {
    intro: 'Envie a Chave de API na metadata gRPC:',
    header: 'authorization: Bearer <sua-chave>',
    refusal: 'Sem a chave, ou com uma chave revogada ou expirada, o LhamaLog responde UNAUTHENTICATED.',
  })
})
