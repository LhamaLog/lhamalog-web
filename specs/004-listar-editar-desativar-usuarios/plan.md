# Implementation Plan: Listar, editar e desativar usuários

**Branch**: `LLT-168-listar-editar-e-desativar-usuarios` | **Date**: 2026-11-15 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/004-listar-editar-desativar-usuarios/spec.md`

## Summary

O administrador continua em `/equipe`. A tela ganha um bloco de usuários ao lado dos convites pendentes da LLT-167. Cada linha junta `organization.getMemberships` (nome público, identificador, cargo, `userId`) com `GET /api/company/members` (status e último acesso) pelo `userId`. Editar é `organization.updateMember({ userId, role })` com `admin` ou `member`, sem prefixo. Desativar é `POST /api/company/members/{userId}/deactivation` e reativar é `DELETE` no mesmo caminho, sem corpo. Não há `PUT`. A pessoa não sai da organização: a tela não chama `membership.destroy` nem `organization.removeMember`.

O Core é o serviço da spec e a fonte da verdade do contrato, no commit `4f32c77`. Ele confere a marca em toda requisição. O Web distingue os 403 por `code`: `user_deactivated` mostra "Seu acesso a esta empresa foi desativado." e não encerra a sessão; `last_admin` é 403, não 409; `not_admin` é a recusa de membro neste recurso. A trava local conta administradores da organização que não estão `deactivated` no Core. Ausência no `GET` conta como ativo.

Não há chave secreta, não há configuração nova de dashboard e não há dependência nova. O contrato em [contracts/company-members.md](contracts/company-members.md) acompanha o do Core. O limite dessa ausência está em [docs/adr/limite-sem-chave-secreta.md](../../docs/adr/limite-sem-chave-secreta.md): rebaixar o último administrador é barrado só no navegador, porque a troca de cargo usa `organization.updateMember` na sessão e o Core não tem `CLERK_SECRET_KEY` (M1); um administrador desativado no Core ainda pode agir direto na Clerk, porque não sai da organização (M2).

## Technical Context

**Language/Version**: TypeScript 7.0.2, React 19.3.1, Vite 8.3.4, Node 26.12.1 (testes)

**Primary Dependencies**: As já declaradas em `package.json`: `react`, `react-dom`, `react-router-dom` 7.18.4, `@clerk/react` 6.18.2, `@clerk/localizations` 4.24.2, Tailwind CSS 4.3.3. Nenhuma dependência nova.

**Storage**: Nenhum no Web. Status e último acesso ficam no Core, por usuário e por empresa. Nome, e-mail e cargo continuam na organização da Clerk. O rascunho de cargo vive no estado da linha até a confirmação.

**Testing**: `node --test tests/*.test.mjs`, com `tests/resolve-ts.mjs`, no estilo de `tests/team-invitations.test.mjs` e `tests/api.test.mjs`. Sem renderizador. Troca real de cargo, marca no Core e a próxima requisição da pessoa desativada ficam em [quickstart.md](quickstart.md).

**Target Platform**: Navegador, SPA autenticada já servida por este repositório.

**Project Type**: Aplicativo web (frontend). O Core expõe o contrato de membros; este repositório só consome.

**Performance Goals**: O administrador vê as cinco colunas da página em menos de 1 minuto (SC-001). Cada ação termina em sucesso visível ou erro visível. Sem meta de latência diferente da tela de empresa.

**Constraints**: Sem `sk_` e sem `CLERK_SECRET_KEY` no Web e no Core. O limite está em [docs/adr/limite-sem-chave-secreta.md](../../docs/adr/limite-sem-chave-secreta.md). Sem configuração nova de dashboard. Sem `membership.destroy`, sem `organization.removeMember` e sem `PUT` de membro. Cargo gravado só `admin` ou `member`, via `organization.updateMember`. Status e último acesso só pelo Core, pelo cliente `apiRequest` / `useApi`. Rota existente: `/equipe`. Textos próprios em português. Recusa de quem abre `/equipe` sem ser administrador, antes da chamada: "Você não tem acesso. Selecione uma empresa válida.", sem `signOut`. Recusa `not_admin` do recurso: "Somente o administrador da empresa pode gerenciar os usuários." Recusa do próprio usuário desativado: "Seu acesso a esta empresa foi desativado.", sem `signOut`. Página de 10, igual aos convites. `lastAccessAt` pode ter até 5 minutos.

**Scale/Scope**: Um bloco novo na tela já existente, dois cargos, dois status, uma empresa ativa por vez. Sem ação em massa. A lista visível é a página da Clerk; o Core devolve os registros que conhece e o Web completa o restante como Ativo e sem acesso registrado.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` ainda é o template upstream, com princípios nomeados como placeholder e sem MUST/SHOULD ratificado. Não há gate normativo a violar nem a dispensar. O preset local `lhamalog-local` restringe o comando de implementação; esta história, por instrução explícita, produz os artefatos Spec Kit até o analyze e pode versioná-los na branch `LLT-168-listar-editar-e-desativar-usuarios`. Não implementa a tela neste passo.

Gate inicial: **aprovado** (nenhum princípio ratificado em conflito).

## Project Structure

### Documentation (this feature)

```text
specs/004-listar-editar-desativar-usuarios/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/company-members.md
├── checklists/requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
src/features/team/
├── types.ts
├── validation.ts
├── invitations.ts
├── members.ts
├── memberContract.ts
└── components/TeamPage.tsx

src/shared/services/api.ts
tests/team-members.test.mjs
tests/api.test.mjs
```

**Structure Decision**: A feature `src/features/team/` já existe. Esta história acrescenta a junção e o contrato do Core ao lado das funções de convite, e estende `TeamPage.tsx` com o bloco de usuários. `api.ts` passa a copiar `code` e a reconhecer `user_deactivated`, `last_admin` e `not_admin` sem mudar o 401 nem o 403 sem `code`. Não há rota nova, item de menu novo nem dependência. `AppRoutes.tsx`, `CompanyWorkspace.tsx` e `Navbar.tsx` permanecem como a LLT-167 os deixou.

## Phase 0 — Research

Resolvido em [research.md](research.md). Não restou `NEEDS CLARIFICATION` no contexto técnico. O contrato do Core no commit `4f32c77` é a fonte da verdade, inclusive o `code` opcional no erro.

## Phase 1 — Design

- Modelo da linha e das transições: [data-model.md](data-model.md)
- Contrato esperado do Core e o uso mínimo da Clerk: [contracts/company-members.md](contracts/company-members.md)
- Roteiro de verificação: [quickstart.md](quickstart.md)

### Post-Design Constitution Check

Os artefatos não introduzem dependência, não colocam segredo no Web nem no Core, não removem a pessoa da organização e não pedem dashboard. O gate permanece **aprovado**, pelo mesmo motivo do gate inicial: a constituição não tem princípio ratificado.

## Complexity Tracking

Nenhuma violação. A lista em duas fontes é a decisão do responsável: a Clerk não tem status nem último acesso, e o Core não pode ler a organização sem chave secreta. Não há exceção de constituição a registrar.
