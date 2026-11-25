# Feature Specification: Aviso de ocorrências novas na tela

**Feature Branch**: `LLT-137-atualizacao-em-tempo-real`

**Created**: 25/11/2026

**Status**: Draft

**Input**: User description: "Feature LLT-137 (Atualização em tempo real, épico LLT-104): LLT-208 atualizar a lista quando surgir ocorrência nova. Nova ocorrência aparece ou é sinalizada em poucos segundos via WebSocket; se a conexão cair, a página reconecta e sincroniza. Core: spec 015 do lhamalog-core."

## Contexto

- A lista é a da spec 008 (LLT-135), com a situação da spec 013 (LLT-136). O Core é a spec `015-tempo-real-ocorrencias` do lhamalog-core (contrato `contracts/websocket.md` de lá).
- Esta branch sai da `LLT-136-ciclo-de-vida` (PR #19 do web, empilhado sobre o #18). O PR é empilhado sobre o #19.

## Clarifications

### Session 2026-11-25

- Q: Como a lista reage? → A: Aviso "N ocorrências novas · Atualizar" no topo; a lista só muda quando a pessoa clica (Felipe, 25/11).
- Q: O que conta? → A: Ocorrências criadas e reabertas pelo Finder (Felipe, 25/11).
- Q: Como autenticar? → A: Token da Clerk numa mensagem logo depois de conectar, renovado antes de vencer; nunca na URL (Felipe, 25/11).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver o aviso de ocorrências novas (Priority: P1)

Com a lista aberta, a pessoa vê surgir no topo "2 ocorrências novas · Atualizar" quando o Finder grava ou reabre ocorrências que ela veria. Ao clicar, a lista volta para a página 1 com os filtros atuais e o aviso some.

**Why this priority**: é o pedido do card.

**Independent Test**: quickstart T1 a T5.

**Acceptance Scenarios**:

1. **Given** a lista aberta em Ativas, **When** chegam avisos de ocorrências criadas ou reabertas de produtos do filtro (ou de qualquer produto, sem filtro de produto) e de tipos do filtro, **Then** aparece "1 ocorrência nova · Atualizar" (ou "N ocorrências novas"), contando cada ocorrência uma vez.
2. **Given** o aviso visível, **When** a pessoa clica em "Atualizar", **Then** a lista recarrega na página 1 com os mesmos filtros, busca e tamanho, e o aviso some.
3. **Given** a situação Arquivadas, **When** chegam avisos, **Then** o aviso não aparece (novas e reabertas não estão arquivadas).
4. **Given** um aviso de produto ou tipo fora do filtro, **When** ele chega, **Then** não conta.
5. **Given** o detalhe aberto, **When** chegam avisos, **Then** nada muda no detalhe; ao voltar para a lista, o aviso aparece se houver novidades.

---

### User Story 2 - Reconectar e sincronizar (Priority: P1)

Se a conexão cair, a tela tenta de novo sozinha, com espera crescente. Ao voltar, ela confere a primeira página e mostra o aviso se algo mudou enquanto estava desconectada.

**Why this priority**: é o segundo critério do card; sem isso, um aviso perdido esconderia ocorrências.

**Independent Test**: quickstart T6 e T7.

**Acceptance Scenarios**:

1. **Given** a conexão caiu, **When** passam alguns segundos, **Then** a tela tenta reconectar em 1 s, 2 s, 4 s… até 30 s entre tentativas, sem recarregar a página.
2. **Given** desconectada há mais de 10 s, **When** a pessoa olha a lista, **Then** vê discretamente "Atualização automática pausada. Reconectando…".
3. **Given** a reconexão, **When** a primeira página com os filtros atuais tem itens que a lista mostrada não tinha (ou total maior), **Then** aparece "Há ocorrências novas · Atualizar".
4. **Given** o Core recusou a autenticação (4403), **When** isso acontece, **Then** a tela para de tentar e não mostra erro na lista (a lista continua funcionando como antes).
5. **Given** a aba fica em segundo plano, **When** volta, **Then** a conexão continua ou é refeita com a sincronização.

---

### Edge Cases

- Vários avisos da mesma ocorrência (reaberta duas vezes): conta uma.
- A pessoa troca de empresa: a conexão é refeita com o token novo (a tela remonta com a empresa, spec 008).
- Sair da tela de ocorrências: a conexão fecha.
- Core sem a spec 015 (`/ws/occurrences` inexistente): a tela tenta com espera crescente e não mostra erro além do aviso de pausa.
- Renovação do token falha (sessão encerrada): a regra de sessão da spec 006 continua valendo nas chamadas `/api`; o WebSocket só fecha.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A tela de lista MUST abrir uma conexão com `/ws/occurrences` do Core (mesmo endereço da API, com `ws`/`wss`) e autenticar mandando o token de sessão em mensagem; o token MUST NOT ir na URL.
- **FR-002**: A tela MUST renovar o token na conexão antes de vencer (a cada 50 s).
- **FR-003**: A tela MUST contar os avisos `CREATED`/`REOPENED` que batem com os filtros de produto e tipo, só na situação Ativas, sem repetir ocorrência, e mostrar "1 ocorrência nova" ou "N ocorrências novas" com o botão "Atualizar" num `aria-live`.
- **FR-004**: "Atualizar" MUST recarregar a lista na página 1 com os filtros atuais e zerar a contagem; mudar filtros, página ou situação também MUST zerar a contagem.
- **FR-005**: Conexão perdida MUST ser refeita com espera de 1, 2, 4, 8, 16 e no máximo 30 s; fechamento 4403 MUST parar as tentativas.
- **FR-006**: Depois de reconectar, a tela MUST consultar a primeira página com os filtros atuais e mostrar "Há ocorrências novas · Atualizar" se houver item ou total que a lista mostrada não tinha.
- **FR-007**: Desconectada por mais de 10 s, a tela MUST mostrar "Atualização automática pausada. Reconectando…" sem bloquear a lista.
- **FR-008**: A conexão MUST fechar ao sair da lista ou trocar de empresa.

### Key Entities

- **Aviso recebido**: mudança, ocorrência, produto, tipo.
- **Novidades pendentes**: ocorrências avisadas desde a última atualização da lista.

## Success Criteria *(mandatory)*

- **SC-001**: O aviso aparece em até 3 s depois da gravação, com o Core local.
- **SC-002**: Em 100% dos testes de queda do Core, a tela reconecta sozinha em até 30 s depois de o Core voltar.
- **SC-003**: Em 100% dos testes, uma ocorrência gravada durante a desconexão é sinalizada depois da reconexão.

## Assumptions

- A busca e o período não entram no filtro do aviso (o aviso não traz texto nem datas); o "Atualizar" mostra o resultado real.
- O detalhe não recebe avisos nesta entrega.
- Sem som ou notificação do navegador.
