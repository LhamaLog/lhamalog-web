import type { ReactNode } from 'react'
import logo from '../../shared/assets/lhamalog-logo.svg'
import { readPublicConfig } from '../../shared/config'
import { Card } from '../../shared/ui/Card'
import { CopyButton } from '../products/components/CopyButton'
import { collectorTokenVariable } from '../products/collectorSnippet'
import { docsEndpoint, docsExamples, docsSections } from '../products/otelDocs'
import { authHeaderLines, keyPlaceholder } from '../products/otelSnippet'

// Public docs of the OpenTelemetry integration (spec 014, I6, FR-I06): no login and no call to the Core. The examples
// come from the same functions as the product tab, with meu-servico and never with a key (I5).
export function OpenTelemetryDocsPage() {
  const config = readPublicConfig()
  const examples = docsExamples(config)
  const title = (id: string) => docsSections.find((section) => section.id === id)?.title ?? id
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <a href="/" className="inline-flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0C70F2]">
            <img src={logo} alt="LhamaLog" className="h-8 w-auto" />
          </a>
          <span className="text-sm text-[#0C70F2]">Documentação</span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-5 px-4 py-8 sm:px-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-[#083B7A]">Integração com OpenTelemetry</h1>
          <p className="max-w-3xl text-sm text-[#0C70F2]">Como enviar os logs e os traces da sua aplicação para o LhamaLog usando o padrão OpenTelemetry (OTLP), direto do SDK ou por um OpenTelemetry Collector.</p>
        </div>

        <Card className="sm:p-6">
          <nav aria-labelledby="docs-index-title">
            <h2 id="docs-index-title" className="mb-3 font-bold text-[#083B7A]">Nesta página</h2>
            <ol className="grid gap-2 text-sm sm:grid-cols-2">
              {docsSections.map((section, index) => (
                <li key={section.id}>
                  <a href={`#${section.id}`} className="text-[#0C70F2] hover:text-[#083B7A] focus-visible:outline-2 focus-visible:outline-[#0C70F2]">{index + 1}. {section.title}</a>
                </li>
              ))}
            </ol>
          </nav>
        </Card>

        <Section id="como-funciona" title={title('como-funciona')}>
          <p>O LhamaLog recebe logs e traces no protocolo OTLP, por HTTP ou por gRPC. Cada produto cadastrado tem as suas Chaves de API. A aplicação, ou um OpenTelemetry Collector no meio do caminho, envia os dados para o endpoint do LhamaLog com a chave no cabeçalho de autorização. É pela chave que o LhamaLog sabe de qual produto e de qual empresa são os dados.</p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>Cadastre o produto no LhamaLog e gere uma Chave de API na aba "Integração OpenTelemetry".</li>
            <li>Configure o SDK, o agente Java ou o Collector com o endpoint e a chave, como nos exemplos abaixo.</li>
            <li>Reinicie a aplicação. Os logs passam a chegar no LhamaLog.</li>
          </ol>
        </Section>

        <Section id="endpoints" title={title('endpoints')}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead className="text-xs text-slate-500">
                <tr><th className="py-2 pr-4 font-semibold">Protocolo</th><th className="py-2 pr-4 font-semibold">Endereço</th><th className="py-2 font-semibold">O que recebe</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr><td className="py-2 pr-4 font-semibold">OTLP/HTTP</td><td className="py-2 pr-4 font-mono text-xs">{docsEndpoint(config.otlpEndpoint)}</td><td className="py-2"><code>POST /v1/logs</code> e <code>POST /v1/traces</code>, em protobuf ou JSON, com gzip opcional</td></tr>
                <tr><td className="py-2 pr-4 font-semibold">OTLP/gRPC</td><td className="py-2 pr-4 font-mono text-xs">{docsEndpoint(config.otlpGrpcEndpoint)}</td><td className="py-2"><code>LogsService/Export</code> e <code>TraceService/Export</code></td></tr>
              </tbody>
            </table>
          </div>
          <p>As portas padrão do OpenTelemetry são 4318 (HTTP) e 4317 (gRPC). Use sempre o endereço informado pelo LhamaLog.</p>
        </Section>

        <Section id="autenticacao" title={title('autenticacao')}>
          {(['http', 'grpc'] as const).map((protocol) => {
            const auth = authHeaderLines(protocol)
            return (
              <div key={protocol} className="space-y-1">
                <p>{auth.intro}</p>
                <code className="inline-block rounded-md bg-slate-100 px-2 py-1 font-mono text-xs text-slate-900">{auth.header}</code>
                <p className="text-xs text-slate-500">{auth.refusal}</p>
              </div>
            )
          })}
          <p>Nas variáveis de ambiente do OpenTelemetry, o espaço depois de <code>Bearer</code> é escrito como <code>%20</code>, porque o valor é codificado como URL.</p>
        </Section>

        <Section id="chaves" title={title('chaves')}>
          <ul className="list-disc space-y-1 pl-5">
            <li><strong>Gerar:</strong> na aba "Integração OpenTelemetry" do produto, quem tem a permissão de gerenciar tokens de ingestão (donos e administradores) gera a chave. Ela aparece <strong>uma única vez</strong>: copie e guarde num cofre de segredos.</li>
            <li><strong>Guardada só como hash:</strong> o LhamaLog não guarda a chave em si, então ninguém, nem o suporte, consegue mostrá-la de novo. Perdeu a chave? Gere outra e revogue a antiga.</li>
            <li><strong>Rotacionar:</strong> gera uma chave nova e mantém a antiga funcionando por um período de transição, de 1 a 168 horas (24 por padrão). Atualize as aplicações nesse prazo.</li>
            <li><strong>Revogar:</strong> a chave deixa de ser aceita em até 30 segundos. Faça isso logo se a chave vazar.</li>
          </ul>
          <p>Nunca coloque a chave no código, no repositório ou em logs. Use uma variável de ambiente ou um cofre de segredos.</p>
        </Section>

        <Section id="variaveis" title={title('variaveis')}>
          <p>Vale para os SDKs e agentes que seguem as variáveis padrão do OpenTelemetry. Troque <code>{keyPlaceholder}</code> pela Chave de API e <code>meu-servico</code> pelo nome do seu serviço.</p>
          <Code label="Variáveis de ambiente (HTTP)" text={examples.http.env} />
          <Code label="Variáveis de ambiente (gRPC)" text={examples.grpc.env} />
        </Section>

        <Section id="java" title={title('java')}>
          <p>Com o agente Java do OpenTelemetry (<code>opentelemetry-javaagent.jar</code>), as mesmas configurações vão como propriedades <code>-Dotel.*</code>.</p>
          <Code label="Java (HTTP)" text={examples.http.java} />
          <Code label="Java (gRPC)" text={examples.grpc.java} />
        </Section>

        <Section id="collector" title={title('collector')}>
          <p>Se as aplicações já enviam para um OpenTelemetry Collector, ele repassa os dados ao LhamaLog. Salve como <code>config.yaml</code> no servidor do Collector (distribuição <code>otelcol-contrib</code>) e defina a variável de ambiente <code>{collectorTokenVariable}</code> com a Chave de API: a chave não fica no arquivo.</p>
          <p>O processor <code>resource</code> preenche o <code>service.name</code> só quando a aplicação não manda o próprio nome. No gRPC sem TLS (endereço <code>http://</code>), o exemplo inclui <code>tls: insecure: true</code>.</p>
          <Code label="config.yaml (HTTP)" text={examples.http.collector} />
          <Code label="config.yaml (gRPC)" text={examples.grpc.collector} />
        </Section>

        <Section id="sinais" title={title('sinais')}>
          <ul className="list-disc space-y-1 pl-5">
            <li><strong>Logs:</strong> obrigatórios. São eles que a IA do LhamaLog analisa.</li>
            <li><strong>Traces:</strong> opcionais.</li>
            <li><strong>Métricas:</strong> ainda não são recebidas. O LhamaLog responde 404 no HTTP e <code>UNIMPLEMENTED</code> no gRPC. Use <code>OTEL_METRICS_EXPORTER=none</code> e não crie o pipeline <code>metrics</code> no Collector.</li>
          </ul>
        </Section>

        <Section id="respostas" title={title('respostas')}>
          <ul className="list-disc space-y-1 pl-5">
            <li><strong>200:</strong> recebido. Se parte dos registros foi recusada, a resposta traz <code>partial_success</code> com a quantidade.</li>
            <li><strong>400:</strong> corpo ilegível, ou todos os registros inválidos.</li>
            <li><strong>401:</strong> chave ausente, errada, revogada ou expirada (no gRPC, <code>UNAUTHENTICATED</code>).</li>
            <li><strong>413:</strong> mensagem acima do limite, de 64 MB depois de descomprimir.</li>
            <li><strong>415:</strong> tipo de conteúdo ou compressão não suportados.</li>
            <li><strong>503:</strong> o LhamaLog está temporariamente indisponível. Tente de novo depois do tempo do cabeçalho <code>Retry-After</code>; os exporters do OpenTelemetry já fazem isso sozinhos.</li>
          </ul>
        </Section>

        <Section id="problemas" title={title('problemas')}>
          <ul className="list-disc space-y-1 pl-5">
            <li><strong>Só recebo 401:</strong> confira se a chave está inteira, com o prefixo <code>Bearer</code> e o espaço (<code>%20</code> nas variáveis de ambiente), e se ela não foi revogada nem expirou depois de uma rotação.</li>
            <li><strong>404 em <code>/v1/metrics</code>:</strong> desligue as métricas (<code>OTEL_METRICS_EXPORTER=none</code>).</li>
            <li><strong>415:</strong> use <code>application/x-protobuf</code> ou <code>application/json</code>.</li>
            <li><strong>gRPC não conecta:</strong> confira a porta do endereço gRPC e, sem TLS, o <code>tls: insecure: true</code> no Collector.</li>
            <li><strong>O Collector não envia:</strong> confira se a variável <code>{collectorTokenVariable}</code> está definida no ambiente do Collector.</li>
            <li><strong>Os logs aparecem com outro nome de serviço:</strong> defina <code>OTEL_SERVICE_NAME</code> na aplicação.</li>
          </ul>
        </Section>
      </main>
    </div>
  )
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <Card className="scroll-mt-4 space-y-3 text-sm leading-6 sm:p-6">
      <section id={id} aria-labelledby={`${id}-title`} className="space-y-3">
        <h2 id={`${id}-title`} className="text-lg font-bold text-[#083B7A]">{title}</h2>
        {children}
      </section>
    </Card>
  )
}

function Code({ label, text }: { label: string; text: string }) {
  return (
    <div className="overflow-hidden rounded-xl bg-[#0B1A33] text-slate-100">
      <div className="flex items-center justify-between gap-3 border-b border-slate-700 px-4 py-2">
        <span className="text-sm text-white">{label}</span>
        <CopyButton tone="dark" getText={() => text} />
      </div>
      <pre className="overflow-x-auto px-4 py-4 text-xs leading-6"><code>{text}</code></pre>
    </div>
  )
}
