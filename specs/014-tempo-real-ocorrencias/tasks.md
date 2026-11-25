# Tasks: Aviso de ocorrências novas na tela

**Input**: artefatos em `specs/014-tempo-real-ocorrencias/`
**Prerequisites**: specs 008 e 013 deste repositório; Core da spec 015 (contrato `contracts/websocket.md`)

**Tests**: módulos puros com `node --test` (escrever antes e ver falhar); telas pelo quickstart.

## Phase 1: Foundational

- [X] T001 Escrever `tests/occurrence-stream.test.mjs`: `wsUrl` (http/https, barra final), `authMessage`, `parseServerMessage` (ready, occurrence, inválida), `countsFor` (situação, produto, tipo, status), `noveltyLabel` (1 e N), `backoffSeconds` (1, 2, 4… 30), `hasNovelties` (id novo no topo, total maior, igual)
- [X] T002 Criar `src/features/occurrences/occurrenceStream.ts`

## Phase 2: User Story 1 - Aviso (P1)

- [X] T003 [US1] Criar `useOccurrenceStream.ts`: conexão, `auth` com `getToken`, renovação a cada 50 s, entrega dos avisos ao chamador, fechamento ao desmontar
- [X] T004 [US1] Em `OccurrencesPage.tsx`: `Set` de novidades pelos avisos que contam; aviso "N ocorrências novas · Atualizar" em `aria-live` acima da lista; "Atualizar" volta à página 1 e recarrega; mudar filtros, página ou situação zera
- [X] T005 [US1] Rodar `npm test`, `npm run build` e o quickstart T1 a T5

## Phase 3: User Story 2 - Reconectar e sincronizar (P1)

- [X] T006 [US2] Completar `useOccurrenceStream.ts` com reconexão (`backoffSeconds`), parada em 4403, estado "pausado" depois de 10 s e o sinal de reconexão
- [X] T007 [US2] Em `OccurrencesPage.tsx`: na reconexão, consultar a primeira página e usar `hasNovelties`; mostrar "Atualização automática pausada. Reconectando…"
- [X] T008 [US2] Rodar o quickstart T6 e T7

## Phase 4: Polish

- [X] T009 [P] Atualizar README e `docs/planejamento-componentes.md`
- [X] T010 Registrar o resultado do quickstart no fim deste arquivo
- [ ] T011 Revisão do Felipe

## Resultados (25/11/2026)

- `npm test`: 197 testes, 0 falhas (7 novos em `tests/occurrence-stream.test.mjs`); `npm run build` verde.
- Ajuste fora das tasks: com o seletor de situação (LLT-136) e o de tamanho, o campo de busca ficava espremido em telas médias; agora ele ocupa a linha inteira até haver espaço (`OccurrencesHeader`).

### Roteiro (T1 a T8)

No Chrome, com o ambiente só de teste (Core da branch `LLT-137-atualizacao-em-tempo-real` na porta 8081, login de teste no web na 5174 e o Finder simulado pelas rotas internas com um token gerado na sessão).

| # | Resultado |
|---|---|
| T1 | OK: "1 ocorrência nova · Atualizar" logo depois da entrega |
| T2 | OK: mais duas novas (uma de outro produto) e uma reaberta → "4 ocorrências novas" |
| T3 | OK: "Atualizar" → página 1, total 24 → 27, as novas no topo, aviso some |
| T4 | OK: filtro do produto V7 e ocorrência nova do produto A → nenhum aviso; nova do V7 → "1 ocorrência nova" |
| T5 | OK: situação Arquivadas → nenhum aviso |
| T6 | OK: Core parado → "Atualização automática pausada. Reconectando…" depois de 10 s; Core de volta → reconectou e o aviso de pausa sumiu, sem aviso de novidades |
| T7 | OK: Core parado, ocorrência gravada direto no banco, Core de volta → "Há ocorrências novas · Atualizar"; atualizar mostrou a ocorrência no topo |
| T8 | OK: a conexão ficou aberta além do vencimento do token de teste (5 min) mais a folga de 30 s, sem nenhum fechamento no log do Core (`occurrence.stream.refused` = 0), e os avisos seguintes chegaram: a renovação a cada 50 s funciona |
