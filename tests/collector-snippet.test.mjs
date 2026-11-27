import { register } from 'node:module'
import { test } from 'node:test'
import assert from 'node:assert/strict'

register(new URL('./resolve-ts.mjs', import.meta.url))

// Spec 014 (LLT-180, I3, I5, I7). Fake values only: a real token never goes into a test.
const fakeSecret = 'llt_teste'
const load = () => import('../src/features/products/collectorSnippet.ts')

test('HTTP: otlphttp exporter with the Bearer header from the LHAMALOG_TOKEN variable, logs and traces, no metrics', async () => {
  const { collectorSnippet } = await load()
  assert.equal(collectorSnippet({ endpoint: 'https://otlp.lhamalog.com', productName: 'Gateway de Pagamentos', traces: true, protocol: 'http' }), [
    '# config.yaml do OpenTelemetry Collector (otelcol-contrib).',
    '# Defina a variável de ambiente LHAMALOG_TOKEN com a Chave de API no servidor do Collector.',
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
    '        value: gateway-de-pagamentos',
    '        action: insert',
    '  batch: {}',
    '',
    'exporters:',
    '  otlphttp/lhamalog:',
    '    endpoint: https://otlp.lhamalog.com',
    '    headers:',
    '      authorization: "Bearer ${env:LHAMALOG_TOKEN}"',
    '',
    'service:',
    '  pipelines:',
    '    logs:',
    '      receivers: [otlp]',
    '      processors: [resource, batch]',
    '      exporters: [otlphttp/lhamalog]',
    '    traces:',
    '      receivers: [otlp]',
    '      processors: [resource, batch]',
    '      exporters: [otlphttp/lhamalog]',
  ].join('\n'))
})

test('gRPC: otlp exporter; plain http adds tls insecure, https does not', async () => {
  const { collectorSnippet } = await load()
  const local = collectorSnippet({ endpoint: 'http://localhost:4327', productName: 'API', traces: false, protocol: 'grpc' })
  assert.ok(local.includes('  otlp/lhamalog:\n    endpoint: http://localhost:4327\n    tls:\n      insecure: true\n    headers:\n      authorization: "Bearer ${env:LHAMALOG_TOKEN}"'))
  assert.ok(local.includes('      exporters: [otlp/lhamalog]'))
  assert.equal(local.includes('otlphttp'), false)
  const secure = collectorSnippet({ endpoint: 'https://otlp.lhamalog.com', productName: 'API', traces: false, protocol: 'grpc' })
  assert.equal(secure.includes('insecure'), false)
})

test('without traces there is no traces pipeline, and there is never a metrics pipeline', async () => {
  const { collectorSnippet } = await load()
  for (const protocol of ['http', 'grpc']) {
    const yaml = collectorSnippet({ endpoint: 'https://otlp.lhamalog.com', productName: 'API', traces: false, protocol })
    assert.equal(yaml.includes('    traces:'), false)
    assert.equal(yaml.includes('metrics'), false)
    assert.ok(yaml.includes('    logs:'))
  }
})

test('the key never enters the YAML, even when it is passed by mistake (I5)', async () => {
  const { collectorSnippet } = await load()
  const yaml = collectorSnippet({ endpoint: 'https://otlp.lhamalog.com', productName: 'API', traces: true, protocol: 'http', secret: fakeSecret })
  assert.equal(yaml.includes(fakeSecret), false)
  assert.ok(yaml.includes('${env:LHAMALOG_TOKEN}'))
})

test('product without a name and endpoint not configured', async () => {
  const { collectorSnippet } = await load()
  const yaml = collectorSnippet({ endpoint: ' ', productName: '', traces: false, protocol: 'http' })
  assert.ok(yaml.includes('        value: meu-servico'))
  assert.ok(yaml.includes('    endpoint: <endereço ainda não configurado>'))
})

test('gRPC needs a port: without one, the default port of the scheme is added (otelcol validate)', async () => {
  const { collectorSnippet } = await load()
  const yaml = (endpoint) => collectorSnippet({ endpoint, productName: 'API', traces: false, protocol: 'grpc' })
  assert.ok(yaml('https://otlp.lhamalog.com').includes('    endpoint: https://otlp.lhamalog.com:443\n'))
  assert.ok(yaml('http://coletor.interno').includes('    endpoint: http://coletor.interno:80\n'))
  assert.ok(yaml('https://otlp.lhamalog.com:4317').includes('    endpoint: https://otlp.lhamalog.com:4317\n'))
  assert.ok(yaml('http://localhost:4327').includes('    endpoint: http://localhost:4327\n'))
  // HTTP keeps the address as it is: the otlphttp exporter takes a base URL.
  assert.ok(collectorSnippet({ endpoint: 'https://otlp.lhamalog.com', productName: 'API', traces: false, protocol: 'http' }).includes('    endpoint: https://otlp.lhamalog.com\n'))
})
