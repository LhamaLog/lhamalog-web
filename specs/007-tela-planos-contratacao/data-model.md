# Data Model: Tela de planos e contratação

Tipos do Web, lidos das respostas do Core (contrato em [contracts/core-billing.md](contracts/core-billing.md)). Nada é gravado no navegador.

## Plan

| Campo | Tipo | Regra |
|---|---|---|
| plan | texto | código não vazio (`FREE`, `STARTER`, ...), único na lista |
| name | texto | não vazio |
| price | número | finito, ≥ 0 |
| currency | texto | `BRL` |

## Order

| Campo | Tipo | Regra |
|---|---|---|
| orderId | texto | não vazio |
| plan | texto | não vazio |
| status | `PENDING` · `PAID` · `CANCELED` | |
| paymentUrl | texto | pode faltar |
| subscriptionActive | booleano | |

## Checkout

`orderId`, `plan`, `status`, `paymentUrl` (http ou https).

## Estado da tela (`planScreenState`)

| Situação | Mostra | Contratar |
|---|---|---|
| plano ativo (`subscriptionActive`) | "Plano X ativo" e "Ir para a empresa" | escondido |
| pedido `PENDING` | "Pagamento pendente" e "Continuar pagamento" | ativo (novo pedido cancela o anterior) |
| pedido `CANCELED` ou nenhum | aviso de empresa sem plano | ativo |
| membro que não é administrador | os mesmos avisos | desativado, com "Só o administrador contrata" |
