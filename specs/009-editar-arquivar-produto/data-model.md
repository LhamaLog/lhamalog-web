# Data Model: Lista, cadastro e edição de produto, arquivar (Web)

## Product (lido do Core)

Contrato: `contracts/core-api.md`. Campo novo nesta feature:

| Campo | Tipo | Regra |
|---|---|---|
| `archivedAt` | data ISO ou `null` | `null` quando ativo. `isArchived` é verdadeiro quando há texto. O cartão mostra "Arquivado em dd/mm/aaaa" |

Os dados gerais editáveis (`GeneralFields`) são `name` (obrigatório, até 200), `description` (até 10000), `category` (a Área; obrigatória, até 200) e `productVersion` (até 200). O `PUT /api/products/{id}` leva esses quatro campos sem os espaços das pontas, mais a `version`.

## ProductUiDraft (rascunho local, F1)

Guardado em `sessionStorage`, chave `lhamalog.productDraft.v1:<id>`. Some ao fechar a aba e não vai para outro navegador.

| Campo | Tipo | Regra |
|---|---|---|
| `productType` | texto | opções do Figma ou "Outro"; obrigatório no cadastro |
| `environment` | texto | Produção, Homologação ou Desenvolvimento; obrigatório no cadastro |
| `owner` | texto | **novo**; nome da pessoa da organização; obrigatório no cadastro |
| `teamEmail` | texto | **novo**; e-mail válido quando preenchido |
| `tags` | lista de texto | **novo**; até 10, cada uma com até 30 caracteres; sem repetidas |
| `otelEndpoint`, `otelProtocol`, `otelService`, `otelHeaders`, `otelEnabled` | texto e booleano | sem mudança (aba OpenTelemetry, LLT-179) |

Saíram: `team`, `criticality`, `project`, `service`, `logLevel` e `active`. Um rascunho antigo com essas chaves é lido sem elas.

## Filtros da lista

| Campo | Valores | Efeito |
|---|---|---|
| `search` | texto | nome e descrição, sem diferenciar maiúsculas |
| `area` | uma das áreas em uso, ou vazio | `category` do Core |
| `environment` | `production`, `staging`, `development` ou vazio | ambiente do rascunho local |
| `situation` | `active` ou `archived` | `archived` busca `GET /api/products?archived=true` |

O contador do botão Filtros conta área, ambiente e situação Arquivados.

## Resultado do salvamento da edição

| Resultado | Quando | Efeito na tela |
|---|---|---|
| `unchanged` | nada mudou nos dados do Core | não chama o Core; com mudança local, volta com "Produto X salvo neste navegador."; sem nenhuma, "Nenhuma alteração para salvar no servidor." |
| `saved` | o que mudou foi salvo | volta para a lista com "Produto X salvo." |
| `partial` | gerais salvos, contexto recusado | fica no formulário com a `version` nova e a mensagem de W1 |
| erro | a primeira chamada foi recusada | mensagem do Core; no 409 de versão, "Recarregar produto" |
