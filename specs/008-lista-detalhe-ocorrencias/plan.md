# Implementation Plan: Lista e detalhe de ocorrências

**Branch**: `LLT-135-lista-e-detalhe` (padrão do Jira) | **Date**: 2026-11-19 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/008-lista-detalhe-ocorrencias/spec.md`

A branch sai da `Development` em `45a39de` (com o PR #9 da LLT-289 já mergeado). A pasta é a 008 porque a 007 é a `007-tela-planos-contratacao`.

## Summary

A tela `/ocorrencias` entra no `CompanyWorkspace` e usa o Core da spec 012 (`GET /api/occurrences` e `/api/occurrences/{id}`). O estado da lista (busca, tipos, status, produtos, período, página e tamanho) mora na query string, lido e escrito por um módulo puro (`occurrenceQuery.ts`) que também monta o caminho do Core e conta os filtros ativos. A lista usa o `useApiResource`, que já cancela consultas antigas. Os componentes da LLT-237 são adaptados aos dados reais (contagem, status, recorrente), com os painéis de métricas opcionais; entram o painel `OccurrenceFilters` e a página `OccurrenceDetailPage`. O detalhe mostra o 404 como "não encontrada ou sem acesso", sem encerrar a sessão. Os módulos puros têm testes `node --test`; as telas são validadas pelo quickstart. Decisões em [research.md](research.md).

## Technical Context

**Language/Version**: TypeScript 5 com React 19, Node.js 26.12.1 (`.node-version`)

**Primary Dependencies**: `@clerk/react` 6.18.2, `react-router-dom` 7.18.4, Vite 8, Tailwind 4. **Nenhuma dependência nova.**

**Storage**: nenhum. O estado da lista fica no endereço; o retorno do detalhe usa o `state` da navegação.

**Testing**: `node --test tests/*.test.mjs` (com `tests/resolve-ts.mjs`) para os módulos puros; `npm run build` (tipos). Telas pelo quickstart, porque @testing-library e jsdom não entram sem aprovação.

**Target Platform**: navegador moderno; desenvolvimento em `http://localhost:5173` com o Core em `http://localhost:8080`.

**Project Type**: web application (SPA), só o frontend; o Core é outro repositório.

**Performance Goals**: primeira página visível em até 2 s com o Core local (SC-004); uma consulta por mudança de filtro, página ou busca (com pausa de 400 ms).

**Constraints**: não alterar o contrato do Core; não mexer na autenticação além do que as specs 006 e 007 já fazem; texto de log sempre como texto; sem gravidade, ações de ciclo de vida, tempo real ou painéis de métricas.

**Scale/Scope**: cerca de 6 arquivos novos em `features/occurrences`, 4 componentes da LLT-237 ajustados, rotas e workspace, 1 arquivo de teste.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

A constituição do web ainda é o template. Os portões vêm de `docs/instrucoes-agentes.md`:

| Regra | Situação |
|---|---|
| README e planejamento como fonte de verdade | plano baseado na `Development` atual e nos componentes da LLT-237. OK |
| Sem Git pelo agente | nenhuma task de Git; a branch foi criada a pedido do Felipe, e os commits são dele. OK |
| Entregas pequenas, com parada para revisão | tasks por história, cada fase com testes e build. OK |
| Autenticação e Clerk são do Felipe | nenhuma mudança em `features/auth`, `useApi` ou `sessionRedirect`; as rotas novas usam o `ProtectedRoute` existente. OK |
| Sem spec retroativa | só o comportamento novo. OK |
| Sem instalar dependências | nenhuma dependência nova. OK |

Re-check pós-design: sem violações.

## Project Structure

### Documentation (this feature)

```text
specs/008-lista-detalhe-ocorrencias/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── core-occurrences.md     # o que o web usa do Core e como reage
├── checklists/requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── routes/AppRoutes.tsx                  # + /ocorrencias e /ocorrencias/:id
│   └── layouts/CompanyWorkspace.tsx          # item ativo, navegação e caminho para Ocorrências
├── features/occurrences/
│   ├── types.ts                              # novo: tipos do contrato
│   ├── labels.ts                             # novo: rótulos e tons de tipo e status
│   ├── occurrenceQuery.ts                    # novo: query da URL, caminho do Core, contagem de filtros
│   └── components/
│       ├── OccurrencesPage.tsx               # novo: lista conectada ao Core e à URL
│       ├── OccurrenceFilters.tsx             # novo: painel de filtros
│       ├── OccurrenceDetailPage.tsx          # novo: detalhe
│       ├── OccurrenceCard.tsx                # + contagem, status, recorrente; tags opcionais
│       ├── OccurrencesView.tsx               # painéis opcionais; estado vazio configurável
│       ├── OccurrencesHeader.tsx             # + maxLength e seletor de tamanho de página
│       └── SeverityIndicator.tsx             # sem mudança de API
└── app/App.tsx                               # demonstração ajustada aos tipos novos

tests/
└── occurrences.test.mjs                      # novo: occurrenceQuery e labels
```

**Structure Decision**: tudo de ocorrências fica em `features/occurrences`, como `products` e `team`. O `CompanyWorkspace` só ganha o ramo de Ocorrências. `useApi`, `useApiResource` e `sessionRedirect` não mudam.

## Complexity Tracking

> Sem violações.
