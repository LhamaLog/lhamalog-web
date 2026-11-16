# Implementation Plan: Manter perfil do usuário

**Branch**: `LLT-174-manter-perfil-do-usuario` | **Date**: 2026-11-12 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/002-manter-perfil-usuario/spec.md`

## Summary

O aplicativo web passa a ter uma tela de perfil em que a pessoa autenticada vê e edita o próprio nome de exibição, o idioma (`pt-BR` ou `en`) e o fuso horário (identificador IANA no campo `timezone`). A gravação usa o cliente autenticado que já fala com o Core, em `GET`/`PUT /api/user/profile`, enviando também `version` (`null` na primeira gravação). Depois de um `PUT` confirmado, o web chama `user.update` na sessão do navegador. Não há SDK Backend da Clerk.

O idioma gravado traduz a tela de perfil e a moldura autenticada (menu, cabeçalho, rodapé, faixa da empresa e sair) e passa a ser o locale das datas e números que o aplicativo já formata. O fuso só aparece na pré-visualização desta tela. Painel, agendamento de varredura e e-mail não existem aqui e não serão criados. Idioma e fuso da empresa permanecem como estão.

## Technical Context

**Language/Version**: TypeScript 7.0.2, React 19.3.1, Vite 8.3.4, Node 26.12.1 (testes)

**Primary Dependencies**: As já declaradas em `package.json`: `react`, `react-dom`, `react-router-dom` 7.18.4, `@clerk/react` 6.18.2, `@clerk/localizations` 4.24.2, Tailwind CSS 4.3.3. Nenhuma dependência nova de produção.

**Storage**: Nenhum armazenamento local do perfil. A fonte gravada é o Core. O rascunho vive no estado da tela até salvar ou cancelar.

**Testing**: `node --test tests/*.test.mjs`, com import de TypeScript pelo registrador `tests/resolve-ts.mjs`, no mesmo estilo de `tests/company-settings.test.mjs`. Não há renderizador de componentes; envio único e navegação ficam no roteiro manual de [quickstart.md](quickstart.md).

**Target Platform**: Navegador, SPA autenticada já servida por este repositório.

**Project Type**: Aplicativo web (frontend). O serviço é o Core, fora deste repositório.

**Performance Goals**: A pessoa conclui a revisão e a gravação em menos de 2 minutos (SC-001). A tela sempre termina em sucesso visível ou erro visível, sem permanecer em "salvando". Sem meta de latência diferente da tela de empresa.

**Constraints**: Não criar painel, agendamento de varredura nem e-mail. Não traduzir empresa, produtos, ocorrências nem as telas de entrada. A sessão Clerk só é atualizada com `user.update` depois de um `PUT` confirmado; sem SDK Backend, segredo, JWT, organizações ou instância. Não mudar `PUT /api/company`. Reusar `useApi` somente quando houver empresa selecionada. Sem biblioteca nova de i18n. O JSON do perfil usa `timezone` e `version`, não `timeZone` e não última gravação silenciosa.

**Scale/Scope**: Um perfil por pessoa autenticada, dois idiomas, uma lista IANA no `<select>` nativo (centenas de opções, aceitável sem componente novo). Uma rota nova, `/perfil`.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` ainda é o template upstream, com princípios nomeados como placeholder e sem MUST/SHOULD ratificado. Não há gate normativo a violar nem a dispensar. O preset local `lhamalog-local` restringe o comando de implementação; esta história, por instrução explícita, só produz artefatos Spec Kit e pode versioná-los no branch `LLT-174-manter-perfil-do-usuario`.

Gate inicial: **aprovado** (nenhum princípio ratificado em conflito).

## Project Structure

### Documentation (this feature)

```text
specs/002-manter-perfil-usuario/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/user-profile.md
├── checklists/requirements.md
├── tasks.md
└── analysis.md
```

### Source Code (repository root)

```text
src/features/profile/
├── types.ts
├── messages.ts
├── timeZones.ts
├── contract.ts
├── validation.ts
├── preferences.tsx
├── clerkLocale.ts
├── clerkName.ts
└── components/ProfilePage.tsx

src/app/routes/AppRoutes.tsx
src/app/layouts/CompanyWorkspace.tsx
src/app/layouts/Navbar.tsx
src/app/layouts/Header.tsx
src/app/layouts/HeaderControls.tsx
src/app/layouts/Footer.tsx
src/app/providers/AuthProvider.tsx
src/features/auth/components/SignOutButton.tsx
src/features/company/contextRevisions.ts
src/features/company/components/ContextRevisionHistory.tsx
src/features/products/productListModel.ts
src/features/products/components/ProductTable.tsx
src/features/products/components/ProductsPage.tsx
src/features/products/components/ProductsByEnvironment.tsx
src/features/products/components/LogsByProduct.tsx
src/shared/ui/DistributionBars.tsx
src/shared/ui/RankingList.tsx

tests/profile.test.mjs
```

**Structure Decision**: Continua o aplicativo único em `src/`, com a feature nova ao lado de `src/features/company` e `src/features/products`. A moldura existente (`CompanyWorkspace`, `AppLayout`, `Navbar`, `Header`, `Footer`) hospeda `/perfil`. O cabeçalho lê o `displayName` aplicado no provider, com fallback para o nome da sessão. `clerkLocale.ts` é chamado na carga e no salvamento confirmado, e o sign-out volta ao português. Sem empresa selecionada o provider não chama `useApi`. Componentes compartilhados não importam a feature. Formatadores existentes ganham um argumento de locale com padrão `pt-BR` e não recebem o `timezone` do perfil.

## Phase 0 — Research

Resolvido em [research.md](research.md). Não restou `NEEDS CLARIFICATION` no contexto técnico.

## Phase 1 — Design

- Modelo de cliente e regras de validação: [data-model.md](data-model.md)
- Contrato HTTP que o web consome e que o Core precisa expor: [contracts/user-profile.md](contracts/user-profile.md)
- Roteiro de verificação: [quickstart.md](quickstart.md)

### Post-Design Constitution Check

Os artefatos de desenho não introduzem dependência nova, não movem regra de negócio para o web e não ampliam o escopo para e-mail, notificação, painel ou agendamento. O gate permanece **aprovado**, pelo mesmo motivo do gate inicial: a constituição não tem princípio ratificado.

## Complexity Tracking

Nenhuma violação. Não há exceção a registrar.
