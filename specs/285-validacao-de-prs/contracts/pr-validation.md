# Contrato: comentário da validação

O workflow `.github/workflows/pr-validation.yml` é a única superfície. Não há endpoint novo no aplicativo.

## Disparo

```yaml
on:
  pull_request:
    types: [opened, synchronize, reopened, edited, ready_for_review]
    branches: [Development]
permissions:
  contents: read
  pull-requests: write
```

O job não roda quando `head.repo.full_name` é diferente deste repositório. Rascunho não é excluído.

## Permissão

O arquivo declara `pull-requests: write` e `contents: read`. Não declara outra permissão.

## Marcador

A primeira linha do comentário é exatamente:

```text
<!-- llt-285-validacao-prs -->
```

Listar os comentários do pull request, editar o que contém esse marcador e, se não houver, criar um. Não criar um segundo.

## Itens

Cada item é uma linha `✅` ou `❌` seguida do nome: branch, título, commits, `npm ci`, `npm test`, `npm run build`.

Falha de commit inclui o hash completo e a primeira linha. Falha de teste ou compilação inclui o comando e o trecho limitado. Falha de título com número diferente inclui o número da branch e o do título.

## Bloco para colar

O comentário termina com o título `Para corrigir com IA` e um bloco de texto copiável. O bloco lista só as falhas da rodada. Sem falhas, o texto é `Não há nada para corrigir.`

## Resultado do job

O job termina com sucesso. Falha de verificação ou falha ao comentar não muda esse resultado.
