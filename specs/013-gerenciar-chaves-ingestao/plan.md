# Implementation Plan: Gerenciar chaves de ingestão no Web

**Branch**: `LLT-179-gerenciar-chaves-ingestao` (a partir da `origin/Development`, em `7a0b243`) | **Date**: 2026-11-27 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/013-gerenciar-chaves-ingestao/spec.md`

## Summary

A aba "Integração OpenTelemetry" ganha, abaixo do cartão do Figma, a seção "Chaves deste produto". Ela tem a lista de chaves com a situação, Revogar (com confirmação), Rotacionar escolhendo o período (1 a 168 h), Nova chave com nome e o Histórico (auditoria do Core), com o autor pelo nome. O topo da aba continua igual ao Figma e à F5 da `011`. Quem pode ver e usar passa a ser decidido pela permissão `INGESTION_TOKENS_MANAGE` da LLT-120, no topo e na seção. Toda a regra (situação, ações, validação, corpo das chamadas, histórico, nomes, permissão) fica em `.ts` puro, com testes. Nada muda no Core nem no Coletor. Decisões em [research.md](research.md).

## Technical Context

**Language/Version**: TypeScript 7.0.2 com React 19.3.1, Node.js 26.12.1 (`engines` do `package.json`)

**Primary Dependencies**: `@clerk/react` 6.18.2 (só `useOrganization().organization.getMemberships`, já usado pela Equipe), `react-router-dom` 7.18.4, Vite 8.3.4, Tailwind 4.3.3. **Nenhuma dependência nova.**

**Storage**: nenhum. O valor de uma chave nova vive só no estado do componente que a mostra, até fechar o aviso ou sair da aba (FR-K09).

**Testing**: `node --test tests/*.test.mjs` (importa `.ts` com `tests/resolve-ts.mjs`; não carrega `.tsx`) e `npm run build` (`tsc --noEmit` e `vite build`). Só o valor falso `llt_teste` aparece nos testes. A tela é conferida no roteiro manual (Parte D do pacote).

**Target Platform**: navegador moderno; desenvolvimento em `http://localhost:5173` com o Core em `http://localhost:8080`.

**Project Type**: web application (SPA), só o frontend.

**Performance Goals**: ao abrir a aba de um produto salvo, quem gerencia faz duas leituras da lista (uma do campo do topo, como hoje, e uma da seção) e uma do histórico, só quando abre o "Histórico". Depois de cada ação, o outro componente relê a lista (analyze A2).

**Constraints**: o topo continua igual ao Figma; a chave nunca vai para armazenamento, console, URL ou exemplo; a seção fica fora do `fieldset` desabilitado do produto arquivado (K7); sem mudança no Core, no Coletor ou na Clerk.

**Scale/Scope**: 1 módulo puro novo (`tokenManagement.ts`), `tokenContract.ts` ampliado, 1 componente novo (`IngestionTokensSection.tsx`), `ApiKeyField.tsx` e `ProductForm.tsx` alterados, 1 arquivo de teste novo.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

A constituição do web ainda não foi ratificada (`.specify/memory/constitution.md` é o template). Os portões vêm de `docs/instrucoes-agentes.md`:

| Regra | Situação |
|---|---|
| README e planejamento como fonte de verdade | plano baseado no código da `origin/Development` (`7a0b243`). OK |
| Sem Git pelo agente | **exceção autorizada pelo Pedro, só na sessão de 27/11/2026**: Git pelo agente para criar, commitar e publicar só as branches `LLT-179-gerenciar-chaves-ingestao`, `LLT-180-instrucoes-opentelemetry` e `LLT-179-coletor-le-produto-do-core`, sem PR. Registrada no [quickstart.md](quickstart.md). OK com exceção |
| Entregas pequenas, com parada para revisão | quatro fases, cada uma com testes e build. A revisão do Pedro fica para o relatório das 13h (ele está fora), sem avançar sobre decisão sensível. OK |
| Autenticação e Clerk são do Felipe, com a menor mudança | nada muda na autenticação. A seção lê `getMemberships`, como a Equipe. O "Gerar nova" troca o cargo admin da Clerk pela permissão do Core (K6), que é a regra da LLT-120. Informado na entrega. OK |
| Sem spec retroativa | só o comportamento novo. OK |
| Sem instalar dependências | nenhuma dependência nova; o `package-lock.json` não muda (`npm ci` autorizado, mas desnecessário). OK |

Re-check pós-design: sem violações além da exceção de Git registrada.

## Project Structure

### Documentation (this feature)

```text
specs/013-gerenciar-chaves-ingestao/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── analysis.md
├── tasks.md
├── checklists/
│   └── requirements.md
└── contracts/
    └── core-api.md          # cópia de leitura do contrato do Core (specs/010-tokens-ingestao)
```

### Source Code (repository root)

```text
src/features/products/
├── tokenContract.ts               # + revokePath, auditPath, tokensAfterRevoke
├── tokenManagement.ts             # NOVO: situação, ações, validação, corpos, histórico, nomes, permissão, textos
└── components/
    ├── IngestionTokensSection.tsx # NOVO: lista, Revogar, Rotacionar, Nova chave, aviso único, Histórico
    ├── ApiKeyField.tsx            # permissão no lugar de admin; relê a lista quando a seção muda algo (K9)
    └── ProductForm.tsx            # monta a seção fora do fieldset; permissão INGESTION_TOKENS_MANAGE; revisão da lista
tests/
└── ingestion-token-management.test.mjs  # NOVO
```

**Structure Decision**: a regra fica em `tokenManagement.ts` (`.ts` puro) para ter teste no `node --test`. A seção é um componente próprio, para o `ApiKeyField` do Figma mudar o mínimo.

### Fases

1. Funções puras e testes (US1 a US5, K5, K6, K7).
2. Seção "Chaves deste produto": lista, Revogar, Rotacionar, Nova chave e aviso único (US1 a US4).
3. Histórico, permissão e produto arquivado (US5, K6, K7).
4. Fechamento: busca de segredos, diferenças do Figma, analyze, commit.

## Complexity Tracking

Nenhuma violação a justificar.
