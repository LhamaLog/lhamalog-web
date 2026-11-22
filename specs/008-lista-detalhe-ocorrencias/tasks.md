# Tasks: Lista e detalhe de ocorrências

**Input**: artefatos em `specs/008-lista-detalhe-ocorrencias/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/core-occurrences.md; Core com a spec 012 (`lhamalog-core/specs/012-consultar-ocorrencias`) e a carga de exemplo

**Tests**: módulos puros com `node --test` (escrever antes e ver falhar); telas pelo [quickstart.md](quickstart.md).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência)
- **[Story]**: história da spec (US1 a US3)

## Phase 1: Setup

- [ ] T001 Conferir que o Core local responde `GET /api/occurrences` com a carga de exemplo (quickstart do core, Q1) antes de ligar a tela

---

## Phase 2: Foundational (bloqueia as histórias)

- [ ] T002 [P] Criar `src/features/occurrences/types.ts` com os tipos do data-model (`OccurrenceType`, `OccurrenceStatus`, `OccurrenceListItem`, `OccurrencePage`, `OccurrenceDetail`)
- [ ] T003 [P] Escrever `tests/occurrences.test.mjs` para `labels.ts`: rótulo e tom de cada tipo e status, rótulo de "Sistema" no autor, rótulos dos atributos (nome conhecido e campo extraído) e texto de dados sensíveis (`true`, `false`, `null`)
- [ ] T004 [P] Criar `src/features/occurrences/labels.ts` com os rótulos e tons da tabela do data-model e o mapeamento tipo → `severity` do `SeverityIndicator`
- [ ] T005 Ajustar `OccurrenceCard.tsx` e o tipo `OccurrenceItem`: `count`, `status`, `recurring` e `product`; `description` e `tags` opcionais; status e "Recorrente" como `Badge`; contagem e última vez no bloco lateral
- [ ] T006 Ajustar `OccurrencesView.tsx`: `panels` opcional (sem painel, a lista ocupa a largura toda) e `emptyState` recebido por propriedade
- [ ] T007 Atualizar a demonstração de `src/app/App.tsx` para os tipos novos, mantendo `/componentes` igual ao que é hoje
- [ ] T008 Rodar `npm test` e `npm run build`

**Checkpoint**: tipos, rótulos e componentes prontos para dados reais.

---

## Phase 3: User Story 1 - Ver a lista (P1) 🎯 MVP

**Goal**: `/ocorrencias` com a lista do Core, ordem, total, página, tamanho e os estados (FR-001 a FR-005).

**Independent Test**: quickstart O1, O2, O3, O17, O19.

### Tests

- [ ] T009 [US1] Em `tests/occurrences.test.mjs`: `readOccurrenceQuery` com valores padrão, `page` e `size` válidos e inválidos (`abc`, `0`, `7`); `writeOccurrenceQuery` omite os padrões; `occurrencesPath` monta `page` e `size`

### Implementation

- [ ] T010 [US1] Criar `src/features/occurrences/occurrenceQuery.ts` com `readOccurrenceQuery`, `writeOccurrenceQuery` e `occurrencesPath` (só página e tamanho nesta fase)
- [ ] T011 [US1] Em `OccurrencesHeader.tsx`, acrescentar o seletor de tamanho (10, 20, 50) por propriedade, sem mudar o uso atual da demonstração
- [ ] T012 [US1] Criar `OccurrencesPage.tsx`: lê a query com `useSearchParams`, consulta com `useApiResource(occurrencesPath(...))`, converte itens para o `OccurrenceCard` (datas no fuso e idioma do perfil), mostra `LoadingState`, `ErrorState` com "Tentar de novo" (`reload`), vazio "Nenhuma ocorrência por aqui ainda" (sem paginação; com página além da última, o vazio mantém a paginação para voltar) e a `Pagination` com `itemLabel="ocorrências"`; mudar o tamanho volta à página 1
- [ ] T013 [US1] Em `AppRoutes.tsx`, acrescentar `/ocorrencias` e `/ocorrencias/:id` com `ProtectedRoute` e `CompanyWorkspace`; em `CompanyWorkspace.tsx`, tratar o item `occurrences` (navegar, marcar ativo, caminho "Ocorrências") e renderizar a `OccurrencesPage`
- [ ] T014 [US1] Rodar `npm test`, `npm run build` e o quickstart O1, O2, O3, O17 e O19

**Checkpoint**: lista paginada real.

---

## Phase 4: User Story 2 - Filtrar e buscar (P1)

**Goal**: busca com pausa, painel de filtros, contagem, limpar, filtros no endereço (FR-006 a FR-009, FR-014, FR-015).

**Independent Test**: quickstart O4 a O10, O16, O18.

### Tests

- [ ] T015 [US2] Em `tests/occurrences.test.mjs`: leitura de `type`, `status`, `productId` repetidos (desconhecidos e repetidos descartados), `periodo` válido e inválido, `q` cortado em 200; `occurrencesPath` com todos os filtros e `from` calculado a partir de um relógio fixo para `24h`, `7d` e `30d`, sem `from` em `all`; `activeFilterCount` e `clearFilters`

### Implementation

- [ ] T016 [US2] Completar `occurrenceQuery.ts` com tipos, status, produtos, período, busca, `activeFilterCount` e `clearFilters`
- [ ] T017 [US2] Criar `OccurrenceFilters.tsx`: rascunho local; tipos e status com `Checkbox`; produtos de `GET /api/products` + `?archived=true` com `Checkbox` ("Todos os produtos" quando nada marcado); período com `Select`; "Aplicar filtros" grava no endereço com página 1; fechar sem aplicar descarta; em tela estreita ocupa a tela toda; foco preso no painel e `Esc` fecha
- [ ] T018 [US2] Em `OccurrencesPage.tsx`: busca com estado local e pausa de 400 ms antes de gravar `q` (página 1); `FilterButton` com `activeFilterCount`; vazio com filtros ("Nenhuma ocorrência encontrada para os filtros aplicados" + "Limpar filtros", sem paginação); 404 de produto do filtro com a mensagem do Core e "Limpar filtros"
- [ ] T019 [US2] Rodar `npm test`, `npm run build` e o quickstart O4 a O10, O16, O18 e O20 (painel)

**Checkpoint**: LLT-204 completa no web.

---

## Phase 5: User Story 3 - Ver o detalhe (P1)

**Goal**: `/ocorrencias/:id` com todas as seções, copiar, 404 e voltar com os filtros (FR-010 a FR-013).

**Independent Test**: quickstart O11 a O15, O20.

### Implementation

- [ ] T020 [US3] Em `OccurrencesPage.tsx`, abrir o item com `navigate('/ocorrencias/' + id, { state: { from: location.search } })`
- [ ] T021 [US3] Criar `OccurrenceDetailPage.tsx`: `useApiResource('/api/occurrences/' + id)`; cabeçalho com `SeverityIndicator`, título, id com copiar, produto, primeira e última vez; "Dados da ocorrência" (status, recorrente, contagem, dados sensíveis mascarados quando não for `null`, atributos em `<dl>` com os rótulos do data-model); "Mensagem e contexto" (resumo e exemplos, que são textos sem data, em `<pre>` com rolagem horizontal e copiar); "Histórico de status" (cronológico, autor "Sistema" ou id); avisos de seção vazia; texto do log sempre como texto
- [ ] T022 [US3] Tratar no detalhe o 404 ("Ocorrência não encontrada ou sem acesso" + voltar) e as demais falhas (`ErrorState` com "Tentar de novo"); "Voltar para ocorrências" usa `location.state.from` ou `/ocorrencias`
- [ ] T023 [US3] Em `CompanyWorkspace.tsx`, caminho "Ocorrências › Detalhe da ocorrência" na rota do detalhe e renderização da `OccurrenceDetailPage`
- [ ] T024 [US3] Rodar `npm test`, `npm run build` e o quickstart O11 a O15 e O20 (detalhe)

**Checkpoint**: LLT-203, LLT-204 e LLT-205 completas no web.

---

## Phase 6: Polish

- [ ] T025 [P] Atualizar o `README.md` (tela de Ocorrências e dependência da carga de exemplo do Core) e o `docs/planejamento-componentes.md` (componentes de ocorrências agora ligados ao Core)
- [ ] T026 Rodar o quickstart completo (O1 a O20) e registrar o resultado no fim deste arquivo
- [ ] T027 Revisão do Felipe antes dos commits

---

## Dependencies & Execution Order

- Depende do Core: US1 a US3 da spec 012 do core e a carga de exemplo (US4 de lá) para o quickstart.
- Setup → Foundational → US1 → US2 → US3. A US3 só depende da US1 (rota e workspace), então pode vir antes da US2 se for útil.
- Em cada fase: testes do módulo puro primeiro, depois a tela, depois build e quickstart.

### Parallel Opportunities

- T002, T003 e T004 em paralelo.
- T025 em paralelo com T026.

## Implementation Strategy

1. MVP: Foundational + US1 → lista real paginada.
2. US2 (filtros) e US3 (detalhe) completam a Feature LLT-135.
3. Polish: documentação, roteiro completo e revisão.
