# Tasks: Ciclo de vida da ocorrência na tela

**Input**: artefatos em `specs/013-ciclo-de-vida-ocorrencias/`
**Prerequisites**: spec 008 deste repositório; Core da spec 014 do lhamalog-core (contrato `contracts/api.md`)

**Tests**: módulos puros com `node --test` (escrever antes e ver falhar); telas pelo quickstart.

## Phase 1: Foundational

- [ ] T001 [P] Acrescentar `archived` em `OccurrenceListItem` e `revision`, `archivedAt`, `archivedBy` em `OccurrenceDetail` (`src/features/occurrences/types.ts`)
- [ ] T002 [P] Em `tests/access-contract.test.mjs`, esperar `OCCURRENCES_MANAGE` no modo legado de administrador e de membro; acrescentar a permissão em `accessContract.ts` e o rótulo "Alterar status e arquivar ocorrências" em `features/access/labels.ts`

## Phase 2: User Story 1 - Alterar o status (P1) 🎯 MVP

- [ ] T003 [US1] Em `tests/occurrences.test.mjs`: `statusAction`, `archiveAction` e `unarchiveAction` montam caminho, método e corpo; `actionResult` classifica 200, 409 `occurrence_changed`, 404, 400 e falha (research R2)
- [ ] T004 [US1] Criar `src/features/occurrences/occurrenceActions.ts`
- [ ] T005 [US1] Criar `components/OccurrenceActions.tsx` (seletor, "Alterar status" desabilitado no status atual e durante a chamada, mensagens em `aria-live`, conflito com "Recarregar") e ligá-lo no `OccurrenceDetailPage` só com `OCCURRENCES_MANAGE` e `revision` presente; o detalhe passa a ser trocado pelo devolvido
- [ ] T006 [US1] Mostrar o autor por nome no histórico (research R4) no `OccurrenceDetailPage`
- [ ] T007 [US1] Rodar `npm test`, `npm run build` e o quickstart S1 a S5

## Phase 3: User Story 2 - Arquivar e ver arquivadas (P2)

- [ ] T008 [US2] Em `tests/occurrences.test.mjs`: leitura e escrita de `situacao`, `occurrencesPath` com `archived=true`, `clearFilters` volta para ativas, `activeFilterCount` não conta a situação
- [ ] T009 [US2] Completar `occurrenceQuery.ts` com a situação
- [ ] T010 [US2] Em `OccurrencesPage.tsx`: seletor "Situação" (Ativas/Arquivadas) que volta à página 1, vazio "Nenhuma ocorrência arquivada", selo "Arquivada" nos itens (`OccurrenceCard` com `archivedLabel`)
- [ ] T011 [US2] Em `OccurrenceActions`/`OccurrenceDetailPage`: "Arquivar"/"Desarquivar", selo "Arquivada" com data e autor
- [ ] T012 [US2] Rodar `npm test`, `npm run build` e o quickstart S6 a S13

## Phase 4: Polish

- [ ] T013 [P] Atualizar `README.md` (rotas de ocorrências) e `docs/planejamento-componentes.md`
- [ ] T014 Registrar o resultado do quickstart no fim deste arquivo
- [ ] T015 Revisão do Felipe antes dos commits
