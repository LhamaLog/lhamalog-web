# Tasks: Sessão encerrada pelo Core (LLT-163)

**Input**: [spec.md](spec.md), [plan.md](plan.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/core-rejections.md](contracts/core-rejections.md), [contracts/sign-in-return.md](contracts/sign-in-return.md), [quickstart.md](quickstart.md)

**Testes**: a lógica pura tem testes com `node --test` (research R8). Componentes e hooks são validados pelo quickstart. Cada fase termina com `npm test` e `npm run build` verdes e uma parada para revisão (docs/instrucoes-agentes.md). Nenhuma task de Git.

**Base**: `Development` com o PR #7 (correção da tela de login depois do segundo fator).

## Phase 1: Setup

- [X] T001 Rodar `npm test` e `npm run build` na base e anotar o total de testes, para comparar no fim (em 17/11: 38 testes)

## Phase 2: Foundational

- [X] T002 Em `src/shared/services/api.ts`, acrescentar ao `ApiError` o campo `serverMessage` (a `message` do corpo do Core quando for texto não vazio; senão `''`) e preenchê-lo em `apiRequest`; `message`, `code`, `status` e `fieldErrors` continuam iguais (research R1, detalhe de implementação)
- [X] T003 [P] Criar `src/shared/services/sessionRedirect.ts` (research R1 a R5): `classifyRejection(status, code, serverMessage)` → `'session' | 'keep'` pela tabela de data-model.md ("401 → session; 403 sem code e sem message → session; 403 com code ou message → keep; outros → keep"); `safeReturnPath(value)` pelas regras de "Destino de volta" ("começa com `/`; não começa com `//` nem `/\`; sem `\`, controle ou esquema; até 2048 caracteres; não começa com `/sign-in`, `/sign-up`, `/tarefas` ou `/organizacoes/nova`", senão `/`); `signInUrl(returnPath)` → `/sign-in?motivo=deslogado&redirect_url=<encodeURIComponent(destino seguro)>` (sem `redirect_url` quando o destino é `/`); `signOutOnce(signOut, returnPath)`, que reutiliza a saída em andamento e libera ao terminar, com sucesso ou erro
- [X] T004 [P] Criar `tests/session-redirect.test.mjs`: tabela de `classifyRejection` (401; 403 vazio; 403 `{"error":"forbidden"}`; 403 com cada código; 403 só com `serverMessage`; 404; 409; 0); exemplos de `contracts/sign-in-return.md` em `safeReturnPath` (mais caractere de controle e 2049 caracteres); `signInUrl` com e sem destino; `signOutOnce` com três chamadas simultâneas → um `signOut`, e uma nova saída depois da primeira terminar
- [X] T005 Em `tests/api.test.mjs`: 403 `{"error":"forbidden"}` → `serverMessage` vazio e `message` com o texto padrão; 403 `{"code":"not_admin","message":"..."}` → `code` e `serverMessage` preenchidos; 403 `{"message":"Somente ..."}` sem `code` → `serverMessage` preenchido

**Checkpoint**: `npm test` e `npm run build` verdes. Parar para revisão.

## Phase 3: User Story 1 — Sair na hora quando o Core encerra o acesso (P1)

**Goal**: 401 e 403 de segurança encerram a sessão na primeira recusa; 403 de negócio mantém.

**Independent Test**: itens E3, E4, E5, E6 e E11 do quickstart.

- [X] T006 [US1] Em `src/shared/services/useApi.ts`: sem `orgId`, lançar `new ApiError('Selecione uma empresa para continuar.', 403, {}, 'no_organization')` (research R6); no `catch`, quando `classifyRejection(error.status, error.code, error.serverMessage) === 'session'`, chamar `signOutOnce(signOut, <pathname + search + hash atual>)` no lugar do `signOut` direto só para 401; relançar o erro como hoje
- [X] T007 [US1] Em `src/features/auth/hooks/useSessionErrorHandler.ts`: o handler recebe o erro (ou `status`, `code` e `serverMessage`), usa `classifyRejection` e `signOutOnce` com a rota atual e devolve se encerrou a sessão; trocar o comentário "401 e 403 são tratados no front do mesmo jeito" pela regra nova e tirar "Pendente na ADR_032"
- [X] T008 [US1] Em `src/features/team/components/TeamPage.tsx`, as três saídas por `isClerkSessionExpired`/`signOutRef.current` (linhas de `fail`, da lista de convites e da lista de membros) passam a usar o `useSessionErrorHandler` (saída única com destino de volta); na lista de membros, `reason.status === 401` vira "classificado como `session`", para não mostrar erro durante a saída
- [X] T009 [US1] Em `src/shared/hooks/useApiResource.ts`, não chamar `setError` quando o erro for classificado como `session` (a saída já está em andamento; SC-001). Conferir o mesmo nos `catch` de `src/features/company/components/CompanyPage.tsx`, `src/features/company/components/ContextRevisionHistory.tsx`, `src/features/products/components/ProductsPage.tsx`, `src/features/products/components/ProductForm.tsx`, `src/features/profile/components/ProfilePage.tsx` e `src/features/profile/preferences.tsx`: nenhuma mensagem de erro aparece antes do login
- [X] T010 [US1] Em `src/shared/services/api.ts`, `messageFor(403, '')` passa a ser "Você não tem acesso a esta empresa." (texto de reserva, mostrado só se a saída falhar)

**Checkpoint**: `npm test` e `npm run build` verdes; E3 a E6 e E11 do quickstart. Parar para revisão.

