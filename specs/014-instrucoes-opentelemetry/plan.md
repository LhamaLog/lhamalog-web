# Implementation Plan: Ver instruções de integração com OpenTelemetry

**Branch**: `LLT-180-instrucoes-opentelemetry` (a partir da `LLT-179-gerenciar-chaves-ingestao`, em `1e5d4c0`) | **Date**: 2026-11-27 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/014-instrucoes-opentelemetry/spec.md`

## Summary

O cartão "Conexão com OpenTelemetry" ganha o seletor de protocolo (HTTP ou gRPC), que troca o endpoint mostrado e os exemplos. Ganha também a aba "OpenTelemetry Collector", com um `config.yaml` mínimo, o bloco "Cabeçalho de autenticação" e o link "Ver documentação completa". O endpoint gRPC vem de `VITE_OTLP_GRPC_ENDPOINT`, com a mesma validação e os mesmos caminhos da `VITE_OTLP_ENDPOINT`. A documentação pública é uma rota do Web, `/docs/opentelemetry`, sem login e sem chamada ao Core, montada com as mesmas funções puras dos exemplos. Nenhum exemplo recebe a chave. Nada muda no Core nem no Coletor. Decisões em [research.md](research.md).

## Technical Context

**Language/Version**: TypeScript 7.0.2 com React 19.3.1, Node.js 26.12.1

**Primary Dependencies**: as mesmas da 013. **Nenhuma dependência nova.**

**Storage**: o protocolo escolhido fica só no estado do cartão (não vai para o rascunho local).

**Testing**: `node --test tests/*.test.mjs` e `npm run build`. O YAML do Collector é validado no teste manual com `otelcol-contrib validate` (Parte D).

**Target Platform**: navegador moderno.

**Project Type**: web application (SPA), só o frontend.

**Performance Goals**: nenhuma chamada nova ao Core. A página pública não chama o Core.

**Constraints**: o que já está igual ao Figma continua igual; nenhum exemplo, texto ou página leva o valor de uma chave; `render-config.sh` continua sem imprimir valores e recusando caracteres perigosos.

**Scale/Scope**: 2 módulos puros novos (`collectorSnippet.ts`, `otelDocs.ts`), `otelSnippet.ts`, `config.ts`, `render-config.sh`, os dois `compose`, `.env.example`, `README.md`, `OtelConnectionCard.tsx`, `ProductForm.tsx` e `AppRoutes.tsx` alterados, 1 página nova, 2 arquivos de teste novos e 2 ampliados.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Regra (`docs/instrucoes-agentes.md`) | Situação |
|---|---|
| README e planejamento como fonte de verdade | plano baseado no código da `LLT-179-gerenciar-chaves-ingestao`. OK |
| Sem Git pelo agente | exceção autorizada pelo Pedro só na sessão de 27/11/2026 (ver [quickstart.md](quickstart.md)). OK com exceção |
| Entregas pequenas, com parada para revisão | cinco fases, cada uma com testes e build; revisão do Pedro no relatório das 13h. OK |
| Autenticação e Clerk são do Felipe | a rota pública fica fora do `ProtectedRoute` e não mexe no `AuthProvider` nem na configuração da Clerk. Informado na entrega. OK |
| Sem spec retroativa | só o comportamento novo. OK |
| Sem instalar dependências | nenhuma. OK |

Re-check pós-design: sem violações além da exceção de Git registrada.

## Project Structure

### Documentation (this feature)

```text
specs/014-instrucoes-opentelemetry/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── analysis.md
├── tasks.md
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
src/shared/config.ts                    # + otlpGrpcEndpoint (VITE_OTLP_GRPC_ENDPOINT e /config.js), mesma validação
infra/nginx/render-config.sh            # + otlpGrpcEndpoint no /config.js, mesma validação
compose.yaml, compose.dev.yaml          # + VITE_OTLP_GRPC_ENDPOINT
.env.example, README.md                 # documentação da variável e da página pública
src/features/products/
├── otelSnippet.ts                      # + protocolo (http | grpc), endpointFor, authHeaderLines
├── collectorSnippet.ts                 # NOVO: config.yaml do OpenTelemetry Collector
├── otelDocs.ts                         # NOVO: caminho, índice e textos da documentação pública
└── components/
    ├── OtelConnectionCard.tsx          # seletor, aba Collector, cabeçalho, link
    └── ProductForm.tsx                 # passa o endpoint gRPC
src/features/docs/OpenTelemetryDocsPage.tsx  # NOVO: /docs/opentelemetry, pública
src/app/routes/AppRoutes.tsx            # + rota pública
tests/
├── otel-snippet.test.mjs               # + protocolo e cabeçalho
├── collector-snippet.test.mjs          # NOVO
├── otel-docs.test.mjs                  # NOVO: rota pública e conteúdo das mesmas funções
└── public-config.test.mjs              # + otlpGrpcEndpoint
```

**Structure Decision**: os exemplos e os textos da documentação ficam em `.ts` puro, para o `node --test` cobrir as regras "sem chave" e "sem métricas", e para a aba e a página pública usarem as mesmas funções.

### Fases

1. Configuração do endpoint gRPC.
2. Exemplos (funções puras).
3. Aba: seletor, Collector, cabeçalho, link.
4. Documentação pública.
5. Fechamento.

## Complexity Tracking

Nenhuma violação a justificar.
