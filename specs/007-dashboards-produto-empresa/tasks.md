# Tasks: Dashboards por produto e da empresa (LLT-145)

**Input**: [spec.md](spec.md), [plan.md](plan.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/dashboard-metrics.md](contracts/dashboard-metrics.md), [quickstart.md](quickstart.md)

**Testes**: regras puras com `node --test` (research R11). UI/Clerk pelo quickstart. Cada fase termina com `npm test` e `npm run build` verdes e **parada para revisão** (`docs/instrucoes-agentes.md`). Nenhuma task de Git.

**Tamanho**: cada tarefa traz uma estimativa de tamanho `(~N linhas)`, só como referência de esforço. A implementação é feita pelo agente de desenvolvimento (100%). A fase Core (repositório `lhamalog-core`, spec 011, branch `LLT-145-consulta-metricas-dashboard`) não é executada neste repo; **nesta entrega** = multi-repositório (Web 007 + Core 011).

**Setup scripts**: `setup-tasks.ps1 -Json` depende de PyYAML (mesmo `yaml_missing` do plan); resolução manual via `.specify/feature.json` + `.specify/templates/tasks-template.md`. Docs disponíveis: `research.md`, `data-model.md`, `contracts/`, `quickstart.md`.

**Base**: branch `LLT-145-dashboards-produto-empresa`; baseline 49 testes verdes em 17/11.

## Phase 1: Setup

**Purpose**: baseline e esqueleto da feature no Web.

- [x] T001 (~8 linhas) Rodar `npm test` e `npm run build` na base e anotar o total de testes (comparar no polish; referência 17/11: 49) — **baseline 18/11: 49 testes, build OK**
- [x] T002 (~35 linhas) Criar esqueleto `src/features/dashboard/` (`components/`, `model/`, `contract/`, `messages.ts` vazio de rotas) conforme [plan.md](plan.md)

**Checkpoint**: `npm test` e `npm run build` verdes. Parar para revisão.

---

## Phase 2: Foundational (bloqueia as User Stories)

**Purpose**: contrato, cliente HTTP, regras de negócio puras e testes — sem telas completas ainda.

**⚠️ CRITICAL**: nenhuma User Story começa antes desta fase.

