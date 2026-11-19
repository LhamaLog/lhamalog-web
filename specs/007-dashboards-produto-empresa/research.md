# Research: Dashboards por produto e da empresa

## R1. Rotas da Web

- **Decision**: `/dashboard` = dashboard por produto; `/dashboard/empresa` = dashboard da empresa. O item `dashboard` da Navbar navega para `/dashboard`. Link/aba interna (ou breadcrumb) leva a `/dashboard/empresa` para quem tem permissão.
- **Rationale**: o item já existe na Navbar sem rota; dois caminhos claros separam US1/US2 de US3/US4 e cabem no `AppRoutes` / workspace atuais.
- **Alternatives considered**: `/dashboard?visao=empresa` (mistura estado de tela com filtro); `/empresa/dashboard` (conflita com configurações de `/empresa`).

## R2. Filtros na URL

- **Decision**: filtros válidos ficam na query string e só entram depois de Aplicar / Atualizar (ou na carga inicial se a URL já trouxer valores válidos). Parâmetros:
  - `produto` — id do produto (obrigatório no por produto; no empresarial, ausente ou vazio = “Todos os produtos autorizados”; múltiplos via `produto` repetido ou lista separada por vírgula — parser único no model).
  - `periodo` — `24h` | `7d` | `30d` | `personalizado` (padrão `7d`).
  - `de` / `ate` — ISO date-time ou date local do perfil, só quando `periodo=personalizado`.
  - `tipo` — ausente = todos; senão subconjunto de `ERROR`, `WARNING`, `INFO` (lista).
- **Rationale**: FR-004 / USID_032 / USID_036; compartilhável e alinhado a outras telas com query (`/empresa?secao=`).
- **Alternatives considered**: só estado React (some no reload); `localStorage` (cache indevido e foge da URL).

## R3. Limite de período e presets

- **Decision**: presets `24h`, `7d`, `30d` e personalizado. Período máximo permitido = `min(30 dias, retentionDays do plano)` (ADR_131: FREE 7, Starter 15, Pro 30, Business/Enterprise 90). **Origem de `retentionDays` na 1ª carga**: até a primeira resposta do Core, o filtro usa teto seguro padrão de **7 dias** (menor plano, FREE). Cada resposta de métricas (produto e empresa) devolve `retentionDays`; a partir daí o teto passa a `min(30, retentionDays)`. Se um filtro aplicado da URL exceder o teto conhecido depois da resposta, trata-se como inválido (mensagem) e não é aplicado. Se o preset exceder o máximo (ex.: `30d` no FREE), o controle não oferece aplicar e mostra mensagem de filtro inválido; o recorte anterior ou o padrão permanece. Personalizado: `de < ate`, duração ≤ máximo, e ambas as pontas dentro da retenção.
- **Rationale**: FR-003; no MVP o dashboard é igual para todos os planos — só muda o teto do período (clarification 2026-11-18); evita assumir retenção alta antes do Core responder.
- **Alternatives considered**: esconder presets acima do plano (pior para feedback); permitir 90 dias no Business sem o teto de 30 do MVP (contradiz FR-003); bloquear a 1ª carga até obter `retentionDays` de outro recurso (atrasa a tela sem ganho).

## R4. Agrupamento hora/dia no fuso do perfil

- **Decision**: duração do período ≤ 48 horas → buckets por **hora** no fuso do perfil; > 48 horas → buckets por **dia** nesse fuso. Sem fuso no perfil → `America/Sao_Paulo` (padrão já usado no perfil). Rótulos do eixo e “dados consolidados até” formatados com `Intl` nesse fuso.
- **Rationale**: FR-006; evita misturar UTC do Core com o relógio da pessoa.
- **Alternatives considered**: sempre por dia (perde detalhe em 24h); fuso fixo do navegador (ignora perfil).

## R5. Gráficos SVG próprios

