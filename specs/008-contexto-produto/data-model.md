# Data Model: Contexto do produto para IA (Web)

O contexto é gravado no Core. O Web só lê, limpa, valida e envia. Contrato: `contracts/core-api.md`.

## ProductContext

| Campo | Tipo | Inicial | Regra no Web |
|---|---|---|---|
| `functionalDescription` | texto | `""` | obrigatório no Web (F2); até 2000 caracteres |
| `personality` | `SIMPLE` \| `STANDARD` \| `DETAILED` | `STANDARD` | sempre tem valor (controle segmentado) |
| `responseLanguage` | código de idioma | `pt-BR` | opções `pt-BR`, `en-US`, `es-ES`; um código gravado fora da lista é mantido (W1); formato de código de idioma, até 20 caracteres |
| `architecture` | lista de texto | `[]` | até 30 itens, cada um com até 80 caracteres |
| `scope` | lista de texto | `[]` | até 30 itens, cada um com até 200 caracteres; ordem gravada (W2) |
| `sensitiveData` | lista de texto | `[]` | até 30 itens, cada um com até 200 caracteres; ordem gravada (W2) |

Regras das listas (`cleanContext` e `addListItem`): espaços das pontas saem; itens vazios saem; repetidos (depois do trim, sem diferenciar maiúsculas) saem, ficando o primeiro; a ordem é mantida.

## Campos antigos

`problemSolved`, `targetAudience`, `differentiators`, `keywords` e `restrictions` saem do tipo e dos testes de produto (FR-W01). Se vierem do Core, `readProductContext` os ignora. O `targetAudience` da **empresa** é outro campo e continua.

## Erros

| Origem | Chave | Onde aparece |
|---|---|---|
| validação local | `context.functionalDescription`, `context.architecture`... | no campo |
| Core, 400 | `fieldErrors` com prefixo `context.` (inclusive `context.scope[1]`) | no campo da lista, por `contextErrorFor` |
| Core, 409 | `message` | no topo, só a mensagem do Core |
