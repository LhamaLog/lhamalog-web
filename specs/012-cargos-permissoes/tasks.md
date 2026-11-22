# Tasks: Cargos e permissões (Web)

Regras para o agente no `lhamalog-web`: não rodar Git; trabalhar uma fase por vez e parar para revisão; não instalar dependência; rodar `npm test` e `npm run build` ao fim de cada fase.

## Fase 0

- [X] T001 Ler `README.md`, `docs/planejamento-componentes.md`, `docs/instrucoes-agentes.md` e o contrato `contracts/core-api.md`. Rodar `npm test` e `npm run build` como linha de base.
- [X] T002 Rodar `speckit-clarify` para W1 a W3 (e W4/W5, que vieram da C1 do Core) e registrar as respostas na `spec.md`.

## Fase 1: papel e menu (US1)

- [X] T003 [P] [US1] Criar `tests/access-contract.test.mjs`:
  - `readMe` aceita só `role` em OWNER, ADMIN ou MEMBER e `permissions` como lista de texto;
  - `readCatalog` aceita `ownerUserId` nulo ou texto;
  - um campo inválido resulta em `null`.
- [X] T004 [US1] Criar `src/features/access/accessContract.ts`, `labels.ts`, `AccessProvider.tsx` e `useAccess.ts`. Recarregar a cada troca de `orgId`. Em caso de erro, mostrar o estado de erro sem liberar a gestão. Em caso de 404, usar o modo antigo (veja Riscos no plan).
- [X] T005 [US1] Envolver o `CompanyWorkspace` com o `AccessProvider` e trocar a regra do item "Equipe" para `can('MEMBERS_VIEW')`. Membro que abre `/equipe` direto vê a negação simples.
- [X] T006 [US1] Rodar `npm test` e `npm run build`. Parar para revisão.

## Fase 2: Dono e convite (US2, US3)

- [X] T007 [P] [US2] Criar `tests/owner-rules.test.mjs`, cobrindo:
  - `isOwnerRow`;
  - `canDemote` e `canDeactivate` falsos para o Dono;
  - `inviteRolesFor('OWNER')` igual a `[admin, member]`;
  - `inviteRolesFor('ADMIN')` igual a `[member]` quando a empresa tem Dono, e `[admin, member]` quando não tem (W4);
  - reenvio de convite admin bloqueado para ADMIN só quando a empresa tem Dono (W4).
- [X] T008 [US2] Criar `src/features/team/ownerRules.ts`.
- [X] T009 [US2] Na `TeamPage.tsx`:
  - ler `ownerUserId` do `AccessProvider` (catálogo);
  - mostrar "Dono" na linha;
  - ocultar rebaixar e desativar na linha do Dono;
  - tratar `owner_protected`;
  - bloquear o rebaixamento do Dono antes de `updateMember`, com "Não é possível rebaixar o Dono da empresa.".
- [X] T010 [US3] Na `TeamPage.tsx`:
  - o seletor de papel do convite usa `inviteRolesFor(role)`, com o texto de ajuda para o ADMIN;
  - o reenvio de convite admin por um ADMIN fica bloqueado com "Só o Dono reenvia convite de Administrador.".
- [X] T011 Rodar `npm test` e `npm run build`. Parar para revisão.

## Fase 3: produtos do Membro (US4)

- [X] T012 [P] [US4] Criar `tests/product-access.test.mjs`:
  - `readProductAccess` valida `allProducts` e `productIds`;
  - `productAccessPath` codifica o `userId` e recusa `userId` vazio ou com mais de 200 caracteres.
- [X] T013 [US4] Criar `src/features/team/productAccess.ts` e `components/MemberProductsPanel.tsx`:
  - lista de `GET /api/products` e de `GET /api/products?archived=true`;
  - marcados vêm de `GET /api/company/members/{userId}/products`;
  - salvar faz o `PUT`;
  - estados de carregando, vazio e erro;
  - mensagens de `full_access` e `product_not_found`.
- [X] T014 [US4] Na `TeamPage.tsx`, a ação "Produtos" por linha: Membro abre o painel; Dono e Administrador mostram "Acessa todos os Produtos.".
- [X] T015 Rodar `npm test` e `npm run build`. Parar para revisão.

## Fase 4: cargos (US5, US6)

- [X] T016 [P] [US5] Criar `tests/notification-roles.test.mjs`:
  - `readRole` e `readRoleList`;
  - `membersSource`;
  - validação de nome (1 a 60) e de listas (pelo menos 1);
  - mapa de rótulos.
- [X] T017 [US5] Criar `src/features/notification-roles/roleContract.ts` e `roleValidation.ts`.
- [X] T018 [US5] Criar `components/NotificationRolesPage.tsx` e `RoleForm.tsx`:
  - lista com selos "Padrão" e "Padrão, não editável";
  - criar, renomear, gravidades, tipos e excluir com diálogo;
  - `version` em toda edição;
  - 409 de versão recarrega o cargo.
