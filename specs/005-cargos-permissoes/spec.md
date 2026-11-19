# Feature Specification: Cargos e permissões (Web)

**Feature Branch**: `LLT-120-cargos-permissoes` (no `lhamalog-web`; o Pedro cria a branch pelo GitHub Desktop)

**Created**: 2026-11-17

**Status**: Draft (pré-preenchida; passa por clarify e analyze no Claude Code)

**Input**: telas da LLT-120 Cargos e permissões. O contrato do Core está em `lhamalog-core/specs/011-cargos-permissoes/contracts/api.md` (o pacote dizia 009; no Core a 009 já era da LLT-178), que é a fonte da verdade. A cópia em `contracts/core-api.md` é só para leitura e foi atualizada em 18/11.

**Base**: ADRs sem chave secreta (decisão do Pedro em 17/11/2026):

- papéis de acesso Dono, Administrador e Membro;
- cargos de notificação;
- acesso por produto;
- a Clerk continua só com `admin` e `member`;
- a troca de cargo na Clerk continua pelo SDK do navegador (LLT-168).

## Clarifications

- **W1** [RESPONDIDA em 18/11, ver Session 2026-11-18]: Os cargos de notificação ficam numa rota nova, `/equipe/cargos`, com aba "Cargos" na tela Equipe, ou numa seção dentro da própria `/equipe`?
  - **Recomendação:** rota nova `/equipe/cargos`, com abas "Pessoas" e "Cargos" no topo da tela Equipe. A `/equipe` fica do tamanho que já tem.
- **W2** [RESPONDIDA em 18/11, ver Session 2026-11-18]: A tela "Permissões" (só leitura da matriz) entra nesta entrega?
  - **Recomendação:** sim, como P3 e numa aba "Permissões", só com a tabela que vem de `GET /api/company/access`.
- **W3** [RESPONDIDA em 18/11, ver Session 2026-11-18]: As telas mudam o `TeamPage.tsx` (LLT-168, do Vinicius) e o fluxo de convite (LLT-167). Pode?
  - **Recomendação:** sim, com o menor recorte possível, avisando o Vinicius no PR.
  - A integração com a Clerk é do Felipe (`docs/instrucoes-agentes.md`). Esta entrega usa só chamadas que já existem (`organization.inviteMember`, `updateMember`) e só limita as opções mostradas.

### Session 2026-11-18

Clarify feito sem o Pedro presente, a pedido dele. Cada resposta é a recomendação aplicada e **aguarda a confirmação do Pedro**. As marcadas com ⚠ nasceram do clarify do Core (C1 de 18/11: o Dono é o `member` DONO da LLT-163, só lido; nenhum "primeiro admin vira Dono").

- Q: Onde ficam os cargos de notificação no Web? (W1) → A: Rota nova `/equipe/cargos`, com abas "Pessoas", "Cargos" e "Permissões" no topo da Equipe.
- Q: A tela de leitura da matriz entra agora? (W2) → A: Sim, como P3, na aba "Permissões" (`/equipe/permissoes`).
- Q: Pode mexer na `TeamPage.tsx` (LLT-168) e no convite (LLT-167)? (W3) → A: Sim, com o menor recorte, avisando o Vinicius e o Felipe no PR.
- Q: ⚠ Sem fluxo de compra, nenhuma empresa tem Dono. Quem convida Administrador enquanto isso? (W4) → A: Enquanto a empresa não tiver Dono (`ownerUserId` nulo), o Administrador continua podendo convidar e reenviar convite de Administrador, como hoje (LLT-167). Quando houver Dono, só ele convida Administrador (ADR_114, US3). Sem isso, a feature tiraria de todas as empresas atuais a possibilidade de convidar Administrador.
- Q: ⚠ O que o Web mostra para um Administrador numa empresa sem Dono? (W5) → A: `ADMIN`, sem selo de Dono em ninguém. O cenário 1 da US1 do pacote ("Administrador numa empresa sem Dono recebe OWNER") deixa de valer.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - O Web sabe o meu papel (Priority: P1)

Como pessoa da empresa, quero que o menu e as telas mostrem só o que o meu papel permite.

**Independent Test**: Ao abrir o workspace, o Web chama `GET /api/company/access/me` e guarda o papel e as permissões. O Membro não vê o item "Equipe". O Dono e o Administrador veem.

**Acceptance Scenarios**:

1. **Given** a pessoa é o `member` DONO e entra com token de administrador, **When** o workspace abre, **Then** o Web chama `access/me`, recebe `OWNER` e a Equipe mostra "Dono" na linha dela. Um Administrador numa empresa sem Dono recebe `ADMIN` (W5).
2. **Given** um Membro, **When** o workspace abre, **Then** o item "Equipe" não aparece. Se ele abrir `/equipe` direto, vê a negação simples e continua logado.
3. **Given** a troca de organização, **When** a empresa muda, **Then** o Web chama `access/me` de novo e descarta o papel anterior.
4. **Given** `access/me` falha (rede ou 5xx), **When** a tela carrega, **Then** aparece o estado de erro com "Tentar novamente", e nenhuma ação de gestão é liberada.

