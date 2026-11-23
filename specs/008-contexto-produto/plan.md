# Implementation Plan: Contexto do produto para IA (Web)

**Branch**: `LLT-178-contexto-produto` (a partir da `Development` do Web) | **Date**: 2026-11-19, revisto em 2026-11-20 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/008-contexto-produto/spec.md`

## Summary

A aba "Contexto para IA" é refeita igual ao Figma (`03-produto-contexto-ia.png`), com os seis campos do Core (PR #9, `specs/009-contexto-produto` do Core). O cadastro e a edição passam a enviar o formato novo, o que conserta a perda de dados: a tela antiga mandava campos que o Core ignora e gravava o contexto vazio. A leitura, a limpeza, a validação e as regras das listas ficam em funções puras no `context.ts`, com testes; os componentes `.tsx` só chamam essas funções. A moldura comum às três abas (Voltar, abas com ícone, rodapé em cartão) entra nesta branch. Decisões em [research.md](research.md).

## Technical Context

**Language/Version**: TypeScript 7.0.2 com React 19.3.1, Node.js 26.12.1 (`engines` do `package.json`)

**Primary Dependencies**: `@clerk/react` 6.18.2, `react-router-dom` 7.18.4, Vite 8.3.4, Tailwind 4.3.3. **Nenhuma dependência nova** (o arrastar usa a API nativa do navegador).

**Storage**: nenhum no Web. O contexto é gravado no Core.

**Testing**: `node --test tests/*.test.mjs` (importa `.ts` com `tests/resolve-ts.mjs`; não carrega `.tsx`, por isso a lógica fica em `.ts` puro) e `npm run build` (`tsc --noEmit` e `vite build`). A tela é conferida pelo roteiro do [quickstart.md](quickstart.md).

**Target Platform**: navegador moderno; desenvolvimento em `http://localhost:5173` com o Core em `http://localhost:8080`.

**Project Type**: web application (SPA), só o frontend; o Core é outro repositório.

**Performance Goals**: nenhuma chamada a mais. A validação local evita chamar o Core com dados que ele recusaria.

**Constraints**: seguir os limites do Core (30 itens; 80 caracteres por item em Arquitetura e 200 em Escopo e Dados sensíveis; 2000 na descrição); não mudar o contrato do Core; não mexer no conteúdo das abas Informações (LLT-123) e OpenTelemetry (LLT-179); `shared/ui` só ganha props opcionais.

**Scale/Scope**: 1 módulo puro novo (`context.ts`), 5 componentes novos, `ProductForm.tsx` e 3 componentes de `shared/ui` alterados, 1 arquivo de teste novo.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

A constituição do web ainda não foi ratificada (`.specify/memory/constitution.md` é o template). Os portões vêm de `docs/instrucoes-agentes.md`:

| Regra | Situação |
|---|---|
| README e planejamento como fonte de verdade | plano baseado no código da `Development` de 19/11/2026. OK |
| Sem Git pelo agente | nenhuma task de Git; branch e commits são do Pedro. OK |
| Entregas pequenas, com parada para revisão | quatro fases, cada uma com testes e build e parada para revisão. OK |
| Autenticação e Clerk são do Felipe, com a menor mudança | nada muda na autenticação nem na Clerk. OK |
| Sem spec retroativa | só o comportamento novo da LLT-178. OK |
| Sem instalar dependências | nenhuma dependência nova. OK |

Re-check pós-design: sem violações. As props novas de `shared/ui` (`hint`, `showCount`, variante `secondary` do `Button`) são opcionais; quem não as passa não vê mudança.

## Project Structure

### Documentation (this feature)

```text
specs/008-contexto-produto/
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
    └── core-api.md          # cópia de leitura do contrato do Core (specs/009-contexto-produto)
```

### Source Code (repository root)

```text
src/features/products/
├── types.ts                       # ProductContext novo, Personality, emptyProductContext
├── context.ts                     # NOVO: readProductContext, cleanContext, contextFieldErrors, contextErrorFor,
│                                  #       personalityOptions, languageOptions, addListItem, removeListItem,
│                                  #       moveListItem, firstTabWithError
└── components/
    ├── ProductForm.tsx            # aba de contexto com os componentes novos; campos antigos e aviso removidos; moldura do Figma
    ├── ProductContextFields.tsx   # NOVO: layout do Figma (descrição, personalidade, idioma, arquitetura, escopo, sensíveis)
    ├── SegmentedControl.tsx       # NOVO: Simples | Padrão | Detalhado (radiogroup, setas do teclado)
    ├── ChipListField.tsx          # NOVO: arquitetura (chips com × e +)
    ├── ReorderListField.tsx       # NOVO: escopo e dados sensíveis (alça, ×, + Adicionar item, mover por teclado)
    └── NewItemInput.tsx           # NOVO: campo do item novo, usado pelas duas listas
src/shared/ui/
├── Input.tsx, Select.tsx          # prop opcional hint
├── Textarea.tsx                   # props opcionais hint e showCount
└── Button.tsx                     # variante opcional secondary
tests/
├── product-context.test.mjs       # NOVO
└── company-products.test.mjs      # context do produto de teste no formato novo
```

**Structure Decision**: a lógica das listas e da validação fica em `context.ts`, e não nos componentes, porque o `node --test` não carrega `.tsx` (analyze C1). Os componentes de campo ficam em `features/products/components`, porque só a tela de produto os usa.

### Fases

1. Tipos e funções puras, com testes.
2. Componentes de campo (`SegmentedControl`, `ChipListField`, `ReorderListField`).
3. Aba montada igual ao Figma, mais envio e erros.
4. Fechamento: roteiro manual com comparação lado a lado com o Figma.

## Complexity Tracking

Nenhuma violação a justificar.
