# Tasks: Listar, editar e desativar usuários

**Input**: Design documents from `/specs/004-listar-editar-desativar-usuarios/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/company-members.md, quickstart.md

**Tests**: Incluídos. A spec pede checagem automática da junção, da trava do último administrador, dos dois cargos, dos dois status e da frase de acesso desativado, no mesmo estilo de `tests/team-invitations.test.mjs` e `tests/api.test.mjs`. Cargo real, marca no Core e a próxima requisição ficam no roteiro manual.

**Organization**: Tarefas agrupadas por história para implementação e teste independentes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode correr em paralelo (arquivos diferentes, sem depender de tarefa incompleta)
- **[Story]**: História a que a tarefa pertence (US1, US2, US3)
- Cada tarefa inclui o caminho do arquivo

## Path Conventions

- Aplicativo único: `src/` e `tests/` na raiz de `lhamalog-web`
- Feature existente: `src/features/team/`
- Sem dependência nova em `package.json`
- Chamadas ao Core só por `src/shared/services/api.ts` e `src/shared/services/useApi.ts`
- Sem `CLERK_SECRET_KEY`, sem valor `sk_`, sem `membership.destroy` e sem `organization.removeMember`
- Sem configuração nova de dashboard

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Tipos da linha, sem infra nova

- [ ] T001 [P] Estender `src/features/team/types.ts` com a linha de usuário conforme `specs/004-listar-editar-desativar-usuarios/data-model.md`: `userId` (`string | null`), `name`, `email`, `role` (string da organização), `status` (`active` | `deactivated`) e `lastAccessAt` (`Date | null`). Exportar os status `active` e `deactivated`. Não criar cargo além de `org:admin` e `org:member` já presentes em `inviteRoles`. Não adicionar dependência em `package.json`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Regras puras, leitura do contrato e a frase de acesso desativado. Nenhuma história começa antes desta fase.

**⚠️ CRITICAL**: Nenhuma história começa antes desta fase

- [ ] T002 [P] Escrever `tests/team-members.test.mjs` antes de T004 e T005, no estilo de `tests/team-invitations.test.mjs` (registrar `tests/resolve-ts.mjs`). Cobrir, com as regras literais de `specs/004-listar-editar-desativar-usuarios/data-model.md` e de `specs/004-listar-editar-desativar-usuarios/contracts/company-members.md`: nome com `firstName` `Ana` e `lastName` `Souza` é `Ana Souza`; `firstName` e `lastName` nulos ou só com espaços, com identificador `ana@empresa.com`, produzem o nome `ana@empresa.com`; os dois vazios e sem identificador produzem nome vazio; e-mail da coluna é o `identifier`, inclusive quando for telefone; `identifier` vazio deixa o e-mail vazio; junção com registro `deactivated` e `lastAccessAt` nulo mantém o `userId` e o status `deactivated`; ausência de registro no Core produz `active` e `lastAccessAt` nulo; associação sem `userId` entra na lista com `userId` nulo, `status` `active` e `lastAccessAt` nulo, e não fica habilitada para cargo, desativar ou reativar; `userId` do Core que não está na associação não cria linha; `lastAdminBlocked` é verdadeiro para rebaixar e para desativar quando o alvo é administrador e a contagem é menor que 2; é falso para desativar quando o alvo não é administrador, mesmo com contagem 1; é falso para rebaixar ou desativar administrador quando a contagem é 2 ou mais, sem parâmetro especial de si mesmo; a frase de rebaixar é exatamente `Não é possível rebaixar o último administrador.`; a frase de desativar é exatamente `Não é possível desativar o último administrador.`; `readMemberList` aceita o `GET` de exemplo do contrato e rejeita `members` que não seja array, `status` fora de `active` e `deactivated`, `userId` vazio e `lastAccessAt` que não seja `null` nem data; `buildMemberPut('deactivated')` é `{ status: 'deactivated' }` e `buildMemberPut('active')` é `{ status: 'active' }`; repetir o mesmo status não é modelado como inversão. Não assertar renderização. Não descrever `destroy` nem `removeMember`.

- [ ] T003 [P] Estender `tests/api.test.mjs` antes de T006. Cobrir: HTTP 403 com `code` `user_deactivated` e sem `message` produz `ApiError` cuja `message` é exatamente `Seu acesso a esta empresa está desativado.` e cujo `code` é `user_deactivated`, e o status não é 401; HTTP 403 com esse `code` e `message` `Texto do Core.` preserva `Texto do Core.`; HTTP 403 sem `code` e sem `message` continua `Você não tem acesso. Selecione uma empresa válida.`; HTTP 409 com `code` `last_admin` e sem `message` produz a mensagem exatamente `Não é possível desativar o último administrador.` e `code` `last_admin`; HTTP 401 continua sem vazar corpo HTML, como o teste que já existe. Não alterar o teste de cancelamento nem o de token de organização.

- [ ] T004 Implementar em `src/features/team/members.ts` as funções puras, sem importar `@clerk/react` e sem chamar rede: `memberDisplayName` (`trim` de `firstName` e de `lastName`, um espaço entre as partes não vazias; resultado vazio usa `identifier`; os dois vazios devolvem `''`); `memberEmail` devolve o `identifier` ou `''`; `mergeMember` aplica o registro do Core quando o `userId` coincide e, sem registro, `status` `active` e `lastAccessAt` `null`; associação sem `userId` entra com `userId` `null`, `status` `active` e `lastAccessAt` `null`, e `firstName` ou `lastName` nulos contam como vazio no nome; `lastAdminBlocked({ adminCount, targetIsAdmin, action })` verdadeiro só quando `targetIsAdmin` é verdadeiro e `adminCount` é menor que 2, para `demote` e para `deactivate`; `lastAdminMessage('demote')` devolve exatamente `Não é possível rebaixar o último administrador.` e `lastAdminMessage('deactivate')` devolve exatamente `Não é possível desativar o último administrador.`. Reusar `isOrganizationAdmin` de `src/features/team/invitations.ts` para saber se o `role` do alvo é administrador (`org:admin` e `admin`). Não exportar operação de remoção da organização.

- [ ] T005 [P] Implementar `readMemberList` e `buildMemberPut` em `src/features/team/memberContract.ts`, no estilo de `src/features/profile/contract.ts`. Exportar a constante `companyMembersPath` com o valor `/api/company/members`, ou com o caminho já alinhado em `specs/004-listar-editar-desativar-usuarios/contracts/company-members.md` se o Core tiver publicado outros nomes antes desta tarefa. Nesse caso, atualizar o contrato do Web primeiro e usar só os nomes alinhados. `readMemberList` aceita `{ members: [...] }` em que cada item tem `userId` string não vazia, `status` exatamente `active` ou `deactivated`, e `lastAccessAt` `null` ou string de data. Qualquer outro formato devolve `null`. `buildMemberPut` devolve só `{ status }` com `active` ou `deactivated`. Não enviar `userId`, `lastAccessAt`, cargo nem id de empresa no corpo.

- [ ] T006 Estender `ApiError` em `src/shared/services/api.ts` com `code` string, vazio por padrão, sem quebrar os construtores já usados nos testes. `apiRequest` copia `body.code` quando for string. Em 403 com `code` `user_deactivated` e sem `message` utilizável, a mensagem é exatamente `Seu acesso a esta empresa está desativado.` Em 409 com `code` `last_admin` e sem `message` utilizável, a mensagem é exatamente `Não é possível desativar o último administrador.` O 403 sem esse `code` permanece com o fallback `Você não tem acesso. Selecione uma empresa válida.` Não tratar `user_deactivated` como 401. Não mudar o `signOut` de `src/shared/services/useApi.ts`, que continua só no 401.

**Checkpoint**: Junção, trava, contrato e frase de acesso desativado testáveis sem a tela

---

## Phase 3: User Story 1 - Ver quem pertence à empresa (Priority: P1) 🎯 MVP

**Goal**: O administrador vê, em `/equipe`, nome, e-mail, cargo, status e último acesso de quem já pertence à empresa, ao lado dos convites pendentes.

**Independent Test**: Com empresa selecionada, o administrador abre Equipe e confere as cinco colunas. Quem o Core não devolve aparece como Ativo e "Sem acesso registrado". Convite pendente não entra nesse bloco. Quem não administra continua sem ver Equipe e, em `/equipe`, lê a recusa padrão sem sair da sessão.

### Implementation for User Story 1

- [ ] T007 [US1] Estender `src/features/team/components/TeamPage.tsx` com o bloco de usuários, sem rota nova. Para a página visível, chamar `organization.getMemberships({ initialPage, pageSize: 10 })` e `GET` `companyMembersPath` via `useApi`. Juntar com `mergeMember` e `memberDisplayName` pelo `publicUserData.userId`. Colunas: nome; e-mail (`identifier`); cargo por `roleLabel` de `src/features/team/invitations.ts`, texto cru se não for `org:admin` nem `org:member`; status Ativo ou Desativado; último acesso em `pt-BR` com data e hora curtas no fuso local, ou exatamente `Sem acesso registrado` quando `lastAccessAt` for nulo. Lista vazia com exatamente `Não há usuário vinculado.` Se `totalCount` passar de 10, usar `Pagination` de `src/shared/ui/Pagination.tsx`. O bloco de convites pendentes permanece com as colunas, a frase `Não há convite pendente.`, revogar e reenviar. Manter `teamPageDenied`: quem não administra vê exatamente `Você não tem acesso. Selecione uma empresa válida.` e a tela não chama Clerk nem Core. Sem `orgId`, não chamar; a moldura existente continua a orientação de selecionar ou cadastrar empresa. Sem `userId`, a linha aparece só com nome, e-mail e cargo, sem controle de cargo, desativar ou reativar. Falha genérica do `GET` mostra o erro no bloco de usuários, com nova tentativa, e mantém o bloco de convites. `ApiError.code` `user_deactivated` mostra a `message` e não oferece o bloco de convites nem o bloco de usuários. Guardar o `orgId` do início e ignorar o efeito se a empresa ativa tiver mudado. `GET` inválido para `readMemberList` é erro de carga, distinto da lista vazia, com nova tentativa. Não chamar `membership.destroy` nem `organization.removeMember`. Não adicionar dependência. Os controles novos usam `Button` de `src/shared/ui`, operável por teclado, como Revogar e Reenviar.

**Checkpoint**: US1 utilizável para administrador; membro comum não vê o menu e não lista usuários

---

## Phase 4: User Story 2 - Editar o cargo de quem já pertence (Priority: P1)

**Goal**: O administrador troca só o cargo entre Administrador e Membro, na sessão, e a lista mostra o cargo confirmado.

**Independent Test**: Promover e rebaixar com pelo menos dois administradores atualiza a coluna e não mexe em nome, e-mail, status nem último acesso. O único administrador não é rebaixado. Falha da Clerk mantém o cargo anterior.

### Implementation for User Story 2

- [ ] T008 [US2] Em `src/features/team/components/TeamPage.tsx`, permitir trocar o cargo só de linha com `userId`. O controle oferece `org:member` (Membro) e `org:admin` (Administrador), validado por `isInviteRole` de `src/features/team/validation.ts`. Cargo inválido mostra exatamente `Escolha Administrador ou Membro.` e não chama a Clerk. Antes de gravar um cargo que não seja de administrador para um alvo administrador (`isOrganizationAdmin`), percorrer todas as páginas de `organization.getMemberships({ role: ['org:admin'], initialPage, pageSize: 10 })` e, se `lastAdminBlocked` for verdadeiro, mostrar exatamente `Não é possível rebaixar o último administrador.` sem chamar `membership.update`. Caso contrário, chamar só `membership.update({ role })` com `org:admin` ou `org:member`. Não chamar `organization.updateMember`. Sucesso em `role="status"` com exatamente `Cargo atualizado para {cargo}.` e recarregar a lista. Falha usa `clerkErrorMessage` em `role="alert"` e mantém o cargo anterior. Um único pedido, controle bloqueado até a resposta, com `Button` de `src/shared/ui`. Falha de rede mostra o alerta e não aplica o cargo; o administrador pode tentar de novo. Ignorar efeito se o `orgId` tiver mudado. Sessão expirada da Clerk continua no `signOut` já usado na tela, para `/sign-in?motivo=deslogado`. Nome, e-mail, status e último acesso não são enviados nessa ação.

**Checkpoint**: US1 e US2 na mesma tela; convites da LLT-167 continuam no outro bloco

---

## Phase 5: User Story 3 - Desativar, reativar e proteger o último administrador (Priority: P1)

**Goal**: Desativar grava a marca no Core e a pessoa continua na lista como Desativado. Reativar tira a marca. O único administrador não é desativado nem rebaixado. A própria pessoa desativada vê a frase combinada e permanece na sessão.

**Independent Test**: Desativar um membro deixa a linha como Desativado. Reativar volta a Ativo. Desativar o único administrador é recusado na tela ou pelo erro do Core, e o status continua Ativo. A frase de acesso desativado não encerra a sessão.

### Implementation for User Story 3

- [ ] T009 [US3] Em `src/features/team/components/TeamPage.tsx`, desativar e reativar só linha com `userId`, por `PUT` `${companyMembersPath}/${encodeURIComponent(userId)}` via `useApi`, com `buildMemberPut`. Desativar envia `deactivated`. Reativar envia `active`. Antes de desativar um alvo administrador, repetir a contagem de todas as páginas de `getMemberships({ role: ['org:admin'] })`. Se `lastAdminBlocked` for verdadeiro para `deactivate`, mostrar exatamente `Não é possível desativar o último administrador.` e não chamar o Core. Desativar quem não é administrador não usa essa trava. Desativar ou rebaixar a si mesmo segue a mesma contagem: com dois administradores ou mais, a ação segue; sendo o único, a trava recusa. Sucesso de desativar: `role="status"` com exatamente `Usuário desativado.` Sucesso de reativar: exatamente `Acesso reativado.` Recarregar a lista. `ApiError.code` `last_admin` mostra a `message` e mantém Ativo. Outra falha mostra a `message` e mantém o status anterior. Um único pedido por ação, controle bloqueado, com `Button` de `src/shared/ui` e rótulos visíveis `Desativar` e `Reativar`. Falha de rede mostra o alerta e não muda o status; o administrador pode tentar de novo. Ignorar efeito se o `orgId` tiver mudado. Não remover a associação. Quando o `GET` ou o `PUT` voltar `user_deactivated`, a tela mostra a `message` e não oferece convite, troca de cargo, desativar nem reativar. Não mudar `src/features/profile/`, `src/features/company/` nem `src/features/products/`: a frase chega por `apiRequest`.

**Checkpoint**: US1, US2 e US3 na mesma `/equipe`; a pessoa desativada continua membro da organização

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Conferir o limite da história e o roteiro

- [ ] T010 Rodar `npm test` e `npm run build` na raiz de `lhamalog-web`. Confirmar que `package.json` não ganhou dependência, que não surgiu rota nova além de `/equipe`, e que nenhum arquivo em `src/features/team/` chama `membership.destroy` ou `organization.removeMember`, nem contém `CLERK_SECRET_KEY`. Confirmar que `src/shared/services/useApi.ts` só chama `signOut` no 401.

- [ ] T011 Executar o roteiro manual de `specs/004-listar-editar-desativar-usuarios/quickstart.md` quando a instância Clerk e o Core alinhado a `specs/004-listar-editar-desativar-usuarios/contracts/company-members.md` estiverem disponíveis, e registrar naquele arquivo o que foi exercitado e o que ficou bloqueado por ambiente. Se o Core tiver publicado outro caminho ou outros nomes, alinhar o contrato antes de dar o roteiro por encerrado. Não criar atalho de autenticação, chave secreta nem configuração de dashboard.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências
- **Foundational (Phase 2)**: T002 e T003 podem correr em paralelo com T001. T004 depende de T001 e T002. T005 depende de T002. T006 depende de T003. T004, T005 e T006 bloqueiam todas as histórias
- **User Stories (Phase 3+)**: dependem da Phase 2
- **Polish (Phase 6)**: T010 e T011 dependem das histórias entregues

### User Story Dependencies

- **User Story 1 (P1)**: começa após a Phase 2. Não depende de US2 nem US3.
- **User Story 2 (P1)**: depende de T007, porque o controle fica na mesma `TeamPage.tsx`. Não depende de US3.
- **User Story 3 (P1)**: depende de T008, porque desativar, reativar e a troca de cargo compartilham a mesma tela e o mesmo bloqueio de pedido.

### Within Each User Story

- Testes da Phase 2 ficam escritos antes da implementação que eles cobrem
- Funções puras e contrato antes da tela
- A frase de `api.ts` antes da tela tratar `user_deactivated`
- História completa antes da próxima prioridade que edita o mesmo arquivo

### Parallel Opportunities

- T001, T002 e T003 podem correr em paralelo
- T004 e T005 podem correr em paralelo depois de T002
- T006 pode correr em paralelo com T004 e T005
- T007, T008 e T009 editam o mesmo arquivo e não correm em paralelo
- T010 espera as histórias. T011 espera T010 e o ambiente

---

## Parallel Example: Foundational

```bash
# Testes e tipos, arquivos diferentes:
Task: "Tipos da linha em src/features/team/types.ts"
Task: "Regras puras em tests/team-members.test.mjs"
Task: "Frase de acesso desativado em tests/api.test.mjs"

