# Quickstart: validar dashboards por produto e da empresa

## Pré-requisitos

- Node.js 26.12.1.
- Web com `.env` (`VITE_CLERK_PUBLISHABLE_KEY`, `VITE_API_URL=http://localhost:8080`) e `npm run dev`.
- **Core real** (quando a spec 011 / LLT-159 existir) **ou Core mockado** que implemente [contracts/dashboard-metrics.md](contracts/dashboard-metrics.md), inclusive eco de `X-Correlation-Id`.
- Conta Clerk com empresa ativa: um usuário DONO/ADMIN e um MEMBRO (com e sem `AcessoProduto`) para os cenários de permissão.
- Perfil com fuso definido (ex.: `America/Sao_Paulo`).

## Verificações automáticas

```powershell
npm test
npm run build
```

Esperado: todos os testes passam (baseline 49 em 17/11 + novos testes de filtro/fuso/papéis/selos/contrato) e o build termina sem erro de tipo.

## Preparar o mock (opcional)

**Mock embutido no Web** (recomendado enquanto o Core 011 não existir): no `.env`, defina `VITE_DASHBOARD_MOCK=true` (documentado em `.env.example`) e reinicie `npm run dev`. O cliente em `src/features/dashboard/api/` passa a usar fixtures locais alinhadas a [contracts/dashboard-metrics.md](contracts/dashboard-metrics.md). Em produção deixe a variável ausente ou `false`.

**Stub externo** (alternativa): subir um stub em `http://localhost:8080` que responda:

- `GET /api/dashboard/products/{id}/metrics`
- `GET /api/dashboard/company/metrics`

com JSON válido do contrato (volume em bytes, múltiplos de 2^30 nos exemplos), header `X-Correlation-Id` ecoado, e os status 400/401/403/404 dos cenários abaixo. Produto inacessível = **404** (não 403).

## Roteiro manual (PowerShell + navegador)

Subir o Web:

```powershell
npm run dev
```

Abrir `http://localhost:5173`, entrar na Clerk e selecionar a empresa de teste.

| Item | Passo | Esperado | Requisito |
|---|---|---|---|
| E1 | Navbar → Dashboard (`/dashboard`) com produto acessível; período padrão | Cinco cartões (incl. volume vs cota em **GiB**, 2^30), gráfico ERROR/WARNING, ranking até 5 serviços; opcional “dados consolidados até” | US1, FR-001 |
| E2 | Período ≤ 48h vs > 48h | Buckets por hora vs por dia; rótulos no fuso do perfil | FR-006, SC-005 |
| E3 | Produto sem dados no período | “nenhum resultado encontrado”; sem números inventados | US1 |
| E4 | Alterar período/tipo, Aplicar; recarregar | URL mantém filtros; métricas no recorte | US2, FR-004 |
| E5 | Período acima de `min(30, retentionDays)` | Mensagem de filtro inválido; dados anteriores inalterados | FR-003, SC-002 |
| E6 | Abrir `/dashboard/empresa` como DONO/ADMIN | Título Dashboard Empresarial, 4 cartões (Alertas=WARNING), gráfico por produto, lista com selos, tabela; sem Exportar/Desempenho | US3, FR-002, SC-007 |
| E7 | MEMBRO com subset de produtos | Só produtos do AcessoProduto | FR-009, SC-003 |
| E8 | MEMBRO sem produtos | Tela vazia com aviso; sem métricas; sem erro | FR-009 |
| E9 | Sem permissão ao empresarial | Mensagem de restrição; zero métricas | FR-010 |
| E10 | Filtros do empresarial na URL; limpar para “Todos” | Recorte e volta ao consolidado autorizado | US4 |
| E11 | DevTools: chamada de métricas | Request com `X-Correlation-Id`; erro mostra o mesmo id | FR-016, SC-008 |
| E12 | Parar o Core / forçar 5xx | Erro + tentar novamente; sessão **não** encerra | edge / spec 006 |
| E13 | Forçar 401 (revogar sessão) | Fluxo spec 006 (“Você foi deslogado”) | spec 006 |
| E14 | Trocar empresa com fetch em andamento | Resposta da empresa anterior descartada | edge |
| E15 | Gráfico sem dados de ocorrências (campo ausente) | Indicador/legenda de Ocorrências em estado pendente com “não implementado ainda” | US5, FR-008, SC-004 |
| E16 | Forçar 404 no `GET .../products/{id}/metrics` (produto de outro tenant ou sem Acesso) | Estado “produto não encontrado/sem acesso”; **sem métricas**; sessão mantida (não é 403 de segurança) | FR-009, FR-012 |

Registrar no PR como `Item | Data | Resultado | Observação`, sem token, e-mail real ou `org_id` real.

## US5 (placeholder no MVP; comparação após LLT-104)

No MVP: conferir E15 (mensagem “não implementado ainda” sem dados de ocorrências). Após LLT-104: comparar totais ERROR/WARNING do dashboard por produto com a lista de Ocorrências no mesmo filtro (parte de SC-004).
