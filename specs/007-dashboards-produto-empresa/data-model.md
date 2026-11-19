# Data Model: Dashboards por produto e da empresa (leitura no Web)

Sem persistência no Web. Modelos abaixo são de **leitura** (URL + resposta do Core + estado de tela). Validação e derivações ficam em `src/features/dashboard/model` (implementação futura).

## Filtro de dashboard

Combinação aplicada (ou candidata na UI) antes/depois de Aplicar.

| Campo | Tipo | Regra |
|---|---|---|
| `productIds` | `string[]` | Por produto: exatamente 1 id acessível. Empresarial: `[]` = todos autorizados; senão subconjunto dos autorizados. Id inacessível → filtro inválido |
| `periodPreset` | `'24h' \| '7d' \| '30d' \| 'personalizado'` | Padrão `'7d'` |
| `from` / `to` | `Date` (instantes) | Obrigatórios se personalizado; `from < to`; duração ≤ `maxPeriodDays` |
| `severities` | `Array<'ERROR' \| 'WARNING' \| 'INFO'>` | Vazio ou os três = “todos”; valor desconhecido → inválido |
| `maxPeriodDays` | `number` | Na 1ª carga (antes da 1ª resposta): teto seguro **7** (FREE). Após resposta de métricas: `min(30, retentionDays)` do plano (ADR_131 / FR-003) |
| origem | URL query | Só valores **válidos** entram na URL aplicada (FR-004). Se, depois da resposta, um filtro da URL exceder o teto conhecido → inválido (mensagem), não aplicado |

**Transições**: rascunho na UI → (Aplicar/Atualizar) → validar → se ok, grava URL e dispara fetch; se inválido, mensagem e mantém recorte aplicado anterior (ou padrão). Após a 1ª resposta, atualiza `maxPeriodDays` com `retentionDays` e revalida o filtro aplicado da URL.

## Período resolvido

| Campo | Regra |
|---|---|
| `start` / `end` | Intervalo efetivo enviado ao Core |
| `durationHours` | `(end - start)` em horas |
| `bucket` | `'hour'` se duração ≤ 48h; `'day'` se > 48h (FR-006) |
| `timeZone` | fuso do perfil; fallback `America/Sao_Paulo` |

## Métricas por produto (resposta de leitura)

| Campo | Significado |
|---|---|
| `productId` | Produto do recorte |
| `totalLogs` | Total de logs no filtro |
| `logsError` | Contagem ERROR |
| `logsWarning` | Contagem WARNING |
| `tracesReceived` | Traces no período |
| `volumeUsedBytes` | Volume usado no período em **bytes** (inteiro; fatos de uso). UI: GiB (÷ 2^30), locale do usuário, até 2 casas + sufixo `GiB` |
| `volumeIngestaoBytes` | Cota de volume de ingestão do plano em **bytes** (inteiro; ADR_131). UI: mesma formatação GiB (2^30) para comparação no cartão |
| `series` | Ver **Série temporal** |
| `serviceRanking` | Até 5 serviços (`service.name`) por `logsError` desc |
| `dadosConsolidadosAte` | Instantâneo até quando os intervalos estão consolidados |
| `retentionDays` | Retenção do plano; atualiza o teto do filtro após a 1ª resposta |

## Consolidado da empresa (resposta de leitura)

| Campo | Significado |
|---|---|
| `productsMonitored` | Quantidade de produtos no recorte autorizado |
| `totalLogs` / `logsError` / `logsWarning` | Somas no recorte (Alertas = `logsWarning`) |
| `seriesByProduct` | Séries de ERROR (e opcionalmente WARNING) por produto |
| `perProduct` | Linhas da tabela: Logs, Logs ERROR, Alertas (WARNING) |
| `dadosConsolidadosAte` | Instantâneo até quando os intervalos estão consolidados (mesmo significado do por produto) |
| `retentionDays` | Retenção do plano; atualiza o teto do filtro após a 1ª resposta (mesmo significado do por produto) |

## Série temporal

| Campo | Regra |
|---|---|
| `bucket` | `'hour'` \| `'day'` (acordo com período; UI pode re-rótular no fuso) |
| `points[]` | `{ start, end, error, warning, occurrences? }` (empresarial: por `productId`). `occurrences` é **opcional** por bucket; ausente = série de Ocorrências em estado **pendente** |
| fuso de exibição | sempre o do perfil na UI |
| Ocorrências (pendente) | Até a LLT-104: UI MUST mostrar indicador/legenda de Ocorrências com a mensagem “não implementado ainda”; sem inventar valores e sem lógica de comparação |

## Ranking (serviços ou produtos)

| Campo | Regra |
|---|---|
| `id` | `service.name` ou `productId` |
| `label` | Nome exibido |
| `logsError` | Ordenação primária |
| `selo` | Só na lista “Produtos mais impactados” (ver abaixo) |

## Selo de estado

| Valor | Regra APROVADA (research R9; Michel 18/11) |
|---|---|
| `CRITICO` | `logsError / max(totalLogs,1) ≥ 0,10` (ERROR ≥ 10% dos logs do produto no período) |
| `ATENCAO` | proporção ∈ `[0,02, 0,10)` (de 2% inclusive a 10% exclusive) |
| `ESTAVEL` | `p < 0,02` (abaixo de 2%, inclusive produto sem logs / zero ERROR) |

Derivado **no Web** a partir das linhas `perProduct` se o Core não enviar selo; se o Core enviar, validar enum e preferir o valor do contrato (parser rejeita desconhecido).

## Dados consolidados até

| Campo | Regra |
|---|---|
| `dadosConsolidadosAte` | Instantâneo (ISO) ou ausente/`null` se o Core não informar |
| UI | MUST exibir “Dados consolidados até …” no fuso do perfil quando o Core enviar o campo; ausência MUST NOT bloquear métricas |

## Estados de tela

| Estado | Quando | UI |
|---|---|---|
| `loading` | Fetch em andamento | LoadingState |
| `empty` | 200 com zero dados no período / sem produtos | “nenhum resultado encontrado” ou aviso MEMBRO sem produto |
| `ready` | 200 com métricas | cartões / gráfico / ranking / tabela |
| `pendente` (Ocorrências) | Campo/série `occurrences` ausente ou explicitamente pendente | Indicador/legenda de Ocorrências no gráfico com “não implementado ainda” (convive com `ready` das demais séries) |
| `filter_invalid` | Tentativa de aplicar filtro inválido | Mensagem; dados aplicados inalterados |
| `forbidden` | Sem permissão ao dashboard empresarial (403 negócio ou guarda local) | Mensagem de restrição; zero métricas |
| `product_unavailable` | 404 no endpoint por produto (produto inexistente, outro tenant ou MEMBRO sem AcessoProduto) | “Produto não encontrado/sem acesso”; zero métricas (não 403) |
| `error` | Rede / 5xx / corpo inválido | Erro + tentar novamente + `X-Correlation-Id` |
| `session` | 401 / 403 segurança | Spec 006 (encerra sessão) |

## Visibilidade por papel (visão Web)

| Papel | Produtos visíveis | Dashboard empresa |
|---|---|---|
| DONO | Todos da empresa | Igual ao ADMIN |
| ADMIN | Todos da empresa | Igual ao DONO |
| MEMBRO com AcessoProduto | Só vinculados | Só esses produtos |
| MEMBRO sem produtos | Nenhum | Tela vazia com aviso (sem erro) |
| Sem permissão empresarial | — | `forbidden` |
