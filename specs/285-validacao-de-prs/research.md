# Research: Validação de PRs

Decisões fechadas para o workflow. Nenhuma escolha ficou em aberto.

## 1. Um workflow, um job

- **Decision**: Um arquivo, `.github/workflows/pr-validation.yml`, com um job. `on.pull_request.types` é `opened`, `synchronize`, `reopened`, `edited` e `ready_for_review`. `branches` é só `Development`.
- **Rationale**: O pedido é um exemplo único. Vários workflows dividiriam o comentário e a permissão.
- **Alternatives considered**: Um workflow por verificação (rejeitado: o comentário deixaria de ser único). Incluir `main` (rejeitado: o destino é Development).

## 2. Rascunho entra, fork fica de fora

- **Decision**: Não há filtro de rascunho. O job só segue quando `github.event.pull_request.head.repo.full_name` é o mesmo repositório.
- **Rationale**: O time não abre pull request por fork. Rascunho precisa do mesmo comentário antes de ficar pronto.
- **Alternatives considered**: Ignorar rascunho até `ready_for_review` (rejeitado). Tentar comentar em fork com o token do pull request (rejeitado: o time não usa fork, e esse token não escreve comentário no repositório de origem da mesma forma).

## 3. Node 26.12.1

- **Decision**: `actions/setup-node` com `node-version: 26.12.1`. É o `engines.node` de `package.json`.
- **Rationale**: A base do repositório já declara essa versão. `npm ci`, `npm test` e `npm run build` rodam nela.
- **Alternatives considered**: `node-version-file` apontando para outro arquivo (rejeitado: não há `.nvmrc`; a versão está no `package.json` e o pedido cita 26.12.1). `lts/*` (rejeitado: não é a versão do repositório).

## 4. Script do comentário

- **Decision**: As regras de branch, título, commit, trecho de erro e texto do comentário ficam em `scripts/pr-validation.mjs`. `actions/github-script` procura os comentários do pull request, acha o que contém o marcador oculto `<!-- llt-285-validacao-prs -->` e chama a atualização. Se não achar, cria o comentário com esse marcador na primeira linha. O script da action não reimplementa as regras.
- **Rationale**: Atualizar no lugar é a API de comentário do pull request: listar, editar ou criar. O marcador não aparece para quem lê o comentário e não muda quando o texto visível muda.
- **Alternatives considered**: Bash com `gh api` (aceitável, rejeitado neste plano: paginar comentários e escapar o corpo em shell é mais frágil do que o script da action). Apagar e criar outro comentário a cada push (rejeitado: o pedido é um único comentário atualizado).

## 5. Job sempre verde

- **Decision**: Nenhuma verificação falha o job. Os comandos `npm` registram a saída e o código, e o passo segue. O passo do comentário também não pode deixar o job vermelho. O script das regras de formato termina com código 0 e devolve os ✅/❌ para o comentário.
- **Rationale**: A validação informa. Não é trava de merge.
- **Alternatives considered**: `exit 1` no teste e `continue-on-error` só no job inteiro sem registrar o trecho (rejeitado: o comentário perderia o motivo). Branch protection obrigatória (rejeitado: está fora da história).

## 6. Número da branch e do título

- **Decision**: O número extraído de `LLT-XXX-slug` e o número extraído de `LLT-XXX: descricao` precisam ser iguais. O commit só casa `LLT-` + dígitos + `: ` + descrição. Commit de merge, com mais de um pai, é ignorado. A lista de commits vem da API do pull request, não de um `git log` da branch.
- **Rationale**: A branch herda commits de outra tarefa. O título é o que apresenta este pull request.
- **Alternatives considered**: Exigir o mesmo número nos commits (rejeitado pelo clarify). Conferir só a mensagem que começa com `Merge ` (rejeitado: a spec define merge pelo número de pais).
