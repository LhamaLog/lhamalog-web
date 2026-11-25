# Tasks: Aviso de ocorrências novas na tela

**Input**: artefatos em `specs/014-tempo-real-ocorrencias/`
**Prerequisites**: specs 008 e 013 deste repositório; Core da spec 015 (contrato `contracts/websocket.md`)

**Tests**: módulos puros com `node --test` (escrever antes e ver falhar); telas pelo quickstart.

## Phase 1: Foundational

- [ ] T001 Escrever `tests/occurrence-stream.test.mjs`: `wsUrl` (http/https, barra final), `authMessage`, `parseServerMessage` (ready, occurrence, inválida), `countsFor` (situação, produto, tipo, status), `noveltyLabel` (1 e N), `backoffSeconds` (1, 2, 4… 30), `hasNovelties` (id novo no topo, total maior, igual)
- [ ] T002 Criar `src/features/occurrences/occurrenceStream.ts`

## Phase 2: User Story 1 - Aviso (P1)

- [ ] T003 [US1] Criar `useOccurrenceStream.ts`: conexão, `auth` com `getToken`, renovação a cada 50 s, entrega dos avisos ao chamador, fechamento ao desmontar
- [ ] T004 [US1] Em `OccurrencesPage.tsx`: `Set` de novidades pelos avisos que contam; aviso "N ocorrências novas · Atualizar" em `aria-live` acima da lista; "Atualizar" volta à página 1 e recarrega; mudar filtros, página ou situação zera
- [ ] T005 [US1] Rodar `npm test`, `npm run build` e o quickstart T1 a T5

## Phase 3: User Story 2 - Reconectar e sincronizar (P1)

- [ ] T006 [US2] Completar `useOccurrenceStream.ts` com reconexão (`backoffSeconds`), parada em 4403, estado "pausado" depois de 10 s e o sinal de reconexão
- [ ] T007 [US2] Em `OccurrencesPage.tsx`: na reconexão, consultar a primeira página e usar `hasNovelties`; mostrar "Atualização automática pausada. Reconectando…"
- [ ] T008 [US2] Rodar o quickstart T6 e T7

## Phase 4: Polish

- [ ] T009 [P] Atualizar README e `docs/planejamento-componentes.md`
- [ ] T010 Registrar o resultado do quickstart no fim deste arquivo
- [ ] T011 Revisão do Felipe