- [x] T003 [P] (~70 linhas) Espelhar tipos de leitura de [data-model.md](data-model.md) em `src/features/dashboard/model/types.ts` (filtro, período, métricas, série, ranking, selo, estados)
- [x] T004 [P] (~120 linhas) Parsers do contrato em `src/features/dashboard/contract/parseDashboardMetrics.ts` a partir de [contracts/dashboard-metrics.md](contracts/dashboard-metrics.md) (rejeitar corpo inválido / enum de severidade desconhecido — FR-011: Web só consome `ERROR`/`WARNING`/`INFO` já normalizados pelo Core)
- [x] T005 (~45 linhas) Em `src/shared/services/api.ts` (e uso via `useApi.ts`): gerar e enviar `X-Correlation-Id` em toda requisição; expor o id no erro para a UI (FR-016); sem mudar classificação 401/403 da spec 006
- [x] T006 (~180 linhas) Em `src/features/dashboard/model/filterPeriod.ts`: presets `24h`/`7d`/`30d`/`personalizado`; padrão `7d` e tipo “todos”; na 1ª carga teto seguro de 7 dias (FREE) até a 1ª resposta; após resposta de métricas (produto/empresa) atualizar teto para `min(30, retentionDays)`; se filtro da URL exceder o teto conhecido depois da resposta → inválido (mensagem) e não aplicar; validação de intervalo personalizado (`from < to`, duração ≤ máximo); mensagens de filtro inválido (FR-003, FR-004)
- [x] T007 (~120 linhas) Em `src/features/dashboard/model/timezoneBuckets.ts`: bucket `hour` se duração ≤ 48h senão `day`; rótulos/`Intl` no fuso do perfil; fallback `America/Sao_Paulo` (FR-006)
- [x] T008 (~130 linhas) Em `src/features/dashboard/model/accessVisibility.ts`: DONO = ADMIN (todos os produtos); MEMBRO só `AcessoProduto`; MEMBRO sem produtos → estado vazio com aviso; sem permissão empresarial → `forbidden`; **sem cache** de permissão (FR-009, FR-010, LLT-171). **Portão**: revisão do Felipe (Clerk/papéis) antes de fechar a fase
- [x] T009 (~150 linhas) Em `src/features/dashboard/model/companyImpact.ts`: totais consolidados; ranking “mais impactados”; selos Crítico/Atenção/Estável pela regra R9 APROVADA (`p = error/max(logs,1)`: ≥0,10 / [0,02,0,10) / <0,02 incl. sem logs) — Session 2026-11-18
- [x] T010 [P] (~160 linhas) Testes em `tests/dashboard-filters.test.mjs` cobrindo presets, teto seguro inicial de 7 dias, atualização para `min(30, retentionDays)` após resposta, URL que excede o teto conhecido (inválido + mensagem), personalizado inválido e mensagens de T006
- [x] T011 [P] (~100 linhas) Testes em `tests/dashboard-timezone-grouping.test.mjs` para T007 (≤48h hora, >48h dia, fallback de fuso)
- [x] T012 [P] (~110 linhas) Testes em `tests/dashboard-access.test.mjs` para T008 (DONO/ADMIN iguais, MEMBRO subset, MEMBRO vazio, forbidden, sem cache). **Portão**: revisão do Felipe (Clerk/papéis) antes de fechar a fase
- [x] T013 [P] (~120 linhas) Testes em `tests/dashboard-company-derived.test.mjs` para T009 (totais, ordem do ranking, limiares APROVADOS de selo: ≥10% / [2%,10%) / <2%)
- [x] T014 [P] (~80 linhas) Testes em `tests/dashboard-contract.test.mjs` para parsers T004 (rejeitar severidade desconhecida — cobertura FR-011) + presença/eco conceitual de `X-Correlation-Id` alinhado a T005
- [x] T015 (~90 linhas) Em `src/features/dashboard/model/applyDashboardFilters.ts`: aplicar só filtro válido; inválido não altera o recorte aplicado; serializar/deserializar query (`produto`, `periodo`, `de`, `ate`, `tipo`) conforme research R2

**Checkpoint**: `npm test` e `npm run build` verdes. **Portão**: revisão do Felipe (Clerk/papéis) nas tasks T008/T012 antes de fechar a fase. Parar para revisão.

---

## Phase 3: User Story 1 — Dashboard por produto (P1) 🎯 MVP

**Goal**: abrir `/dashboard`, escolher produto, ver cartões, gráfico SVG, ranking e “dados consolidados até”, no fuso do perfil.

**Independent Test**: E1–E3 do [quickstart.md](quickstart.md).

- [x] T016 [P] [US1] (~80 linhas) Rotas `/dashboard` (e preparação de `/dashboard/empresa`) em `src/app/routes/AppRoutes.tsx` + integração no shell (`CompanyWorkspace` ou layout dedicado) com `ProtectedRoute`
- [x] T017 [P] [US1] (~30 linhas) Em `src/app/layouts/Navbar.tsx` / shell: item `dashboard` navega para `/dashboard` e destaca ativo
- [x] T018 [P] [US1] (~130 linhas) Extender SVG próprio em `src/shared/ui/TimeSeriesChart.tsx` (séries ERROR/WARNING; acessível; sem lib externa) a partir de Sparkline/MetricCard
- [x] T019 [US1] (~140 linhas) `src/features/dashboard/components/ProductDashboardPage.tsx`: estados loading/empty/ready/error; cinco cartões (volume vs `volumeIngestaoBytes`); ranking via `RankingList`; MUST exibir “Dados consolidados até …” no fuso do perfil quando `dadosConsolidadosAte` vier do Core (ausência não bloqueia métricas)
- [x] T020 [US1] (~90 linhas) Cliente de leitura `src/features/dashboard/api/fetchProductMetrics.ts` (+ hook com `useApi`/`useApiResource`): `GET /api/dashboard/products/{id}/metrics` com `X-Correlation-Id`; descartar resposta se `orgId` mudou
- [x] T021 [US1] (~50 linhas) `src/features/dashboard/messages.ts`: strings pt-BR/en dos cartões, vazio (“nenhum resultado encontrado”), erro com correlacao
- [x] T022 [US1] (~80 linhas) Compor gráfico/cartões na página US1 usando T007 (bucket) e parsers T004; MEMBRO sem produtos usa estado de T008 (aviso, sem erro)

