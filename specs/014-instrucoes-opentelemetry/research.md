# Research: Ver instruções de integração com OpenTelemetry

Decisões do plano, a partir do clarify (I1 a I8) e do contrato do receptor (`lhamalog-collector`, `README.md` e `specs/001-otlp-receiver/contracts/otlp-export.md`).

## R1. Endpoint por protocolo

- **Decision**: `endpointFor(protocol, { http, grpc })` escolhe o endereço. Sem valor, o campo mostra "Endereço ainda não configurado." e o Copiar fica desabilitado, como já acontece com o HTTP.
- **Rationale**: I2. O Coletor recebe OTLP/HTTP na 4318 (4328 local) e OTLP/gRPC na 4317 (4327 local).

## R2. Variável de ambiente nos exemplos do SDK

- **Decision**:
  - HTTP: `OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf` e `OTEL_EXPORTER_OTLP_HEADERS=Authorization=Bearer%20<sua-chave>` (como hoje);
  - gRPC: `OTEL_EXPORTER_OTLP_PROTOCOL=grpc` e `OTEL_EXPORTER_OTLP_HEADERS=authorization=Bearer%20<sua-chave>`.
- **Rationale**: I4. No gRPC, a metadata vai em minúsculas, e é ela que o `BearerTokenInterceptor` do Coletor lê. A especificação do OpenTelemetry pede os valores codificados como URL, por isso o espaço vira `%20`.

## R3. YAML do Collector

- **Decision**: `receivers.otlp` com `grpc` em `0.0.0.0:4317` e `http` em `0.0.0.0:4318`; processors `resource` (`service.name`, `action: insert`) e `batch`; exporter `otlphttp/lhamalog` (HTTP) ou `otlp/lhamalog` (gRPC), com `headers.authorization: "Bearer ${env:LHAMALOG_TOKEN}"`; pipelines `logs` e, com Traces, `traces`. Nunca `metrics`. No gRPC com `http://`, `tls.insecure: true`.
- **Rationale**: I3 e I7. O exporter gRPC do Collector usa TLS por padrão, e o Coletor local não tem TLS. `insert` não sobrescreve o nome que a aplicação já manda. `${env:...}` é a sintaxe atual do Collector para ler uma variável de ambiente; assim, a chave nunca entra no arquivo.
- **Alternatives considered**: `upsert` (trocaria o nome de todos os serviços que passam por um Collector agregador); colocar a chave no YAML (proibido pela I5).

## R4. Bloco "Cabeçalho de autenticação"

- **Decision**: HTTP: "Envie no cabeçalho HTTP: `Authorization: Bearer <sua-chave>`". gRPC: "Envie na metadata gRPC: `authorization: Bearer <sua-chave>`". Mais uma linha: "Sem a chave ou com uma chave revogada, o LhamaLog responde 401 (no gRPC, `UNAUTHENTICATED`)."
- **Rationale**: FR-I02 e o contrato do receptor.

## R5. Página pública

- **Decision**: `OpenTelemetryDocsPage` em `src/features/docs/`, montada em `/docs/opentelemetry` fora do `ProtectedRoute`. Os endpoints vêm do `readPublicConfig()`; sem valor, aparece "consulte o administrador do LhamaLog". Os exemplos usam `envSnippet`, `javaSnippet` e `collectorSnippet` com o produto vazio (`meu-servico`). Índice no topo, com âncoras.
- **Rationale**: I6. O `AuthProvider` envolve todas as rotas, mas só o `ProtectedRoute` redireciona para o login.
- **Alternatives considered**: um `.md` no GitHub (depende do repositório público e fica fora do produto).

## R6. Link da aba

- **Decision**: `<a href="/docs/opentelemetry" target="_blank" rel="noopener noreferrer">Ver documentação completa</a>`.
- **Rationale**: US4.1; `noreferrer` também evita mandar a URL do produto para a página nova.

## R7. Produto arquivado

- **Decision**: reservado para o Pedro (clarify). Nada muda: a aba continua dentro do `fieldset` desabilitado (C1 da `011`).
