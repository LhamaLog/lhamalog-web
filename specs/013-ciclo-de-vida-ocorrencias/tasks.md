# Tasks: Ciclo de vida da ocorrência na tela

**Input**: artefatos em `specs/013-ciclo-de-vida-ocorrencias/`
**Prerequisites**: spec 008 deste repositório; Core da spec 014 do lhamalog-core (contrato `contracts/api.md`)

**Tests**: módulos puros com `node --test` (escrever antes e ver falhar); telas pelo quickstart.

## Phase 1: Foundational

- [X] T001 [P] Acrescentar `archived` em `OccurrenceListItem` e `revision`, `archivedAt`, `archivedBy` em `OccurrenceDetail` (`src/features/occurrences/types.ts`)
- [X] T002 [P] Em `tests/access-contract.test.mjs`, esperar `OCCURRENCES_MANAGE` no modo legado de administrador e de membro; acrescentar a permissão em `accessContract.ts` e o rótulo "Alterar status e arquivar ocorrências" em `features/access/labels.ts`

## Phase 2: User Story 1 - Alterar o status (P1) 🎯 MVP

- [X] T003 [US1] Em `tests/occurrences.test.mjs`: `statusAction`, `archiveAction` e `unarchiveAction` montam caminho, método e corpo; `actionResult` classifica 200, 409 `occurrence_changed`, 404, 400 e falha (research R2)
- [X] T004 [US1] Criar `src/features/occurrences/occurrenceActions.ts`
- [X] T005 [US1] Criar `components/OccurrenceActions.tsx` (seletor, "Alterar status" desabilitado no status atual e durante a chamada, mensagens em `aria-live`, conflito com "Recarregar") e ligá-lo no `OccurrenceDetailPage` só com `OCCURRENCES_MANAGE` e `revision` presente; o detalhe passa a ser trocado pelo devolvido
- [X] T006 [US1] Mostrar o autor por nome no histórico (research R4) no `OccurrenceDetailPage`
- [X] T007 [US1] Rodar `npm test`, `npm run build` e o quickstart S1 a S5

## Phase 3: User Story 2 - Arquivar e ver arquivadas (P2)

- [X] T008 [US2] Em `tests/occurrences.test.mjs`: leitura e escrita de `situacao`, `occurrencesPath` com `archived=true`, `clearFilters` volta para ativas, `activeFilterCount` não conta a situação
- [X] T009 [US2] Completar `occurrenceQuery.ts` com a situação
- [X] T010 [US2] Em `OccurrencesPage.tsx`: seletor "Situação" (Ativas/Arquivadas) que volta à página 1, vazio "Nenhuma ocorrência arquivada", selo "Arquivada" nos itens (`OccurrenceCard` com `archivedLabel`)
- [X] T011 [US2] Em `OccurrenceActions`/`OccurrenceDetailPage`: "Arquivar"/"Desarquivar", selo "Arquivada" com data e autor
- [X] T012 [US2] Rodar `npm test`, `npm run build` e o quickstart S6 a S13

## Phase 4: Polish

- [X] T013 [P] Atualizar `README.md` (rotas de ocorrências) e `docs/planejamento-componentes.md`
- [X] T014 Registrar o resultado do quickstart no fim deste arquivo
- [ ] T015 Revisão do Felipe antes dos commits

## Resultados (25/11/2026)

- `npm test`: 190 testes, 0 falhas (novos: situação, ações, autor por nome, selo de arquivada e a permissão no modo legado). `npm run build` verde.
- Ajuste fora das tasks: o `OccurrencesHeader` ganhou a propriedade `controls` para o seletor de situação ficar ao lado da busca; a demonstração `/componentes` não muda.

### Roteiro (S1 a S13)

Rodado no Chrome com o ambiente só de teste (Core da branch `LLT-136-ciclo-de-vida` na porta 8081 e web na 5174 com o login de teste), sobre a carga de exemplo. Com a Clerk de teste não há nomes de membros, então o autor aparece como id; com a Clerk real, aparece o nome.

| # | Resultado |
|---|---|
| S1 | OK: cartão "Ações" com Aberta selecionado e "Alterar status" desabilitado |
| S2 | OK: Em análise, histórico "Aberta → Em análise" com o autor, aviso "Status alterado" |
| S3 | OK: aparece no filtro Em análise (conferido também no roteiro do core, C5) |
| S4 | OK: mudança feita por fora (Fechada) → a tela mostra "A ocorrência mudou…" e "Recarregar"; recarregar mostra Fechada |
| S5 | OK: Fechada → Aberta, com o histórico |
| S6 | OK: "Ocorrência arquivada", selo "Arquivada em … por …", botão vira "Desarquivar" |
| S7 | OK: lista padrão com 23 de 24 |
| S8 | OK: "Arquivadas" mostra 1, endereço `?situacao=arquivadas`, F5 mantém |
| S9 | OK: "Desarquivar" → aviso, selo some; volta para Ativas (24) |
| S10 | OK: "Nenhuma ocorrência arquivada", sem paginação |
| S11 | OK: o membro só vê "Produto do membro (V7)" e altera o status de uma ocorrência dele |
| S12 | OK: Equipe › Permissões com "Alterar status e arquivar ocorrências" para Dono, Administrador e Membro |
| S13 | OK: em 390 px, seletor e botões em uma coluna, sem rolagem horizontal |
