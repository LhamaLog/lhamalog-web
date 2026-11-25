# Data Model: Aviso de ocorrências novas na tela

Nada é gravado. Estado da tela: `pendentes: Set<occurrenceId>` (zerado ao atualizar ou mudar filtros), `conexao: conectando | pronta | pausada | parada`, `tentativa` (para a espera).

Mensagens: ver `contracts/core-websocket.md`.
