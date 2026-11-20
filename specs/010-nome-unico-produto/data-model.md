# Data Model: Nome único de produto (Web)

Sem dado novo e sem persistência. A feature só lê uma recusa do Core e a mostra no formulário.

## Recusa por nome em uso

Lida de `ApiError` (`status`, `serverMessage`). Contrato: `contracts/core-api.md`.

| status | serverMessage | É nome em uso? | Efeito no formulário |
|---|---|---|---|
| 409 | "Já existe um produto com este nome nesta empresa. Ele pode estar arquivado." | sim | erro no campo nome, aviso "Nada foi salvo: confira o nome do produto.", aba Informações aberta, sem "Recarregar produto" |
| 409 | "Os dados foram alterados. Recarregue antes de salvar novamente." | não | mensagem do Core e "Recarregar produto" (spec 009) |
| 409 | "Produto arquivado não pode ser editado." | não | mensagem do Core (spec 009) |
| outros | qualquer | não | tratamento que já existia |

## Estado do formulário

| Estado | Origem | Limpo quando |
|---|---|---|
| erro do campo `name` | `nameInUseErrors(error)` em `localErrors` | qualquer edição no formulário |
| aviso do topo | `ApiError(nameInUseNotice, 0)` | a pessoa edita o nome, ou salva de novo |