**Checkpoint**: `npm test` e `npm run build` verdes; E1–E3. Parar para revisão.

---

## Phase 4: User Story 2 — Filtrar dashboard por produto (P1)

**Goal**: filtros produto/período/tipo na URL; inválido não aplica; atualização sob demanda.

**Independent Test**: E4–E5 do quickstart.

- [x] T023 [P] [US2] (~100 linhas) UI de filtros em `src/features/dashboard/components/DashboardFilters.tsx` (controles visuais: select produto, presets, personalizado, tipo, botões Aplicar/Atualizar) sem embutir as regras de T006
- [x] T024 [US2] (~90 linhas) Ligar `DashboardFilters` + URL em `ProductDashboardPage` via `applyDashboardFilters` (T015/T006): rascunho ≠ aplicado até Aplicar/Atualizar; mensagens de inválido; sem WebSocket (FR-005)
- [x] T025 [US2] (~40 linhas) Estado de erro recuperável na US2 exibe `X-Correlation-Id` e “tentar novamente” (`ErrorState`)

**Checkpoint**: `npm test` e `npm run build` verdes; E4–E5. Parar para revisão.

---

## Phase 5: User Story 3 — Dashboard da empresa (P1)

**Goal**: visão multiproduto com cartões, gráfico por produto, lista com selos e tabela; permissões.

**Independent Test**: E6–E9 do quickstart.

- [x] T026 [P] [US3] (~150 linhas) `src/features/dashboard/components/CompanyDashboardPage.tsx`: título/subtítulo; quatro cartões (Alertas = WARNING); tabela por produto; MUST exibir “Dados consolidados até …” no fuso do perfil quando `dadosConsolidadosAte` vier do Core (ausência não bloqueia métricas); **sem** Exportar e **sem** Desempenho
- [x] T027 [P] [US3] (~90 linhas) Cliente `src/features/dashboard/api/fetchCompanyMetrics.ts` para `GET /api/dashboard/company/metrics` com correlacao e descarte em troca de empresa
- [x] T028 [US3] (~80 linhas) Gráfico “Evolução de erros por produto” reutilizando `TimeSeriesChart` + `seriesByProduct`
- [x] T029 [US3] (~70 linhas) Aplicar `companyImpact` (T009) e `accessVisibility` (T008) na montagem da lista “Produtos mais impactados” (selos) e dos totais exibidos; estados `forbidden` e MEMBRO vazio. **Portão**: revisão do Felipe (Clerk/papéis) antes de fechar a fase
- [x] T030 [US3] (~45 linhas) UI dos estados `forbidden` e aviso MEMBRO sem produtos em componentes dedicados sob `src/features/dashboard/components/`. **Portão**: revisão do Felipe (Clerk/papéis) antes de fechar a fase

**Checkpoint**: `npm test` e `npm run build` verdes; E6–E9. **Portão**: revisão do Felipe (Clerk/papéis) nas tasks T029/T030 antes de fechar a fase. Parar para revisão.

---

## Phase 6: User Story 4 — Filtrar dashboard da empresa (P2)

**Goal**: filtro multiproduto + período + tipo na URL do empresarial.

**Independent Test**: E10 do quickstart.

