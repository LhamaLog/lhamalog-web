# Tasks: Manter perfil do usuário

**Input**: Design documents from `/specs/002-manter-perfil-usuario/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/user-profile.md, quickstart.md

**Tests**: Incluídos. A spec pede o mesmo tipo de checagem já usado nas configurações da empresa: teste automático de mapeamento, versão, divisão do nome e validação em `node --test`, e envio único mais `user.update` no roteiro manual.

**Organization**: Tarefas agrupadas por história para implementação e teste independentes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode correr em paralelo (arquivos diferentes, sem depender de tarefa incompleta)
- **[Story]**: História a que a tarefa pertence (US1, US2, US3)
- Cada tarefa inclui o caminho do arquivo

## Path Conventions

- Aplicativo único: `src/` e `tests/` na raiz de `lhamalog-web`
- Feature nova: `src/features/profile/`
- Sem dependência nova de produção em `package.json`
- JSON do perfil: `displayName`, `language`, `timezone`, `version`. Não usar `timeZone` neste recurso.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Catálogos e lista de fusos usados por todas as histórias

- [ ] T001 [P] Criar os catálogos `pt-BR` e `en` com as mesmas chaves em `src/features/profile/messages.ts`, cobrindo a moldura e a tela de perfil listadas em `specs/002-manter-perfil-usuario/data-model.md` (menu, inclusive o item Perfil; recolher/expandir; sair; rodapé; faixa da empresa; breadcrumbs Administração e Perfil; rótulos, validação, sucesso, carregamento e erro da tela). Não oferecer `en-US` nem outra etiqueta. Não adicionar dependência em `package.json`.
- [ ] T002 [P] Criar `src/features/profile/timeZones.ts` com `Intl.supportedValuesOf('timeZone')` quando existir e, sem essa API, a lista `UTC`, `America/Sao_Paulo`, `America/Manaus`, `America/Rio_Branco`. Quando existirem, esses quatro ficam no topo; o restante em ordem alfabética. O rótulo de cada opção é o identificador. O campo de perfil que consome esta lista chama-se `timezone`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Contrato com `timezone` e `version`, divisão do nome e preferências aplicadas, sem a tela ainda

**⚠️ CRITICAL**: Nenhuma história começa antes desta fase

- [ ] T003 Escrever `tests/profile.test.mjs` antes de T005, T006 e T007, no estilo de `tests/company-settings.test.mjs` (registrar `tests/resolve-ts.mjs`). Cobrir: objeto com `displayName`, `language` e `timezone` string e `version` `null` ou número finito é lido; o `GET` sem perfil (`displayName: ""`, `language: "pt-BR"`, `timezone: "America/Sao_Paulo"`, `version: null`) é lido; corpo sem `timezone` string, ou só com `timeZone`, é rejeitado; o PUT serializado tem só `displayName`, `language`, `timezone` e `version`, com `displayName` sem espaços nas pontas e `version: null` na primeira gravação; o eco aceita os três valores iguais com `version` diferente e recusa mudança em `displayName`, `language` ou `timezone`; nome vazio, nome de 201 caracteres e nome que case `/[\u0000-\u001F\u007F]/` são inválidos; nome de 1 e de 200 caracteres é válido; idioma diferente de `pt-BR` e `en`, inclusive `en-US`, é inválido para gravar; fuso fora da lista de T002 é inválido; `America/Sao_Paulo`, `pt-BR` e `en` são válidos; `splitDisplayName("Ana Souza Silva")` devolve `firstName` `Ana` e `lastName` `Souza Silva`; `splitDisplayName("Ana")` devolve `firstName` `Ana` e `lastName` `""`; os dois catálogos de T001 têm as mesmas chaves. Não assertar ainda o locale de `formatPercent` (isso é T013).
- [ ] T004 Criar `UserProfile` e o estado aplicado em `src/features/profile/types.ts` com `displayName`, `language`, `timezone` e `version` (`number | null`), sem id de usuário, e-mail ou avatar, e sem campo `timeZone`, conforme `specs/002-manter-perfil-usuario/data-model.md`.
- [ ] T005 [P] Implementar `readUserProfile`, `buildProfilePut`, `serverConfirmedProfile` e a constante do caminho `/api/user/profile` em `src/features/profile/contract.ts`, conforme `specs/002-manter-perfil-usuario/contracts/user-profile.md`. O PUT envia `displayName`, `language`, `timezone` e `version`. A confirmação compara os três valores e guarda a `version` devolvida sem exigir que seja igual à enviada.
- [ ] T006 [P] Implementar a validação em `src/features/profile/validation.ts` com as regras literais do modelo: depois de `trim`, `displayName` tem de 1 a 200 caracteres inclusive e não pode casar `/[\u0000-\u001F\u007F]/`; `language` é exatamente `pt-BR` ou `en`; `timezone` precisa estar na lista de `src/features/profile/timeZones.ts`.
- [ ] T007 [P] Implementar `splitDisplayName` em `src/features/profile/clerkName.ts`: depois do trim, a primeira palavra é `firstName` e as demais, unidas por um espaço, são `lastName`; uma palavra só deixa `lastName` igual a `""`.
- [ ] T008 [P] Criar `src/features/profile/clerkLocale.ts` e assiná-lo em `src/app/providers/AuthProvider.tsx`: o setter com `en` usa `enUS` de `@clerk/localizations`; `pt-BR` ou ausência de perfil aplicado permanece o `localization` português já exportado por `src/features/auth/theme/localization.ts`. O sign-out chama o setter de volta ao português. Não alterar JWT, organizações, instância Clerk nem adicionar SDK Backend.
- [ ] T009 Implementar o provider em `src/features/profile/preferences.tsx`. Sem empresa selecionada, não chamar `useApi` (essa função lança erro sem `orgId`): manter `pt-BR` e o nome da sessão. Com empresa, `GET /api/user/profile` via `useApi`, abortar pedido antigo e ignorar resposta abortada. Nome da sessão enquanto carrega e quando `displayName` vier vazio; caso contrário expor o `displayName` para o cabeçalho. Aplicar `language` só quando for exatamente `pt-BR` ou `en`, e nesse momento chamar o setter de `src/features/profile/clerkLocale.ts`. Recarregar quando a empresa selecionada mudar.
- [ ] T010 Montar o provider em `src/app/layouts/CompanyWorkspace.tsx` em volta de `AppLayout` e passar ao cabeçalho o `displayName` aplicado quando não estiver vazio; senão, o nome da sessão (`fullName`, e-mail primário ou `Usuário`). O `LoadingState` de Clerk ainda não carregado fica fora do provider e permanece em português.

**Checkpoint**: Contrato, versão e nome do cabeçalho testáveis sem a tela de edição

---

## Phase 3: User Story 1 - Ajustar o próprio perfil (Priority: P1) 🎯 MVP

**Goal**: A pessoa vê e grava o próprio nome, idioma e fuso, com versão, e o nome confirmado aparece no cabeçalho. A sessão Clerk é atualizada depois, sem desfazer o Core se `user.update` falhar.

**Independent Test**: Alterar os três campos, salvar, sair e voltar. Os valores e a versão nova permanecem e o cabeçalho mostra o nome salvo. Valor inválido não grava. `409` oferece recarregar. Cancelar restaura o baseline.

### Implementation for User Story 1

- [ ] T011 [US1] Criar `src/features/profile/components/ProfilePage.tsx` com nome, idioma e fuso, usando `Input` e `Select` de `src/shared/ui/`. Validar com `src/features/profile/validation.ts` antes do `PUT`. Espelhar `src/features/company/components/CompanyPage.tsx`: carga com cancelamento, erro com nova tentativa, `fieldset` desabilitado e um único envio enquanto `saving`, sucesso em `role="status"`, erro em `role="alert"`, cancelar restaura o baseline inclusive `version`. Enviar `buildProfilePut` com `version: null` na primeira gravação e, depois, a `version` carregada. `fieldErrors` usam as chaves `displayName`, `language` e `timezone` e são mostrados como vieram. `409` oferece recarregar via novo `GET` e não chama `user.update`. Resposta que não passe em `serverConfirmedProfile` mostra o que voltou mais o aviso de não confirmação e não chama `user.update`. Sem empresa selecionada, não chamar a API. Não enviar id de usuário, e-mail, avatar ou senha. Não chamar `/api/company` nem API Backend da Clerk. No salvamento confirmado, nesta ordem: atualizar as preferências aplicadas e o nome do cabeçalho com o `displayName` do Core; chamar o setter de `src/features/profile/clerkLocale.ts` com o idioma confirmado; mostrar o sucesso nesse idioma; chamar `user.update({ firstName, lastName })` com `splitDisplayName` de `src/features/profile/clerkName.ts`, usando `lastName: ""` quando o nome tem uma palavra. Se `user.update` falhar, manter o perfil do Core e o nome do cabeçalho. Se `user.update` resolver, chamar `user.reload()`; se o reload falhar, manter o nome do Core.
- [ ] T012 [US1] Publicar a rota protegida `/perfil` em `src/app/routes/AppRoutes.tsx` e o ramo correspondente em `src/app/layouts/CompanyWorkspace.tsx`, ao lado de `/empresa` e `/produtos`. Em `src/app/layouts/Navbar.tsx`, acrescentar o item Perfil no grupo Configuração e navegar só para `/perfil`, `/empresa` e `/produtos` (não criar rota de painel, agendamento de varredura ou e-mail). Em `src/app/layouts/HeaderControls.tsx`, o nome da pessoa vira link para `/perfil`. Breadcrumb desta rota: Administração / Perfil. Breadcrumbs das seções da empresa permanecem com os rótulos portugueses atuais.

**Checkpoint**: US1 utilizável em português, com versão, cabeçalho no nome do Core e `user.update` sem rollback

---

## Phase 4: User Story 2 - Aplicar o idioma na moldura e nos formatos (Priority: P2)

**Goal**: O idioma gravado `pt-BR` ou `en` traduz a tela de perfil e a moldura, inclusive o seletor de empresa, e troca o locale das datas e números já formatados, sem traduzir as frases de empresa, produtos, ocorrências e entrada.

**Independent Test**: Com `language` `en` gravado, menu, rodapé, sair, faixa da empresa, seletor de empresa e tela de perfil ficam em inglês; um percentual e a data do histórico de contexto usam convenção em inglês; as frases da empresa e de produtos, inclusive `Sem registro`, continuam em português. Idioma ainda não salvo não muda a moldura. Sair volta o seletor ao português.

### Tests for User Story 2

- [ ] T013 [US2] Estender `tests/profile.test.mjs` para falhar até os formatadores aceitarem locale: `formatPercent` de um número com parte decimal produz strings diferentes em `pt-BR` e `en`. O teste não passa fuso horário.

### Implementation for User Story 2

- [ ] T014 [P] [US2] Em `src/features/company/contextRevisions.ts`, mudar para `formatRevisionDate(value, locale = 'pt-BR')` sem parâmetro de fuso. Manter a literal `Data indisponível`. Em `src/features/company/components/ContextRevisionHistory.tsx`, passar o idioma aplicado e não passar o `timezone` do perfil.
- [ ] T015 [P] [US2] Em `src/features/products/productListModel.ts`, aceitar locale com padrão `pt-BR` em `occurrenceText(value, now, locale = 'pt-BR')`, `formatPercent(value, locale = 'pt-BR')`, `uniqueSorted(values, locale = 'pt-BR')` e `initials(name, locale = 'pt-BR')`, sem parâmetro de fuso. Manter a literal `Sem registro`. Em `src/features/products/components/ProductTable.tsx` e `src/features/products/components/ProductsPage.tsx`, passar só o idioma aplicado.
- [ ] T016 [P] [US2] Acrescentar `locale` opcional com padrão `pt-BR` em `src/shared/ui/DistributionBars.tsx` e `src/shared/ui/RankingList.tsx`, sem esses componentes importarem `src/features/profile`. Passar o idioma aplicado em `src/features/products/components/ProductsByEnvironment.tsx` e `src/features/products/components/LogsByProduct.tsx`.
- [ ] T017 [P] [US2] Somente depois de T012, e em paralelo apenas com T014, T015 e T016, nunca com T012. Trocar as frases da moldura para o catálogo do idioma aplicado em `src/app/layouts/Navbar.tsx`, `src/app/layouts/Footer.tsx`, `src/app/layouts/Header.tsx`, `src/app/layouts/HeaderControls.tsx`, `src/features/auth/components/SignOutButton.tsx` e na faixa de `src/app/layouts/CompanyWorkspace.tsx` (empresa selecionada, cadastrar empresa, estado sem empresa). `SignOutButton` recebe o rótulo por prop, com padrão `Sair`, e não importa a feature de perfil. Textos já escritos por `CompanyPage` e `ProductsPage` não mudam. A entrada em `/sign-in` permanece em português. O sign-out continua voltando o locale da Clerk ao português, como em T008.

**Checkpoint**: US1 e US2 funcionam; empresa e produtos continuam com as frases atuais

---

## Phase 5: User Story 3 - Conferir o fuso sem criar novas superfícies (Priority: P3)

**Goal**: A pré-visualização da tela de perfil mostra a data e a hora atuais no `timezone` selecionado. Nenhuma outra data passa a usar esse fuso, e nenhuma tela de painel, varredura ou e-mail é criada.

**Independent Test**: Trocar o fuso no formulário e ver a pré-visualização mudar antes de salvar. Cancelar restaura fuso e pré-visualização. A data do histórico de contexto não muda de fuso. Não existe rota nova de painel, agendamento ou e-mail.

### Implementation for User Story 3

- [ ] T018 [US3] Na tela `src/features/profile/components/ProfilePage.tsx`, mostrar a pré-visualização com `Intl.DateTimeFormat` (`dateStyle: 'short'`, `timeStyle: 'short'`), o `timezone` do rascunho e o idioma já aplicado, não o idioma ainda não salvo. Atualizar ao mudar o select e pelo menos a cada minuto. Cancelar restaura o fuso gravado e a pré-visualização. Não passar esse `timezone` para `formatRevisionDate`, `occurrenceText`, `formatPercent`, `DistributionBars` ou `RankingList`.

**Checkpoint**: As três histórias funcionam sem superfície nova de painel, varredura ou e-mail

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Verificação final e registro

- [ ] T019 Rodar `npm test` e `npm run build` na raiz de `lhamalog-web` e registrar o resultado em `specs/002-manter-perfil-usuario/quickstart.md`. Confirmar que `src/features/company/contract.ts` não passou a ser chamado pela tela de perfil e que os rótulos de idioma e fuso da empresa em `src/features/company/components/companyFields.tsx` permanecem os atuais, inclusive o nome `timeZone` desse outro recurso.
- [ ] T020 Executar o roteiro manual de `specs/002-manter-perfil-usuario/quickstart.md` quando Clerk e Core estiverem disponíveis, inclusive `user.update`, nome de uma palavra, falha sem rollback, `version: null` na primeira gravação e `409` na versão antiga, e registrar naquele arquivo o que foi exercitado e o que ficou bloqueado por ambiente. Não criar atalho de autenticação.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências
- **Foundational (Phase 2)**: depende da Phase 1 e bloqueia todas as histórias
- **User Stories (Phase 3+)**: dependem da Phase 2
- **Polish (Phase 6)**: depende das histórias que forem entregues

### User Story Dependencies

- **User Story 1 (P1)**: começa após a Phase 2. Não depende de US2 nem US3.
- **User Story 2 (P2)**: começa após a Phase 2. T014, T015 e T016 não dependem da tela. T017 edita `CompanyWorkspace.tsx` e só começa depois de T012; em paralelo, só com T014, T015 e T016.
- **User Story 3 (P3)**: depende de T011, porque a pré-visualização fica na mesma tela. Não depende de US2 para existir; o formato da hora usa o idioma aplicado, que é `pt-BR` até US2.

### Within Each User Story

- T003 fica escrito antes de T005, T006 e T007 e deve falhar até esses módulos existirem
- T013 fica escrito antes de T014–T016 e deve falhar até `formatPercent` honrar o locale
- Modelo e contrato antes da tela; tela antes da rota que a monta; frases da moldura em `CompanyWorkspace.tsx` depois dessa rota

### Parallel Opportunities

- T001 e T002 em paralelo
- T005, T006, T007 e T008 em paralelo, depois de T004
- T014, T015 e T016 em paralelo depois de T013
- T017 em paralelo somente com T014, T015 e T016, e somente depois de T012

---

## Parallel Example: User Story 2

```bash
# Depois de T013 falhar pelo motivo certo, e com T012 já concluído antes de T017:
Task: "formatRevisionDate em src/features/company/contextRevisions.ts"
Task: "locale em src/features/products/productListModel.ts"
Task: "locale em src/shared/ui/DistributionBars.tsx e RankingList.tsx"
# T017 não corre junto com T012:
Task: "frases da moldura em Navbar, Footer, Header e CompanyWorkspace"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 e Phase 2
2. Phase 3 (T011–T012)
3. Parar e validar o perfil em português: gravar com `version: null`, recarregar, cancelar, rejeitar inválido, ver o nome do Core no cabeçalho, ver `user.update` sem desfazer o salvamento se a sessão falhar
4. O idioma ainda não traduz a moldura e o fuso ainda não tem pré-visualização; os dois ficam gravados

### Incremental Delivery

1. Setup + Foundational
2. US1: gravar o perfil com versão, refletir o nome e atualizar a sessão
3. US2: aplicar o idioma na moldura e nos formatos, sem traduzir o resto
4. US3: pré-visualização do fuso, sem painel, varredura ou e-mail
5. Polish: `npm test`, `npm run build` e o manual possível

### Parallel Team Strategy

1. Todos fecham Phase 1 e Phase 2
2. Em seguida: uma pessoa na tela (US1), outra nos formatadores (T014–T016). T017 espera T012 e não divide `CompanyWorkspace.tsx` com essa rota.

---

## Notes

- O commit de implementação, quando houver, usa `LLT-174 Manter perfil do usuário`. Este arquivo não autoriza esse commit agora.
- [P] = arquivos diferentes, sem dependência incompleta. T017 é a exceção explícita: o marcador não a libera para correr com T012.
- Não editar `PUT /api/company` para carregar preferência de pessoa
- Não criar tela de painel, agendamento de varredura ou e-mail
- Não adicionar SDK Backend da Clerk
