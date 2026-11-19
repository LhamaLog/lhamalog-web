# Implementation Plan: Comando test no comentário do PR

**Branch**: `LLT-287-implementar-comando-test-no-comentario-do-pr-para-reexecutar-o-action` | **Date**: 2026-11-19 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/287-comando-test-no-pr/spec.md`

## Summary

O workflow `.github/workflows/pr-validation.yml` ganha o gatilho `issue_comment` (`created`). Um job novo só segue quando o comentário está num pull request, o corpo sem espaços nas pontas é `test` ou `/test`, o autor não é bot e a associação é `OWNER`, `MEMBER` ou `COLLABORATOR`. O job obtém o commit da ponta da branch, roda `npm ci`, `npm test` e `npm run build` e atualiza o comentário do marcador `<!-- llt-285-validacao-prs -->`. As regras do comentário continuam em `scripts/pr-validation.mjs`. O job termina com saída zero. Fork não faz checkout.

## Technical Context

**Language/Version**: YAML do GitHub Actions e JavaScript do Node já usado em `scripts/pr-validation.mjs`. Node 26.12.1 no runner, o valor de `engines.node`.

**Primary Dependencies**: `actions/checkout@v4`, `actions/setup-node@v4` e `actions/github-script@v7`. Nenhuma dependência nova em `package.json`.

**Storage**: Nenhum. O comentário de validação continua no pull request. As reações ficam no comentário do comando.

**Testing**: `node --test` em `tests/pr-validation.test.mjs` para o comando, a associação, o autor ignorado e a reação. O comentário real no GitHub não entra no teste local.

**Target Platform**: GitHub Actions. O gatilho de comentário usa o arquivo da branch padrão (`main`). O gatilho de pull request continua no merge do próprio pull request.

**Project Type**: Workflow de validação. Não altera o aplicativo.

**Performance Goals**: A reexecução cabe na mesma rodada de instalação, teste e compilação. Não há segunda meta de tempo.

**Constraints**: Não bloquear merge. Não executar fork. Não duplicar as regras de branch, título, commit e comandos. Sem segredo no repositório. O checkout do head usa `persist-credentials: false`. O job de pull request mantém `contents: read` e `pull-requests: write`. O job do comentário acrescenta `issues: write` para reagir ao comentário.

**Scale/Scope**: Um comando, três associações aceitas, um comentário atualizado, duas reações.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` ainda é o template upstream, sem princípio ratificado. Não há gate normativo a violar.

Gate inicial: **aprovado**.

## Decisões

- **Onde mora a regra**: `isRerunCommand`, `canRequestRerun`, `isIgnoredCommentAuthor`, `shouldRerun` e `rerunReaction` ficam em `scripts/pr-validation.mjs`. O workflow chama `node scripts/pr-validation.mjs --gate` e `--reaction`. Assim o teste e a execução usam a mesma função.
- **Comando**: `String.trim()` e igualdade com `test` ou `/test`. Espaço no meio não vale. Maiúsculas não valem.
- **Permissão**: só `author_association` `OWNER`, `MEMBER` ou `COLLABORATOR`. Não há segunda consulta de permissão. `CONTRIBUTOR` não entra.
- **Bot**: `user.type === 'Bot'`, login `github-actions[bot]` ou login terminado em `[bot]`.
- **Script usado na reexecução**: antes de trocar o checkout, o job copia `scripts/pr-validation.mjs` da revisão do workflow (na branch padrão, quando o gatilho é comentário) para o diretório temporário do runner. O comentário é montado com essa cópia. `npm ci`, `npm test` e `npm run build` rodam no head. Um pull request não substitui o formatador do comentário.
- **Cabeça do pull request**: `actions/checkout` com o SHA de `head` e `persist-credentials: false`. O token não é passado ao passo do npm.
- **Comentário**: a mesma busca pelo marcador. Atualiza se achar. Cria só se não achar.
- **Reação**: `eyes` no começo. No fim, `rocket` se o corpo não contém ❌ e não está vazio; senão `-1`. A API não oferece ✅ nem ❌.
- **Verde**: cada passo que pode falhar tem `continue-on-error` ou `exit 0`, no mesmo espírito do job que já existe.
- **Filtro do job**: o `if` do job exige pull request, comentário criado, autor que não é bot, associação aceita e o texto `test` em algum lugar. A função continua sendo a decisão final, para rejeitar `testar` e `test por favor` sem duplicar a regra no YAML além desse filtro barato.
- **Limitação**: documentada no README e nesta spec. `issue_comment` não usa o workflow da branch do pull request.

Alternativa recusada: um segundo workflow só para o comentário. O pedido é reexecutar este Action, e o script já é o ponto único das regras.

## Project Structure

### Documentation (this feature)

```text
specs/287-comando-test-no-pr/
├── plan.md
├── spec.md
└── tasks.md
```

Spec, plano e tarefas no mesmo passo. Sem research, data-model, contracts ou quickstart à parte: as decisões estão acima.

### Source Code (repository root)

```text
.github/workflows/pr-validation.yml
scripts/pr-validation.mjs
tests/pr-validation.test.mjs
README.md
```

**Structure Decision**: O job `validar` permanece no gatilho `pull_request`. O job `reexecutar` atende `issue_comment`. Os dois publicam pelo mesmo marcador. `package.json` não muda.

## Post-Design Constitution Check

Sem princípio ratificado. Gate final: **aprovado**.
