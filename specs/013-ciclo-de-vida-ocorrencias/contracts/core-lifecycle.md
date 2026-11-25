# Contrato consumido: ciclo de vida no Core

Fonte da verdade: `lhamalog-core/specs/014-ciclo-de-vida-ocorrencias/contracts/api.md`.

| Tela | Chamada | Reação |
|---|---|---|
| Lista, situação Arquivadas | `GET /api/occurrences?…&archived=true` | lista das arquivadas |
| Detalhe | `GET /api/occurrences/{id}` | usa `revision`, `archived`, `archivedAt`, `archivedBy` |
| Alterar status | `PUT /api/occurrences/{id}/status` `{status, revision}` | 200 → detalhe novo; 409 `occurrence_changed` → mensagem + "Recarregar"; 404 → "não encontrada ou sem acesso"; 400 → mensagem do campo |
| Arquivar / desarquivar | `POST /api/occurrences/{id}/archive` ou `/unarchive` `{revision}` | igual |
| Matriz (Equipe › Permissões) | `GET /api/company/access` | linha `OCCURRENCES_MANAGE` |

Recusas de segurança (401/403 sem código) e `subscription_required` seguem as specs 006 e 007.
