# Tasks: Convidar usuário para a empresa

**Input**: Design documents from `/specs/003-convidar-usuario-empresa/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/team-invitations.md, quickstart.md

**Tests**: Incluídos. A spec pede checagem automática do e-mail, dos dois cargos, do prazo de 7 dias, da regra de um convite utilizável e do reconhecimento de administrador, no mesmo estilo de `tests/company-settings.test.mjs`. E-mail real e aceite ficam no roteiro manual.

**Organization**: Tarefas agrupadas por história para implementação e teste independentes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode correr em paralelo (arquivos diferentes, sem depender de tarefa incompleta)
- **[Story]**: História a que a tarefa pertence (US1, US2, US3)
- Cada tarefa inclui o caminho do arquivo

## Path Conventions

- Aplicativo único: `src/` e `tests/` na raiz de `lhamalog-web`
- Feature nova: `src/features/team/`
- Sem dependência nova de produção em `package.json`
- Sem chamada a `src/shared/services/api.ts` ou `src/shared/services/useApi.ts` para convite
- Sem `CLERK_SECRET_KEY` e sem valor `sk_`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Tipos da tela, sem infra nova

- [x] T001 [P] Criar `src/features/team/types.ts` com o rascunho (`emailAddress`, `role`) e a linha de convite (`id`, `emailAddress`, `role`, `createdAt`, `expiresAt`, `status`) conforme `specs/003-convidar-usuario-empresa/data-model.md`. `role` do rascunho só admite `org:admin` e `org:member`. Não incluir prazo editável, id de usuário nem campo de empresa. Não adicionar dependência em `package.json`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Regras puras que US1, US2 e US3 usam. Nenhuma história começa antes desta fase.

**⚠️ CRITICAL**: Nenhuma história começa antes desta fase

- [x] T002 [P] Escrever `tests/team-invitations.test.mjs` antes de T003 e T004, no estilo de `tests/company-settings.test.mjs` (registrar `tests/resolve-ts.mjs`). Cobrir, com as regras literais de `specs/003-convidar-usuario-empresa/data-model.md`: e-mail vazio e só com espaços é inválido; e-mail que não casa `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` é inválido; `ana@empresa.com` é válido; a comparação normaliza com `trim` e minúsculas, então `Ana@Empresa.com` e `ana@empresa.com` são o mesmo e-mail; cargo diferente de `org:admin` e `org:member` é inválido; esses dois valores são válidos; `isOrganizationAdmin` é verdadeiro para `org:admin` e para `admin`, e falso para `org:member`, vazio e `org:gestor`; validade sem `expiresAt` é `createdAt` + 7 dias; se `expiresAt` for uma data, ela é a validade; pendente utilizável do mesmo e-mail bloqueia envio novo; reenvio lista todos os ids pendentes daquele e-mail para `revoke` e só depois um `inviteMember`; se a lista de revogação tiver falha, o plano não inclui `inviteMember`; identificador de membro normalizado impede o convite; `invitationOutcomeCopy('expired')` é exatamente `Este convite expirou e não pode ser usado.`; `invitationOutcomeCopy('revoked')` é exatamente `Este convite foi revogado e não pode ser usado.`. Não assertar renderização.

- [x] T003 [P] Implementar a validação em `src/features/team/validation.ts`: depois de `trim`, o e-mail é obrigatório e precisa casar `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`, o mesmo critério de `src/features/company/validation.ts`; `role` é exatamente `org:admin` ou `org:member`. Exportar a normalização de e-mail (`trim` + minúsculas) usada na comparação.

- [x] T004 [P] Implementar em `src/features/team/invitations.ts` as funções puras, sem importar `@clerk/react` e sem chamar rede: `isOrganizationAdmin` (verdadeiro só para `org:admin` e `admin`); `invitationExpiry` (`expiresAt` quando for data, senão `createdAt` + 7 dias); detecção de pendente utilizável para o e-mail normalizado, ignorando pendente cuja validade já passou; plano de reenvio que devolve todos os ids pendentes daquele e-mail para revogar e, somente se nenhum revoke estiver marcado como falho, um único `inviteMember` com o mesmo e-mail e o mesmo `role`; `membershipBlocksInvite` comparando identificadores normalizados; `invitationOutcomeCopy('expired')` devolve exatamente `Este convite expirou e não pode ser usado.` e `invitationOutcomeCopy('revoked')` devolve exatamente `Este convite foi revogado e não pode ser usado.`. Não criar API no Core.

**Checkpoint**: Regras de cargo, prazo, administrador e reenvio testáveis sem a tela

---

## Phase 3: User Story 1 - Enviar um convite com cargo (Priority: P1) 🎯 MVP

**Goal**: O administrador envia um convite com Administrador ou Membro, vê a confirmação de 7 dias e não cria convite inválido, duplicado ou para quem já é membro.

**Independent Test**: Enviar e-mail válido com um dos dois cargos e ver a confirmação com 7 dias. E-mail inválido, membro existente e pendente duplicado não enviam. Quem não administra não vê Equipe e, em `/equipe`, lê a recusa padrão sem sair da sessão.

### Implementation for User Story 1

- [x] T005 [US1] Criar `src/features/team/components/TeamPage.tsx` com e-mail e cargo, usando `Input` e `Select` de `src/shared/ui/`. Validar com `src/features/team/validation.ts` antes de chamar `organization.inviteMember({ emailAddress, role })` de `useOrganization` em `@clerk/react`. `role` só `org:admin` ou `org:member`. Não enviar prazo nem URL. Antes do envio, percorrer todas as páginas de `organization.getMemberships` e bloquear se `membershipBlocksInvite` achar o e-mail, inclusive o e-mail primário da sessão (`useUser`). Percorrer todas as páginas de `organization.getInvitations({ status: ['pending'] })` e bloquear envio novo se já houver pendente utilizável para o e-mail, com a frase "Já existe um convite pendente para este e-mail. Use reenviar.", sem revogar nesse caminho. Membro existente ou o próprio e-mail usa "Esta pessoa já pertence à empresa." E-mail inválido usa "Informe um e-mail válido." Rótulos visíveis: "E-mail" e "Cargo". Espelhar o estado de `src/features/company/components/CompanyPage.tsx`: um único envio com o botão bloqueado, sucesso em `role="status"` com o texto `Convite enviado para {email} como {cargo}. Ele expira em 7 dias.`, erro em `role="alert"`, rascunho preservado na falha. Guardar o `orgId` do início da chamada (`useAuth`) e ignorar o efeito se a empresa ativa tiver mudado. Sem `orgId`, não chamar o SDK. Se a pessoa não for administradora por `isOrganizationAdmin`, não chamar o SDK e mostrar a frase "Você não tem acesso. Selecione uma empresa válida." sem `signOut`. Se o SDK indicar sessão expirada, usar o `signOut` já adotado no 401, para `/sign-in?motivo=deslogado`. Não importar `useApi` nem `apiRequest`. Não criar chamada ao Core.

- [x] T006 [US1] Publicar a rota protegida `/equipe` em `src/app/routes/AppRoutes.tsx` e o ramo correspondente em `src/app/layouts/CompanyWorkspace.tsx`, ao lado de `/empresa`, `/produtos` e `/perfil`. Em `src/app/layouts/Navbar.tsx`, acrescentar uma prop opcional para ocultar ids sem apagar os demais itens já visíveis quando a prop vem vazia; `CompanyWorkspace` oculta só `team` quando `isOrganizationAdmin` for falso. O clique em Equipe navega para `/equipe`. O breadcrumb usa as chaves já existentes `shell.breadcrumbAdministration` e `nav.team`, para o rótulo Equipe continuar o que a moldura já traduz. Sem empresa selecionada, manter o `EmptyState` já usado pela moldura e não montar envio. Não criar rota `/convite` nem rota de painel.

**Checkpoint**: US1 utilizável para administrador; membro comum não vê o menu e não convida

---

## Phase 4: User Story 2 - Aceitar e entrar na empresa com o cargo (Priority: P1)

**Goal**: O aceite permanece em `/sign-in` e `/sign-up`, com mensagens distintas para expirado e revogado. Nenhuma rota nova de aceite.

**Independent Test**: O link do convite não ganha caminho novo. As frases de expiração e de revogação são as de `invitationOutcomeCopy` e diferem entre si. As rotas de entrada continuam as atuais.

### Implementation for User Story 2

- [x] T007 [P] [US2] Em `src/features/auth/theme/localization.ts`, fazer as telas de entrada já existentes distinguirem convite expirado de convite revogado usando as frases de `invitationOutcomeCopy` em `src/features/team/invitations.ts`: `Este convite expirou e não pode ser usado.` e `Este convite foi revogado e não pode ser usado.` Procurar no pacote `@clerk/localizations` as chaves de erro de convite de organização já presentes e preencher só essas chaves com essas duas frases, sem apagar o restante de `ptBR` já espalhado no arquivo. Não adicionar rota em `src/app/routes/AppRoutes.tsx`. Não definir URL de retorno no `inviteMember`: o dashboard é quem aponta o portal para `/sign-in` e `/sign-up`, como em `specs/003-convidar-usuario-empresa/contracts/team-invitations.md`.

**Checkpoint**: US2 não cria tela; o texto dos dois fracassos fica distinto

---

## Phase 5: User Story 3 - Acompanhar pendentes e impedir convite expirado ou revogado (Priority: P1)

**Goal**: A mesma tela lista pendentes (e-mail, cargo, validade, situação), revoga e reenvia sem deixar dois convites utilizáveis.

**Independent Test**: A lista mostra os quatro dados e pagina de 10 em 10. Revogar tira o item dos utilizáveis. Reenviar revoga todos os pendentes daquele e-mail antes de um único `inviteMember`. Falha depois da revogação não deixa convite utilizável novo.

### Implementation for User Story 3

- [x] T008 [US3] Estender `src/features/team/components/TeamPage.tsx` com a lista de `organization.getInvitations({ status: ['pending'], initialPage, pageSize: 10 })`. Colunas: e-mail; cargo Administrador para `org:admin`, Membro para `org:member`, texto cru para outro `role`; validade por `invitationExpiry`; situação Pendente, ou Expirado quando a validade já passou. Lista vazia com o texto "Não há convite pendente." Se `totalCount` passar de 10, usar `Pagination` de `src/shared/ui/Pagination.tsx`. Revogar chama `invitation.revoke()` no item e recarrega. Reenviar segue o plano de `src/features/team/invitations.ts`: `revoke()` em todos os pendentes daquele e-mail e, só depois de todos resolverem, um `inviteMember` com o mesmo e-mail e o mesmo `role`; se um `revoke` falhar, não convidar; se o `inviteMember` falhar, recarregar e mostrar o alerta, deixando zero convites utilizáveis dessa tentativa. Um único pedido por ação, com o botão bloqueado. Ignorar efeito se o `orgId` tiver mudado. Não listar membros da empresa, não editar o cargo de quem já aceitou e não escolher produtos. Não chamar o Core.

**Checkpoint**: US1 e US3 na mesma tela; US2 continua sem rota nova

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Alinhar o comentário vencido e verificar

- [x] T009 [P] Substituir o comentário de `src/features/auth/components/CreateOrganizationPage.tsx` e a linha de `/organizacoes/nova` em `README.md`. Manter `skipInvitationScreen`. O texto no código fica só com a decisão vigente: criar empresa continua sem a etapa de convite da plataforma; convidar alguém é a tela `/equipe`, pelo SDK do navegador na sessão do administrador, sem API de convite no Core e sem segredo. O histórico de que o comentário antigo atribuía o convite ao backend (ADR_114) permanece em `specs/003-convidar-usuario-empresa/spec.md` e `specs/003-convidar-usuario-empresa/plan.md`, não no comentário do componente.

- [x] T010 Rodar `npm test` e `npm run build` na raiz de `lhamalog-web`. Confirmar que `src/features/team/` não importa `src/shared/services/api.ts` nem `src/shared/services/useApi.ts`, que `package.json` não ganhou dependência e que não surgiu rota `/convite`.

- [x] T011 Executar o roteiro manual de `specs/003-convidar-usuario-empresa/quickstart.md` quando a instância Clerk estiver com convites ligados, prazo de 7 dias e papéis `org:admin` e `org:member`, e registrar naquele arquivo o que foi exercitado e o que ficou bloqueado por ambiente. Não criar atalho de autenticação nem chave secreta.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências
- **Foundational (Phase 2)**: T002 pode ser escrito em paralelo com T001; T003 e T004 dependem de T001 e T002 e bloqueiam todas as histórias
- **User Stories (Phase 3+)**: dependem da Phase 2
- **Polish (Phase 6)**: T009 pode correr em paralelo com as histórias, porque não edita a tela; T010 e T011 dependem das histórias entregues

### User Story Dependencies

- **User Story 1 (P1)**: começa após a Phase 2. Não depende de US2 nem US3.
- **User Story 2 (P1)**: começa após a Phase 2. T007 não depende da tela. Não cria rota.
- **User Story 3 (P1)**: depende de T005, porque a lista fica na mesma `TeamPage.tsx`. Não depende de US2.

### Within Each User Story

- T002 fica escrito antes de T003 e T004 e deve falhar até esses módulos existirem
- T005 usa T003 e T004; T006 publica a rota que monta T005
- T008 só edita `TeamPage.tsx` depois de T005

### Parallel Opportunities

- T001 e T002 em paralelo
- T003 e T004 em paralelo, depois de T001 e T002
- T007 em paralelo com T005 e T006, depois da Phase 2
- T009 em paralelo com T005, T006, T007 e T008

---

## Parallel Example: User Story 1 e User Story 2

```bash
# Depois de T003 e T004:
Task: "TeamPage de envio em src/features/team/components/TeamPage.tsx"
Task: "rota /equipe em src/app/routes/AppRoutes.tsx e menu em Navbar.tsx"
Task: "frases de expiração e revogação em src/features/auth/theme/localization.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 e Phase 2
2. Phase 3 (T005–T006)
3. Parar e validar: administrador envia Membro ou Administrador, vê 7 dias, e-mail inválido não sai, quem já é membro não recebe outro convite, pendente duplicado não cria o segundo, não administrador não vê Equipe

