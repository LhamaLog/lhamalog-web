# Implementation Plan: Validação de PRs

**Branch**: `LLT-285-estudar-git-hub-actions-e-montar-um-exemplo-de-workflow-yml-para-os-testes-base-do-repositorio` | **Date**: 2026-11-19 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/285-validacao-de-prs/spec.md`

## Summary

Um único workflow de GitHub Actions roda em pull requests para `Development` nos eventos `opened`, `synchronize`, `reopened`, `edited` e `ready_for_review`. Rascunho entra. Fork fica de fora. O job termina verde mesmo quando uma verificação falha ou o comentário não é publicado.

O workflow confere o nome da branch (`LLT-XXX-slug`), o título (`LLT-XXX: descricao`, com o mesmo número da branch) e a primeira linha de cada commit que não é merge (só o formato). Depois executa `npm ci`, `npm test` e `npm run build` com Node 26.12.1. Um script com `actions/github-script` publica ou atualiza um único comentário, identificado pelo marcador oculto `<!-- llt-285-validacao-prs -->`.

## Technical Context

**Language/Version**: YAML do GitHub Actions. Node 26.12.1, o valor de `engines.node` em `package.json`. JavaScript do `actions/github-script` para achar e atualizar o comentário.

**Primary Dependencies**: `actions/checkout`, `actions/setup-node` e `actions/github-script`, sem dependência nova em `package.json`. Os comandos conferidos são os scripts já existentes: `npm ci`, `npm test` e `npm run build`.

**Storage**: Nenhum. O comentário vive no pull request. O marcador oculto é a identidade dele.

**Testing**: As regras de branch, título e commit podem ser funções puras cobertas por `node --test`, no estilo de `tests/*.test.mjs`. O comentário real, o verde do job e o Node 26.12.1 no runner ficam em [quickstart.md](quickstart.md).

**Target Platform**: GitHub Actions, no pull request deste repositório cujo destino é `Development`.

**Project Type**: Workflow de validação. Não altera o aplicativo.

**Performance Goals**: O comentário aparece na mesma rodada em que a validação termina. Não há meta de minutos além de caber numa execução comum de instalação, teste e compilação deste repositório.

**Constraints**: Um arquivo de workflow. Permissões só `contents: read` e `pull-requests: write`, declaradas nesse arquivo. Job sempre verde. Um comentário, atualizado no lugar. Trecho de erro de no máximo 30 linhas e 1500 caracteres. Node 26.12.1 exato. Sem branch protection nova. Sem fork.

**Scale/Scope**: Seis verificações (branch, título, commits, instalação, testes, compilação) e um bloco `Para corrigir com IA`. Um pull request por vez, do ponto de vista de cada rodada.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` ainda é o template upstream, com princípios nomeados como placeholder e sem MUST/SHOULD ratificado. Não há gate normativo a violar nem a dispensar. Esta história, por instrução explícita, produz o plano e não implementa o workflow neste passo.

Gate inicial: **aprovado** (nenhum princípio ratificado em conflito).

## Project Structure

### Documentation (this feature)

```text
specs/285-validacao-de-prs/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/pr-validation.md
├── checklists/requirements.md
└── tasks.md
```

`tasks.md` não é criado neste passo.

### Source Code (repository root)

```text
.github/workflows/validacao-prs.yml
scripts/pr-validation.mjs
tests/pr-validation.test.mjs
```

O workflow ainda não existe. A implementação cria esse arquivo e o módulo puro `scripts/pr-validation.mjs`, coberto por `tests/pr-validation.test.mjs`. O workflow chama o módulo para as regras e usa `actions/github-script` só para criar ou atualizar o comentário. `package.json` não ganha dependência.

**Structure Decision**: Um workflow, um job. O comentário é publicado por `actions/github-script` no mesmo job, depois das verificações. Não há segundo workflow, action composta nem segredo.

## Phase 0 — Research

Resolvido em [research.md](research.md). Não restou `NEEDS CLARIFICATION`. O script do comentário é `actions/github-script`. Bash com `gh api` ficou de alternativa.

## Phase 1 — Design

- Regras dos seis itens e do marcador: [data-model.md](data-model.md)
- Forma do comentário e da permissão: [contracts/pr-validation.md](contracts/pr-validation.md)
- Roteiro para conferir o workflow quando ele existir: [quickstart.md](quickstart.md)

### Post-Design Constitution Check

Os artefatos não adicionam dependência ao aplicativo, não pedem segredo e não tornam a verificação obrigatória para o merge. O gate permanece **aprovado**, pelo mesmo motivo do gate inicial.

## Complexity Tracking

Nenhuma violação. Um workflow com o job sempre verde é a decisão do responsável: o exemplo informa, não trava.
