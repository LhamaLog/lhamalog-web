# Contrato: métricas de dashboard (Web → Core)

**Status**: proposta do Web para a **LLT-159** / spec `lhamalog-core/specs/011-consulta-metricas-dashboard` (branch do Core `LLT-145-consulta-metricas-dashboard`). Não é implementação do Core. **Nesta entrega** = multi-repositório (Web spec 007 + Core spec 011).

**Princípios**: ADR_141 (Web só fala com o Core); fonte = contagens em logs (OpenObserve via Core) + fatos de uso; resposta híbrida (agregados consolidados + intervalo aberto) **CONFIRMADA** (A1, Michel 18/11, 22:02: job lê logs no MVP e Ocorrências após a LLT-104; no Web, Ocorrências ficam pendentes com “não implementado ainda” até a LLT-104); header `X-Correlation-Id` (Core aceita e devolve o mesmo id). Severidades no payload já normalizadas pelo Core (ADR_170: erro→ERROR, aviso→WARNING, info→INFO); o Web só consome `ERROR` \| `WARNING` \| `INFO` e o parser rejeita valores desconhecidos. Campo/série `occurrences` por bucket é **opcional**; ausente = estado pendente no Web. Volume na API em **bytes** (inteiros); UI em **GiB** (2^30 = 1073741824 bytes).

## Headers

| Header | Direção | Regra |
|---|---|---|
| `Authorization: Bearer <token>` | Web → Core | Obrigatório |
| `X-Correlation-Id: <uuid>` | Web → Core | Obrigatório em toda chamada de métricas |
| `X-Correlation-Id: <uuid>` | Core → Web | Eco do id recebido (ou o gerado pelo Core se ausente — o Web sempre envia) |
| `Content-Type: application/json` | respostas | JSON |

## `GET /api/dashboard/products/{productId}/metrics`

Métricas do **dashboard por produto**.

### Parâmetros

| Nome | Onde | Obrigatório | Descrição |
|---|---|---|---|
| `productId` | path | sim | Produto acessível no tenant do token |
| `from` | query | sim | Início do intervalo (ISO-8601 instant) |
| `to` | query | sim | Fim do intervalo (ISO-8601 instant); deve ser > `from` |
| `severities` | query | não | Lista `ERROR,WARNING,INFO`; omitido = todos |

### Resposta 200 (campos de negócio)

```json
{
  "productId": "prd_123",
  "from": "2026-11-11T00:00:00.000Z",
  "to": "2026-11-18T00:00:00.000Z",
  "dadosConsolidadosAte": "2026-11-18T14:00:00.000Z",
  "retentionDays": 30,
  "volumeIngestaoBytes": 10737418240,
  "totals": {
    "logs": 1200,
    "error": 40,
    "warning": 80,
    "info": 1080,
    "traces": 15,
    "volumeUsedBytes": 1610612736
  },
  "series": {
    "bucket": "day",
    "points": [
      { "start": "2026-11-11T00:00:00.000Z", "end": "2026-11-12T00:00:00.000Z", "error": 5, "warning": 10 }
    ]
  },
  "serviceRanking": [
    { "serviceName": "checkout", "error": 12 }
  ]
}
```

Notas de volume (Michel 18/11, 22:02):

- `volumeIngestaoBytes`: **10737418240** = 10 × 2^30 = **10 GiB** (cota do plano em bytes).
- `volumeUsedBytes`: **1610612736** = 1,5 × 2^30 = **1,5 GiB** (uso no período em bytes).
- Ambos são inteiros em bytes (múltiplos de 2^30 neste exemplo; sem misturar 10^9). A UI formata em GiB no locale do usuário (até 2 casas + sufixo `GiB`).

Demais regras:

- `serviceRanking`: até **5** itens, ordenados por `error` desc.
- `series.bucket`: `hour` ou `day` (Core pode alinhar à duração; a UI garante rótulos no fuso do perfil).
- `series.points[]`: campos `error` e `warning` obrigatórios no ponto; `occurrences` **opcional** (número). Ausência de `occurrences` em todos os pontos (ou omissão da série) = Ocorrências **pendentes** no Web → UI exibe “não implementado ainda” (sem inventar valores).
- Cartões Web: Total de logs, Logs ERROR, Logs WARNING, Traces, Volume vs volume de ingestão (`volumeIngestaoBytes`).
- `retentionDays`: obrigatório na resposta 200; na 1ª carga o Web usa teto seguro de 7 dias até receber este campo; depois o teto do filtro passa a `min(30, retentionDays)`. Se um filtro da URL exceder o teto conhecido após a resposta, o Web trata como inválido (mensagem) e não aplica.
- `dadosConsolidadosAte`: quando presente, a UI MUST exibir “Dados consolidados até …” no fuso do perfil; ausência não bloqueia métricas.
- Severidades em `totals` / filtros: enums já normalizados pelo Core; parser do Web rejeita desconhecidos.

