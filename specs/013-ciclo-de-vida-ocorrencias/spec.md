# Feature Specification: Ciclo de vida da ocorrência na tela (alterar status e arquivar)

**Feature Branch**: `LLT-136-ciclo-de-vida`

**Created**: 25/11/2026

**Status**: Draft

**Input**: User description: "Feature LLT-136 (Ciclo de vida, épico LLT-104): LLT-206 alterar status da ocorrência, só com os status aprovados e registrando quem fez e quando; LLT-207 arquivar ocorrência, que sai da lista padrão, aparece no filtro de arquivadas e pode ser desarquivada. Tela sobre a spec 008 (lista e detalhe) e o Core da spec 014 do lhamalog-core."

## Contexto

- Continua a spec `008-lista-detalhe-ocorrencias` (LLT-135). O Core é a spec `014-ciclo-de-vida-ocorrencias` do lhamalog-core (contrato em `contracts/api.md` de lá).
- Esta branch sai da `LLT-135-lista-e-detalhe` (PR #18 do web). O PR é empilhado sobre o #18.

## Clarifications

### Session 2026-11-25

- Q: Quais status a tela oferece? → A: Aberta, Em análise e Fechada (ADR_082), de qualquer um para qualquer outro (Felipe, 25/11; spec 014 do core).
- Q: Quem vê os botões? → A: Quem tem a permissão `OCCURRENCES_MANAGE` da matriz da LLT-120: Dono, Administrador e Membro (este só vê ocorrências dos produtos liberados) (Felipe, 25/11).
- Q: Ocorrência arquivada que volta a acontecer? → A: O Core desarquiva e reabre; a tela só mostra o resultado (Felipe, 25/11).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Alterar o status no detalhe (Priority: P1)

No detalhe, o usuário escolhe Aberta, Em análise ou Fechada e confirma. O status novo aparece na hora, o histórico ganha a mudança com o nome de quem fez e a data, e ao voltar para a lista o item mostra o status novo.

**Why this priority**: é o tratamento básico da ocorrência.

**Independent Test**: quickstart S1 a S5.

**Acceptance Scenarios**:

1. **Given** o detalhe de uma ocorrência Aberta, **When** o usuário escolhe Em análise e clica em "Alterar status", **Then** o selo vira Em análise, o histórico ganha "Aberta → Em análise" com o nome (ou id) do usuário e a data, e aparece "Status alterado".
2. **Given** o mesmo status escolhido, **When** o usuário olha o botão, **Then** "Alterar status" fica desabilitado.
3. **Given** que a ocorrência mudou desde que o detalhe abriu (409 `occurrence_changed`), **When** o usuário confirma, **Then** aparece "A ocorrência mudou desde que você abriu. Recarregue e tente de novo." com o botão "Recarregar", sem perder a sessão.
4. **Given** um usuário sem a permissão `OCCURRENCES_MANAGE` (ou acesso ainda carregando ou com erro), **When** ele abre o detalhe, **Then** não vê o seletor nem os botões de ação.
5. **Given** uma falha de rede ou 5xx, **When** o usuário confirma, **Then** aparece a mensagem de erro e o status continua o de antes.

---

### User Story 2 - Arquivar, ver arquivadas e desarquivar (Priority: P2)

No detalhe, o usuário arquiva a ocorrência; ela some da lista padrão. Na lista, ele escolhe ver as arquivadas, abre uma e desarquiva.

**Why this priority**: limpa a lista.

**Independent Test**: quickstart S6 a S10.

**Acceptance Scenarios**:

1. **Given** o detalhe de uma ocorrência ativa, **When** o usuário clica em "Arquivar", **Then** aparece o selo "Arquivada", a data e quem arquivou, e o botão vira "Desarquivar".
2. **Given** a lista, **When** o usuário escolhe "Arquivadas" no seletor de situação, **Then** a lista mostra só as arquivadas, com os outros filtros mantidos, e o endereço guarda a escolha (`situacao=arquivadas`).
3. **Given** o detalhe de uma arquivada, **When** o usuário clica em "Desarquivar", **Then** o selo some e ela volta para a lista padrão.
4. **Given** a lista de arquivadas vazia, **When** ela aparece, **Then** a mensagem é "Nenhuma ocorrência arquivada".
5. **Given** 409 ou falha, **When** o usuário arquiva ou desarquiva, **Then** valem as mesmas mensagens da US1.

---

### Edge Cases

- Usuário clica duas vezes: o botão fica desabilitado enquanto a chamada roda.
- Voltar para a lista depois de uma ação mostra o estado novo (a lista é consultada de novo).
- Membro sem acesso ao produto não chega ao detalhe (404 da spec 008).
- Core antigo sem a spec 014: o detalhe não traz `revision`; a tela esconde as ações.
- Tela estreita: seletor e botões em uma coluna.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O detalhe MUST oferecer, para quem tem `OCCURRENCES_MANAGE`, um seletor com Aberta, Em análise e Fechada e o botão "Alterar status", desabilitado quando o status escolhido é o atual.
- **FR-002**: Alterar o status MUST chamar `PUT /api/occurrences/{id}/status` com a revisão do detalhe e MUST mostrar o detalhe devolvido (status, histórico, revisão).
- **FR-003**: O histórico MUST mostrar o autor de cada mudança: "Sistema" para o Finder e, para usuários, o nome do membro da organização quando conhecido, senão o id.
- **FR-004**: O detalhe MUST oferecer "Arquivar" ou "Desarquivar" conforme a situação, chamando `POST /api/occurrences/{id}/archive` ou `/unarchive` com a revisão, e MUST mostrar o selo "Arquivada", a data e quem arquivou.
- **FR-005**: A lista MUST ter o seletor de situação "Ativas" (padrão) e "Arquivadas", guardado no endereço como `situacao=arquivadas` e enviado ao Core como `archived=true`; trocar a situação MUST voltar à página 1 e manter os demais filtros. "Limpar filtros" MUST voltar para Ativas.
- **FR-006**: O 409 `occurrence_changed` MUST mostrar a mensagem do Core e o botão "Recarregar"; nenhuma ação MUST encerrar a sessão (só a regra de recusa de segurança da spec 006 encerra).
- **FR-007**: Durante a chamada, os controles de ação MUST ficar desabilitados; depois, a tela MUST anunciar o resultado ("Status alterado", "Ocorrência arquivada", "Ocorrência desarquivada") num `aria-live`.
- **FR-008**: A matriz de permissões (LLT-120, aba Permissões da Equipe) MUST rotular `OCCURRENCES_MANAGE` como "Alterar status e arquivar ocorrências", e o modo legado (Core sem LLT-120) MUST incluir a permissão para administrador e membro.

### Key Entities

- **Ação na ocorrência**: status escolhido ou arquivar/desarquivar, com a revisão vista.
- **Situação da lista**: ativas ou arquivadas, no endereço.

## Success Criteria *(mandatory)*

- **SC-001**: O usuário altera o status em 2 cliques a partir do detalhe.
- **SC-002**: Em 100% dos testes, depois de arquivar, a ocorrência não aparece na lista padrão e aparece em "Arquivadas".
- **SC-003**: Em 100% dos testes de conflito, a tela mostra a mensagem de recarregar e não mostra um status que não está gravado.
- **SC-004**: O resultado de uma ação aparece em até 1 s com o Core local.

## Assumptions

- Sem confirmação extra para arquivar: é reversível.
- Sem ações em lote nem comentário na mudança de status.
- O nome do autor vem dos membros da organização na Clerk (`organization.getMemberships`), já usado pela tela de Equipe; se não vier, mostra o id.