---

### User Story 2 - Dono identificado e protegido na Equipe (Priority: P1)

Como Dono ou Administrador, quero ver quem é o Dono na lista de pessoas, e não quero conseguir rebaixá-lo ou desativá-lo.

**Independent Test**: Na `/equipe`, a linha do Dono mostra o cargo "Dono". Os botões de rebaixar e desativar não aparecem nessa linha. Se o Core responder `owner_protected`, a mensagem aparece.

**Acceptance Scenarios**:

1. **Given** `GET /api/company/access` traz `ownerUserId`, **When** a lista abre, **Then** a linha dessa pessoa mostra "Dono" no lugar de "Administrador", e as ações de cargo e desativação ficam ocultas.
2. **Given** o Core responde 403 `owner_protected`, **When** alguém tenta desativar, **Then** o Web mostra "Não é possível desativar o Dono da empresa." e não muda a linha.
3. **Given** alguém tenta rebaixar o Dono, **When** a ação seria enviada, **Then** o Web mostra "Não é possível rebaixar o Dono da empresa." e não chama `organization.updateMember`.

---

### User Story 3 - Convite respeita o papel de quem convida (Priority: P1)

Como Administrador que não é Dono, só posso convidar como Membro (ADR_114, USID_029.1 FA03).

**Acceptance Scenarios**:

1. **Given** quem convida é o Dono, ou um Administrador numa empresa ainda sem Dono (W4), **When** abre o convite, **Then** vê "Administrador" e "Membro".
2. **Given** quem convida é Administrador e a empresa tem Dono, **When** abre o convite, **Then** só vê "Membro", com o texto "Depois do aceite, você pode promover a pessoa a Administrador."
3. **Given** a empresa tem Dono e o convite é de Administrador, **When** quem reenvia é um Administrador, **Then** o reenvio fica bloqueado com "Só o Dono reenvia convite de Administrador.".

---

### User Story 4 - Acesso aos produtos de um Membro (Priority: P1)

Como Dono ou Administrador, quero marcar quais produtos cada Membro acessa (USID_030.1).

**Independent Test**: Na linha de um Membro, a ação "Produtos" abre um painel com a lista de produtos da empresa (`GET /api/products`, inclusive arquivados) e marca os que ele já acessa (`GET /api/company/members/{userId}/products`). Salvar envia o `PUT`.

**Acceptance Scenarios**:

1. **Given** um Membro com A liberado, **When** o painel abre, **Then** A aparece marcado e B e C desmarcados.
2. **Given** o administrador marca B e salva, **When** o `PUT` responde 200, **Then** aparece "Acessos atualizados." e o painel reflete a resposta.
3. **Given** o alvo é Dono ou Administrador, **When** a linha aparece, **Then** a ação "Produtos" mostra "Acessa todos os Produtos." sem caixas de marcar. Se o Core responder `full_access`, a mesma frase aparece.
4. **Given** o Core responde `product_not_found`, **When** salvar, **Then** o Web recarrega a lista de produtos e mostra "Um produto não existe mais nesta empresa. Confira a lista.".
5. **Given** a empresa não tem produtos, **When** o painel abre, **Then** mostra o estado vazio "Nenhum produto cadastrado.".

---

### User Story 5 - Catálogo de cargos de notificação (Priority: P2)

Como Dono ou Administrador, quero criar, renomear, configurar e excluir cargos de notificação (USID_052).

**Independent Test**: Na aba "Cargos" (W1), a lista vem de `GET /api/company/notification-roles`.

- Os cargos Dono e Administrador mostram o selo "Padrão, não editável" e não têm ações.
- Gestor, Supervisor e Membro mostram o selo "Padrão" e são editáveis.
- "Novo cargo" pede o nome, as gravidades (Erro, Alerta, Informação) e os tipos (Ocorrência, Estado crítico, Alerta do sistema).

**Acceptance Scenarios**:

1. **Given** a aba abre, **When** a lista carrega, **Then** aparecem os cinco cargos padrão e os personalizados, sem os excluídos.
2. **Given** nome, pelo menos uma gravidade e um tipo, **When** o administrador cria, **Then** o cargo entra na lista com "Cargo criado.".
3. **Given** o Core responde `role_name_in_use`, **When** o administrador salva, **Then** a mensagem aparece no campo nome.
4. **Given** o administrador edita o nome, as gravidades ou os tipos, **When** salva, **Then** o Web envia a `version` atual. Um 409 de versão mostra "Os dados foram alterados. Recarregue antes de salvar novamente." e recarrega o cargo.
5. **Given** o administrador exclui, **When** confirma no diálogo ("A exclusão é definitiva. As pessoas deste cargo deixam de receber os alertas dele."), **Then** o cargo some da lista.
6. **Given** as gravidades ficariam vazias, **When** o administrador tenta salvar, **Then** o Web recusa com "Escolha pelo menos uma gravidade." sem chamar o Core. O mesmo vale para os tipos.

---

### User Story 6 - Atribuir cargo a uma pessoa (Priority: P2)