- **Decision**: estender `src/shared/ui` (Sparkline, MetricCard, RankingList, DistributionBars) com um gráfico de séries no tempo (linha ERROR/WARNING e, no empresarial, uma série por produto) em SVG próprio. **Sem** Recharts ou outra lib de charts.
- **Rationale**: FR-015; preset local proíbe dependência nova sem autorização; a demo `/componentes` já usa esses primitivos.
- **Alternatives considered**: Recharts (dependência nova); canvas (pior acessibilidade / inconsistente com o design system).

## R6. Fonte de dados e agregação (contrato com o Core)

- **Decision**: o Web consome só o endpoint de consulta do Core (FR-013: fonte/contrato do Web; OpenObserve só via Core + fatos de uso). Job SSID_011 e consulta híbrida ficam em FR-014 / Core: resposta = agregados já consolidados **mais** contagem na hora do intervalo ainda não consolidado; volume = fatos de uso; campo de negócio `dadosConsolidadosAte` — quando presente, a UI MUST exibir no fuso do perfil. Job no MVP lê **logs** no OpenObserve (não Ocorrências — LLT-104 inexistente), com frequência padrão a cada **1h** configurável por propriedade (cron ou intervalo). **Nesta entrega** = multi-repositório: Web (spec 007) + Core (spec 011 em `lhamalog-core/specs/011-consulta-metricas-dashboard`, branch `LLT-145-consulta-metricas-dashboard`).
- **Rationale**: clarifications 2026-11-18; ADR_141 (Web ↔ Core); ADR_166 mantém agregações no MVP; frequência fechada pelo Michel (18/11, 21:39); **A1 CONFIRMADO** pelo Michel (18/11, 22:02): job lê logs agora e passa a ler Ocorrências depois da LLT-104; interpretação híbrida confirmada.
- **Alternatives considered**: Web → OpenObserve direto (proibido); só consulta na hora sem job (rejeitado na clarification); só agregados sem intervalo aberto (atraso na hora corrente); frequência fixa sem propriedade (impede ajuste operacional).

## R7. `X-Correlation-Id`

- **Decision**: cada `apiRequest` de métricas (e, de preferência, o cliente HTTP compartilhado) envia `X-Correlation-Id` (UUID). O Core já aceita e devolve o mesmo id. Em estado de erro recuperável, a UI mostra esse id para suporte. 401/403 de segurança continuam na spec 006 (não misturar com falha de rede).
- **Rationale**: FR-016 / SC-008; alinhado à classe `CorrelationId` do Core.
- **Alternatives considered**: correlacionar só no Core (UI sem id de suporte); header proprietário novo (quebra o que o Core já entende).

## R8. Papéis e visibilidade

- **Decision**: DONO e ADMIN (`org:admin` / `Membro.papel`) veem **o mesmo** conjunto — todos os produtos da empresa. MEMBRO (`org:member`) vê só `AcessoProduto`. MEMBRO sem produtos: tela vazia com aviso (sem métricas, sem erro) nos dois dashboards. Sem permissão ao dashboard empresarial: bloqueio com mensagem, zero métricas. **Sem cache de permissão** no Web (LLT-171): cada carga reavalia. Troca de empresa descarta resposta em voo.
- **Rationale**: FR-009 / FR-010 / clarifications.
- **Alternatives considered**: tratar DONO diferente de ADMIN (rejeitado); cachear lista de produtos na sessão (viola LLT-171).

## R9. Selos Crítico / Atenção / Estável (Produtos mais impactados)

- **Decision (APROVADO pelo Michel em 18/11)**: para cada produto no recorte, seja `p = logsError / max(totalLogs, 1)` no período filtrado:
  - **Crítico** se `p ≥ 0,10` (ERROR ≥ 10% dos logs do produto no período);
  - **Atenção** se `0,02 ≤ p < 0,10` (de 2% inclusive a 10% exclusive);
  - **Estável** se `p < 0,02` (abaixo de 2%, inclusive produto sem logs / zero ERROR).
  Ranking “mais impactados”: ordenar por `logsError` desc, depois por `p` desc; top N (protótipo: lista curta, tipicamente até 5). Sem SLA/latência.
- **Rationale**: limiares fechados na Session 2026-11-18; edge case Estável cobre produto sem logs.
- **Alternatives considered**: limiares absolutos só por contagem (ignora volume do produto); score com WARNING (mistura Alertas com criticidade de ERROR).

