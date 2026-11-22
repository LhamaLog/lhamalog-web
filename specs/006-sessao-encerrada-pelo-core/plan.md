# Implementation Plan: Sessão encerrada pelo Core

**Branch**: `LLT-162-login-e-logout-na-web-com-clerk` (padrão do Jira; empilhada no PR #7) | **Date**: 2026-11-17 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/006-sessao-encerrada-pelo-core/spec.md`

## Summary

A decisão "encerrar ou não a sessão" sai do `useApi` e do `TeamPage` e vai para um módulo puro, `shared/services/sessionRedirect.ts`. Ele classifica a recusa (401 e 403 sem `code` encerram a sessão; 403 com `code` de negócio não), monta o endereço de login com `motivo=deslogado` e `redirect_url`, e valida o destino de volta, aceitando só rotas internas. O mesmo módulo guarda a saída em andamento, para que `signOut` seja chamado uma vez só, mesmo com várias recusas simultâneas. O `useApi` e o `useSessionErrorHandler` (hoje sem uso, passa a servir o `TeamPage`) usam essa saída única, e a `SignInPage` usa a validação do destino. A `SignInPage` leva ao destino validado, inclusive com a sessão já ativa. O 403 local (sem empresa selecionada) ganha um `code` próprio para nunca encerrar a sessão. A tela de criar organização mostra o aviso da FR-008. Os testes cobrem o módulo puro e o cliente HTTP com `node --test`, sem dependências novas. O resto é validado pelo roteiro do quickstart com a Clerk real. Decisões em [research.md](research.md).

## Technical Context

**Language/Version**: TypeScript 5 com React 19, Node.js 26.12.1 (`.node-version`)

**Primary Dependencies**: `@clerk/react` 6.18.2, `react-router-dom` 7.18.4, Vite 8, Tailwind 4. **Nenhuma dependência nova.**

**Storage**: nenhum. O destino de volta vai na própria URL do login (`redirect_url`), sem `localStorage`.

**Testing**: `node --test tests/*.test.mjs` (importa `.ts` diretamente, com `tests/resolve-ts.mjs`); `npm run build` (tipos). Componentes e hooks são validados pelo quickstart, porque @testing-library e jsdom não entram sem aprovação.

**Target Platform**: navegador moderno; desenvolvimento em `http://localhost:5173` com o Core em `http://localhost:8080`.

**Project Type**: web application (SPA), só o frontend; o Core é outro repositório.

**Performance Goals**: a saída acontece na primeira recusa, sem chamadas extras ao Core.

**Constraints**: não alterar o contrato do Core; a revogação das sessões continua no Core (ADR_032); destino de volta só interno; sessão `pending` continua deslogada (ADR_024); nada de segredo no front (ADR_026).

**Scale/Scope**: 1 módulo novo, cerca de 12 arquivos alterados (serviços, auth, Equipe e as telas que mostram erro de API), 2 arquivos de teste.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

A constituição do web ainda não foi ratificada (`.specify/memory/constitution.md` é o template). Os portões vêm de `docs/instrucoes-agentes.md`:

| Regra | Situação |
|---|---|
| README e planejamento como fonte de verdade | plano baseado no código atual da `Development` mais o PR #7. OK |
| Sem Git pelo agente | nenhuma task de Git; branch e commits são do Felipe. OK |
| Entregas pequenas, com parada para revisão | tasks por história, cada fase com build e testes. OK |
| Autenticação e Clerk são do Felipe, com a menor mudança | mudanças restritas a `features/auth`, `useApi`, `TeamPage` e à tela de criar organização; o relatório de cada entrega diz o que mudou no comportamento. OK |
| Sem spec retroativa | só o comportamento novo. OK |
| Sem instalar dependências | nenhuma dependência nova. OK |

Re-check pós-design: sem violações.

## Project Structure

### Documentation (this feature)

```text
specs/006-sessao-encerrada-pelo-core/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── core-rejections.md     # como o Web lê as recusas do Core
│   └── sign-in-return.md      # contrato de /sign-in?motivo&redirect_url
├── checklists/requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── features/auth/
│   ├── hooks/useSessionErrorHandler.ts    # usa a saída única de shared (para o TeamPage)
│   └── components/
│       ├── SignInPage.tsx                 # usa o destino validado (com e sem sessão ativa)
│       └── CreateOrganizationPage.tsx     # aviso da FR-008
├── shared/services/
│   ├── sessionRedirect.ts                 # novo: classificar recusa, destino seguro, URL de login, saída única
│   ├── api.ts                             # code local "no_organization"; texto do 403 de segurança
│   └── useApi.ts                          # usa a saída única para 401 e 403 de segurança
└── features/team/components/TeamPage.tsx  # 3 saídas passam pelo handler único

tests/
├── session-redirect.test.mjs              # novo
└── api.test.mjs                           # + classificação dos 403

README.md                                  # tratamento de 401/403 e trechos defasados
```

**Structure Decision**: SPA única organizada por funcionalidade (README, "Organização"). O README proíbe `shared` de depender de `features`, e o `useApi` está em `shared`. Por isso a regra de sessão, que é a leitura do contrato de recusas do Core, fica em `shared/services/sessionRedirect.ts`, e `features/auth` a usa (research R5).

## Complexity Tracking

Sem violações a justificar.
