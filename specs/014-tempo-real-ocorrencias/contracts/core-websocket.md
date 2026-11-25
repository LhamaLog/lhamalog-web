# Contrato consumido: WebSocket de ocorrências

Fonte da verdade: `lhamalog-core/specs/015-tempo-real-ocorrencias/contracts/websocket.md`.

| Momento | Tela | Core |
|---|---|---|
| Abrir | `new WebSocket(wsUrl(apiUrl))` | aceita se a origem é autorizada |
| Autenticar | `{"type":"auth","token":…}` em até 10 s | `{"type":"ready","expiresAt":…}` |
| Renovar (50 s) | `{"type":"auth","token":…}` | `ready` |
| Aviso | conta se bate com os filtros | `{"type":"occurrence","change":"CREATED"|"REOPENED",…}` |
| Fechamento 4401 | reconecta com espera | token inválido ou vencido |
| Fechamento 4403 | para | acesso negado |