- [x] T031 [P] [US4] (~80 linhas) Estender `DashboardFilters` para modo empresa (multi-produto, padrão “Todos os produtos autorizados”)
- [x] T032 [US4] (~80 linhas) Regras de apply/URL do empresarial em `applyDashboardFilters` / página empresa: subset ⊆ autorizados; inválido não aplica; limpar → todos autorizados (USID_036); reutilizar teto de período T006

**Checkpoint**: `npm test` e `npm run build` verdes; E10. Parar para revisão.

---

## Phase 7: User Story 5 — Placeholder de Ocorrências no gráfico (P3) 🎯 MVP

**Goal**: gráfico pronto para série opcional de ocorrências; estado pendente com mensagem “não implementado ainda”; sem lógica de comparação.

**Independent Test**: mensagem “não implementado ainda” quando não há dados de ocorrências (T034). Comparação real SC-004 só após LLT-104.

- [x] T033 [US5] (~50 linhas) Preparar tipos/props do `TimeSeriesChart` e da página para a série opcional de ocorrências + estado pendente com a mensagem “não implementado ainda” (contrato: `occurrences` opcional por bucket; ausente = pendente). Sem lógica de comparação com lista de Ocorrências
- [x] T034 [US5] (~25 linhas) Teste em `tests/dashboard-occurrences-pending.test.mjs` que garante a mensagem “não implementado ainda” quando não há dados de ocorrências — teste puro do model/mensagens com `node --test`

**Checkpoint**: `npm test` e `npm run build` verdes; placeholder visível sem dados de ocorrências. Parar para revisão.

---

## Phase 8: Polish (Web)

**Purpose**: documentação e fechamento da baseline no Web.

- [x] T035 [P] (~25 linhas) Atualizar menção no `README.md` (seção de rotas/monitoramento) apontando `/dashboard` e `/dashboard/empresa` e a spec 007 — sem expandir escopo
- [x] T036 (~30 linhas) Conferir E11–E15 do quickstart (correlacao, 5xx sem logout, 401 spec 006, troca de empresa, placeholder Ocorrências) e anotar resultado no PR quando houver — **parcial**: E15 coberto por teste automático; E11–E14 manuais dependem de Clerk/Core reais (não executados nesta sessão)
- [x] T037 (~15 linhas) `npm test` e `npm run build` finais; comparar com T001 (só entram testes novos desta feature) — **final: 72 testes (49 baseline + 23 novos), build OK** (aviso Vite chunk >500 kB)

**Checkpoint**: verdes; parar para revisão do MVP Web.

---

## Phase 9: Core (`lhamalog-core`, spec 011) — fora deste repositório

**Purpose**: outra metade desta entrega multi-repositório — o que o Core precisa entregar para o Web. **Não executar aqui.** Criar/rodar só em `lhamalog-core/specs/011-consulta-metricas-dashboard` (branch `LLT-145-consulta-metricas-dashboard`) após autorização.

- [ ] T038 [P] (~100 linhas) *(core)* Controladores `GET .../products/{id}/metrics` e `GET .../company/metrics` conforme [contracts/dashboard-metrics.md](contracts/dashboard-metrics.md) (LLT-159)
- [ ] T039 [P] (~120 linhas) *(core)* Adapter de contagem no OpenObserve (por severidade, produto, serviço, período)
- [ ] T040 [P] (~80 linhas) *(core)* Leitura dos fatos de uso (`/internal/usage-facts`) para volume/traces aceitos
- [ ] T041 (~200 linhas) *(core)* Job SSID_011 / ADR_166: agregados por tenant, produto, severidade, serviço e hora a partir de **logs** (não Ocorrências no MVP); propriedade de configuração da frequência (cron ou intervalo) com **padrão a cada 1h**
- [ ] T042 (~150 linhas) *(core)* Serviço de consulta híbrida: agregados consolidados + contagem na hora do intervalo aberto; preencher `dadosConsolidadosAte`
- [ ] T043 (~120 linhas) *(core)* Regras de acesso no Core: tenant do token; DONO/ADMIN todos; MEMBRO AcessoProduto; cross-tenant 403/404 (LLT-158). **Portão**: revisão do Felipe (Clerk/papéis) antes de fechar a fase
- [ ] T044 [P] (~60 linhas) *(core)* Documentar contrato LLT-159 na spec 011 do Core (espelho do markdown do Web)
- [ ] T045 [P] (~110 linhas) *(core)* Plumbing de query/count OpenObserve + eco de `X-Correlation-Id` nos filtros HTTP; mapeamento ADR_170 (erro→ERROR, aviso→WARNING, info→INFO) antes de devolver enums ao Web
- [ ] T046 (~100 linhas) *(core)* Testes de autorização/isolamento (DONO/ADMIN/MEMBRO/outro tenant). **Portão**: revisão do Felipe (Clerk/papéis) antes de fechar a fase
- [ ] T047 (~120 linhas) *(core)* Testes das regras do job e do merge híbrido (consolidado vs intervalo aberto)
- [ ] T048 [P] (~100 linhas) *(core)* Testes de API/contrato dos dois `GET` (400/401/403/404 e payload 200)