- [X] T019 [US5] Criar `TeamTabs.tsx` (Pessoas, Cargos, Permissões) e a rota `/equipe/cargos` em `AppRoutes.tsx`, conforme W1.
- [X] T020 [US6] Criar `components/RoleMembersPanel.tsx`:
  - pessoas da organização via `organization.getMemberships` (o mesmo padrão paginado `everyMembership` da `TeamPage`, extraído para um utilitário compartilhado, se precisar);
  - marcar faz `POST` e desmarcar faz `DELETE`;
  - leitura só para Dono e Administrador.
- [X] T021 [US6] No detalhe da pessoa na `TeamPage`, mostrar os cargos dela (`GET /api/company/members/{userId}/notification-roles`), carregados sob demanda.
- [X] T022 Rodar `npm test` e `npm run build`. Parar para revisão.

## Fase 5: permissões (US7)

- [X] T023 [US7] Criar `src/features/access/components/PermissionsMatrix.tsx` e a rota `/equipe/permissoes`. A tabela vem de `GET /api/company/access`, com os rótulos de `labels.ts`.
- [X] T024 Rodar `npm test` e `npm run build`.

## Fase 6: fechamento

- [ ] T025 Roteiro manual contra o Core local da LLT-120, em `quickstart.md`:
  - Dono, Administrador e Membro em janelas separadas;
  - cada US com o resultado registrado.
- [X] T026 Conferir que não há chave secreta nem token salvo em arquivo.
- [X] T027 Rodar `speckit-analyze` e resolver as inconsistências.
- [X] T028 Entregar ao Pedro a lista do que mudou na `TeamPage` (LLT-168) e no convite (LLT-167), para ele avisar o Vinicius e o Felipe no PR.

## Situação em 18/11/2026

- Fases 1 a 5 implementadas pela IA, com testes de funções puras escritos antes (vermelho, depois verde). `npm test`: 61 testes, 60 passando; a falha é `@clerk/localizations` ausente, a mesma da linha de base.
- Ficam abertas T006, T011, T015, T022 e T024, porque o `npm run build` não rodou: não há `node_modules` e as instruções do repositório proíbem instalar dependências sozinho (analyze WA1). O código TSX foi revisado à mão, sem `tsc`.
- Fica aberta T025 (roteiro manual em `quickstart.md`): depende do Pedro no navegador, com o Core da LLT-120 rodando.
- T028: a lista de mudanças na `TeamPage` e no convite foi entregue ao Pedro no relatório final.

## Fase 7: atualizar com a Development (22/11/2026)

- [X] T029 Auditoria: tabela com cada tarefa do `tasks.md` (feita, parcial ou aberta, e onde está no código). Linha de base: `npm test` e `npm run build` em `1c88900`, registrando as falhas sem corrigir. Resultado na seção "Auditoria de 22/11" abaixo e no `quickstart.md`.
- [X] T030 O Pedro mescla a `Development` (GitHub Desktop). Resolver os conflitos mantendo os dois lados e explicar cada arquivo ao Pedro. Da `Development`: a rota e o desvio para a tela de planos, o encerramento de sessão só no 403 sem código e os ajustes de Equipe. Desta branch: o `AccessProvider`, as rotas de cargos e permissões e os controles de acesso na Equipe.
- [X] T031 Se o `package-lock.json` mudou, pedir ao Pedro para rodar `npm ci`. Rodar `npm test` e `npm run build` e corrigir os erros desta feature. Registrar no `quickstart.md`.

## Fase 8: spec 012 e contrato

- [X] T032 Renomear `specs/005-cargos-permissoes` para `specs/012-cargos-permissoes` (a `005` é de notificação, a `007` é a tela de planos e de `008` a `011` são as de Produto). Atualizar as referências dentro da pasta e em comentários de `src/` e `tests/` (procurar `005-cargos` e `spec 005`).
- [X] T033 `contracts/core-api.md`: copiar de novo o `specs/011-cargos-permissoes/contracts/api.md` do Core, no estado final da Parte A. Se alguma rota ou código mudou, ajustar o `accessContract.ts` e os testes.
- [X] T034 Recusas de negócio desta feature: mostrar a mensagem do Core, sem encerrar a sessão. Os códigos são `not_admin`, `owner_protected`, `full_access`, `product_not_found`, `immutable_role`, `role_name_in_use`, `members_from_access_role`, `role_members_limit` e `role_not_found`. O `subscription_required` segue o comportamento da LLT-289 (tela de planos). Teste em `tests/*.test.mjs`, com função pura.
- [X] T035 Conferir que a tela decide pelas permissões do `GET /api/company/access/me` (`can('...')`), e não pelo cargo da Clerk, sempre que a matriz tiver a permissão. Na Equipe, o Dono aparece como "Dono" e não tem o botão Desativar (o Core recusaria com `owner_protected`).
- [X] T036 `npm test` e `npm run build`. Parar para revisão.

## Fase 9: completar