## R10. Escopo Core vs Web

- **Decision**: **nesta entrega** = multi-repositório. Neste repo só o Web (spec 007). Core (endpoint, OpenObserve, fatos de uso, job, autorização backend, contrato LLT-159, mapeamento ADR_170 de severidades) → `lhamalog-core/specs/011-consulta-metricas-dashboard` / branch `LLT-145-consulta-metricas-dashboard` (não criar aqui), após autorização. Até lá, quickstart usa Core mockado ou real quando existir. O Web só consome enums já normalizados; parsers rejeitam valores desconhecidos (FR-011 / T004 / T014).
- **Rationale**: clarification (Michel + agente no Core); ADR_141; instrução explícita de não criar artefatos fora de `specs/007-...`.
- **Alternatives considered**: implementar Core nesta pasta (errado de repositório); bloquear o Web até a 011 (atrasa parsers/UI testáveis com mock); mapear severidades brutas no Web (duplica ADR_170 e diverge do Core).

## R11. Testes sem dependências novas

- **Decision**: regras puras (filtro, limite de período, agrupamento, papéis, selos/ranking derivado, parsers do contrato) em `tests/*.test.mjs` com `node --test`. UI e integração Clerk → [quickstart.md](quickstart.md).
- **Rationale**: mesmo padrão da spec 006; baseline 49 testes em 17/11 deve permanecer verde e crescer só com casos novos.
- **Alternatives considered**: @testing-library/jsdom (dependência nova).

## R12. US5 / Ocorrências (placeholder no MVP; comparação na LLT-104)

- **Decision** (Michel 18/11, 21:38): no MVP o gráfico de linhas MUST estar pronto para receber valores de ocorrências (props, tipos e campo opcional `occurrences` no contrato). Sem dados, a série fica em estado **pendente** e a UI mostra “não implementado ainda”. A comparação real dashboard ↔ lista de Ocorrências (SC-004 / critério LLT-222) continua condicionada à LLT-104. Cartões/criticidade usam Logs ERROR / Logs WARNING (ADR_170). Tasks T033/T034 entram no MVP (Phase 7), sem lógica de comparação.
- **Rationale**: FR-008 / SC-004; clarifications Session 2026-11-18.
- **Alternatives considered**: manter US5 totalmente bloqueada (atrasa o encaixe do gráfico); inventar lista de ocorrências no Web (fora de escopo); comparar totais sem a LLT-104 (sem fonte confiável).

## R13. Volume em bytes (API) e GiB na UI (2^30)

- **Decision** (Michel 18/11, 22:02): a API trafega `volumeUsedBytes` e `volumeIngestaoBytes` como inteiros em **bytes**; a tela exibe em **GiB** (1 GiB = 2^30 = 1073741824 bytes), com `toLocaleString` no locale do usuário, até 2 casas decimais e sufixo `GiB` (função pura `formatVolumeGiB` no model). Exemplos de contrato usam múltiplos exatos de 2^30 (sem misturar 10^9).
- **Rationale**: FR-001; evita ambiguidade GB decimal vs GiB binário; alinhado ao locale do perfil.
- **Alternatives considered**: formatação automática B/KB/MB/GB mista (confunde cota do plano); GB = 10^9 (mistura base 10 com cota binária).

## R14. Produto inacessível → 404

- **Decision** (Michel 18/11, 22:02): produto inacessível (outra empresa / tenant diferente do token, ou MEMBRO sem AcessoProduto / produto inexistente) → Core responde **404** no `GET .../products/{id}/metrics` (não 403). O Web trata 404 como estado `product_unavailable` (“produto não encontrado/sem acesso”) sem métricas. 403 de segurança continua na spec 006; 403 de negócio permanece para o dashboard empresarial sem permissão.
- **Rationale**: FR-009 / FR-012 / LLT-158; evita confundir falta de produto com logout de segurança.
- **Alternatives considered**: 403 de negócio para produto inacessível (rejeitado pelo Michel); mapear 404 como erro genérico recuperável (pior UX / foge do estado dedicado).