### Incremental Delivery

1. Setup + Foundational
2. US1: enviar com os dois cargos e a recusa padrão
3. US2: frases distintas nas telas de entrada, sem rota nova
4. US3: lista, revogar e reenviar
5. Polish: comentário do ADR_114, `npm test`, `npm run build` e o manual possível

### Parallel Team Strategy

1. Todos fecham Phase 1 e Phase 2
2. Em seguida: uma pessoa na tela de envio (T005–T006), outra nas frases de aceite (T007) e outra no texto do ADR_114 (T009). T008 espera T005 e não divide `TeamPage.tsx` com T005.

---

## Notes

- O commit de implementação usa `LLT-167 Convidar usuário para a empresa`.
- T011 está marcado porque o bloqueio foi registrado em `quickstart.md`. O roteiro manual em si não rodou: não há instância Clerk neste ambiente.
- Revisão do PR: as chaves de `unstable__errors` conferidas em `@clerk/localizations` 4.24.2 e em `@clerk/shared` (`ticket_expired_code`, `ticket_invalid_code`) permanecem. O mapeamento ficou em `invitationTicketErrors`. O menu e a recusa direta de `/equipe` saem de `teamMenuHiddenItems`, `teamPageDenied` e `filterNavItems`, cobertos em `tests/team-invitations.test.mjs`. O README aponta a spec e o quickstart.
- [P] = arquivos diferentes, sem dependência incompleta
- Não chamar o Core para convite
- Não adicionar SDK Backend da Clerk nem segredo
- Não remover `skipInvitationScreen` de `src/features/auth/components/CreateOrganizationPage.tsx`
