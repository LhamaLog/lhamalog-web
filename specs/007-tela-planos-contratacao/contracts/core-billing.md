# Contrato: como o Web usa `/api/billing` do Core

Fonte: `specs/010-criar-tenant-pagamento/contracts/api.md` do lhamalog-core (PR #14). Todas as chamadas vão pelo `useApi`, com o token da sessão e a organização ativa.

| Chamada | Uso no Web | Respostas tratadas |
|---|---|---|
| `GET /api/billing/plans` | lista da tela | 200 lista; erro → `ErrorState` com "Tentar novamente" |
| `GET /api/billing/order` | situação | 200 pedido; 404 `no_order` → nenhum pedido; outro erro → aviso, a lista continua |
| `POST /api/billing/checkout` `{"plan","companyName"}` | "Contratar" | 201 → navega ao `paymentUrl`; 400 `fieldErrors.companyName`/`invalid_plan`, 403 `not_admin`, 409 `already_subscribed`, 503 `payment_unavailable` → mensagem do Core na tela |

## `subscription_required` em qualquer rota

403 `{"message","code":"subscription_required"}` → o `useApi` relança o erro (recusa de negócio, sessão mantida, spec 006) e avisa o `subscriptionRedirect`; o `CompanyWorkspace` navega para `/plano`.

## Volta do pagamento

O simulador (e, depois, o Asaas) volta para `BILLING_RETURN_URL` do Core, que no local é `http://localhost:5173/empresa`.
