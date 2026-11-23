# Implementation Plan: Lista, cadastro e edição de produto, arquivar (Web)

**Branch**: `LLT-123-editar-arquivar-produto` (a partir da `LLT-178-contexto-produto` do Web) | **Date**: 2026-11-19, revisto em 2026-11-20 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/009-editar-arquivar-produto/spec.md`

## Summary

A lista de produtos passa a seguir o Figma (`01-produtos-lista.png`), reaproveitando os componentes que o Vinicius fez para a demonstração (`ProductsView` e afins), ligados aos dados do Core (PR #3, `specs/002-editar-arquivar-produto` do Core). A aba "Informações do produto" fica igual ao Figma (`02-produto-informacoes.png`). Os dados do Figma que o Core não tem vão para o rascunho local, e os indicadores sem API mostram "—" (F1). A edição envia só o que mudou, os dados gerais antes do contexto, com a `version` encadeada. Arquivar e desarquivar entram no rodapé da edição, só para admin, e o produto arquivado abre só para leitura. A lógica fica em funções puras (`productView.ts`, `productEdit.ts`), com testes. Decisões em [research.md](research.md).

## Technical Context

**Language/Version**: TypeScript 7.0.2 com React 19.3.1, Node.js 26.12.1 (`engines` do `package.json`)

**Primary Dependencies**: `@clerk/react` 6.18.2, `react-router-dom` 7.18.4, Vite 8.3.4, Tailwind 4.3.3. **Nenhuma dependência nova.**

**Storage**: `sessionStorage`, chave `lhamalog.productDraft.v1:<id>`, para os campos do Figma que o Core ainda não guarda (F1). O resto é gravado no Core.

**Testing**: `node --test tests/*.test.mjs` (importa `.ts` com `tests/resolve-ts.mjs`; não carrega `.tsx`, por isso a lógica fica em `.ts` puro) e `npm run build` (`tsc --noEmit` e `vite build`). As telas são conferidas pelo roteiro do [quickstart.md](quickstart.md).

**Target Platform**: navegador moderno; desenvolvimento em `http://localhost:5173` com o Core em `http://localhost:8080`.

**Project Type**: web application (SPA), só o frontend; o Core é outro repositório.

**Performance Goals**: a lista ativa é carregada uma vez; `GET /api/products?archived=true` só roda na situação Arquivados. Salvar sem mudança no servidor não chama o Core.

**Constraints**: não alterar o contrato do Core; não inventar número (F1); os componentes do Vinicius só recebem props opcionais; autenticação e Clerk só são lidas (`orgRole`, `getMemberships`), sem mudança.

**Scale/Scope**: 2 módulos puros novos e 1 hook novo; `ProductsPage.tsx` reescrito; `ProductForm.tsx`, `types.ts`, `draft.ts`, 4 componentes do Vinicius e `DistributionBars` alterados; `ProductTable.tsx` apagado; 2 arquivos de teste novos.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

A constituição do web ainda não foi ratificada (`.specify/memory/constitution.md` é o template). Os portões vêm de `docs/instrucoes-agentes.md`:

| Regra | Situação |
|---|---|
| README e planejamento como fonte de verdade | plano baseado no código da `LLT-178-contexto-produto`. OK |
| Sem Git pelo agente | nenhuma task de Git; branch e commits são do Pedro. OK |
| Entregas pequenas, com parada para revisão | seis fases, cada uma com testes e build e parada para revisão. OK |
| Autenticação e Clerk são do Felipe, com a menor mudança | nenhuma mudança de autenticação; só leitura de `orgRole` (`useAuth`) e `organization.getMemberships`, as mesmas chamadas do menu e da Equipe. Informado em cada entrega. OK |
| Sem spec retroativa | só o comportamento novo da LLT-123. OK |
| Sem instalar dependências | nenhuma dependência nova. OK |

Re-check pós-design: sem violações.

## Project Structure

### Documentation (this feature)

```text
specs/009-editar-arquivar-produto/
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
    └── core-api.md          # cópia de leitura do contrato do Core (specs/002-editar-arquivar-produto)
```

### Source Code (repository root)

```text
src/features/products/
├── types.ts                 # + archivedAt; ProductUiDraft: + owner, teamEmail, tags; − team, criticality, project, service, logLevel, active
├── draft.ts                 # lê owner, teamEmail e tags; ignora chaves antigas
├── productListModel.ts      # − productFieldErrors (substituída por formFieldErrors)
├── productView.ts           # NOVO: toCardProps, summaryFrom, filtros, paginação de 6, productsPath, sidePanelsFrom (F1, sem inventar número)
├── productEdit.ts           # NOVO: changedParts, saveEdits, setArchived, formFieldErrors, addTag, ownerOptions, canArchive(orgRole), caminhos e textos
├── useOwnerOptions.ts       # NOVO: pessoas da organização com getMemberships, a mesma chamada da Equipe (N3)
└── components/
    ├── ProductsPage.tsx     # monta o ProductsView com dados do Core; Filtros com Situação (F6)
    ├── ProductsView.tsx     # (Vinicius) + props opcionais filters e listState
    ├── ProductCard.tsx      # (Vinicius) + props opcionais onOpen (seta e clique) e archivedLabel; environment aceita null
    ├── ProductsSummary.tsx  # (Vinicius) valor aceita texto ("—")
    ├── ProductsByEnvironment.tsx # (Vinicius) valores aceitam null ("—")
    ├── ProductForm.tsx      # aba Informações igual ao Figma, com o TagsField interno; salvar por partes; Arquivar/Desarquivar; só leitura
    └── ProductTable.tsx     # apagada (sem uso)
src/shared/ui/
└── DistributionBars.tsx     # + formattedValue opcional
tests/
├── product-view.test.mjs    # NOVO
├── product-edit.test.mjs    # NOVO
└── company-products.test.mjs # o trecho do productFieldErrors virou o teste das chaves antigas descartadas
```

**Structure Decision**: a montagem das props da lista fica em `productView.ts` e as regras de edição e arquivo em `productEdit.ts`, separadas da tela, porque o `node --test` não carrega `.tsx`. O painel de filtros entrou como prop do `ProductsView`, e não do `ProductsHeader`, porque o painel fica entre o cabeçalho e a lista (I3).

### Fases

1. Funções puras (`productView`, `productEdit`) e testes.
2. Lista igual ao Figma (US1).
3. Aba Informações igual ao Figma (US2).
4. Edição dos dados gerais (US3).
5. Arquivar, desarquivar e só leitura (US4).
6. Fechamento: roteiro manual com comparação lado a lado.

### Riscos

| Risco | Mitigação |
|---|---|
| Rascunho local guarda dados que o time pode achar que estão no servidor | nota visível na aba ("ainda não são salvos no servidor: ficam guardados só neste navegador") e lista de pendências para o Core (F1) |
| Mudar componentes da demonstração quebra a `/componentes` | props novas opcionais; conferir `/componentes` no roteiro manual |
| Duas chamadas no salvar | ordem fixa e mensagem de salvamento parcial (W1) |

## Complexity Tracking

Nenhuma violação a justificar.
