# Tasks: Comando test no comentário do PR

**Input**: Design documents from `/specs/287-comando-test-no-pr/`

**Prerequisites**: plan.md, spec.md

**Tests**: Incluídos para a detecção do comando, a associação, o autor ignorado e a reação. O comentário real no GitHub fica de fora do `npm test`.

**Organization**: Uma história por fase, na ordem da spec. A fundação é o módulo que o workflow e o teste importam.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode correr em paralelo (arquivos diferentes, sem depender de tarefa incompleta)
- **[Story]**: História a que a tarefa pertence (US1, US2, US3)
- Cada tarefa inclui o caminho do arquivo

## Path Conventions

- Workflow: `.github/workflows/pr-validation.yml`
- Regras: `scripts/pr-validation.mjs`
- Teste: `tests/pr-validation.test.mjs`
- Documentação da limitação: `README.md` e `specs/287-comando-test-no-pr/spec.md`
- Sem dependência nova em `package.json`

## Phase 1: Setup

**Purpose**: Registrar a história sem mexer no aplicativo

- [x] T001 Confirmar que `specs/287-comando-test-no-pr/spec.md` e `specs/287-comando-test-no-pr/plan.md` descrevem o comando, a permissão, o mesmo comentário, o fork de fora, as reações e a limitação da branch padrão `main`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Funções puras usadas pelo workflow e pelos testes. Nenhuma história de workflow começa antes.

**⚠️ CRITICAL**: Nenhuma história começa antes desta fase

- [x] T002 Escrever em `tests/pr-validation.test.mjs`, antes de alterar o comportamento, a cobertura de `scripts/pr-validation.mjs`: `test`, `/test`, ` test ` e quebra de linha nas pontas são comando; `Test`, `testar`, `test por favor`, `t e s t` e vazio não são; `OWNER`, `MEMBER` e `COLLABORATOR` podem pedir reexecução; `CONTRIBUTOR`, `NONE`, `FIRST_TIME_CONTRIBUTOR` e associação vazia não podem; autor com `type` `Bot`, login `github-actions[bot]` ou login terminado em `[bot]` não pode, mesmo com associação aceita e corpo `test`; `shouldRerun` só devolve verdadeiro quando comando, associação e autor passam juntos; comentário de validação sem ❌ pede a reação `rocket`; comentário com ❌ ou vazio pede `-1`; `node scripts/pr-validation.mjs --gate` escreve `rerun=true` ou `rerun=false` e termina com código 0

- [x] T003 Implementar em `scripts/pr-validation.mjs` `isRerunCommand`, `canRequestRerun`, `isIgnoredCommentAuthor`, `shouldRerun`, `gateFromEnv` e `rerunReaction`, mais os modos `--gate` e `--reaction`, sem mudar o texto do comentário já coberto pelos testes da LLT-285

**Checkpoint**: `npm test` cobre o comando e a permissão sem workflow

---

## Phase 3: User Story 1 - Pedir a validação de novo (Priority: P1) 🎯 MVP

**Goal**: Comentário aceito refaz a validação no head e atualiza o comentário do marcador, sem bloquear o merge e sem fork

**Independent Test**: O job `reexecutar` em `.github/workflows/pr-validation.yml` só corre em `issue_comment` `created` de pull request. Com `rerun=true` e head no próprio repositório, faz checkout do SHA, roda `npm ci`, `npm test` e `npm run build`, monta o comentário com a cópia de `scripts/pr-validation.mjs` e atualiza o marcador `<!-- llt-285-validacao-prs -->`. O job não falha a rodada.

### Implementation for User Story 1

- [x] T004 [US1] Em `.github/workflows/pr-validation.yml`, acrescentar `on.issue_comment.types: [created]` e o job `reexecutar`. O job `validar` continua só em `pull_request`, com o mesmo `if` de repositório do head. O job novo copia `scripts/pr-validation.mjs` para o temporário do runner antes do checkout do head, chama `--gate`, busca o pull request, recusa fork comparando `head.repo.full_name` com `github.repository`, faz checkout do SHA com `persist-credentials: false`, repete instalação, teste e compilação com Node 26.12.1, monta o comentário com a cópia do script e atualiza ou cria o comentário do marcador. Passos que podem falhar usam `continue-on-error` ou `exit 0`

