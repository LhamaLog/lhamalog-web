# Data Model: Ver instruções de integração com OpenTelemetry

Só tipos do frontend. Nada é gravado no navegador.

## PublicConfig (ampliado, `src/shared/config.ts`)

| Campo | Origem | Regra |
|---|---|---|
| `otlpEndpoint` | `VITE_OTLP_ENDPOINT` ou `/config.js` | já existe (spec 011) |
| `otlpGrpcEndpoint` | `VITE_OTLP_GRPC_ENDPOINT` ou `/config.js` | novo: opcional, http ou https, sem usuário, senha, parâmetros ou âncora, sem barra final |

## SnippetInput (ampliado, `otelSnippet.ts`)

| Campo | Tipo | Uso |
|---|---|---|
| `endpoint` | string | o endpoint do protocolo escolhido (`endpointFor`) |
| `productName` | string | `service.name` (vazio vira `meu-servico`) |
| `traces` | boolean | liga ou desliga os traces |
| `protocol` | `http` \| `grpc` (opcional, padrão `http`) | protocolo, cabeçalho e exporter |

Não existe campo para a chave: os exemplos usam sempre `<sua-chave>` ou `${env:LHAMALOG_TOKEN}`.

## Estado do cartão

| Estado | Valores | Padrão |
|---|---|---|
| protocolo | `http`, `grpc` | `http` |
| aba do exemplo | `env`, `java`, `collector` | `env` |

## Documentação pública (`otelDocs.ts`)

| Item | Conteúdo |
|---|---|
| `docsPath` | `/docs/opentelemetry` |
| `docsSections` | índice: id e título de cada tópico da I6 |
| `docsEndpoint(value)` | o endereço ou "consulte o administrador do LhamaLog" |
| `docsExamples(config)` | os exemplos do SDK e do Collector, com `meu-servico`, nos dois protocolos |
