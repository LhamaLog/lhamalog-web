import { register } from 'node:module'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

register(new URL('./resolve-ts.mjs', import.meta.url))

// Spec 014 (LLT-180, I6, FR-I05, FR-I06). Fake values only: a real token never goes into a test.
const fakeSecret = 'llt_teste'
const load = () => import('../src/features/products/otelDocs.ts')

test('the public docs live at /docs/opentelemetry and cover every topic of I6', async () => {
  const { docsPath, docsSections } = await load()
  assert.equal(docsPath, '/docs/opentelemetry')
  assert.deepEqual(docsSections.map((section) => section.id), [
    'como-funciona', 'endpoints', 'autenticacao', 'chaves', 'variaveis', 'java', 'collector', 'sinais', 'respostas', 'problemas',
  ])
  for (const section of docsSections) assert.ok(section.title.length > 0)
})

test('the endpoints come from the public config, or ask for the administrator', async () => {
  const { docsEndpoint } = await load()
  assert.equal(docsEndpoint('https://otlp.lhamalog.com'), 'https://otlp.lhamalog.com')
  assert.equal(docsEndpoint(''), 'consulte o administrador do LhamaLog')
})

test('the examples come from the same functions as the tab, with meu-servico, in both protocols, without a key', async () => {
  const { docsExamples } = await load()
  const { envSnippet, javaSnippet } = await import('../src/features/products/otelSnippet.ts')
  const { collectorSnippet } = await import('../src/features/products/collectorSnippet.ts')
  const config = { otlpEndpoint: 'http://localhost:4328', otlpGrpcEndpoint: 'http://localhost:4327', secret: fakeSecret }
  const examples = docsExamples(config)
  const http = { endpoint: 'http://localhost:4328', productName: '', traces: true, protocol: 'http' }
  const grpc = { endpoint: 'http://localhost:4327', productName: '', traces: true, protocol: 'grpc' }
  assert.equal(examples.http.env, envSnippet(http))
  assert.equal(examples.http.java, javaSnippet(http))
  assert.equal(examples.http.collector, collectorSnippet(http))
  assert.equal(examples.grpc.env, envSnippet(grpc))
  assert.equal(examples.grpc.collector, collectorSnippet(grpc))
  const all = JSON.stringify(examples)
  assert.ok(all.includes('meu-servico'))
  assert.equal(all.includes(fakeSecret), false)
  assert.equal(/metrics_exporter=otlp|pipelines:[\s\S]*metrics:/i.test(all), false)
})

test('the route is public (outside ProtectedRoute) and the page never calls the Core', () => {
  const routes = readFileSync(new URL('../src/app/routes/AppRoutes.tsx', import.meta.url), 'utf8')
  const line = routes.split(/\r?\n/).find((item) => item.includes('path="/docs/opentelemetry"'))
  assert.ok(line, 'rota /docs/opentelemetry')
  assert.ok(line.includes('<OpenTelemetryDocsPage />'))
  assert.equal(line.includes('ProtectedRoute'), false)
  const page = readFileSync(new URL('../src/features/docs/OpenTelemetryDocsPage.tsx', import.meta.url), 'utf8')
  for (const forbidden of ['useApi', 'fetch(', 'request(', 'useAuth', 'useOrganization']) assert.equal(page.includes(forbidden), false, forbidden)
})
