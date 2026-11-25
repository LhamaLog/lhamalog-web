# Implementation Plan: Melhorar a tela de perfil do usuário

**Branch**: `LLT-295-melhorar-a-tela-de-perfil-do-usuario` | **Date**: 2026-11-25 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/295-melhorar-a-tela-de-perfil-do-usuario/spec.md`

## Summary

`/perfil` passa a ser o hub da conta: cartão de identidade e uma seção por vez (Conta, Preferências, Notificações, Segurança, Ajuda). Nome, idioma e fuso continuam no Core, como na especificação anterior. Bio e cargo entram no mesmo `GET`/`PUT /api/user/profile`, nos campos `bio` e `jobTitle`. Tema e acessibilidade ficam só neste navegador. Foto, sessões, a troca de senha pela sessão aberta e desligar a verificação usam o SDK de sessão da Clerk já aberto, sem segredo e sem mudança no painel. Ligar a verificação fica só no fluxo existente `/tarefas/configurar-mfa`. A ADR_171 fica só como ponteiro. Decisões em [research.md](research.md).

## Technical Context

**Language/Version**: TypeScript 7.0.2, React 19.3.1, Vite 8.3.4, Node 26.12.1 (testes)

**Primary Dependencies**: as já declaradas em `package.json`: `react`, `react-dom`, `react-router-dom` 7.18.4, `@clerk/react` 6.18.2, Tailwind CSS 4.3.3. Nenhuma dependência nova.

**Storage**: perfil gravado no Core. Rascunho no estado da tela. Tema e acessibilidade em `localStorage` (`lhamalog.theme`, `lhamalog.reduceMotion`, `lhamalog.underlineLinks`, `lhamalog.contrast`). O tema `system` lê `prefers-color-scheme`.

**Testing**: `node --test tests/*.test.mjs`, importando `.ts` por `tests/resolve-ts.mjs`. A suíte não carrega `.tsx`; a regra pura fica em `.ts`. A tela segue [quickstart.md](quickstart.md).

**Target Platform**: navegador, SPA autenticada já servida por este repositório.

**Project Type**: aplicativo web (frontend). O Core é outro repositório e segue em trabalho paralelo.

**Performance Goals**: a pessoa encontra os dados do cartão em menos de 1 minuto (SC-001) e um fuso em menos de 1 minuto (SC-004). Sem meta de latência nova.

**Constraints**: sem `CLERK_SECRET_KEY`, sem valor `sk_`, sem SDK Backend e sem mudança no painel da Clerk. Sem código de pareamento. Sem dependência nova. Sem traduzir o restante do aplicativo. Bio até 160 e cargo até 80, texto puro como o nome. A ADR_171 não é lida nesta rodada.

**Scale/Scope**: a rota `/perfil` que já existe, cinco seções, dois idiomas no catálogo que o perfil já usa.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` ainda é o template upstream, sem princípio MUST ratificado. Não há gate normativo a violar. Esta rodada só produz artefatos Spec Kit.

Gate inicial: **aprovado**.

## Project Structure

### Documentation (this feature)

```text
specs/295-melhorar-a-tela-de-perfil-do-usuario/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/user-profile.md
├── checklists/requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
src/features/profile/
├── types.ts
├── contract.ts
├── validation.ts
├── messages.ts
├── timeZones.ts
├── appearance.ts
├── sessions.ts
├── photo.ts
├── membership.ts
└── components/
    ├── ProfilePage.tsx
    ├── AccountSection.tsx
    ├── PreferencesSection.tsx
    ├── SecuritySection.tsx
    └── HelpSection.tsx

src/features/notificationPreferences/components/NotificationPreferences.tsx
src/app/layouts/CompanyWorkspace.tsx
src/app/layouts/HeaderControls.tsx
src/app/layouts/footerLinks.ts
src/shared/ui/Avatar.tsx
src/styles.css

tests/profile.test.mjs
tests/profile-hub.test.mjs
```

**Structure Decision**: o aplicativo único em `src/` continua. O hub fica em `src/features/profile`. `NotificationPreferences` permanece na feature de notificações: muda o lugar, para dentro da seção, e o idioma das frases fixas. A foto do cabeçalho entra no `Avatar` que o cabeçalho já usa. Tema e acessibilidade são atributos em `document.documentElement` enquanto `CompanyWorkspace` está montado, com as regras em `src/styles.css`. As telas de entrada não recebem esses atributos. Não se espalha `dark:` por todos os componentes.

## Phase 0 — Research

Resolvido em [research.md](research.md). Não restou `NEEDS CLARIFICATION` no contexto técnico.

## Phase 1 — Design

- Modelo e regras: [data-model.md](data-model.md)
- Contrato que o web consome: [contracts/user-profile.md](contracts/user-profile.md)
- Roteiro: [quickstart.md](quickstart.md)

### Post-Design Constitution Check

Os artefatos não adicionam dependência, não usam segredo e não gravam tema no Core. O gate permanece **aprovado**.

## Complexity Tracking

Nenhuma violação. Não há exceção a registrar.