## Phase 4: User Story 2 — Voltar para onde estava (P1)

**Goal**: depois do login, a pessoa volta à rota interna em que estava.

**Independent Test**: itens E3, E7 e E8 do quickstart.

- [X] T011 [US2] Em `src/features/auth/components/SignInPage.tsx`: ler `redirect_url`, calcular `destino = safeReturnPath(...)`; com `isLoaded && isSignedIn`, `<Navigate to={destino} replace />` (estende o PR #7); no `<SignIn>`, `forceRedirectUrl={destino}` no lugar de `fallbackRedirectUrl="/"` (research R4). O aviso `motivo=deslogado` continua igual. Sessão `pending` continua indo para as telas de tarefa
- [X] T012 [US2] Conferir em `src/features/auth/components/ProtectedRoute.tsx` que o `redirectToSignIn` da Clerk (sessão ausente ao abrir uma rota protegida) continua sem gerar `redirect_url=/sign-in`; o destino gerado por ele passa pelo `safeReturnPath` na `SignInPage`. Só alterar o arquivo se o E7 ou o E8 falhar

**Checkpoint**: `npm test` e `npm run build` verdes; E3, E7 e E8. Parar para revisão.

## Phase 5: User Story 3 — Criar organização enquanto não há fluxo de compra (P2)

**Goal**: aviso da FR-008 antes de criar.

**Independent Test**: item E9 do quickstart.

- [X] T013 [P] [US3] Em `src/features/auth/components/CreateOrganizationPage.tsx`, acima do `<CreateOrganization>`, um parágrafo `role="note"` com o texto da research R7: "A empresa nova só dá acesso ao LhamaLog depois da contratação de um plano, que ainda não está disponível. Para testar, use uma empresa já liberada." Visual alinhado ao `lh-aviso` das telas de autenticação; o componente da Clerk e o `skipInvitationScreen` não mudam

**Checkpoint**: `npm run build` verde; E9. Parar para revisão.

## Phase 6: User Story 4 — Teste de ponta a ponta com a Clerk real (P2)

**Goal**: evidência manual de que o login funciona com o Core da LLT-163.

**Independent Test**: tabela E1 a E12 registrada.

- [X] T014 [US4] (manual, Felipe) Preparar o ambiente da spec 007 do `lhamalog-core` (organizações A com Tenant e C sem Tenant, conta membro `+clerk_test`, `CLERK_SECRET_KEY` no Core)
- [X] T015 [US4] (manual, Felipe) Executar E1 a E12 de `specs/005-sessao-encerrada-pelo-core/quickstart.md` e registrar `Item | Data | Resultado | Observação` no PR da feature, sem token, e-mail real ou `org_id` real
- [X] T016 [US4] Marcar a T009 de `specs/001-empresa-produtos/tasks.md` como concluída, citando este roteiro, se E1 a E3 passarem

## Phase 7: Polish

- [X] T017 [P] `README.md`: na seção de autenticação e no item de `features/auth` em "Responsabilidades", descrever 401 e 403 de segurança (saem), 403 de negócio (fica), volta à rota e `shared/services/sessionRedirect.ts`; corrigir "O nome e a função exibidos continuam fixos" conforme o Header atual (`src/app/layouts/HeaderControls.tsx`)
- [X] T018 [P] Em `specs/001-empresa-produtos/research.md`, no USID_030.1, registrar que o "403 de negócio permanece na tela" vale para 403 com `code` ou mensagem do Core e que o 403 de segurança encerra a sessão (spec 005)
- [X] T020 [US3] Achado do E11: a etapa `/tarefas/escolher-organizacao` também cria organização e não mostrava o aviso. O aviso passa a ser o componente `src/features/auth/components/OrganizationPlanNotice.tsx`, usado em `CreateOrganizationPage.tsx` e em `ChooseOrganizationTask.tsx`; E3, E6 e E11 do quickstart ajustados ao comportamento observado
- [X] T019 `npm test` e `npm run build` finais; comparar com o total do T001 (devem entrar os testes novos sem perder nenhum)

## Dependencies

```text
T001 ─> T002 ─> T005 ─┐
        T003 ─> T004 ─┼─> T006 ─> T007 ─> T008 ─> T009 ─> T010 ─┐
                      ├─> T011 ─> T012 ──────────────────────────┼─> T014 ─> T015 ─> T016 ─> T017, T018 ─> T019
T013 ─────────────────┴──────────────────────────────────────────┘
```

- US1 e US2 dependem da fase 2 e não dependem uma da outra.
- US3 (T013) é independente.
- US4 (roteiro) depende de US1, US2 e US3, e do ambiente da spec 007 do Core.

## Parallel Execution

- Fase 2: T003 e T004 juntos (módulo e teste); T002 e T005 em seguida, no mesmo par de arquivos de `api`.
- Depois da fase 2: US1 (T006 a T010), US2 (T011, T012) e US3 (T013) em paralelo, por arquivos diferentes.
- Polish: T017 e T018 em paralelo.

## Implementation Strategy

- **MVP**: fases 1 a 3 (US1). Já resolve a pessoa presa na tela "Você não tem acesso".
- **Incremento**: US2 (volta à rota) e US3 (aviso). Depois, o roteiro da US4 e o polish.
- Mudanças de autenticação são responsabilidade do Felipe: cada entrega informa o que mudou no comportamento do login e da saída (docs/instrucoes-agentes.md).
