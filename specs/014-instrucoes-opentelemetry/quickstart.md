# Quickstart: LLT-180 instruções OpenTelemetry (Web)

## Exceção às regras do Web (27/11/2026)

A mesma da spec `013`: só na sessão de 27/11/2026, o Pedro autorizou o `npm ci` no `lhamalog-web` e o Git pelo agente para criar, commitar e publicar **apenas** as branches `LLT-179-gerenciar-chaves-ingestao`, `LLT-180-instrucoes-opentelemetry` e `LLT-179-coletor-le-produto-do-core`, sem PR. Esta branch saiu da 179 com `git switch -c LLT-180-instrucoes-opentelemetry` (a partir de `1e5d4c0`). O `npm ci` não foi preciso.

## Linha de base e resultados

| Momento | `npm test` | `npm run build` |
|---|---|---|
| Início (27/11/2026), sobre a 179 (`1e5d4c0`) | 185 de 185 | ok, com o aviso de chunk acima de 500 kB, que já existia |
| Fase 1 (T004 a T006) | 186 de 186 (1 novo; falhou antes do código) | ok |
| Fase 2 (T007, T008) | 195 de 195 (9 novos; 8 falharam antes do código, e o da porta gRPC falhou antes da correção B1) | ok |
| Fase 3 (T009 a T011) | 195 de 195 | ok |
| Fase 4 (T012 a T014) | 199 de 199 (4 novos; os 4 falharam antes do código) | ok |
| Fase 5 (T015 a T017), final | 199 de 199 | ok |

`render-config.sh` testado no Git Bash: valores válidos geram o `/config.js` com `otlpGrpcEndpoint`; `grpc://`, usuário e senha, e aspas são recusados, e a mensagem não mostra o valor.

YAML do Collector validado com `docker run otel/opentelemetry-collector-contrib:0.163.1 validate`: HTTP local, gRPC local, HTTP https só com logs e gRPC https, todos aceitos depois da correção B1. Os arquivos ficaram fora dos repositórios.

Busca do T015: só o valor falso `llt_teste` e as checagens de `sk_` que já existiam.

## Como rodar

```
npm test
npm run build
```

`VITE_OTLP_GRPC_ENDPOINT` é opcional, como a `VITE_OTLP_ENDPOINT`. No local: `VITE_OTLP_ENDPOINT=http://localhost:4328` e `VITE_OTLP_GRPC_ENDPOINT=http://localhost:4327`. O Pedro confirma as duas linhas antes de elas entrarem no `.env.local` (Parte D).

## Diferenças em relação ao Figma (T016)

- Igual ao Figma: título, endpoint, Chave de API, sinais, nível mínimo e a caixa escura do exemplo.
- `Authorization: Bearer` no lugar do `x-api-key` do Figma, que o Coletor recusaria (N1 da `011`, I8).
- Fora do Figma, na mesma linguagem visual: o seletor "Protocolo: HTTP | gRPC" ao lado de "Configuração da aplicação", a aba "OpenTelemetry Collector", o bloco "Cabeçalho de autenticação" e o link "Ver documentação completa".
- A página `/docs/opentelemetry` não tem desenho; ela usa o cabeçalho com o logo, os cartões e os blocos de código da aba.
- Pendências para o Figma: seletor de protocolo, aba Collector, bloco do cabeçalho, link e página pública; trocar `x-api-key` por `Authorization: Bearer`.

## Roteiro manual

Linhas 16 a 25 do `TESTE-MANUAL.md` do pacote da LLT-124. A preencher na Parte D.

| # | Resultado |
|---|---|
| 16 a 25 | pendente |
