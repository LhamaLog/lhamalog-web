# Tasks: Validação de PRs

**Input**: Design documents from `/specs/285-validacao-de-prs/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/pr-validation.md, quickstart.md

**Tests**: Incluídos para as regras puras. O plano manda cobrir branch, título, commit, trecho de erro e texto do comentário com `node --test`, no estilo de `tests/*.test.mjs`. O comentário real no GitHub e o job verde ficam no roteiro manual.

**Organization**: Tarefas agrupadas por história. US1 publica o comentário sem travar o merge. US2 e US3 preenchem as verificações. US4 acrescenta o bloco para colar.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode correr em paralelo (arquivos diferentes, sem depender de tarefa incompleta)
- **[Story]**: História a que a tarefa pertence (US1, US2, US3, US4)
- Cada tarefa inclui o caminho do arquivo

## Path Conventions

- Um workflow: `.github/workflows/pr-validation.yml`
- Regras puras: `scripts/pr-validation.mjs`
- Teste: `tests/pr-validation.test.mjs`
- Sem dependência nova em `package.json`
- Permissões do workflow: só `contents: read` e `pull-requests: write`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Arquivo único do workflow, ainda sem as seis verificações

- [x] T001 Criar `.github/workflows/pr-validation.yml` com um único job. `on.pull_request.types` é exatamente `opened`, `synchronize`, `reopened`, `edited` e `ready_for_review`. `on.pull_request.branches` é só `Development`. `permissions` é só `contents: read` e `pull-requests: write`. O job não roda quando `github.event.pull_request.head.repo.full_name` for diferente de `github.repository`. Não filtrar rascunho. Não criar outro workflow. Não alterar `package.json`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Regras puras que o comentário e as histórias usam. Nenhuma história começa antes desta fase.

**⚠️ CRITICAL**: Nenhuma história começa antes desta fase

- [x] T002 [P] Escrever `tests/pr-validation.test.mjs` antes de T003, no estilo de `tests/*.test.mjs`. Cobrir, com as regras literais de `specs/285-validacao-de-prs/data-model.md` e de `specs/285-validacao-de-prs/contracts/pr-validation.md`: `LLT-285-validacao-de-prs` é branch válida; `LLT-285`, `LLT-285-`, `LLT-285--slug`, `LLT-285-Validacao` e `feature/LLT-285-validacao` são inválidas e o motivo mostra o nome encontrado e o formato `LLT-XXX-slug`; título `LLT-285: especifica validação de PRs` é válido na branch `LLT-285-validacao-de-prs`; `LLT-285:descricao`, `LLT-285:  descricao` e descrição só com espaços são inválidos; título `LLT-286: outro número` nessa branch é inválido e o motivo mostra `285` e `286`; commit de um pai com primeira linha `LLT-167: convida usuário` é válido nessa branch; commit fora do formato é inválido e o motivo traz o hash completo e a primeira linha; commit com mais de um pai não entra, qualquer que seja a mensagem; lista sem commit de um pai deixa a verificação de commits aprovada; trecho de erro com mais de 30 linhas ou mais de 1500 caracteres é cortado e o texto diz que o trecho foi cortado; se `npm ci` falha, `npm test` e `npm run build` ficam reprovados dizendo que não rodaram; o corpo do comentário começa com `<!-- llt-285-validacao-prs -->`, tem uma linha ✅ ou ❌ para branch, título, commits, `npm ci`, `npm test` e `npm run build`, e termina com `Para corrigir com IA`; sem falhas, o bloco diz `Não há nada para corrigir.`; com falhas, o bloco lista só essas falhas, com encontrado, esperado e o trecho quando houver.

- [x] T003 Implementar em `scripts/pr-validation.mjs` as funções puras usadas por `tests/pr-validation.test.mjs`, sem rede e sem importar o aplicativo. Quando o arquivo for executado com `node`, MUST terminar com código 0 mesmo se alguma verificação estiver reprovada, e escrever o corpo do comentário para o workflow ler. Regras: branch `LLT-` + um ou mais dígitos + `-` + slug `[a-z0-9]+(-[a-z0-9]+)*`; título na primeira linha com `LLT-` + dígitos + `:` + um espaço + descrição que não fica vazia depois do `trim`, e número igual ao da branch; commit de um pai no formato `LLT-XXX: descricao` ou `LLT-XXX descricao` sem exigir o mesmo número; commit com mais de um pai ignorado; trecho final de no máximo 30 linhas e 1500 caracteres, com aviso de que o trecho foi cortado quando passar de um dos limites; resultados de `npm ci`, `npm test` e `npm run build` em que falha de instalação marca os outros dois como não rodados; montagem do comentário em português com o marcador `<!-- llt-285-validacao-prs -->` na primeira linha, seis linhas ✅ ou ❌ e o bloco `Para corrigir com IA`. Não alterar `package.json`.

**Checkpoint**: Regras de formato, trecho e texto do comentário testáveis sem o GitHub

---

## Phase 3: User Story 1 - Ver o resultado sem travar o merge (Priority: P1) 🎯 MVP

**Goal**: O pull request para Development ganha um único comentário, atualizado no lugar, e o job termina verde mesmo quando algo falha.

**Independent Test**: Abrir um rascunho para Development. O job fica verde, existe um comentário com o marcador e um segundo evento edita esse comentário em vez de criar outro. Falha ao comentar não deixa o job vermelho.

### Implementation for User Story 1

- [x] T004 [US1] Em `.github/workflows/pr-validation.yml`, fazer checkout do pull request e instalar Node `26.12.1` com `actions/setup-node`. Rodar `node scripts/pr-validation.mjs`, que termina com código 0, para obter o corpo do comentário. Com `actions/github-script`, listar os comentários do pull request, atualizar o que já contém `<!-- llt-285-validacao-prs -->` e criar só se não existir. Isso vale para `opened`, `synchronize`, `reopened`, `edited` e `ready_for_review`, inclusive edição de título sem push. O passo do script e o passo do comentário não podem falhar o job: verificação reprovada ou erro ao publicar terminam com o job verde. Não usar Bash para achar ou editar o comentário. Não declarar permissão além de `contents: read` e `pull-requests: write`.

**Checkpoint**: US1 comenta uma vez e não trava o merge

---

## Phase 4: User Story 2 - Conferir branch, título e commits (Priority: P1)

**Goal**: O comentário marca branch, título e commits. O número da branch e o do título são o mesmo. Commit herdado só precisa do formato.

**Independent Test**: Branch válida, título com outro número e um commit `LLT-167: ...` de um pai, mais um merge. O título fica ❌ com os dois números, o commit herdado fica ✅ e o merge não aparece como falha.

### Implementation for User Story 2

- [x] T005 [US2] Em `.github/workflows/pr-validation.yml`, passar para `scripts/pr-validation.mjs` o nome `github.head_ref`, a primeira linha de `github.event.pull_request.title` e os commits do pull request obtidos pela API, com hash completo, primeira linha da mensagem e quantidade de pais. Não usar `git log` para decidir o que é merge. Branch fora de `LLT-XXX-slug` fica ❌ com o nome encontrado e o formato esperado. Título fora de `LLT-XXX: descricao`, ou com número diferente do da branch, fica ❌ e mostra os dois números quando a diferença for o número. Commit de um pai fora do formato fica ❌ com hash completo e primeira linha. Commit com mais de um pai não entra. Lista sem commit de um pai deixa commits ✅.

**Checkpoint**: US2 distingue formato, número compartilhado e merge

---

## Phase 5: User Story 3 - Instalar, testar e compilar (Priority: P1)

**Goal**: `npm ci`, `npm test` e `npm run build` aparecem separados, com Node 26.12.1, e o erro longo vira trecho.

**Independent Test**: Uma falha de `npm test` deixa o job verde, cita o comando e um trecho, e `npm run build` também aparece. Se `npm ci` falha, os outros dois ficam ❌ dizendo que não rodaram.

### Implementation for User Story 3

- [x] T006 [US3] Em `.github/workflows/pr-validation.yml`, com Node `26.12.1`, executar na raiz `npm ci`, depois `npm test` e `npm run build` somente se a instalação passar. Guardar o código e o final da saída de cada um. Se `npm ci` falhar, não executar os outros dois e marcar os dois como ❌ dizendo que não rodaram. Se a instalação passar, executar teste e compilação mesmo quando um deles falhar. Entregar esses resultados a `scripts/pr-validation.mjs`, que corta o trecho em 30 linhas e 1500 caracteres e, ao cortar, diz que o trecho foi cortado. O job continua verde.

**Checkpoint**: US3 mostra os três comandos sem esconder um por causa do outro

---

## Phase 6: User Story 4 - Levar a correção para uma IA (Priority: P2)

**Goal**: O comentário termina com um bloco pronto para copiar, só com as falhas da rodada.

**Independent Test**: Título inválido e teste falho. O bloco cita os dois, o título encontrado, o formato esperado, o comando `npm test` e o trecho. Não cita item que passou. Tudo verde produz `Não há nada para corrigir.`

### Implementation for User Story 4

- [x] T007 [US4] Em `scripts/pr-validation.mjs` e no corpo publicado por `.github/workflows/pr-validation.yml`, garantir o bloco `Para corrigir com IA` no fim do comentário. Com falha, listar só as falhas daquela rodada, cada uma com o valor encontrado, o valor esperado e o trecho de erro quando existir. Sem falha, o bloco é exatamente `Não há nada para corrigir.` Atualizar o mesmo comentário não pode deixar o bloco da rodada anterior.

**Checkpoint**: US4 entrega o texto que a pessoa cola

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Conferir que o exemplo não mudou o aplicativo

- [x] T008 Rodar `npm test` na raiz de `lhamalog-web`. Confirmar que `package.json` não ganhou dependência, que não surgiu workflow além de `.github/workflows/pr-validation.yml` e que esse arquivo não declara permissão além de `contents: read` e `pull-requests: write`.

- [x] T009 Executar o roteiro de `specs/285-validacao-de-prs/quickstart.md` quando o workflow estiver no repositório e registrar naquele arquivo o que foi exercitado. Não tornar o check obrigatório no merge, não alterar o aplicativo e não publicar o site.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências
- **Foundational (Phase 2)**: T002 pode começar com T001, porque o arquivo é outro. T003 depende de T002. T003 bloqueia as histórias
- **User Stories (Phase 3+)**: dependem da Phase 2. US2, US3 e US4 editam o workflow depois de US1
- **Polish (Phase 7)**: T008 depende das histórias. T009 depende de T008 e de um pull request real

### User Story Dependencies

- **User Story 1 (P1)**: começa depois de T003. Não depende de US2, US3 ou US4
- **User Story 2 (P1)**: começa depois de US1, porque preenche o comentário que US1 publica
- **User Story 3 (P1)**: começa depois de US1. Não depende de US2
- **User Story 4 (P2)**: começa depois de US1 e usa os resultados que US2 e US3 gravarem. O texto do bloco já é testado em T002

### Within Each User Story

- O teste de T002 fica vermelho antes de T003
- US1 publica antes de US2 e US3 preencherem os itens
- US4 não cria um segundo comentário

### Parallel Opportunities

- T001 e T002 podem correr juntos
- US2 e US3 não podem correr juntas: as duas editam `.github/workflows/pr-validation.yml`

---

## Parallel Example: Foundation

```bash
Task: "Workflow vazio em .github/workflows/pr-validation.yml"
Task: "Testes das regras em tests/pr-validation.test.mjs"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar a Phase 1
2. Completar a Phase 2
3. Completar a Phase 3
4. Parar e validar: um rascunho para Development tem um comentário e o job verde

### Incremental Delivery

1. Setup e regras puras prontos
2. US1 comenta sem travar o merge
3. US2 marca branch, título e commits
4. US3 marca instalação, teste e compilação
5. US4 deixa o bloco pronto para colar
6. Polish roda `npm test` e deixa o manual registrado

### Parallel Team Strategy

1. Uma pessoa escreve o teste e o módulo
2. Outra abre o workflow com a permissão e os eventos
3. As histórias no workflow ficam com uma pessoa, na ordem US1, US2, US3, US4

---

## Notes

- [P] marca arquivos diferentes, sem depender de tarefa incompleta
- US2 e US3 não levam [P] porque editam o mesmo workflow
- O job verde e o comentário no GitHub não são provados por `npm test`. T009 confere isso
- Pull request para `main` pula branch, título e commits: o comentário tem a nota `PR de release (Development → main): só testes e build são verificados` e só as linhas de `npm ci`, `npm test` e `npm run build`. Destino `Development` segue com as seis verificações.
- Nenhum passo torna esta validação obrigatória para o merge
