---
description: "Task list for the profile hub"
---

# Tasks: Melhorar a tela de perfil do usuário

**Input**: Design documents from `specs/295-melhorar-a-tela-de-perfil-do-usuario/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/user-profile.md, quickstart.md

**Tests**: pedidos nesta rodada. A suíte é `node --test tests/*.test.mjs` e importa `.ts`. Escrever o teste, vê-lo falhar, e só então implementar.

**Organization**: tarefas por história, para cada uma poder ser implementada e testada à parte.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivo diferente, sem depender de tarefa incompleta)
- **[Story]**: história a que a tarefa pertence (US1…US5)
- A descrição inclui o caminho do arquivo

## Path Conventions

- Aplicativo único: `src/` e `tests/` na raiz
- Hub em `src/features/profile/`. Notificações continuam em `src/features/notificationPreferences/`

## Phase 1: Setup

**Purpose**: não criar pacote nem runner novo

- [X] T001 Manter `package.json` sem dependência nova e com `npm test` em `node --test tests/*.test.mjs`

---

## Phase 2: Foundational

**Purpose**: regras puras de que todas as histórias dependem

**⚠️ CRITICAL**: nenhuma história começa antes desta fase

### Tests

- [X] T002 [P] Estender `tests/profile.test.mjs`: leitura sem `bio` e sem `jobTitle` continua válida e vale `""`; o `PUT` envia os dois; a confirmação exige o eco; bio acima de 160, cargo (`jobTitle`) acima de 80, quebra de linha e outro caractere de controle (`U+0000`–`U+001F` e `U+007F`) são recusados; só espaços vira `""`
- [X] T003 [P] Criar `tests/profile-hub.test.mjs` para aparência (`light`, `dark`, `system`), sessão em uso sem revogação, `profilePhotoSrc` só com `hasImage`, filtro de fuso por nome ou deslocamento e papel `org:admin` / `org:member`

### Implementation

- [X] T004 Acrescentar `bio` e `jobTitle` em `src/features/profile/types.ts`
- [X] T005 [P] Depois de T004, ler campo ausente como `""`, enviar sempre `bio` e `jobTitle` e confirmar o eco em `src/features/profile/contract.ts`
- [X] T006 [P] Depois de T004, validar bio até 160 e `jobTitle` até 80, texto puro como o nome, em `src/features/profile/validation.ts`
- [X] T007 [P] Gravar e ler tema e acessibilidade só no `localStorage` em `src/features/profile/appearance.ts`, sem incluir esses campos no `PUT` e sem apagar as chaves ao trocar de empresa
- [X] T008 [P] Marcar a sessão em uso e impedir a revogação dela em `src/features/profile/sessions.ts`
- [X] T009 [P] Devolver a foto só quando `hasImage` for verdadeiro em `src/features/profile/photo.ts`
- [X] T010 [P] Filtrar fusos por nome ou deslocamento e expor o deslocamento atual em `src/features/profile/timeZones.ts`
- [X] T011 [P] Mapear `org:admin` e `org:member` para chave de mensagem e tratar data ausente em `src/features/profile/membership.ts`

**Checkpoint**: `npm test` cobre o contrato, a validação, a aparência, a sessão, a foto, o fuso e o papel

---

## Phase 3: User Story 1 - Reconhecer a conta e editar o que é da pessoa (Priority: P1) 🎯 MVP

**Goal**: cartão, hub com uma seção por vez e edição de nome, bio e cargo, com a mesma foto no cabeçalho

**Independent Test**: abrir `/perfil`, ler o cartão, editar nome, bio e cargo, salvar, reabrir, trocar a foto e ver a mesma imagem no cabeçalho sem novo login

- [X] T012 [US1] Acrescentar nos catálogos `pt-BR` e `en` de `src/features/profile/messages.ts` as frases do cartão, dos nomes das cinco seções, de Editar, bio, cargo e dos erros de tamanho e de quebra de linha
- [X] T013 [US1] Montar o hub em `src/features/profile/components/ProfilePage.tsx`: Conta ao abrir, uma seção por vez, lista vertical em janela larga, abas ou seletor em janela estreita, teclado e rótulo visível na seção ativa, cartão sempre visível; sem empresa selecionada, não chama perfil nem notificações
- [X] T014 [US1] Implementar leitura e edição em `src/features/profile/components/AccountSection.tsx`: só nome, bio e cargo editáveis depois de Editar; e-mail, função, empresa e membro desde somente leitura via `src/features/profile/membership.ts`; salvar envia bio e `jobTitle` e impede um segundo envio até a resposta; recusa mostra o erro, não anuncia sucesso e mantém o rascunho; cancelar restaura o último valor gravado; resposta de pedido abandonado é descartada
- [X] T015 [US1] Trocar a foto com `user.setProfileImage({ file })` em `src/features/profile/components/AccountSection.tsx`, usando `src/features/profile/photo.ts`, sem ação de remover; falha mantém a foto anterior
- [X] T016 [US1] Mostrar a mesma foto no cabeçalho: `src/shared/ui/Avatar.tsx` aceita a imagem, `src/app/layouts/HeaderControls.tsx` a repassa e `src/app/layouts/CompanyWorkspace.tsx` envia `imageUrl` só quando `hasImage` for verdadeiro; sem foto, cartão e cabeçalho mostram as iniciais

**Checkpoint**: a história 1 funciona com as outras seções ainda vazias, mas alcançáveis

---

## Phase 4: User Story 2 - Ajustar idioma, fuso, tema e acessibilidade (Priority: P1)

**Goal**: fuso buscável e aparência só neste navegador

**Independent Test**: buscar um fuso, ver deslocamento e pré-visualização, salvar e reabrir; escolher tema e acessibilidade, recarregar neste navegador e ver o efeito fora do `PUT`

- [X] T017 [P] [US2] Acrescentar nos dois catálogos de `src/features/profile/messages.ts` as frases de idioma, fuso, pré-visualização, tema e acessibilidade
- [X] T018 [US2] Implementar `src/features/profile/components/PreferencesSection.tsx` com a busca de `src/features/profile/timeZones.ts`, a pré-visualização local e o salvamento que reenvia nome, bio e `jobTitle` já confirmados, com um envio por vez; cancelar restaura só idioma e fuso; resposta de pedido abandonado é descartada
- [X] T019 [P] [US2] Aplicar `src/features/profile/appearance.ts` em `document.documentElement` a partir de `src/app/layouts/CompanyWorkspace.tsx` e as regras de tema, reduzir movimento, sublinhar links e contraste em `src/styles.css`, removendo os atributos ao desmontar para as telas de entrada não mudarem

**Checkpoint**: idioma e fuso continuam no Core; tema e acessibilidade não

---

## Phase 5: User Story 3 - Manter as notificações dentro do hub (Priority: P2)

**Goal**: o mesmo cartão, só na seção Notificações, com as frases fixas nos dois idiomas

**Independent Test**: alterar e-mail ou um filtro, salvar, reabrir; web obrigatório; trocar de empresa recarrega; com English, as frases fixas do cartão estão em inglês

- [X] T020 [US3] Mover para os dois catálogos de `src/features/profile/messages.ts` todas as frases fixas de `src/features/notificationPreferences/components/NotificationPreferences.tsx`: título, descrição, carregamento, vazio, erro, canais, web obrigatório, filtros, item indisponível, cancelar e salvar
- [X] T021 [P] [US3] Exibir `NotificationPreferences` só na seção Notificações de `src/features/profile/components/ProfilePage.tsx` e retirar o empilhamento em `src/app/layouts/CompanyWorkspace.tsx`
- [X] T022 [P] [US3] Ler essas chaves em `src/features/notificationPreferences/components/NotificationPreferences.tsx` com `profileMessage` e `useAppliedPreferences`; rótulos e erros devolvidos pelo Core permanecem como vieram; o envio único e o descarte de resposta abandonada que o cartão já tem permanecem

**Checkpoint**: o cartão não aparece nas outras seções e a gravação antiga continua

---

## Phase 6: User Story 4 - Cuidar da segurança da própria conta (Priority: P2)

**Goal**: status da verificação, troca de senha e sessões, sem pareamento no hub. Ligar a verificação fica no fluxo existente.

**Independent Test**: ler o status; com a tarefa `reset-password`, abrir `/tarefas/redefinir-senha`; sem a tarefa, pedir a senha atual e a nova no `PasswordInput` já existente via `user.updatePassword`; ligar a verificação só em `/tarefas/configurar-mfa`; no hub, o bloco da verificação só mostra o status e desliga com `user.disableTOTP()`, sem `createTOTP`; ver a sessão em uso marcada e sem revogação; revogar outra

- [X] T023 [US4] Acrescentar nos dois catálogos de `src/features/profile/messages.ts` as frases de status, erro com nova tentativa, senha atual, senha nova, desligar a verificação, sessão em uso, nenhuma outra sessão e falha ao revogar. Não acrescentar frase de pareamento, código, URI ou QR. Ligar a verificação não ganha texto de fluxo próprio no hub
- [X] T024 [US4] No bloco da verificação de `src/features/profile/components/SecuritySection.tsx`, mostrar só o status `user.twoFactorEnabled`; se o status não puder ser lido, erro com nova tentativa e sem apresentar inativo; não renderizar código, URI, QR, aparelho nem pareamento. Senha e sessões continuam na mesma seção
- [X] T025 [US4] Em `src/features/profile/components/SecuritySection.tsx`, abrir `/tarefas/redefinir-senha` quando a sessão tiver a tarefa `reset-password`; sem a tarefa, a troca pela sessão aberta pede a senha atual e a nova no `PasswordInput` já existente, via `user.updatePassword({ currentPassword, newPassword })`, sem `signOutOfOtherSessions`, e isso não conta como desenho novo (I1). Ligar a verificação quando estiver desligada não é feito no hub: acontece só pelo fluxo existente `/tarefas/configurar-mfa` (I2). No hub, o bloco da verificação só mostra o status e desliga com `user.disableTOTP()`. Sem `createTOTP`, sem pareamento e sem chave secreta. Senha e sessões continuam na mesma seção
- [X] T026 [US4] Listar `user.getSessions()` em `src/features/profile/components/SecuritySection.tsx` com `src/features/profile/sessions.ts`: marcar o id de `useSession()`, sem revogação nele; `revoke()` nas outras; sucesso tira o id da lista; falha mantém a linha e explica o erro

**Checkpoint**: a sessão em uso só termina pelo Sair já existente

---

## Phase 7: User Story 5 - Achar ajuda sem sair do hub (Priority: P3)

**Goal**: os mesmos três destinos do rodapé

**Independent Test**: acionar Privacidade, Termos de Uso e Suporte e chegar a `#privacidade`, `#termos` e `#suporte`

- [X] T027 [US5] Extrair os três destinos do rodapé para `src/app/layouts/footerLinks.ts` e usá-los em `src/app/layouts/CompanyWorkspace.tsx`
- [X] T028 [US5] Implementar `src/features/profile/components/HelpSection.tsx` com `shell.privacy`, `shell.terms` e `shell.support` e os hrefs de `src/app/layouts/footerLinks.ts`, sem página nova

**Checkpoint**: Ajuda não abre destino que o rodapé não tenha

---

## Phase 8: Polish

**Purpose**: fechar i18n e o roteiro

- [X] T029 Afirmar em `tests/profile-hub.test.mjs` que as chaves novas do hub, inclusive status, erro com nova tentativa, senha atual, senha nova e desligar a verificação, e as de `NotificationPreferences`, existem nos catálogos `pt-BR` e `en` de `src/features/profile/messages.ts`, e que não há chave de pareamento, código, URI ou QR
- [ ] T030 Executar o roteiro de `specs/295-melhorar-a-tela-de-perfil-do-usuario/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: começa imediato
- **Foundational (Phase 2)**: depende do Setup e bloqueia as histórias
- **Histórias (Phase 3+)**: dependem da Phase 2. US2, US3, US4 e US5 encaixam o painel no hub criado em US1
- **Polish**: depois das histórias desejadas

### User Story Dependencies

- **US1 (P1)**: depois da Phase 2. É o MVP e cria o hub
- **US2 (P1)**: depois do hub. Não depende de Segurança nem de Ajuda
- **US3 (P2)**: depois do hub. O cartão de notificações já existe
- **US4 (P2)**: depois do hub. Não depende de tema nem de Ajuda
- **US5 (P3)**: depois do hub. Só precisa dos hrefs do rodapé

### Within Each User Story

- Teste da fase, quando houver, antes da implementação correspondente
- Chaves de mensagem antes da seção que as exibe
- US1 antes de montar as outras seções no mesmo `ProfilePage.tsx`

### Parallel Opportunities

- T002 e T003 em paralelo
- T005 a T011 em paralelo, depois de T004
- T017 e T019 em paralelo
- T021 e T022 em paralelo, depois de T020
- US2, US3, US4 e US5 podem avançar em paralelo depois de US1, em arquivos de seção diferentes; `ProfilePage.tsx` e `messages.ts` continuam ponto de encontro

---

## Parallel Example: User Story 2

```bash
Task: "Acrescentar as frases de tema em src/features/profile/messages.ts"
Task: "Aplicar a aparência em src/app/layouts/CompanyWorkspace.tsx e src/styles.css"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 e Phase 2
2. Phase 3 (US1)
3. Parar e validar o cartão, a edição e a foto do cabeçalho

### Incremental Delivery

1. Fundação pronta
2. US1: hub e conta
3. US2: fuso, tema e acessibilidade
4. US3: notificações na seção, com i18n
5. US4: segurança e sessões
6. US5: ajuda
7. T029 e o roteiro do quickstart

### Parallel Team Strategy

1. Todos fecham Setup e Foundational
2. Uma pessoa fecha US1
3. Em seguida, seções de US2, US3, US4 e US5 em arquivos diferentes

---

## Notes

- [P] só quando os arquivos não se cruzam
- Na tela, cargo; no JSON, `jobTitle`
- Não usar `CLERK_SECRET_KEY` nem valor `sk_`
- A troca de senha pela sessão aberta usa o `PasswordInput` já existente e não conta como desenho novo (I1)
- Ligar a verificação só em `/tarefas/configurar-mfa`. No hub, o bloco da verificação só mostra o status e chama `user.disableTOTP()`. Não chamar `createTOTP` nem desenhar pareamento (I2)
- Bio no máximo 160 e `jobTitle` no máximo 80, depois do recorte
- Tema e acessibilidade não entram no `PUT /api/user/profile`