# Depois dos testes da junção:
Task: "Funções puras em src/features/team/members.ts"
Task: "Contrato em src/features/team/memberContract.ts"
Task: "code user_deactivated em src/shared/services/api.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar a Phase 1
2. Completar a Phase 2
3. Completar a Phase 3
4. Parar e validar a lista com as cinco colunas, sem ainda trocar cargo nem desativar

### Incremental Delivery

1. Setup e fundação prontos
2. US1 mostra a lista e os convites na mesma `/equipe`
3. US2 troca só o cargo, com a trava local de rebaixamento
4. US3 grava e retira a marca no Core, com a trava local e a recusa `last_admin`
5. Polish roda o automático e deixa o manual registrado

### Parallel Team Strategy

1. Uma pessoa fecha tipos, testes e funções puras
2. Outra estende `api.ts` com o `code`, em arquivo diferente
3. A tela fica com uma pessoa, na ordem US1, US2, US3

---

## Notes

- [P] marca arquivos diferentes, sem depender de tarefa incompleta
- US2 e US3 não levam [P] porque editam `TeamPage.tsx` depois de US1
- O Core que recusa a próxima requisição e que recusa o último administrador que ele conhece não é implementado neste repositório. T011 confere isso quando o contrato estiver no ar
- O contrato esperado pode mudar de nome antes de T005 se o Core publicar `specs/005-listar-editar-usuarios/contracts/`. A tarefa de alinhar está em T011 e no cabeçalho de `contracts/company-members.md`
- Cada história continua testável: US1 não precisa da troca de cargo; US2 não precisa da marca; US3 usa a mesma tela, mas a marca é um `PUT` distinto
