# Implementation Plan: Dashboards por produto e da empresa

**Branch**: `LLT-145-dashboards-produto-empresa` | **Date**: 2026-11-18 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/007-dashboards-produto-empresa/spec.md`

**Nota de setup**: `setup-plan.ps1 -Json` falhou com `yaml_missing` (PyYAML ausente). O passo equivalente foi feito manualmente a partir de `.specify/feature.json` e `.specify/templates/plan-template.md`, sem instalar dependências.

## Summary

Entregar na Web os dashboards do cliente (LLT-222 por produto e LLT-223 da empresa): cartões, gráfico SVG próprio (com placeholder de Ocorrências pendente), ranking e filtros na URL, com horários no fuso do perfil e atualização sob demanda. O Web fala só com o Core (ADR_141), por um contrato HTTP proposto em [contracts/dashboard-metrics.md](contracts/dashboard-metrics.md) (LLT-159 / spec 011 do `lhamalog-core`). **Nesta entrega** = multi-repositório: Web (spec 007) + Core (`lhamalog-core/specs/011-consulta-metricas-dashboard`, branch `LLT-145-consulta-metricas-dashboard`). Neste repo: parsers, regras de filtro/permissão/selo, UI e cliente com `X-Correlation-Id`. A implementação do Core (contagem no OpenObserve, fatos de uso, job SSID_011 a cada 1h configurável, mapeamento ADR_170, regras de acesso no backend) **não** entra neste repositório; o plano aponta o que a spec 011 precisa entregar. Decisões em [research.md](research.md).

## Technical Context

**Language/Version**: TypeScript 7.0.2 (strict) com React 19.3.1; Node.js 26.12.1 (`.node-version`)

**Primary Dependencies**: `@clerk/react` 6.18.2, `react-router-dom` 7.18.4, Vite 8.3.4, Tailwind 4.3.3. **Nenhuma dependência nova** (sem biblioteca de gráficos; estender SVG em `src/shared/ui`).

**Storage**: nenhum no Web. Filtros válidos ficam na URL; fuso vem do perfil (`src/features/profile`). Dados de métricas vêm do Core.

**Testing**: `node --test tests/*.test.mjs` (importa `.ts` com `tests/resolve-ts.mjs`); `npm test` e `npm run build` (tipos). Baseline em 17/11: **49 testes verdes**. Componentes e hooks são validados pelo [quickstart.md](quickstart.md); @testing-library/jsdom não entram sem aprovação.

**Target Platform**: navegador moderno; desenvolvimento em `http://localhost:5173` com Core (real ou mock) em `http://localhost:8080`.

**Project Type**: web application (SPA). O Core é outro repositório (`lhamalog-core`).

**Performance Goals**: atualização sob demanda (Aplicar / Atualizar); sem WebSocket; descartar resposta se a empresa ativa mudou durante a consulta.

**Constraints**: Web só fala com o Core; sem OpenObserve no front; sem Recharts; sem cache de permissão (LLT-171); 401/403 de segurança seguem a spec 006; segredos fora do front; cada chamada envia `X-Correlation-Id` (o Core já aceita e devolve); Clerk/papéis revisados pelo Felipe; commits `LLT-145: descricao` só com OK do Michel; merge da Development sem rebase.

**Scale/Scope**: feature `src/features/dashboard` (rotas `/dashboard` e `/dashboard/empresa`), extensão de SVG em `src/shared/ui`, parsers/cliente em `shared/services`, testes puros das regras de filtro/fuso/papéis/selos/mensagens de Ocorrências pendentes, documentação nesta pasta de spec. Entrega multi-repositório: Core em `lhamalog-core/specs/011-consulta-metricas-dashboard` (branch `LLT-145-consulta-metricas-dashboard`, fora deste repo).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

A constituição do web ainda não foi ratificada (`.specify/memory/constitution.md` é o template em branco). Os portões vêm de `docs/instrucoes-agentes.md`, do README e das regras da equipe:

| Regra | Situação |
|---|---|
| README e planejamento como fonte de verdade | plano baseado no código atual (React 19.3 / TS 7 / Vite 8 / Tailwind 4 / Clerk 6 / rotas e Navbar com item `dashboard`). OK |
| Spec Kit local (preset `lhamalog-local`) | plan/tasks só em `specs/007-...`; sem Git pelo agente; sem issues externas. OK |
| Sem Git pelo agente; sem criar branch | nenhuma task de Git; branch já é `LLT-145-dashboards-produto-empresa`. OK |
| Código em inglês; docs em pt-BR | código/caminhos em inglês; artefatos desta pasta em pt-BR. OK |
| Entregas pequenas, parada para revisão | tasks por história; cada fase com `npm test` e `npm run build` verdes. OK |
| Sem instalar dependências / sem alterar package.json | gráficos SVG próprios; zero libs novas. OK |
| Sem alterar constituição nem `docs/instrucoes-agentes.md` | não tocados. OK |
| Sem alterar `src/` neste comando | só artefatos em `specs/007-...`. OK |
| Segredos fora do front; `X-Correlation-Id` | contrato e cliente planejados com header; sem secrets. OK |
| Clerk / papéis: revisão do Felipe | **Portão**: revisão do Felipe (Clerk/papéis) antes de fechar as fases que tocam papéis/permissões (Foundational T008/T012; US3 T029/T030; Core T043/T046). Plano restringe mudanças de auth. OK |
| Commits `LLT-145: descricao` só com OK do Michel; merge Development sem rebase | fora do escopo deste plan/tasks (nenhuma task de Git). OK |
| Core não é implementado neste repo | aponta spec 011 / LLT-159; entrega multi-repositório; não cria nada em `lhamalog-core` a partir deste repo. OK |

Re-check pós-design / pós-analyze 2026-11-18: sem violações. Complexidade Tracking vazio. Portão Felipe explícito nas tasks e checkpoints das fases correspondentes.

## Project Structure

### Documentation (this feature)

```text
specs/007-dashboards-produto-empresa/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── dashboard-metrics.md   # proposta Web→Core (LLT-159 / spec 011)
├── checklists/requirements.md
└── tasks.md                   # $speckit-tasks (não criado pelo $speckit-plan)
```

### Source Code (repository root — alvo da implementação futura)

```text
src/
├── app/
│   ├── routes/AppRoutes.tsx              # + /dashboard e /dashboard/empresa
│   └── layouts/
│       ├── CompanyWorkspace.tsx          # ou shell equivalente para dashboard
│       └── Navbar.tsx                    # item dashboard já existe → navegar
├── features/
│   ├── dashboard/                        # novo domínio
│   │   ├── components/                   # ProductDashboardPage, CompanyDashboardPage, filtros, cartões
│   │   ├── model/                        # filtros URL, limites de período, selos, agrupamento
│   │   ├── contract/                     # parsers das respostas do Core
│   │   └── messages.ts                   # textos pt-BR/en alinhados ao perfil
│   └── profile/                          # fuso (já existe)
├── shared/
│   ├── services/
│   │   ├── api.ts / useApi.ts / useApiResource.ts  # + X-Correlation-Id
│   │   └── sessionRedirect.ts            # 401/403 (spec 006) — reutilizar
│   └── ui/
│       ├── Sparkline.tsx / MetricCard.tsx / RankingList.tsx / DistributionBars.tsx
│       └── (extensão) TimeSeriesChart.tsx ou similar SVG próprio
tests/
├── dashboard-filters.test.mjs
├── dashboard-timezone-grouping.test.mjs
├── dashboard-access.test.mjs
├── dashboard-company-derived.test.mjs
└── dashboard-contract.test.mjs
```

**Fora deste repositório (não criar agora):**

```text
lhamalog-core/specs/011-consulta-metricas-dashboard/   # outra metade desta entrega
# branch: LLT-145-consulta-metricas-dashboard
→ endpoint de consulta, job SSID_011 (padrão 1h, frequência configurável), OpenObserve, fatos de uso, mapeamento ADR_170, LLT-159
```

**Structure Decision**: SPA por domínio (`src/features/dashboard`), alinhada ao README. Cliente HTTP permanece em `shared/services`. Gráficos estendem `shared/ui` sem lib externa. Core em repositório e spec próprios.

## O que a spec 011 do Core precisa entregar (para o Web)

1. **Contrato LLT-159** alinhado a [contracts/dashboard-metrics.md](contracts/dashboard-metrics.md): `GET` métricas por produto e da empresa; parâmetros de período/produto(s)/severidade; campos `dadosConsolidadosAte`, `retentionDays`, `volumeIngestaoBytes`; série/campo opcional `occurrences` por bucket (ausente = pendente no Web); erros 400/401/403/404; eco de `X-Correlation-Id`.
2. **Consulta híbrida**: agregados já consolidados pelo job + contagem na hora no OpenObserve só do intervalo ainda aberto; volume via fatos de uso (`/internal/usage-facts`).
3. **Job SSID_011 / ADR_166**: agregação periódica por tenant, produto, severidade (ERROR/WARNING/INFO), serviço e hora a partir dos logs (não Ocorrências no MVP; LLT-104 depois). Frequência: padrão a cada **1 hora**, configurável por propriedade (cron ou intervalo) para poder mudar depois (decisão Michel 18/11, 21:39).
4. **Autorização no Core**: `tenantId` do token; DONO/ADMIN = todos os produtos; MEMBRO = AcessoProduto; outra empresa → 403/404 (LLT-158). **Portão**: revisão do Felipe (Clerk/papéis) antes de fechar.
5. **Campos de plano** necessários ao filtro: `retentionDays` e `volumeIngestaoBytes` (volume de ingestão, ADR_131) no payload de métricas.
6. **Mapeamento ADR_170** no Core (erro→ERROR, aviso→WARNING, info→INFO); payload só com enums normalizados.
7. Testes de contrato e isolamento no Core.

## Complexity Tracking

Sem violações a justificar.
