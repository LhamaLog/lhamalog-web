# Tasks: Tela de planos e contratação (Asaas simulado)

**Input**: Design documents from `/specs/007-tela-planos-contratacao/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Incluídos para os módulos puros (`node --test`); a tela é validada pelo quickstart.

**Organization**: Tasks grouped by user story.

## Format: `[ID] [P?] [Story] Description`

**Restrição de toda a feature**: sem dependências novas; sem Git pelo agente; a regra de saída da spec 006 não muda.

---

## Phase 1: Foundational

- [X] T001 [P] Criar `src/features/billing/model.ts`: tipos `Plan`, `Order`, `Checkout`; `readPlans`, `readOrder`, `readCheckout` (devolvem `null` para formato inesperado); `companyNameError`; `isHttpUrl`; `formatMonthlyPrice`; `planScreenState(order, isAdmin)`
- [X] T002 [P] Criar `src/shared/services/subscriptionRedirect.ts`: `SUBSCRIPTION_REQUIRED_CODE`, `onSubscriptionRequired(listener)` (devolve a função de cancelar) e `notifySubscriptionRequired()`
- [X] T003 Criar `tests/billing.test.mjs` cobrindo T001 e T002

## Phase 2: User Story 1 - Contratar sem o console (P1)

- [X] T004 [US1] Criar `src/features/billing/components/PlansPage.tsx`: cabeçalho, aviso do simulador, campo "Nome da empresa" (padrão: nome da organização), cartões dos planos com preço e "Contratar"; checkout pelo `useApi` e `window.location.assign` só com `isHttpUrl`; erros do Core na tela
- [X] T005 [US1] Em `src/app/routes/AppRoutes.tsx`, rota `/plano` com `ProtectedRoute` e `CompanyWorkspace`
- [X] T006 [US1] Em `src/app/layouts/CompanyWorkspace.tsx`, item `plan` do menu leva a `/plano`, ativo nessa rota, com breadcrumb e a `PlansPage`

## Phase 3: User Story 2 - Levado aos planos sem plano (P1)

- [X] T007 [US2] Em `src/shared/services/useApi.ts`, chamar `notifySubscriptionRequired()` quando o erro tiver `code === 'subscription_required'`, sem mudar a classificação da spec 006
- [X] T008 [US2] Em `src/app/layouts/CompanyWorkspace.tsx`, registrar `onSubscriptionRequired` e navegar para `/plano` (`replace`) fora dela

## Phase 4: User Story 3 - Situação da contratação (P2)

- [X] T009 [US3] Em `PlansPage.tsx`, buscar `GET /api/billing/order` (404 `no_order` = nenhum) e mostrar o estado de `planScreenState`: ativo com "Ir para a empresa", pendente com "Continuar pagamento", membro com botões desativados

## Phase 5: Polish

- [X] T010 [P] README: trocar o texto de "sem Tenant, 403 e logout" pelo fluxo de contratação e citar a tela `/plano`
- [X] T011 Rodar `npm test` e `npm run build` — 2026-11-18: 56 testes, 0 falhas; build ok (o aviso de chunk acima de 500 kB já existia)
- [ ] T012 Roteiro P1–P8 do quickstart com o Core da spec 010 e a Clerk real — 2026-11-18, conta admin `+clerk_test` e a organização "Teste C sem Tenant" (reiniciada sem plano): P1–P7 passaram (redirecionamento para `/plano` sem logout; nome inválido sem chamada ao Core; checkout abre o simulador; pendente com "Continuar pagamento"; empresa liberada; plano ativo sem "Contratar"). P8 (membro) não rodou no navegador: coberto por `planScreenState` em `tests/billing.test.mjs` e pelo `not_admin` do Core

## Dependencies

T001–T002 → T003 → US1 (T004–T006) → US2 (T007–T008) → US3 (T009) → Polish.
