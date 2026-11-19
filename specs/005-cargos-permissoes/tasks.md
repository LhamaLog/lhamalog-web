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
- [ ] T006 [US1] Rodar `npm test` e `npm run build`. Parar para revisão.

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
- [ ] T011 Rodar `npm test` e `npm run build`. Parar para revisão.

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
- [ ] T015 Rodar `npm test` e `npm run build`. Parar para revisão.

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
- [ ] T022 Rodar `npm test` e `npm run build`. Parar para revisão.

## Fase 5: permissões (US7)

- [X] T023 [US7] Criar `src/features/access/components/PermissionsMatrix.tsx` e a rota `/equipe/permissoes`. A tabela vem de `GET /api/company/access`, com os rótulos de `labels.ts`.
- [ ] T024 Rodar `npm test` e `npm run build`.

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
