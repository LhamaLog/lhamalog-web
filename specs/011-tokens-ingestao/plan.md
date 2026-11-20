# Implementation Plan: Aba de integração e Chave de API (Web)

**Branch**: `LLT-179-tokens-ingestao` (a partir da `LLT-177-nome-unico-produto` do Web) | **Date**: 2026-11-19, revisto em 2026-11-20 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/011-tokens-ingestao/spec.md`

## Summary

A aba "Integração OpenTelemetry" é refeita igual ao Figma (`04-produto-integracao-otel.png`). A "Chave de API" usa os tokens de ingestão do Core (PR #8, `specs/010-tokens-ingestao` do Core): sem chave ativa, "Gerar nova" cria uma; com chave ativa, rotaciona com 24 h de transição depois de confirmar. O valor aparece uma vez, com Copiar, e vive só no estado do campo. O endpoint vem da configuração pública (`VITE_OTLP_ENDPOINT`), também no `/config.js` do Docker. O exemplo da "Configuração da aplicação" segue o que o Coletor aceita: `Authorization: Bearer`, logs e traces, sem métricas, e nunca leva o valor real da chave. Sinais e nível mínimo ficam no rascunho local; o painel de status mostra estados neutros (F1). A leitura do contrato e a montagem do exemplo ficam em funções puras, com testes. Decisões em [research.md](research.md).

## Technical Context

**Language/Version**: TypeScript 7.0.2 com React 19.3.1, Node.js 26.12.1 (`engines` do `package.json`)

**Primary Dependencies**: `@clerk/react` 6.18.2, `react-router-dom` 7.18.4, Vite 8.3.4, Tailwind 4.3.3. **Nenhuma dependência nova.** O Copiar usa `navigator.clipboard`.

**Storage**: o valor da chave **não é guardado** em lugar nenhum (só no estado do componente, apagado ao sair). Sinais e nível mínimo vão para o rascunho local (`sessionStorage`, chave `lhamalog.productDraft.v1:<id>`), como os outros campos sem Core (F1).

**Testing**: `node --test tests/*.test.mjs` (importa `.ts` com `tests/resolve-ts.mjs`; não carrega `.tsx`) e `npm run build` (`tsc --noEmit` e `vite build`). Os testes usam só o valor falso `llt_teste`. A tela e a ausência da chave no armazenamento do navegador são conferidas pelo roteiro do [quickstart.md](quickstart.md).

**Target Platform**: navegador moderno; desenvolvimento em `http://localhost:5173` com o Core em `http://localhost:8080`.

**Project Type**: web application (SPA), só o frontend; o Core e o Coletor são outros repositórios.

**Performance Goals**: uma chamada `GET /api/products/{id}/tokens` ao abrir a aba de um produto salvo, só para admin (o Core exige admin em todas as rotas de token).

**Constraints**: o valor da chave nunca vai para armazenamento, console, URL, estado global nem para o exemplo (FR-W03, SC-W02); não alterar o contrato do Core nem o Coletor; listar, revogar e histórico ficam fora (F5); `render-config.sh` continua recusando segredo e não imprime os valores.

**Scale/Scope**: 2 módulos puros novos, 4 componentes novos, `ProductForm.tsx`, `types.ts`, `draft.ts`, `config.ts`, `render-config.sh`, os dois `compose`, `.env.example` e README alterados, 2 arquivos de teste novos e 1 alterado.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

A constituição do web ainda não foi ratificada (`.specify/memory/constitution.md` é o template). Os portões vêm de `docs/instrucoes-agentes.md`:

| Regra | Situação |
|---|---|
| README e planejamento como fonte de verdade | plano baseado no código da `LLT-177-nome-unico-produto` e no README atual. OK |
| Sem Git pelo agente | nenhuma task de Git; branch e commits são do Pedro. OK |
| Entregas pequenas, com parada para revisão | quatro fases, cada uma com testes e build e parada para revisão. OK |
| Autenticação e Clerk são do Felipe, com a menor mudança | nenhuma mudança de autenticação; só leitura de `orgRole`, como na LLT-123. A configuração pública ganha um campo opcional, sem tocar na chave da Clerk. Informado na entrega. OK |
| Sem spec retroativa | só o comportamento novo da LLT-179. OK |
| Sem instalar dependências | nenhuma dependência nova. OK |

Re-check pós-design: sem violações.

## Project Structure

### Documentation (this feature)

```text
specs/011-tokens-ingestao/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── analysis.md
├── tasks.md
├── checklists/
│   └── requirements.md
└── contracts/
    └── core-api.md          # cópia de leitura do contrato do Core (specs/010-tokens-ingestao)
```

### Source Code (repository root)

```text
src/features/products/
├── tokenContract.ts          # NOVO: readTokenList, activeToken, expiringToken, readCreatedToken, readRotation, caminhos, nome padrão, textos
├── otelSnippet.ts            # NOVO: serviceName, envSnippet, javaSnippet (endpoint, <sua-chave>, Bearer, logs/traces, métricas none)
├── types.ts                  # ProductUiDraft: + otelTraces, otelLogLevel; − otelEndpoint, otelProtocol, otelService, otelHeaders, otelEnabled
├── draft.ts                  # lê os campos novos; ignora os antigos
└── components/
    ├── ProductForm.tsx           # aba OTel monta os componentes novos; campos antigos e ajuda antiga saem
    ├── OtelConnectionCard.tsx    # NOVO: endpoint, Chave de API, sinais, nível mínimo, configuração da aplicação
    ├── ApiKeyField.tsx           # NOVO: mascarado, Gerar nova (POST ou rotate), Copiar, valor só em memória
    ├── CopyButton.tsx            # NOVO: Copiar com navigator.clipboard e o aviso de copiar à mão
    ├── LogLevelSlider.tsx        # NOVO: DEBUG, INFO, WARN, ERROR
    └── ConnectionStatusPanel.tsx # NOVO: estados neutros (F1); Testar conexão desabilitado
src/shared/config.ts          # + otlpEndpoint opcional (VITE_OTLP_ENDPOINT e /config.js), validado
infra/nginx/render-config.sh  # + otlpEndpoint no /config.js, com a mesma validação (N4)
compose.yaml, compose.dev.yaml # + VITE_OTLP_ENDPOINT
.env.example, README.md       # documentação da variável
tests/
├── ingestion-tokens.test.mjs # NOVO
├── otel-snippet.test.mjs     # NOVO: o exemplo nunca contém o valor real; usa <sua-chave>
└── public-config.test.mjs    # + casos do otlpEndpoint
```

**Structure Decision**: a leitura do contrato de tokens e a montagem do exemplo ficam em `.ts` puro, separadas da tela, porque o `node --test` não carrega `.tsx` e porque a regra "o exemplo nunca leva a chave" precisa de teste próprio.

### Fases

1. Funções puras, configuração e testes.
2. Layout da aba igual ao Figma (US1).
3. Chave de API: gerar, rotacionar e mostrar uma vez (US2).
4. Fechamento: roteiro manual com DevTools e comparação lado a lado.

## Complexity Tracking

Nenhuma violação a justificar.