Como Dono ou Administrador, quero incluir e retirar pessoas de cada cargo e ver os cargos de cada pessoa.

**Acceptance Scenarios**:

1. **Given** um cargo editável, **When** o administrador abre "Pessoas" do cargo, **Then** vê os membros da organização (Clerk) com caixas de marcar, já marcadas para quem está no cargo.
2. **Given** ele marca ou desmarca uma pessoa, **When** a ação termina, **Then** o Web chama `POST` ou `DELETE .../members/{userId}` e mostra "Cargo atualizado.".
3. **Given** o cargo é Dono ou Administrador, **When** abre "Pessoas", **Then** o Web mostra só a leitura: "As pessoas deste cargo vêm do papel de acesso." e a lista montada pelo papel.
4. **Given** a linha de uma pessoa na `/equipe`, **When** a lista carrega, **Then** a coluna "Cargos" mostra os nomes vindos de `GET /api/company/members/{userId}/notification-roles`. O carregamento é sob demanda, ao abrir o detalhe, para não fazer uma chamada por linha.

---

### User Story 7 - Ver a matriz de permissões (Priority: P3)

Como Dono ou Administrador, quero ver o que cada papel pode fazer (W2).

**Acceptance Scenarios**:

1. **Given** a aba "Permissões", **When** abre, **Then** mostra uma tabela (Permissão × Dono, Administrador, Membro) vinda de `GET /api/company/access`, com os nomes das permissões em português (mapa no Web) e a observação "Só nos produtos liberados" onde houver.
2. A tabela é só de leitura e não tem botão de editar. A ADR_123 não prevê papéis customizados de acesso.

### Edge Cases

- **Pessoa desativada:** o Core responde 403 `user_deactivated`, e o Web segue a regra que já existe da LLT-168.
- **Troca de empresa no meio de uma ação:** descartar o resultado, no mesmo padrão `sameOrganization` do `TeamPage`.
- **Contagem de último administrador (LLT-168):** continua igual. O Dono conta como administrador ativo.
- **Chave da Clerk:** nenhuma chave secreta no front (ADR_026). Só `VITE_CLERK_PUBLISHABLE_KEY`.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-W01**: Ao abrir o workspace e a cada troca de organização, o Web MUST chamar `GET /api/company/access/me` e guardar `role` e `permissions` num contexto (`AccessProvider`).
- **FR-W02**: Os itens de menu e as ações MUST depender das permissões, não do `orgRole` da Clerk:
  - "Equipe" exige `MEMBERS_VIEW`;
  - acesso por produto exige `PRODUCT_ACCESS_MANAGE`;
  - cargos exigem `NOTIFICATION_ROLES_MANAGE`.
- **FR-W03**: A lista de pessoas MUST mostrar "Dono" para o `ownerUserId` e MUST ocultar as ações de rebaixar e desativar nessa linha. As mensagens `owner_protected` MUST ser mostradas.
- **FR-W04**: O convite MUST oferecer "Administrador" quando o papel de quem convida é `OWNER` (`MEMBERS_INVITE_ADMIN`) ou quando a empresa ainda não tem Dono e quem convida é `ADMIN` (W4).
- **FR-W05**: O painel "Produtos" de um Membro MUST ler e gravar pelo contrato do Core. Para Dono e Administrador, o painel MUST mostrar "Acessa todos os Produtos.".
- **FR-W06**: A aba "Cargos" MUST listar, criar, renomear, trocar listas e excluir cargos, e MUST incluir e retirar pessoas. Tudo pelo contrato do Core, com `version` nas edições.
- **FR-W07**: Os rótulos MUST seguir este mapa:
  - `ERROR` = Erro, `WARNING` = Alerta, `INFO` = Informação;
  - `OCCURRENCE` = Ocorrência, `CRITICAL_STATE` = Estado crítico, `SYSTEM_ALERT` = Alerta do sistema;
  - `OWNER` = Dono, `ADMIN` = Administrador, `MEMBER` = Membro.
- **FR-W08**: A leitura das respostas do Core MUST ser validada por funções puras (no padrão do `memberContract.ts`), com testes em `tests/*.test.mjs`.
- **FR-W09**: O Web MUST NOT usar chave secreta, MUST NOT criar chamada nova à Clerk além das que já existem, e MUST NOT mudar o fluxo de login.

## Success Criteria *(mandatory)*

- **SC-W01**: Um Membro nunca vê "Equipe" nem ações de gestão.
- **SC-W02**: Um Administrador configura os produtos de um Membro em até 1 minuto.
- **SC-W03**: Nenhuma tela permite rebaixar ou desativar o Dono.
- **SC-W04**: `npm test` e `npm run build` ficam verdes.

## Assumptions

- O Core da `LLT-120-cargos-permissoes` precisa estar rodando localmente para o roteiro manual.
- As telas seguem os componentes de `src/shared/ui` e o padrão visual que já existe. As telas do Figma ("Permissões" e "Acesso dos Gestores aos Produtos") são só inspiração: os perfis editáveis delas não valem (ADR_123).
