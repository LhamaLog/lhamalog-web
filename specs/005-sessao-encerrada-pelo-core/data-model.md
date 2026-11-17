# Data Model: Sessão encerrada pelo Core

Sem persistência. Os dois conceitos vivem em memória e na URL do login.

## Recusa do Core

Lida de `ApiError` (`status`, `code`, `serverMessage`). `serverMessage` é a `message` que veio no corpo do Core, ou vazio; a `message` do `ApiError` continua sendo o texto mostrado na tela.

| status | code | Classe | Efeito |
|---|---|---|---|
| 401 | qualquer | `session` | saída única + login com aviso e destino |
| 403 | sem `code` e sem `message` do Core | `session` | saída única + login com aviso e destino |
| 403 | `code` (`not_admin`, `user_deactivated`, `last_admin`, `no_organization` ou outro) ou `message` não vazios | `keep` | sessão mantida; mensagem na tela |
| outros (0, 400, 404, 409, 5xx) | qualquer | `keep` | sessão mantida; mensagem ou tentativa de novo |

- `no_organization` é local (o Web não chama o Core sem `orgId`, FR-004).
- A mensagem mostrada vem de `message` do Core quando existir (FR-010).

## Destino de volta

| Campo | Regra |
|---|---|
| valor | `pathname + search + hash` da tela no momento da saída |
| aceito quando | começa com `/`; não começa com `//` nem `/\`; sem `\`, controle ou esquema; até 2048 caracteres; não começa com `/sign-in`, `/sign-up`, `/tarefas` ou `/organizacoes/nova` |
| se recusado | `/` |
| transporte | parâmetro `redirect_url` de `/sign-in`, codificado com `encodeURIComponent` |
| uso | uma vez, logo depois do login |

## Saída em andamento

| Estado | Transição |
|---|---|
| ociosa | recusa `session` → em andamento (chama `signOut` uma vez) |
| em andamento | nova recusa `session` → reutiliza a mesma saída |
| em andamento | `signOut` termina (sucesso ou erro) → ociosa |