**Checkpoint**: A reexecução atualiza um comentário só e termina verde

---

## Phase 4: User Story 2 - Só o comando certo, de quem pode (Priority: P1)

**Goal**: O workflow não chega a obter o head quando o comando, a associação ou o autor falham

**Independent Test**: O `if` do job exige pull request, autor que não é bot, associação `OWNER`, `MEMBER` ou `COLLABORATOR` e a presença de `test`. `--gate` ainda recusa corpo que não é o comando exato. Fork não faz checkout.

### Implementation for User Story 2

- [x] T005 [US2] No `if` de `reexecutar` em `.github/workflows/pr-validation.yml`, exigir `github.event.issue` com chave `pull_request`, `github.event.comment.user.type != 'Bot'`, login diferente de `github-actions[bot]`, associação `OWNER` ou `MEMBER` ou `COLLABORATOR`, e `contains` do corpo com `test`. Não obter o head quando `steps.gate.outputs.rerun` não for `true` ou quando o head for de outro repositório

**Checkpoint**: Issue, bot, associação recusada, texto a mais e fork não instalam dependência

---

## Phase 5: User Story 3 - Ver que a reexecução começou e terminou (Priority: P2)

**Goal**: Olhos ao começar e foguete ou polegar para baixo ao terminar

**Independent Test**: O passo de olhos só corre depois do gate e da recusa de fork. O passo final chama `--reaction` e publica `rocket` ou `-1` no comentário do comando. Comando ignorado não reage.

### Implementation for User Story 3

- [x] T006 [US3] Em `.github/workflows/pr-validation.yml`, reagir com `eyes` no `comment_id` do comando antes de instalar, e ao final com `rocket` ou `-1` conforme `scripts/pr-validation.mjs --reaction`. Os dois passos usam `continue-on-error`. A reação final também corre se o checkout do head falhou depois dos olhos

**Checkpoint**: O comentário `test` mostra início e fim sem mudar o comentário de validação

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: A limitação da branch padrão fica visível para quem lê o README

- [x] T007 [P] Documentar em `README.md`, na seção de validação de pull requests, o comando `test` e `/test`, quem pode usá-lo, as reações, o comentário único, a exclusão de fork e a limitação: workflow de `issue_comment` roda a versão do arquivo que está em `main`, então o comando só funciona de verdade depois que esta alteração chega lá
- [x] T008 Rodar `npm test` e `npm run build` e não seguir com falha

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependência
- **Foundational (Phase 2)**: depende do setup e bloqueia as histórias
- **User Story 1 (Phase 3)**: depende da fundação
- **User Story 2 (Phase 4)**: depende do job criado na história 1; o filtro mora no mesmo arquivo
- **User Story 3 (Phase 5)**: depende do job da história 1
- **Polish (Phase 6)**: depende das histórias desejadas

### User Story Dependencies

- **User Story 1 (P1)**: começa depois da fundação
- **User Story 2 (P1)**: o teste da regra é a fundação; o `if` do workflow espera o job da história 1
- **User Story 3 (P2)**: espera o job da história 1. A função da reação já está na fundação

### Parallel Opportunities

- T007 pode ser escrito em paralelo com o workflow, porque mexe só no `README.md`
- T002 e o rascunho de T007 não compartilham arquivo

### Parallel Example: User Story 1

```bash
# A história 1 é um único arquivo de workflow; não há tarefa [P] dentro dela.
# O README (T007) pode avançar ao mesmo tempo que o workflow.
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Fase 1 e fase 2
2. Fase 3: reexecução e comentário único
3. Parar e conferir que o job termina verde

### Incremental Delivery

1. Fundação testada com `npm test`
2. História 1: checkout, comandos e comentário
3. História 2: filtro no `if` e fork
4. História 3: reações
5. README e `npm run build`

---

## Notes

- Não alterar `AGENTS.md`, `CLAUDE.md` nem arquivos de instrução de agentes
- Não gravar segredo
- Não criar outro workflow
- A limitação da `main` não se contorna neste repositório: o GitHub não lê `issue_comment` da branch do pull request
