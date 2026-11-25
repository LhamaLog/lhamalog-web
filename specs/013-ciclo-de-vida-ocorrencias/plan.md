# Implementation Plan: Ciclo de vida da ocorrência na tela

**Branch**: `LLT-136-ciclo-de-vida` | **Date**: 25/11/2026 | **Spec**: [spec.md](spec.md)

A branch sai da `LLT-135-lista-e-detalhe` em `2b8407c` (PR #18). O PR é empilhado sobre o #18: base `LLT-135-lista-e-detalhe` até o #18 entrar, depois `Development`, sempre com merge commit.

## Summary

O `OccurrenceDetailPage` da spec 008 ganha um bloco "Ações" (seletor de status, "Alterar status", "Arquivar"/"Desarquivar"), visível com `OCCURRENCES_MANAGE` (`useAccess`, LLT-120). As ações chamam o Core da spec 014 com a revisão do detalhe e trocam o detalhe pelo que o Core devolve. A lista ganha o seletor de situação (Ativas/Arquivadas) no endereço (`situacao=arquivadas` → `archived=true`). Um módulo puro `occurrenceActions.ts` monta as chamadas e classifica as respostas; `occurrenceQuery.ts` ganha a situação. O histórico mostra o nome do autor pelos membros da organização. Decisões em [research.md](research.md).

## Technical Context

**Language/Version**: TypeScript 5, React 19, Node.js 26.12.1

**Primary Dependencies**: `@clerk/react` 6.18.2, `react-router-dom` 7.18.4. Nenhuma dependência nova.

**Storage**: nenhum; a situação fica no endereço.

**Testing**: `node --test` para `occurrenceQuery.ts`, `occurrenceActions.ts`, `labels.ts` e `accessContract.ts`; telas pelo quickstart.

**Constraints**: autenticação e `useApi` sem mudança; texto de log sempre como texto; sem confirmação para arquivar (reversível).

**Scale/Scope**: 1 módulo novo, 1 componente novo (`OccurrenceActions`), ajustes em `OccurrenceDetailPage`, `OccurrencesPage`, `OccurrenceFilters`, `types.ts`, `labels.ts`, `occurrenceQuery.ts`, `features/access/labels.ts` e `accessContract.ts`.

## Constitution Check

A constituição do web ainda é o template; os portões vêm de `docs/instrucoes-agentes.md`: entregas pequenas com revisão, sem Git pelo agente sem pedido do Felipe, Clerk sem mudança (só leitura de membros, já usada pela Equipe), sem dependências novas. Sem violações.

## Project Structure

```text
src/features/occurrences/
├── types.ts                       # + revision, archived, archivedAt, archivedBy; ListItem.archived
├── labels.ts                      # + rótulos de situação e das mensagens das ações
├── occurrenceQuery.ts             # + situação (ativas/arquivadas) → archived=true
├── occurrenceActions.ts           # novo: corpo/caminho de cada ação e classificação das respostas
└── components/
    ├── OccurrenceActions.tsx      # novo: seletor de status, alterar, arquivar/desarquivar, aria-live
    ├── OccurrenceDetailPage.tsx   # + bloco de ações, selo Arquivada, autor por nome
    ├── OccurrencesPage.tsx        # + seletor de situação, vazio de arquivadas
    └── OccurrenceFilters.tsx      # sem mudança de API (a situação fica fora do painel)
src/features/access/
├── labels.ts                      # + OCCURRENCES_MANAGE
└── accessContract.ts              # + OCCURRENCES_MANAGE no modo legado
tests/
├── occurrences.test.mjs           # + situação e ações
└── access-contract.test.mjs       # + permissão nova no modo legado
```

**Structure Decision**: as ações ficam num componente próprio dentro do detalhe, que recebe o detalhe e devolve o atualizado; a lógica de chamada e de erro fica no módulo puro, testável com `node --test`.
