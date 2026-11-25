# Contrato consumido: ocorrências no Core

Fonte da verdade: `lhamalog-core/specs/012-consultar-ocorrencias/contracts/api.md`. Este arquivo resume o que o web usa e como reage a cada resposta.

## Chamadas

| Tela | Chamada |
|---|---|
| Lista | `GET /api/occurrences?page&size&type*&status*&productId*&from&q` |
| Filtro de produto | `GET /api/products` e `GET /api/products?archived=true` |
| Detalhe | `GET /api/occurrences/{id}` |

O web nunca envia `to` nesta entrega (só períodos prontos, que terminam "agora").

## Reações

| Resposta | Lista | Detalhe |
|---|---|---|
| 200 com itens | lista e paginação | detalhe |
| 200 com `items` vazio e sem filtros | "Nenhuma ocorrência por aqui ainda" | — |
| 200 com `items` vazio e com filtros | "Nenhuma ocorrência encontrada para os filtros aplicados" + "Limpar filtros" | — |
| 200 vazio com `page` maior que a última | estado vazio com a paginação para voltar | — |
| 400 | estado de erro com a mensagem; "Limpar filtros" (só acontece com endereço editado à mão que passou pela leitura) | — |
| 404 (produto do filtro) | "Produto não encontrado ou sem acesso." com "Limpar filtros" | — |
| 404 | — | "Ocorrência não encontrada ou sem acesso" + "Voltar para ocorrências" |
| 401 / 403 sem código | sessão encerrada (spec 006) | igual |
| 403 `subscription_required` | vai para a tela de planos (spec 007) | igual |
| falha de rede ou 5xx | estado de erro com "Tentar de novo" | igual |
