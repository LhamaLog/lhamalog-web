# Implementation Plan: Tela de planos e contratação (Asaas simulado)

**Branch**: `LLT-289-criar-o-tenant-na-confirmacao-de-pagamento-asaas-simulado` (padrão do Jira; par do PR #14 do core) | **Date**: 2026-11-18 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/007-tela-planos-contratacao/spec.md`

## Summary

Nova rota `/plano` na área logada, aberta pelo item "Plano" do menu, que já existe e hoje não leva a lugar nenhum. A tela lista os planos do Core, valida o nome da empresa e, em "Contratar", chama o checkout e leva o navegador ao `paymentUrl` (hoje, o simulador do Asaas). Ela também mostra a situação do pedido mais recente. Leitura e validação das respostas ficam num módulo puro, `features/billing/model.ts`, testado com `node --test`. Para levar quem está sem plano até a tela, o `useApi` avisa um módulo pequeno, `shared/services/subscriptionRedirect.ts`, quando recebe `subscription_required`; o `CompanyWorkspace` escuta esse aviso e navega para `/plano`. A sessão não é encerrada (spec 006). O README troca o texto antigo ("sem Tenant, 403 e logout") pelo fluxo de contratação. Decisões em [research.md](research.md).

## Technical Context

**Language/Version**: TypeScript com React 19, Node.js 26.12.1

**Primary Dependencies**: `@clerk/react` 6.18.2, `react-router-dom` 7.18.4, Vite 8, Tailwind 4. **Nenhuma dependência nova.**

**Storage**: nenhum.

**Testing**: `node --test tests/*.test.mjs` (módulos puros) e `npm run build` (tipos). A tela é validada pelo quickstart, com o Core da spec 010 e a Clerk real.

**Target Platform**: navegador; desenvolvimento em `http://localhost:5173` com o Core em `http://localhost:8080`.

**Project Type**: web application (SPA), só o frontend.

**Performance Goals**: a tela faz duas chamadas ao abrir (planos e pedido) e uma em "Contratar".

**Constraints**: não alterar o contrato do Core; a spec 006 continua valendo; nada de segredo no front (ADR_026); tela provisória, sem o Figma.

**Scale/Scope**: 1 tela, 2 módulos novos, 4 arquivos alterados (`useApi`, `AppRoutes`, `CompanyWorkspace`, README), 1 arquivo de teste.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

A constituição do web ainda não foi ratificada (`.specify/memory/constitution.md` é o template). Os portões vêm de `docs/instrucoes-agentes.md`:

| Regra | Situação |
|---|---|
| README e planejamento como fonte de verdade | plano baseado no código atual da `Development`. OK |
| Sem Git pelo agente | nenhuma task de Git; branch e commits são do Felipe. OK |
| Entregas pequenas, com parada para revisão | uma feature pequena (cerca de 300 linhas), com build e testes. OK |
| Autenticação e Clerk são do Felipe, com a menor mudança | só uma linha nova no `useApi` (o aviso do `subscription_required`), sem mudar a regra de saída da spec 006. Informado na entrega. OK |
| Regras de negócio e API fora de `shared/ui` | tudo em `features/billing`; `shared/ui` só é usado. OK |
| Sem instalar dependências | nenhuma dependência nova. OK |

Re-check pós-design: sem violações.

## Project Structure

### Documentation (this feature)

```text
specs/007-tela-planos-contratacao/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/core-billing.md   # como o Web usa /api/billing do Core
├── checklists/requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── features/billing/
│   ├── model.ts                       # leitura das respostas, validação, formatação, estado da tela
│   └── components/PlansPage.tsx       # tela /plano
├── shared/services/
│   ├── subscriptionRedirect.ts        # aviso de subscription_required (novo)
│   └── useApi.ts                      # avisa no subscription_required
├── app/routes/AppRoutes.tsx           # rota /plano
└── app/layouts/CompanyWorkspace.tsx   # item "Plano" do menu, tela e navegação no aviso

tests/billing.test.mjs                 # model.ts e subscriptionRedirect.ts
README.md                              # fluxo de contratação
```

**Structure Decision**: nova pasta `features/billing`, no padrão das outras features (modelo puro mais componentes). A tela entra no `CompanyWorkspace`, como Empresa, Produtos, Perfil e Equipe, para manter menu, cabeçalho e troca de empresa.