## `GET /api/dashboard/company/metrics`

Métricas do **dashboard da empresa** (multiproduto autorizado).

### Parâmetros

| Nome | Onde | Obrigatório | Descrição |
|---|---|---|---|
| `from` / `to` | query | sim | Mesmo significado do endpoint por produto |
| `productIds` | query | não | Lista de ids; omitido/vazio = todos os produtos autorizados à pessoa |
| `severities` | query | não | Igual ao por produto |

### Resposta 200 (campos de negócio)

```json
{
  "from": "2026-11-11T00:00:00.000Z",
  "to": "2026-11-18T00:00:00.000Z",
  "dadosConsolidadosAte": "2026-11-18T14:00:00.000Z",
  "retentionDays": 30,
  "totals": {
    "logs": 5000,
    "error": 120,
    "warning": 300,
    "productsMonitored": 3
  },
  "seriesByProduct": [
    {
      "productId": "prd_123",
      "productName": "Checkout",
      "bucket": "day",
      "points": [
        { "start": "2026-11-11T00:00:00.000Z", "end": "2026-11-12T00:00:00.000Z", "error": 5, "warning": 8 }
      ]
    }
  ],
  "products": [

    {
      "productId": "prd_123",
      "productName": "Checkout",
      "logs": 2000,
      "error": 80,
      "warning": 100
    }
  ]
}
```

- Cartões Web: Logs consolidados, Logs ERROR, Alertas (= WARNING), Produtos monitorados.
- `retentionDays` e `dadosConsolidadosAte`: mesmo significado e regras do endpoint por produto (teto do filtro / exibição obrigatória quando presente).
- `seriesByProduct[].points[]`: mesmo contrato de `occurrences` opcional do endpoint por produto (ausente = pendente / “não implementado ainda”).
- Lista “Produtos mais impactados” + selos: derivados no Web (research R9, limiares APROVADOS em 18/11) a partir de `products[]`, salvo se a spec 011 acrescentar `impact` enum — nesse caso o parser aceita só `CRITICO` \| `ATENCAO` \| `ESTAVEL`.
- Sem campos de exportação ou “Desempenho” (LLT-224 fora).

## Erros

| Status | Quando | Corpo (exemplo) | Comportamento Web |
|---|---|---|---|
| 400 | Período inválido, severidade desconhecida, `productIds` malformado | `{"code":"invalid_filter","message":"..."}` | Mantém sessão; mensagem; não aplica filtro |
| 401 | Token inválido / ausente | `{"error":"unauthorized"}` | Spec 006 → encerra sessão |
| 403 | Segurança (sem Tenant, etc.) sem `code`/`message` de negócio | `{"error":"forbidden"}` | Spec 006 → encerra sessão |
| 403 | Negócio (sem permissão ao dashboard empresarial) | `{"code":"...","message":"..."}` | Mantém; mensagem / tela de restrição |
| 404 | Produto inexistente, de outro tenant, ou MEMBRO sem AcessoProduto | corpo de erro | Mantém; estado “produto não encontrado/sem acesso”; **sem métricas** (não 403; Michel 18/11, 22:02 / LLT-158) |

Falha de rede / 5xx: estado `error` com tentar novamente + exibir `X-Correlation-Id`; **não** encerrar sessão (spec 006).

## Autorização (esperado do Core)

- Escopo = `tenantId` do token.
- DONO/ADMIN: todos os produtos da empresa.
- MEMBRO: só `AcessoProduto`; lista vazia → 200 com totais zerados / lista vazia (o Web mostra aviso), não 403 genérico de segurança.
- Pedido de produto inacessível (outro tenant / sem Acesso) → **404** (não 403).

## Fora deste contrato

- Implementação OpenObserve, job SSID_011 (frequência padrão 1h configurável; lê logs no MVP — A1 confirmado; Ocorrências após LLT-104), schema Mongo — spec 011 do Core.
- Comparação real com lista de Ocorrências — LLT-104 (SC-004). O placeholder Web (campo opcional + estado pendente + “não implementado ainda”) faz parte deste contrato / US5 no MVP.
- Exportação PDF/Excel — LLT-224.
