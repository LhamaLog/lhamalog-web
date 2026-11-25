# Tasks: Lista e detalhe de ocorrências

**Input**: artefatos em `specs/008-lista-detalhe-ocorrencias/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/core-occurrences.md; Core com a spec 012 (`lhamalog-core/specs/012-consultar-ocorrencias`) e a carga de exemplo

**Tests**: módulos puros com `node --test` (escrever antes e ver falhar); telas pelo [quickstart.md](quickstart.md).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência)
- **[Story]**: história da spec (US1 a US3)

## Phase 1: Setup

- [X] T001 Conferir que o Core local responde `GET /api/occurrences` com a carga de exemplo (quickstart do core, Q1) antes de ligar a tela

---

## Phase 2: Foundational (bloqueia as histórias)

- [X] T002 [P] Criar `src/features/occurrences/types.ts` com os tipos do data-model (`OccurrenceType`, `OccurrenceStatus`, `OccurrenceListItem`, `OccurrencePage`, `OccurrenceDetail`)
- [X] T003 [P] Escrever `tests/occurrences.test.mjs` para `labels.ts`: rótulo e tom de cada tipo e status, rótulo de "Sistema" no autor, rótulos dos atributos (nome conhecido e campo extraído) e texto de dados sensíveis (`true`, `false`, `null`)
- [X] T004 [P] Criar `src/features/occurrences/labels.ts` com os rótulos e tons da tabela do data-model e o mapeamento tipo → `severity` do `SeverityIndicator`
- [X] T005 Ajustar `OccurrenceCard.tsx` e o tipo `OccurrenceItem`: `count`, `status`, `recurring` e `product`; `description` e `tags` opcionais; status e "Recorrente" como `Badge`; contagem e última vez no bloco lateral
- [X] T006 Ajustar `OccurrencesView.tsx`: `panels` opcional (sem painel, a lista ocupa a largura toda) e `emptyState` recebido por propriedade
- [X] T007 Atualizar a demonstração de `src/app/App.tsx` para os tipos novos, mantendo `/componentes` igual ao que é hoje
- [X] T008 Rodar `npm test` e `npm run build`

**Checkpoint**: tipos, rótulos e componentes prontos para dados reais.

---

## Phase 3: User Story 1 - Ver a lista (P1) 🎯 MVP

**Goal**: `/ocorrencias` com a lista do Core, ordem, total, página, tamanho e os estados (FR-001 a FR-005).

**Independent Test**: quickstart O1, O2, O3, O17, O19.

### Tests

- [X] T009 [US1] Em `tests/occurrences.test.mjs`: `readOccurrenceQuery` com valores padrão, `page` e `size` válidos e inválidos (`abc`, `0`, `7`); `writeOccurrenceQuery` omite os padrões; `occurrencesPath` monta `page` e `size`

### Implementation

- [X] T010 [US1] Criar `src/features/occurrences/occurrenceQuery.ts` com `readOccurrenceQuery`, `writeOccurrenceQuery` e `occurrencesPath` (só página e tamanho nesta fase)
- [X] T011 [US1] Em `OccurrencesHeader.tsx`, acrescentar o seletor de tamanho (10, 20, 50) por propriedade, sem mudar o uso atual da demonstração
- [X] T012 [US1] Criar `OccurrencesPage.tsx`: lê a query com `useSearchParams`, consulta com `useApiResource(occurrencesPath(...))`, converte itens para o `OccurrenceCard` (datas no fuso e idioma do perfil), mostra `LoadingState`, `ErrorState` com "Tentar de novo" (`reload`), vazio "Nenhuma ocorrência por aqui ainda" (sem paginação; com página além da última, o vazio mantém a paginação para voltar) e a `Pagination` com `itemLabel="ocorrências"`; mudar o tamanho volta à página 1
- [X] T013 [US1] Em `AppRoutes.tsx`, acrescentar `/ocorrencias` e `/ocorrencias/:id` com `ProtectedRoute` e `CompanyWorkspace`; em `CompanyWorkspace.tsx`, tratar o item `occurrences` (navegar, marcar ativo, caminho "Ocorrências") e renderizar a `OccurrencesPage`
- [X] T014 [US1] Rodar `npm test`, `npm run build` e o quickstart O1, O2, O3, O17 e O19

**Checkpoint**: lista paginada real.

---

## Phase 4: User Story 2 - Filtrar e buscar (P1)

**Goal**: busca com pausa, painel de filtros, contagem, limpar, filtros no endereço (FR-006 a FR-009, FR-014, FR-015).

**Independent Test**: quickstart O4 a O10, O16, O18.

### Tests

- [X] T015 [US2] Em `tests/occurrences.test.mjs`: leitura de `type`, `status`, `productId` repetidos (desconhecidos e repetidos descartados), `periodo` válido e inválido, `q` cortado em 200; `occurrencesPath` com todos os filtros e `from` calculado a partir de um relógio fixo para `24h`, `7d` e `30d`, sem `from` em `all`; `activeFilterCount` e `clearFilters`

### Implementation

- [X] T016 [US2] Completar `occurrenceQuery.ts` com tipos, status, produtos, período, busca, `activeFilterCount` e `clearFilters`
- [X] T017 [US2] Criar `OccurrenceFilters.tsx`: rascunho local; tipos e status com `Checkbox`; produtos de `GET /api/products` + `?archived=true` com `Checkbox` ("Todos os produtos" quando nada marcado); período com `Select`; "Aplicar filtros" grava no endereço com página 1; fechar sem aplicar descarta; em tela estreita ocupa a tela toda; foco preso no painel e `Esc` fecha
- [X] T018 [US2] Em `OccurrencesPage.tsx`: busca com estado local e pausa de 400 ms antes de gravar `q` (página 1); `FilterButton` com `activeFilterCount`; vazio com filtros ("Nenhuma ocorrência encontrada para os filtros aplicados" + "Limpar filtros", sem paginação); 404 de produto do filtro com a mensagem do Core e "Limpar filtros"
- [X] T019 [US2] Rodar `npm test`, `npm run build` e o quickstart O4 a O10, O16, O18 e O20 (painel)

**Checkpoint**: LLT-204 completa no web.

---

## Phase 5: User Story 3 - Ver o detalhe (P1)

**Goal**: `/ocorrencias/:id` com todas as seções, copiar, 404 e voltar com os filtros (FR-010 a FR-013).

**Independent Test**: quickstart O11 a O15, O20.

### Implementation

- [X] T020 [US3] Em `OccurrencesPage.tsx`, abrir o item com `navigate('/ocorrencias/' + id, { state: { from: location.search } })`
- [X] T021 [US3] Criar `OccurrenceDetailPage.tsx`: `useApiResource('/api/occurrences/' + id)`; cabeçalho com `SeverityIndicator`, título, id com copiar, produto, primeira e última vez; "Dados da ocorrência" (status, recorrente, contagem, dados sensíveis mascarados quando não for `null`, atributos em `<dl>` com os rótulos do data-model); "Mensagem e contexto" (resumo e exemplos, que são textos sem data, em `<pre>` com rolagem horizontal e copiar); "Histórico de status" (cronológico, autor "Sistema" ou id); avisos de seção vazia; texto do log sempre como texto
- [X] T022 [US3] Tratar no detalhe o 404 ("Ocorrência não encontrada ou sem acesso" + voltar) e as demais falhas (`ErrorState` com "Tentar de novo"); "Voltar para ocorrências" usa `location.state.from` ou `/ocorrencias`
- [X] T023 [US3] Em `CompanyWorkspace.tsx`, caminho "Ocorrências › Detalhe da ocorrência" na rota do detalhe e renderização da `OccurrenceDetailPage`
- [X] T024 [US3] Rodar `npm test`, `npm run build` e o quickstart O11 a O15 e O20 (detalhe)

**Checkpoint**: LLT-203, LLT-204 e LLT-205 completas no web.

---

## Phase 6: Polish

- [X] T025 [P] Atualizar o `README.md` (tela de Ocorrências e dependência da carga de exemplo do Core) e o `docs/planejamento-componentes.md` (componentes de ocorrências agora ligados ao Core)
- [X] T026 Rodar o quickstart completo (O1 a O20) e registrar o resultado no fim deste arquivo
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

## Resultados

### Implementação (25/11/2026)

- `npm test`: 183 testes, 0 falhas (23 novos em `tests/occurrences.test.mjs`: rótulos, `occurrenceQuery`, conversão para o cartão, datas no fuso do perfil e histórico).
- `npm run build`: verde (o aviso de chunk acima de 500 kB já existia).
- Fora do plano, por necessidade:
  - `useCoreResource.ts` em `features/occurrences`: igual ao `useApiResource`, mas guarda o status HTTP da falha, para o 404 do detalhe e o 404 de produto do filtro terem textos próprios. O `useApiResource` compartilhado não mudou.
  - `occurrenceView.ts`: conversão do item do Core para o `OccurrenceCard` e datas no idioma e fuso do perfil, testáveis com `node --test`.
  - `App.tsx`: a busca da demonstração passou a aceitar `description` e `tags` opcionais; `/componentes` continua igual.
  - Trocar de empresa volta para `/ocorrencias` sem a query (`afterSelectOrganizationUrl`), o que limpa os filtros de produto da empresa anterior (FR-015).
- O item `occurrences` do menu não entra no `hiddenItems`: todo papel abre a tela e o Core limita os produtos.

### Roteiro do quickstart (T026), 25/11/2026

Rodado pelo Chrome (Claude in Chrome) num ambiente **só de teste**, porque o login da Clerk não pode ser feito pelo agente: um emissor de tokens local (`127.0.0.1:9911`, JWKS e tokens no formato v2 da Clerk), um Core de teste na porta 8081 com `CLERK_ISSUER` apontando para ele (mesmo Mongo e Redis locais, `OCCURRENCE_SAMPLE_DATA=true`) e o web na porta 5174 com o `@clerk/react` trocado por um stub (identidades fixas: admin e membro da organização de desenvolvimento `org_3MFF…sgq7` e admin de outra organização). Nada disso está nos repositórios; os arquivos ficaram na pasta temporária da sessão. O Felipe valida depois com a Clerk de verdade, na porta 5173.

| # | Resultado |
|---|---|
| O1 | OK: menu e caminho "Ocorrências", 20 itens, "Mostrando 1–20 de 24", lista pronta em 422 ms |
| O2 | OK: tipo com cor e rótulo, título, produto, contagem, status, "Recorrente", última vez no fuso do perfil |
| O3 | OK: página 2 com 21–24; tamanho 10 volta à página 1 com 10 itens |
| O4 | OK: "timeout" digitado letra a letra gera uma só consulta, página 1, 2 itens |
| O5 | OK: Erro + Aberta + 1 produto + 7 dias → 2 itens, botão "4 ativos" |
| O6 | OK: produto + busca, página 2 com 11–12 de 12, filtros mantidos |
| O7 | OK: abrir o endereço com filtros, busca e página restaura o mesmo estado |
| O8 | OK: mudar o rascunho e fechar com Esc não muda o endereço nem a lista; ao reabrir, o rascunho foi descartado |
| O9 | OK: Erro + Fechada + 24 horas → "Nenhuma ocorrência encontrada para os filtros aplicados", sem paginação |
| O10 | OK: "Limpar filtros" volta à página 1, busca vazia, "0 ativos" (o tamanho escolhido fica, como no data-model) |
| O11 | OK: cabeçalho, dados, dados sensíveis, atributos (Host, Serviço, Trace ID, `http.route`), resumo ausente avisado, exemplos e histórico; sem título mostra a mensagem da assinatura |
| O12 | Parcial: os botões passam o texto certo (id e exemplos) ao `navigator.clipboard.writeText`; a confirmação "Copiado" e a área de transferência não puderam ser conferidas na automação (janela sem foco). Conferir à mão |
| O13 | OK: "Voltar para ocorrências" devolve a lista com os mesmos filtros e página |
| O14 | OK: `/ocorrencias/nao-existe` → "Ocorrência não encontrada ou sem acesso", sessão mantida |
| O15 | OK: o link de um detalhe da empresa A aberto pela outra empresa dá a mesma mensagem |
| O16 | OK: o membro vê só "Produto do membro (V7)" na lista e no filtro (e o menu Equipe some) |
| O17 | OK: com o Core parado aparece o erro com "Tentar novamente"; com o Core de volta, a lista carrega. O aviso de acesso da LLT-120 tem o próprio botão |
| O18 | OK no stub: trocar de empresa leva a `/ocorrencias` sem o filtro de produto, com o vazio sem filtros. Com a Clerk real depende do `afterSelectOrganizationUrl` (conferir à mão) |
| O19 | OK: `?type=XYZ&page=abc&size=7` mostra a lista padrão, sem erro |
| O20 | OK em iframe de 390 px (a janela do Chrome não encolheu): lista e detalhe em uma coluna, sem rolagem horizontal da página; exemplos com rolagem própria; painel de filtros em tela cheia |

Correções feitas durante o roteiro: textos com acentuação quebrada em `OccurrencesPage.tsx` (regravado com a codificação errada); "Info" → "Informação" no indicador de tipo (FR-002), com rótulo opcional no `SeverityIndicator` e largura pelo conteúdo, sem mudar a demonstração.

### Pendente para o Felipe

- Repetir com a Clerk real (porta 5173): O1, O12 (copiar) e O18 (troca de empresa pelo `OrganizationSwitcher`). A sessão do Chrome na 5173 estava numa organização sem Tenant e terminou deslogada.
