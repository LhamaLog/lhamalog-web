# Implementation Plan: Nome único de produto (Web)

**Branch**: `LLT-177-nome-unico-produto` (a partir da `LLT-123-editar-arquivar-produto` do Web) | **Date**: 2026-11-19, revisto em 2026-11-20 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/010-nome-unico-produto/spec.md`

## Summary

O Core (PR #7, `specs/006-nome-unico-produto`) recusa com 409 o nome de produto que já existe na empresa, inclusive de produto arquivado. O Web passa a reconhecer essa recusa pela mensagem fixa do contrato, numa função pura (`productErrors.ts`), e a mostrá-la embaixo do campo nome, na aba "Informações do produto", com o aviso "Nada foi salvo: confira o nome do produto." no topo. O botão "Recarregar produto" da spec 009 não aparece nesse caso. Na edição com duas partes, a ordem do `saveEdits` (gerais e depois contexto) já impede o envio do contexto quando o nome é recusado. Decisões em [research.md](research.md).

## Technical Context

**Language/Version**: TypeScript 7.0.2 com React 19.3.1, Node.js 26.12.1 (`engines` do `package.json`)

**Primary Dependencies**: `@clerk/react` 6.18.2, `react-router-dom` 7.18.4, Vite 8.3.4, Tailwind 4.3.3. **Nenhuma dependência nova.**

**Storage**: nenhum. A recusa vive só no estado do formulário.

**Testing**: `node --test tests/*.test.mjs` (importa `.ts` com `tests/resolve-ts.mjs`; não carrega `.tsx`, por isso a lógica fica em `.ts` puro) e `npm run build` (`tsc --noEmit` e `vite build`). A ligação na tela é conferida pelo roteiro do [quickstart.md](quickstart.md).

**Target Platform**: navegador moderno; desenvolvimento em `http://localhost:5173` com o Core em `http://localhost:8080`.

**Project Type**: web application (SPA), só o frontend; o Core é outro repositório.

**Performance Goals**: nenhuma chamada a mais. O Web não consulta o nome antes de enviar (edge case da spec).

**Constraints**: não alterar o contrato do Core; não depender de `code`, que o Core ainda não manda nessa recusa; manter os outros 409 (versão e arquivado) como na spec 009.

**Scale/Scope**: 1 módulo novo (`productErrors.ts`), 1 arquivo alterado (`ProductForm.tsx`), 1 arquivo de teste novo.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

A constituição do web ainda não foi ratificada (`.specify/memory/constitution.md` é o template). Os portões vêm de `docs/instrucoes-agentes.md`:

| Regra | Situação |
|---|---|
| README e planejamento como fonte de verdade | plano baseado no código da `LLT-123-editar-arquivar-produto`. OK |
| Sem Git pelo agente | nenhuma task de Git; branch e commits são do Pedro. OK |
| Entregas pequenas, com parada para revisão | três fases, cada uma com testes e build e parada para revisão. OK |
| Autenticação e Clerk são do Felipe, com a menor mudança | nada muda na autenticação nem na Clerk. OK |
| Sem spec retroativa | só o comportamento novo da LLT-177. OK |
| Sem instalar dependências | nenhuma dependência nova. OK |

Re-check pós-design: sem violações.

## Project Structure

### Documentation (this feature)

```text
specs/010-nome-unico-produto/
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
    └── core-api.md          # cópia de leitura do contrato do Core (specs/006-nome-unico-produto)
```

### Source Code (repository root)

```text
src/features/products/
├── productErrors.ts        # NOVO: nameInUseMessage (texto do contrato), nameInUseNotice (N1), isNameInUse(error), nameInUseErrors(error)
└── components/ProductForm.tsx   # usa isNameInUse no catch; abre a aba Informações; limpa o erro ao digitar
tests/
└── product-errors.test.mjs # NOVO
```

**Structure Decision**: a regra fica em `productErrors.ts`, separada do `productEdit.ts` da spec 009, porque trata só da leitura de uma recusa do Core e pode ser reaproveitada por outras telas de produto.

### Fases

1. Funções puras e testes.
2. Ligação no `ProductForm`.
3. Roteiro manual e fechamento.

## Complexity Tracking

Nenhuma violação a justificar.
