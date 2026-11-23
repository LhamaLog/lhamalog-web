# LLT-294: Separar o comando test em um workflow próprio

## Objetivo

`.github/workflows/pr-validation.yml` tinha dois jobs: `validar` no gatilho `pull_request` e `reexecutar` no gatilho `issue_comment`. Em todo push ou abertura de pull request, `reexecutar` aparecia como skipped. Em todo comentário, `validar` aparecia como skipped. O objetivo é cada evento disparar só o workflow que tem o job correspondente.

## Decisão

Dois arquivos, sem mudar a lógica nem o texto do comentário.

`.github/workflows/pr-validation.yml` fica só com `pull_request`, nos types `opened`, `synchronize`, `reopened`, `edited` e `ready_for_review`, e nas branches `Development` e `main`. O único job é `validar`. As permissões desse arquivo continuam `contents: read` e `pull-requests: write`. Saiu o gatilho `issue_comment` e a permissão `issues: write`, que só a reexecução usava.

`.github/workflows/pr-rerun.yml`, com o nome "Reexecutar validação de PRs", fica só com `issue_comment` e type `created`. O job `reexecutar` mantém o filtro de `OWNER`, `MEMBER` e `COLLABORATOR`, ignora bot, atualiza o comentário do marcador `<!-- llt-285-validacao-prs -->` e publica as mesmas reações. As permissões são `contents: read`, `issues: write` e `pull-requests: write`.

O comando `test` só passa a funcionar depois que `pr-rerun.yml` estiver na branch padrão `main`. O GitHub lê `issue_comment` dessa branch, não da branch do pull request.

## Arquivos

- `.github/workflows/pr-validation.yml`
- `.github/workflows/pr-rerun.yml`
- `README.md`
- `specs/287-comando-test-no-pr/plan.md`
- `specs/287-comando-test-no-pr/tasks.md`

Não há `CONTRIBUTING`. `tests/` e `scripts/pr-validation.mjs` não citam o arquivo do workflow, então não mudaram.

## Como testar

Na raiz: `npm ci`, `npm test` e `npm run build`. Conferir que os dois YAML são válidos.

No pull request desta branch, o Action "Validação de PRs" deve mostrar só o job `validar`, e o comentário de validação deve ficar com ✅ quando instalação, testes e compilação passarem.

Comentar `test` neste pull request não exercita `pr-rerun.yml` enquanto o arquivo não estiver em `main`.
