# Roteiro: Validação de PRs

Conferir a LLT-285 quando `.github/workflows/pr-validation.yml` existir.

## Resultado desta entrega

Exercitado em 2026-11-19 no pull request https://github.com/LhamaLog/lhamalog-web/pull/10, destino `Development`:

- `npm test`: passou, 55 testes, neste ambiente (Node 22.23.4; o workflow usa Node 26.12.1).
- `npm run build`: passou (`tsc --noEmit` e `vite build`).
- O job `validar` terminou verde. O comentário único começa com `<!-- llt-285-validacao-prs -->` e marcou ✅ em branch, título, commits, `npm ci`, `npm test` e `npm run build`. O bloco `Para corrigir com IA` disse `Não há nada para corrigir.`
- Não foram exercitados aqui: rascunho, edição só do título, reabertura, pull request de fork, destino diferente de `Development`, commit fora do formato e falha proposital de `npm test`. O workflow não foi marcado como obrigatório para o merge.

## Antes de começar

- O workflow está no repositório, com `permissions` `contents: read` e `pull-requests: write` no próprio arquivo.
- O destino do pull request de prova é `Development`.
- A branch de prova segue `LLT-XXX-slug`. O título usa o mesmo número e o formato `LLT-XXX: descricao`.
- Node no runner é 26.12.1. Não definir segredo para esta validação.

## O que olhar

1. Abrir um pull request em rascunho para `Development`. A validação comenta. O job fica verde.
2. O comentário tem uma linha ✅ ou ❌ para branch, título, commits, `npm ci`, `npm test` e `npm run build`, e o bloco `Para corrigir com IA`. A primeira linha do fonte do comentário é `<!-- llt-285-validacao-prs -->`.
3. Dar um push. O mesmo comentário muda. Não aparece um segundo.
4. Editar só o título para outro `LLT-XXX`. O comentário atualiza sem push e o título fica ❌, mostrando os dois números.
5. Um commit herdado `LLT-167: ...` ou `LLT-167 ...`, que não seja merge, fica ✅ se a primeira linha tiver um desses formatos. Um commit fora do formato fica ❌ com hash completo e a primeira linha. Um merge, com mais de um pai, não entra.
6. Uma falha de `npm test` deixa o job verde. O comentário cita `npm test` e um trecho do erro, não o log inteiro. `npm run build` também aparece.
7. Reabrir ou marcar como pronto para revisão atualiza o mesmo comentário.
8. Pull request para outro destino, ou aberto a partir de um fork, não recebe esse comentário.

## Fora deste roteiro

- Tornar o check obrigatório no merge.
- Alterar o aplicativo, os testes de produto ou o `package.json`.
- Publicar o site.