- [X] T037 Concluir as tarefas que a auditoria marcou como parciais ou abertas.
- [X] T038 Produto. Se a `Development` já tiver a LLT-123 (existe `src/features/products/productEdit.ts` com `canArchive`), trocar a regra do Arquivar e Desarquivar de "cargo admin na Clerk" para `can('PRODUCTS_ARCHIVE')`, como a spec `009` (W2) pede, e atualizar o `tests/product-edit.test.mjs`. Se já tiver a LLT-179, fazer o mesmo com o "Gerar nova" da chave de API e o `INGESTION_TOKENS_MANAGE`. Se não tiverem entrado, registrar como pendência na spec `012` e no PR.
- [X] T039 `npm test` e `npm run build`. Parar para revisão.

## Fase 10: teste manual

- [ ] T040 Subir o ambiente e guiar o Pedro no roteiro do `TESTE-MANUAL-120.md` (pasta do pacote). Registrar cada linha (ok ou o que aconteceu) no `quickstart.md`. Corrigir o que falhar, na mesma branch, e repetir a linha. Fecha também a T025.

## Fase 11: fechamento

- [X] T041 `speckit-analyze`. Procurar `sk_`, `CLERK_SECRET_KEY` com valor e `eyJ` em `src/`, `tests/` e na spec.
- [X] T042 `npm test` e `npm run build` finais.
- [ ] T043 Rascunho do PR (título `LLT-120: cargos e permissoes`): o que entrega, o resultado dos testes e do roteiro manual, o fato de não haver tela no Figma e os avisos:
  - Vinicius: a `TeamPage` passou a usar as permissões do Core e mostra o Dono;
  - Felipe: o `CompanyWorkspace` e as rotas foram mesclados com a tela de planos;
  - pendências (por exemplo, o Arquivar, se a LLT-123 ainda não tiver entrado).

  Entregar ao Pedro a mensagem de commit: `LLT-120: atualiza com a development e fecha as telas de cargos e permissoes`.

## Auditoria de 22/11/2026 (T029)

Feita por leitura dos arquivos, sem Git (`docs/instrucoes-agentes.md`), em `1c88900`.

| Tarefa | Situação | Onde está |
|---|---|---|
| T001, T002 | feitas | linha de base de 18/11; W1 a W5 na Session 2026-11-18 (ainda aguardam a confirmação do Pedro) |
| T003 a T005 (US1) | feitas | `tests/access-contract.test.mjs`; `src/features/access/` (`accessContract.ts`, `labels.ts`, `AccessProvider.tsx` com o modo antigo no 404, `useAccess.ts`); `CompanyWorkspace.tsx` envolve com o `AccessProvider` e esconde Equipe por `teamMenuHidden(access)` |
| T007 a T010 (US2, US3) | feitas | `tests/owner-rules.test.mjs`; `src/features/team/ownerRules.ts`; `TeamPage.tsx` (selo Dono, `canDeactivate`, `demoteGuard`, `inviteRolesFor`, `resendBlocked`) |
| T012 a T014 (US4) | feitas | `tests/product-access.test.mjs`; `src/features/team/productAccess.ts`; `components/MemberProductsPanel.tsx`; ação "Produtos" na `TeamPage` por `can('PRODUCT_ACCESS_MANAGE')` |
| T016 a T021 (US5, US6) | feitas | `tests/notification-roles.test.mjs`; `src/features/notification-roles/` (`roleContract.ts`, `roleValidation.ts`, `NotificationRolesPage.tsx`, `RoleForm.tsx`, `RoleMembersPanel.tsx` com `getMemberships` paginado); `TeamTabs.tsx`; rota `/equipe/cargos`; cargos da pessoa sob demanda na `TeamPage` |
| T023 (US7) | feita | `src/features/access/components/PermissionsMatrix.tsx`; rota `/equipe/permissoes` |
| T006, T011, T015, T022, T024 | **verdes em 22/11** | ficaram abertas em 18/11 só porque o build não rodava. Em 22/11, com `node_modules` instalado pelo Pedro, `npm test` (61/61) e `npm run build` passaram em `1c88900`. Ficam marcadas pela linha de base; a T031 repete depois do merge |
| T025 | aberta | roteiro manual: vai para a Fase 10 (T040), com o `TESTE-MANUAL-120.md` |
| T026 a T028 | feitas | — |

**Parciais ou abertas para a Fase 9 (T037):**
- `quickstart.md`, pré-requisito 4: manda marcar o Dono à mão. Desde a LLT-289, o Dono nasce pela compra simulada. Atualizar junto com a T040.
- `plan.md`, Riscos: "Nenhuma empresa tem Dono enquanto não existir o fluxo de compra" ficou velho com a LLT-289.
- O modo antigo do `AccessProvider` (404 → papel da Clerk) é para ser removido depois do merge do Core (plan, Riscos). Fica como pendência: só pode sair quando o PR do Core da 120 estiver na `Development`.
