# Data Model: Aba de integração e Chave de API (Web)

## Token (lido do Core)

Contrato: `contracts/core-api.md`. O `TokenView` nunca traz o valor nem o hash.

| Campo | Tipo | Uso no Web |
|---|---|---|
| `id` | texto | caminho do `rotate` |
| `name` | texto | não aparece na tela (F5) |
| `state` | `ACTIVE` \| `EXPIRING` \| `EXPIRED` \| `REVOKED` | escolhe a chave atual e a anterior |
| `createdAt` | data ISO | ordena (mais recente primeiro) |
| `expiresAt` | data ISO ou `null` | data em que a chave anterior para (US2.6) |
| `revokedAt`, `revokedBy`, `createdBy`, `replacedBy` | texto ou `null` | não usados na tela |

`readTokenList` descarta itens sem `id`, sem `state` válido ou sem `createdAt`.

| Derivado | Regra |
|---|---|
| chave atual (`activeToken`) | o `ACTIVE` com `createdAt` mais recente, ou nenhum |
| chave anterior (`expiringToken`) | o `EXPIRING` com `createdAt` mais recente, ou nenhum |

## Chave gerada (resposta do Core)

| Resposta | Campos lidos |
|---|---|
| `POST .../tokens` (201) | `token` (TokenView), `secret`, `notice` |
| `POST .../tokens/{id}/rotate` (201) | `created` (como acima) e `previous` (TokenView em `EXPIRING`) |

O `secret` só existe no estado do `ApiKeyField`, até ele sair da tela. Não é gravado em lugar nenhum.

## Rascunho local (F1)

Mesmo armazenamento da LLT-123 (`sessionStorage`, chave `lhamalog.productDraft.v1:<id>`).

| Campo | Tipo | Inicial | Regra |
|---|---|---|---|
| `otelTraces` | booleano | `false` | **novo**; Traces marcado |
| `otelLogLevel` | `DEBUG` \| `INFO` \| `WARN` \| `ERROR` | `INFO` | **novo**; valor fora da lista volta para `INFO` |

Saíram: `otelEndpoint`, `otelProtocol`, `otelService`, `otelHeaders` e `otelEnabled`. Um rascunho antigo com essas chaves é lido sem elas. Logs não é guardado: está sempre ligado. Métricas não é guardado: está sempre desligado (N2).

## Configuração pública

| Campo | Origem | Regra |
|---|---|---|
| `otlpEndpoint` | `/config.js` (Docker) ou `VITE_OTLP_ENDPOINT` (Vite) | opcional; `http` ou `https`, sem usuário, senha, espaço ou aspas, até 500 caracteres; barra final removida; vazio quando ausente |

## Exemplo da configuração da aplicação

Entrada: endpoint, nome do produto e Traces. **Não recebe a chave.**

| Variável | Valor |
|---|---|
| `OTEL_SERVICE_NAME` | `serviceName(nome do produto)` |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | endpoint, ou `<endereço ainda não configurado>` |
| `OTEL_EXPORTER_OTLP_PROTOCOL` | `http/protobuf` |
| `OTEL_EXPORTER_OTLP_HEADERS` | `Authorization=Bearer%20<sua-chave>` |
| `OTEL_LOGS_EXPORTER` | `otlp` |
| `OTEL_TRACES_EXPORTER` | `otlp` com Traces marcado; senão `none` |
| `OTEL_METRICS_EXPORTER` | `none` |

O comando Java usa as mesmas configurações como `-Dotel.*`.
