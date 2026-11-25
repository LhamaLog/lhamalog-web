# Data Model: Lista e detalhe de ocorrências

**Feature**: `008-lista-detalhe-ocorrencias` | **Data**: 19/11/2026 | **Revisado**: 22/11/2026 (contrato do Finder aprovado)

Tipos em `src/features/occurrences/types.ts`, espelhando o contrato `contracts/api.md` da spec 012 do lhamalog-core.

## Tipos do Core

```ts
type OccurrenceType = 'ERROR' | 'WARNING' | 'INFO'
type OccurrenceStatus = 'ABERTA' | 'EM_ANALISE' | 'FECHADA'

type ProductRef = { id: string; name: string }

type OccurrenceListItem = {
  id: string
  type: OccurrenceType
  title: string                  // sempre preenchido (o Core usa a assinatura como reserva)
  product: ProductRef
  count: number
  status: OccurrenceStatus
  recurring: boolean
  firstSeenAt: string
  lastSeenAt: string
}

type OccurrencePage = { items: OccurrenceListItem[]; page: number; size: number; totalItems: number }

type OccurrenceDetail = OccurrenceListItem & {
  summary: string | null
  sensitiveData: boolean | null
  samples: string[]              // até 5, do mais novo para o mais antigo, sem data
  attributes: { name: string; value: string }[]
  statusHistory: {
    from: OccurrenceStatus | null
    to: OccurrenceStatus
    changedAt: string
    changedBy: { type: 'USER' | 'SYSTEM'; id: string }
  }[]
}
```

## Estado da lista (endereço)

Módulo `src/features/occurrences/occurrenceQuery.ts`.

```ts
type PeriodPreset = 'all' | '24h' | '7d' | '30d'

type OccurrenceQuery = {
  q: string                      // até 200 caracteres
  types: OccurrenceType[]
  statuses: OccurrenceStatus[]
  productIds: string[]
  period: PeriodPreset           // padrão 'all'
  page: number                   // ≥ 1, padrão 1
  size: 10 | 20 | 50             // padrão 20
}
```

| Parâmetro na URL | Campo | Regra de leitura |
|---|---|---|
| `q` | `q` | texto, cortado em 200 |
| `type` (repetível) | `types` | só valores conhecidos; repetidos removidos |
| `status` (repetível) | `statuses` | só valores conhecidos; repetidos removidos |
| `productId` (repetível) | `productIds` | texto não vazio; validação de acesso é do Core |
| `periodo` | `period` | `24h`, `7d` ou `30d`; outro valor = `all` |
| `page` | `page` | inteiro ≥ 1; senão 1 |
| `size` | `size` | 10, 20 ou 50; senão 20 |

Funções puras:

- `readOccurrenceQuery(params: URLSearchParams): OccurrenceQuery`
- `writeOccurrenceQuery(query): URLSearchParams` (omite valores padrão, para o link ficar curto)
- `occurrencesPath(query, now: Date): string` → `/api/occurrences?...`, com `from = now - preset` em ISO-8601 quando o período não é `all`
- `activeFilterCount(query): number` (tipo, status, produto e período contam 1 cada)
- `clearFilters(query): OccurrenceQuery` (mantém `size`)

## Rótulos

| Valor | Rótulo | Tom |
|---|---|---|
| `ERROR` | Erro | vermelho (`severity: 'error'`) |
| `WARNING` | Alerta | âmbar (`severity: 'warning'`) |
| `INFO` | Informação | azul (`severity: 'info'`) |
| `ABERTA` | Aberta | `danger` |
| `EM_ANALISE` | Em análise | `warning` |
| `FECHADA` | Fechada | `success` |
| `recurring: true` | Recorrente | `neutral` |
| `sensitiveData: true` | Dados sensíveis mascarados: Sim | — |
| `sensitiveData: false` | Dados sensíveis mascarados: Não | — |
| `changedBy.type = SYSTEM` | Sistema | — |

Rótulos dos atributos: `host.name` → Host, `service.name` → Serviço, `trace_id` → Trace ID, `correlation_id` → Correlation ID, `module_id` → Módulo, `line_number` → Linha; campos extraídos aparecem com o próprio nome.
