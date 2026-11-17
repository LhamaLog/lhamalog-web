# Implementation Plan: Convidar usuário para a empresa

**Branch**: `LLT-167-convidar-usuario-para-a-empresa` | **Date**: 2026-11-12 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/003-convidar-usuario-empresa/spec.md`

## Summary

O administrador da empresa selecionada ganha a rota `/equipe`, aberta pelo item Equipe. A tela envia convite de organização pela sessão já aberta (`organization.inviteMember`), lista pendentes (`getInvitations`), revoga (`revoke`) e reenvia sem deixar dois convites utilizáveis para o mesmo e-mail. Os cargos são Administrador (`org:admin`) e Membro (`org:member`). O prazo é de 7 dias, configurado no dashboard por outra pessoa; a tela só exibe a criação mais 7 dias. O aceite continua em `/sign-in` e `/sign-up`.

O Core não guarda convite, não ganha API de convite e não usa chave secreta. O Web não chama `apiRequest` nem `useApi` para este fluxo e não adiciona dependência. Esta decisão substitui a leitura do ADR_114 para convidar membros. O comentário de `CreateOrganizationPage.tsx` e a linha do README ainda dizem que o convite é do backend: a implementação reescreve esses dois textos. Criar empresa continua com `skipInvitationScreen`.

## Technical Context

**Language/Version**: TypeScript 7.0.2, React 19.3.1, Vite 8.3.4, Node 26.12.1 (testes)

**Primary Dependencies**: As já declaradas em `package.json`: `react`, `react-dom`, `react-router-dom` 7.18.4, `@clerk/react` 6.18.2, `@clerk/localizations` 4.24.2, Tailwind CSS 4.3.3. Nenhuma dependência nova de produção.

**Storage**: Nenhum. O convite vive na organização da Clerk. O rascunho do formulário vive no estado da tela até o envio.

**Testing**: `node --test tests/*.test.mjs`, com `tests/resolve-ts.mjs`, no estilo de `tests/company-settings.test.mjs`. Sem renderizador. E-mail real, revogação e aceite ficam em [quickstart.md](quickstart.md).

**Target Platform**: Navegador, SPA autenticada já servida por este repositório.

**Project Type**: Aplicativo web (frontend). O serviço Core fica de fora do convite.

**Performance Goals**: O administrador conclui um convite válido em menos de 2 minutos (SC-001). Cada ação termina em sucesso visível ou erro visível. Sem meta de latência diferente da tela de empresa.

**Constraints**: Sem segredo (`sk_`, `CLERK_SECRET_KEY`) no Web e sem segredo de convite no Core. Sem API de convite no Core. Sem `fetch` direto e sem biblioteca nova. `inviteMember` só recebe `emailAddress` e `role`. Prazo de 7 dias e URL de retorno são dashboard. Cargos só `org:admin` e `org:member`. Rota nova única: `/equipe`. Aceite sem rota nova. `skipInvitationScreen` permanece na criação de empresa. Textos próprios da tela em português. Recusa de não administrador: "Você não tem acesso. Selecione uma empresa válida.", sem `signOut`.

**Scale/Scope**: Uma tela, dois cargos, lista paginada de 10, uma empresa ativa por vez. Sem convite em massa.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` ainda é o template upstream, com princípios nomeados como placeholder e sem MUST/SHOULD ratificado. Não há gate normativo a violar nem a dispensar. O preset local `lhamalog-local` restringe o comando de implementação; esta história, por instrução explícita, produz os artefatos Spec Kit até o analyze e pode versioná-los na branch `LLT-167-convidar-usuario-para-a-empresa`. Não implementa a tela neste passo.

Gate inicial: **aprovado** (nenhum princípio ratificado em conflito).

## Project Structure

### Documentation (this feature)

```text
specs/003-convidar-usuario-empresa/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/team-invitations.md
├── checklists/requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
src/features/team/
├── types.ts
├── validation.ts
├── invitations.ts
└── components/TeamPage.tsx

src/app/routes/AppRoutes.tsx
src/app/layouts/CompanyWorkspace.tsx
src/app/layouts/Navbar.tsx
src/features/auth/components/CreateOrganizationPage.tsx
src/features/auth/theme/localization.ts
README.md

tests/team-invitations.test.mjs
```

**Structure Decision**: Feature nova em `src/features/team/`, ao lado de `company`, `products` e `profile`. `CompanyWorkspace` passa a tratar `/equipe` como trata `/perfil`: mesma moldura, empresa selecionada obrigatória, item de menu só para administrador. A lógica pura (e-mail, cargo, administrador, validade, "pode convidar" e plano de reenvio) fica fora do componente para o `node --test` alcançar. O componente só chama o SDK. `api.ts` e `useApi.ts` não mudam. O comentário vencido do ADR_114 é atualizado no componente de criar empresa e no README, sem remover `skipInvitationScreen`.

## Phase 0 — Research

Resolvido em [research.md](research.md). Não restou `NEEDS CLARIFICATION` no contexto técnico. O conflito com o comentário do ADR_114 está decidido: reescrever o comentário na implementação, sem devolver o convite ao Core.

## Phase 1 — Design

- Modelo da tela: [data-model.md](data-model.md)
- Contrato do SDK, sem HTTP: [contracts/team-invitations.md](contracts/team-invitations.md)
- Roteiro de verificação: [quickstart.md](quickstart.md)

### Post-Design Constitution Check

Os artefatos não introduzem dependência, não criam API no Core, não colocam segredo no Web e não ampliam o escopo para a lista de membros, a matriz de cargos ou uma rota de aceite. O gate permanece **aprovado**, pelo mesmo motivo do gate inicial: a constituição não tem princípio ratificado.

## Complexity Tracking

Nenhuma violação. Não há exceção a registrar. O conflito com o comentário antigo do ADR_114 não é violação de constituição; é texto de código a corrigir na implementação, já coberto por research e por tarefa.
