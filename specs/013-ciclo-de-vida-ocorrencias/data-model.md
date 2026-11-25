# Data Model: Ciclo de vida da ocorrência na tela

**Feature**: `013-ciclo-de-vida-ocorrencias` | **Data**: 25/11/2026

## Tipos (`src/features/occurrences/types.ts`)

```ts
type OccurrenceListItem = { /* spec 008 */ archived: boolean }
type OccurrenceDetail = OccurrenceListItem & {
  /* spec 008 */
  revision: string | null            // null em Core sem a spec 014 → ações escondidas
  archivedAt: string | null
  archivedBy: { type: string; id: string | null } | null
}
```

## Estado da lista (`occurrenceQuery.ts`)

| Parâmetro na URL | Campo | Regra |
|---|---|---|
| `situacao` | `archived: boolean` | `arquivadas` → `true`; outro valor ou ausente → `false` |

`occurrencesPath` acrescenta `archived=true` quando `archived`. `writeOccurrenceQuery` omite o padrão. `clearFilters` volta `archived` para `false`. `activeFilterCount` não conta a situação.

## Ações (`occurrenceActions.ts`)

| Ação | Chamada | Corpo |
|---|---|---|
| Alterar status | `PUT /api/occurrences/{id}/status` | `{status, revision}` |
| Arquivar | `POST /api/occurrences/{id}/archive` | `{revision}` |
| Desarquivar | `POST /api/occurrences/{id}/unarchive` | `{revision}` |

Resultado: `{ kind: 'ok', detail }` · `{ kind: 'conflict', message }` · `{ kind: 'not-found' }` · `{ kind: 'invalid', message }` · `{ kind: 'error', message }`.

## Rótulos

| Chave | Texto |
|---|---|
| situação ativas / arquivadas | Ativas / Arquivadas |
| selo | Arquivada |
| sucesso | Status alterado · Ocorrência arquivada · Ocorrência desarquivada |
| vazio arquivadas | Nenhuma ocorrência arquivada |
| permissão `OCCURRENCES_MANAGE` | Alterar status e arquivar ocorrências |
