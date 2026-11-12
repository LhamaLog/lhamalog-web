# Tasks: Manter perfil do usuário

**Input**: Design documents from `/specs/002-manter-perfil-usuario/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/user-profile.md, quickstart.md

**Tests**: Incluídos. A spec pede o mesmo tipo de checagem já usado nas configurações da empresa: teste automático de mapeamento e validação em `node --test`, e envio único no roteiro manual.

**Organization**: Tarefas agrupadas por história para implementação e teste independentes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode correr em paralelo (arquivos diferentes, sem depender de tarefa incompleta)
- **[Story]**: História a que a tarefa pertence (US1, US2, US3)
- Cada tarefa inclui o caminho do arquivo

## Path Conventions

- Aplicativo único: `src/` e `tests/` na raiz de `lhamalog-web`
- Feature nova: `src/features/profile/`
- Sem dependência nova de produção em `package.json`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Catálogos e lista de fusos usados por todas as histórias

- [ ] T001 [P] Criar os catálogos `pt-BR` e `en` com as mesmas chaves em `src/features/profile/messages.ts`, cobrindo a moldura e a tela de perfil listadas em `specs/002-manter-perfil-usuario/data-model.md` (menu, inclusive o item Perfil; recolher/expandir; sair; rodapé; faixa da empresa; breadcrumbs Administração e Perfil; rótulos, validação, sucesso, carregamento e erro da tela). Não adicionar dependência em `package.json`.
- [ ] T002 [P] Criar `src/features/profile/timeZones.ts` com `Intl.supportedValuesOf('timeZone')` quando existir e, sem essa API, a lista `UTC`, `America/Sao_Paulo`, `America/Manaus`, `America/Rio_Branco`. Quando existirem, esses quatro ficam no topo; o restante em ordem alfabética. O rótulo de cada opção é o identificador.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Contrato, validação e preferências aplicadas, sem a tela ainda

**⚠️ CRITICAL**: Nenhuma história começa antes desta fase

- [ ] T003 Escrever `tests/profile.test.mjs` antes de T005 e T006, no estilo de `tests/company-settings.test.mjs` (registrar `tests/resolve-ts.mjs`). Cobrir: objeto com `displayName`, `language` e `timeZone` string é lido; corpo sem esses campos string é rejeitado; o PUT serializado tem só essas três chaves e `displayName` sem espaços nas pontas; o eco aceita a mesma tríade e recusa resposta que mude qualquer campo; nome vazio, nome de 201 caracteres e nome que case `/[\u0000-\u001F\u007F]/` são inválidos; nome de 1 e de 200 caracteres é válido; idioma diferente de `pt-BR` e `en` é inválido; fuso fora da lista de T002 é inválido; `America/Sao_Paulo`, `pt-BR` e `en` são válidos; os dois catálogos de T001 têm as mesmas chaves. Não assertar ainda o locale de `formatPercent` (isso é T012).
- [ ] T004 Criar `UserProfile` e o estado aplicado em `src/features/profile/types.ts` com `displayName`, `language` e `timeZone` string, sem id de usuário, e-mail, avatar ou versão, conforme `specs/002-manter-perfil-usuario/data-model.md`.
- [ ] T005 [P] Implementar `readUserProfile`, `buildProfilePut`, `serverConfirmedProfile` e a constante do caminho `/api/user/profile` em `src/features/profile/contract.ts`, conforme `specs/002-manter-perfil-usuario/contracts/user-profile.md`. String vazia no GET é valor carregado; tipo errado é falha de leitura. O PUT envia só as três chaves, com `displayName` já aparado.
- [ ] T006 [P] Implementar a validação em `src/features/profile/validation.ts` com as regras literais do modelo: depois de `trim`, `displayName` tem de 1 a 200 caracteres inclusive e não pode casar `/[\u0000-\u001F\u007F]/`; `language` é exatamente `pt-BR` ou `en`; `timeZone` precisa estar na lista de `src/features/profile/timeZones.ts`.
- [ ] T007 [P] Criar `src/features/profile/clerkLocale.ts` e assiná-lo em `src/app/providers/AuthProvider.tsx`: idioma aplicado `en` usa `enUS` de `@clerk/localizations`; caso contrário permanece o `localization` português já exportado por `src/features/auth/theme/localization.ts`. Voltar ao português no sign-out. Não alterar JWT, organizações, instância Clerk nem adicionar SDK Backend.
- [ ] T008 Implementar o provider em `src/features/profile/preferences.tsx`: `GET /api/user/profile` via `useApi`, abortar pedido antigo, ignorar resposta abortada, padrão `pt-BR` e nome da sessão enquanto carrega, nome da sessão se `displayName` vier vazio, e só então aplicar `language` `pt-BR` ou `en`. Recarregar quando a empresa selecionada mudar.
- [ ] T009 Montar o provider em `src/app/layouts/CompanyWorkspace.tsx` em volta de `AppLayout`. O `LoadingState` de Clerk ainda não carregado fica fora do provider e permanece em português.

**Checkpoint**: Contrato e preferências testáveis sem a tela de perfil

---

## Phase 3: User Story 1 - Ajustar o próprio perfil (Priority: P1) 🎯 MVP

**Goal**: A pessoa vê e grava o próprio nome, idioma e fuso, com os estados da tela de empresa, e o nome confirmado aparece na moldura.

**Independent Test**: Alterar os três campos, salvar, sair e voltar. Os valores permanecem e o cabeçalho mostra o nome salvo. Valor inválido não grava. Cancelar restaura o baseline.

### Implementation for User Story 1

- [ ] T010 [US1] Criar `src/features/profile/components/ProfilePage.tsx` com nome, idioma e fuso, usando `Input` e `Select` de `src/shared/ui/`. Validar com `src/features/profile/validation.ts` antes do `PUT`. Espelhar `src/features/company/components/CompanyPage.tsx`: carga com cancelamento, erro com nova tentativa, `fieldset` desabilitado e um único envio enquanto `saving`, sucesso em `role="status"`, erro em `role="alert"`, cancelar restaura o baseline, `409` oferece recarregar via novo `GET`, e resposta que não passe em `serverConfirmedProfile` mostra o que voltou mais o aviso de não confirmação. Mensagens locais saem de `messages.ts` no idioma aplicado; `fieldErrors` do serviço são mostrados como vieram, nas chaves `displayName`, `language` e `timeZone`. Sem empresa selecionada, não chamar a API e mostrar a orientação já usada para selecionar empresa. Não enviar id de usuário, e-mail, avatar ou senha. Não chamar `/api/company` nem API Backend da Clerk. No salvamento confirmado, atualizar as preferências aplicadas, mostrar o sucesso no idioma recém-gravado e chamar `user.reload()`; se `reload` falhar, manter o nome devolvido pelo serviço.
- [ ] T011 [US1] Publicar a rota protegida `/perfil` em `src/app/routes/AppRoutes.tsx` e o ramo correspondente em `src/app/layouts/CompanyWorkspace.tsx`, ao lado de `/empresa` e `/produtos`. Em `src/app/layouts/Navbar.tsx`, acrescentar o item Perfil no grupo Configuração e navegar só para `/perfil`, `/empresa` e `/produtos` (não criar rota de painel, agendamento de varredura ou e-mail). Em `src/app/layouts/HeaderControls.tsx`, o nome da pessoa vira link para `/perfil`. Breadcrumb desta rota: Administração / Perfil. Breadcrumbs das seções da empresa permanecem com os rótulos portugueses atuais.

**Checkpoint**: US1 utilizável em português, com o nome da moldura vindo do perfil confirmado

---

## Phase 4: User Story 2 - Aplicar o idioma na moldura e nos formatos (Priority: P2)

**Goal**: O idioma gravado traduz a tela de perfil e a moldura, e troca o locale das datas e números já formatados, sem traduzir as frases de empresa, produtos, ocorrências e entrada.

**Independent Test**: Com `language` `en` gravado, menu, rodapé, sair, faixa da empresa e tela de perfil ficam em inglês; um percentual e a data do histórico de contexto usam convenção em inglês; as frases da empresa e de produtos, inclusive `Sem registro`, continuam em português. Idioma ainda não salvo não muda a moldura.

### Tests for User Story 2

- [ ] T012 [US2] Estender `tests/profile.test.mjs` para falhar até os formatadores aceitarem locale: `formatPercent` de um número com parte decimal produz strings diferentes em `pt-BR` e `en`. O teste não passa fuso horário.

### Implementation for User Story 2

- [ ] T013 [P] [US2] Em `src/features/company/contextRevisions.ts`, mudar para `formatRevisionDate(value, locale = 'pt-BR')` sem parâmetro de fuso. Manter a literal `Data indisponível`. Em `src/features/company/components/ContextRevisionHistory.tsx`, passar o idioma aplicado e não passar o fuso do perfil.
- [ ] T014 [P] [US2] Em `src/features/products/productListModel.ts`, aceitar locale com padrão `pt-BR` em `occurrenceText(value, now, locale = 'pt-BR')`, `formatPercent(value, locale = 'pt-BR')`, `uniqueSorted(values, locale = 'pt-BR')` e `initials(name, locale = 'pt-BR')`, sem parâmetro de fuso. Manter a literal `Sem registro`. Em `src/features/products/components/ProductTable.tsx` e `src/features/products/components/ProductsPage.tsx`, passar só o idioma aplicado.
- [ ] T015 [P] [US2] Acrescentar `locale` opcional com padrão `pt-BR` em `src/shared/ui/DistributionBars.tsx` e `src/shared/ui/RankingList.tsx`, sem esses componentes importarem `src/features/profile`. Passar o idioma aplicado em `src/features/products/components/ProductsByEnvironment.tsx` e `src/features/products/components/LogsByProduct.tsx`.
- [ ] T016 [P] [US2] Trocar as frases da moldura para o catálogo do idioma aplicado em `src/app/layouts/Navbar.tsx`, `src/app/layouts/Footer.tsx`, `src/app/layouts/Header.tsx`, `src/app/layouts/HeaderControls.tsx`, `src/features/auth/components/SignOutButton.tsx` e na faixa de `src/app/layouts/CompanyWorkspace.tsx` (empresa selecionada, cadastrar empresa, estado sem empresa). `SignOutButton` recebe o rótulo por prop, com padrão `Sair`, e não importa a feature de perfil. Textos já escritos por `CompanyPage` e `ProductsPage` não mudam. A entrada em `/sign-in` permanece em português.

**Checkpoint**: US1 e US2 funcionam; empresa e produtos continuam com as frases atuais

---

## Phase 5: User Story 3 - Conferir o fuso sem criar novas superfícies (Priority: P3)

**Goal**: A pré-visualização da tela de perfil mostra a data e a hora atuais no fuso selecionado. Nenhuma outra data passa a usar esse fuso, e nenhuma tela de painel, varredura ou e-mail é criada.

**Independent Test**: Trocar o fuso no formulário e ver a pré-visualização mudar antes de salvar. Cancelar restaura fuso e pré-visualização. A data do histórico de contexto não muda de fuso. Não existe rota nova de painel, agendamento ou e-mail.

### Implementation for User Story 3

- [ ] T017 [US3] Na tela `src/features/profile/components/ProfilePage.tsx`, mostrar a pré-visualização com `Intl.DateTimeFormat` (`dateStyle: 'short'`, `timeStyle: 'short'`), o `timeZone` do rascunho e o idioma já aplicado, não o idioma ainda não salvo. Atualizar ao mudar o select e pelo menos a cada minuto. Cancelar restaura o fuso gravado e a pré-visualização. Não passar esse fuso para `formatRevisionDate`, `occurrenceText`, `formatPercent`, `DistributionBars` ou `RankingList`.

**Checkpoint**: As três histórias funcionam sem superfície nova de painel, varredura ou e-mail

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Verificação final e registro

- [ ] T018 Rodar `npm test` e `npm run build` na raiz de `lhamalog-web` e registrar o resultado em `specs/002-manter-perfil-usuario/quickstart.md`. Confirmar que `src/features/company/contract.ts` não passou a ser chamado pela tela de perfil e que os rótulos de idioma e fuso da empresa em `src/features/company/components/companyFields.tsx` permanecem os atuais.
- [ ] T019 Executar o roteiro manual de `specs/002-manter-perfil-usuario/quickstart.md` quando Clerk e Core estiverem disponíveis, e registrar naquele arquivo o que foi exercitado e o que ficou bloqueado por ambiente. Não criar atalho de autenticação.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências
- **Foundational (Phase 2)**: depende da Phase 1 e bloqueia todas as histórias
- **User Stories (Phase 3+)**: dependem da Phase 2
- **Polish (Phase 6)**: depende das histórias que forem entregues

### User Story Dependencies

- **User Story 1 (P1)**: começa após a Phase 2. Não depende de US2 nem US3.
- **User Story 2 (P2)**: começa após a Phase 2. Traduzir a faixa em `CompanyWorkspace.tsx` (T016) espera a rota de T011 no mesmo arquivo. Os formatadores (T013–T015) não dependem da tela.
- **User Story 3 (P3)**: depende de T010, porque a pré-visualização fica na mesma tela. Não depende de US2 para existir; o formato da hora usa o idioma aplicado, que é `pt-BR` até US2.

### Within Each User Story

- T003 fica escrito antes de T005 e T006 e deve falhar até esses módulos existirem
- T012 fica escrito antes de T013–T015 e deve falhar até `formatPercent` honrar o locale
- Modelo e contrato antes da tela; tela antes da rota que a monta

### Parallel Opportunities

- T001 e T002 em paralelo
- T005, T006 e T007 em paralelo, depois de T004
- T013, T014, T015 e T016 em paralelo depois de T012, com T016 também depois de T011

---

## Parallel Example: User Story 2

```bash
# Depois de T012 falhar pelo motivo certo, formatadores em arquivos diferentes:
Task: "formatRevisionDate em src/features/company/contextRevisions.ts"
Task: "locale em src/features/products/productListModel.ts"
Task: "locale em src/shared/ui/DistributionBars.tsx e RankingList.tsx"
Task: "frases da moldura em Navbar, Footer, Header e CompanyWorkspace"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 e Phase 2
2. Phase 3 (T010–T011)
3. Parar e validar o perfil em português: gravar, recarregar, cancelar, rejeitar inválido, ver o nome na moldura
4. O idioma ainda não traduz a moldura e o fuso ainda não tem pré-visualização; os dois ficam gravados

### Incremental Delivery

1. Setup + Foundational
2. US1: gravar o perfil e refletir o nome
3. US2: aplicar o idioma na moldura e nos formatos, sem traduzir o resto
4. US3: pré-visualização do fuso, sem painel, varredura ou e-mail
5. Polish: `npm test`, `npm run build` e o manual possível

### Parallel Team Strategy

1. Todos fecham Phase 1 e Phase 2
2. Em seguida: uma pessoa na tela (US1), outra nos formatadores (T013–T015), desde que T016 espere T011 no `CompanyWorkspace.tsx`

---

## Notes

- O commit de implementação, quando houver, usa `LLT-174 Manter perfil do usuário`. Este arquivo não autoriza esse commit agora.
- [P] = arquivos diferentes, sem dependência incompleta
- Não editar `PUT /api/company` para carregar preferência de pessoa
- Não criar tela de painel, agendamento de varredura ou e-mail