**Checkpoint (no Core)**: suíte do Core verde; **Portão**: revisão do Felipe (Clerk/papéis) nas tasks T043/T046 antes de fechar a fase. Só então apontar o Web ao endpoint real no quickstart.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup → Foundational → US1 → US2 → US3 → US4 → US5 (placeholder) → Polish** (Web), com parada em cada checkpoint.
- **US5** entra no MVP (Phase 7): placeholder de Ocorrências; comparação real SC-004 só após LLT-104.
- **Phase 9 (Core)** é paralela em outro repo; o Web pode desenvolver com mock até T038–T048 existirem.

### User Story Dependencies

- **US1**: após Foundational.
- **US2**: após US1 (reutiliza página/filtros).
- **US3**: após Foundational (pode parallelizar com US1/US2 se staffed; na prática após US1 para SVG/rotas).
- **US4**: após US3.
- **US5**: após US1 (reutiliza `TimeSeriesChart`/página); no MVP como placeholder; SC-004 real após LLT-104.

### Parallel Opportunities

- Foundational: T003/T004 em paralelo; T006–T009 em paralelo após tipos; T010–T014 em paralelo após as regras.
- US1: T016/T017/T018 em paralelo.
- Core: T038–T040, T044–T045, T048 em paralelo após o contrato; T041–T043 sequenciais entre si o mínimo necessário.

---

## Parallel Example: Foundational

```text
Task: T003 types
Task: T004 parsers
# depois das regras de negócio:
Task: T010 filter tests
Task: T011 timezone tests
Task: T012 access tests
Task: T013 company-derived tests
Task: T014 contract tests
```

---

## Implementation Strategy

### MVP First (Web)

1. Setup + Foundational  
2. US1 (dashboard por produto) → demo  
3. US2 (filtros) → demo  
4. US3 + US4 (empresa) → demo  
5. US5 (placeholder de Ocorrências no gráfico) → demo  
6. Polish  

### Core

Entregar Phase 9 na spec 011 do `lhamalog-core` (branch `LLT-145-consulta-metricas-dashboard`; agente de desenvolvimento — 100%). **Portão**: revisão do Felipe (Clerk/papéis) antes de fechar a fase (T043/T046). Web permanece testável com mock.

### Commits

Nenhuma task de Git. Commits `LLT-145: descricao` só com OK explícito do Michel; merge da Development sem rebase.

---

## Resumo de tamanho (linhas estimadas)

| Escopo | Tarefas | Linhas estimadas |
|---|---|---:|
| **Web (MVP, Phases 1–8)** | T001–T037 | **~3088** |
| **Core (Phase 9, outro repositório)** | T038–T048 | ~1260 |

### Portões

- Nenhuma task de Git.
- Nenhuma dependência npm nova.
- **Portão**: revisão do Felipe (Clerk/papéis) antes de fechar as fases Foundational (T008/T012), US3 (T029/T030) e Core (T043/T046).
