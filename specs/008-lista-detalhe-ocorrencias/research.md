# Research: Lista e detalhe de ocorrências

**Feature**: `008-lista-detalhe-ocorrencias` | **Data**: 19/11/2026

Fontes: spec e contratos da `012-consultar-ocorrencias` do lhamalog-core; telas oficiais "Design base v2 - Com Logo" e "Detalhe da Ocorrência" (lhamalog_docs); componentes da LLT-237 em `src/features/occurrences`; `useApi`, `useApiResource`, `Pagination` e as telas de Produtos e Equipe.

## R1. Rotas e lugar na área logada

- **Decisão**: `/ocorrencias` e `/ocorrencias/:id` dentro do `CompanyWorkspace`, como `/produtos` e `/equipe`. O `Navbar` já tem o item `occurrences`; o `CompanyWorkspace` passa a navegar para ele, marcar o item ativo e montar o caminho de navegação ("Ocorrências" e "Ocorrências › Detalhe").
- **Motivo**: mesma moldura (seletor de empresa, cabeçalho, menu) das outras telas; o `key={orgId}` do workspace já remonta a tela ao trocar de empresa (FR-015).
- **Alternativas**: rota fora do workspace, descartada por duplicar o shell.

## R2. Estado da lista no endereço

- **Decisão**: busca, tipos, status, produtos, período, página e tamanho ficam na query string (`q`, `type`, `status`, `productId`, `periodo`, `page`, `size`), lidos e escritos por um módulo puro `occurrenceQuery.ts` com `useSearchParams`. Valor inválido é descartado na leitura. O período é guardado como preset (`24h`, `7d`, `30d`) e convertido em `from` só na hora de consultar o Core.
- **Motivo**: FR-008 e FR-013 (recarregar, voltar do detalhe e compartilhar link). Guardar o preset e não a data faz o link continuar "últimos 7 dias" quando aberto noutro dia. O módulo puro é testável com `node --test`.
- **Alternativas**: estado em memória ou `localStorage`, descartados porque não sobrevivem ao link nem ao voltar.

## R3. Consulta e respostas fora de ordem

- **Decisão**: a lista usa o `useApiResource(path)` existente, com o caminho montado a partir da query; ele já cancela a consulta anterior com `AbortController` quando o caminho muda.
- **Motivo**: cobre FR-014 sem código novo de concorrência.

## R4. Busca com pausa

- **Decisão**: o campo de busca tem estado local; um `setTimeout` de 400 ms grava `q` no endereço e volta a página para 1. Limite de 200 caracteres pelo `maxLength`.
- **Motivo**: FR-006, sem uma consulta por tecla.

## R5. Painel de filtros

- **Decisão**: componente novo `OccurrenceFilters` (diálogo ancorado ao `FilterButton`; em tela estreita, tela cheia), com rascunho local; "Aplicar filtros" grava no endereço e "Limpar filtros" apaga busca e filtros. Tipos e status como caixas de seleção (`Checkbox`), produtos como lista de caixas de seleção, período como `Select` com os quatro presets.
- **Motivo**: protótipo "Filtros de ocorrências" (Nível, Projeto, Período, Status); seleção múltipla pedida pela LLT-204. "Criticidade" fica fora (gravidade não está no Core).
- **Produtos do filtro**: `GET /api/products` e `GET /api/products?archived=true`, juntando os dois; o Core já devolve só os produtos visíveis.

## R6. Contagem de filtros ativos

- **Decisão**: cada grupo com seleção conta 1 (tipo, status, produto, período); a busca não conta, porque fica visível no campo.
- **Motivo**: o botão do protótipo mostra "2" com dois filtros aplicados.

## R7. Adaptar os componentes da LLT-237

- **Decisão**: `OccurrenceItem` ganha `count`, `status`, `recurring` e `product`; `description` e `tags` ficam opcionais (a lista real não tem tags). `OccurrenceCard` mostra status como `Badge`, "Recorrente" como `Badge`, contagem e data e hora da última vez. `OccurrencesView` deixa os painéis opcionais (`panels?`), para a tela real não mostrar métricas, e recebe `emptyState` para os dois textos de vazio. A demonstração em `/componentes` continua funcionando com os mesmos dados de exemplo.
- **Motivo**: reaproveitar o visual aprovado sem quebrar a página de componentes.

## R8. Detalhe

- **Decisão**: `OccurrenceDetailPage` com cabeçalho (`SeverityIndicator`, título, id com copiar, produto, primeira e última vez), cartão "Dados da ocorrência" (status, recorrente, contagem, dados sensíveis mascarados e atributos em `<dl>`), cartão "Mensagem e contexto" (resumo e exemplos em `<pre>` com rolagem horizontal e botão copiar; os exemplos não têm data) e cartão "Histórico de status" (lista cronológica).
- **Revisão 22/11**: o contrato Finder → Módulo aprovado não tem mensagem normalizada nem data por linha; o detalhe usa `summary` e `samples: string[]` (spec 012 do core revisada). Abas, ações ("Alterar status", "Arquivar", "Sugestão IA") e "Ações e próxima etapa" do protótipo ficam fora.
- **Motivo**: FR-010 e FR-017. Texto de log vai como conteúdo de texto do React, sem `dangerouslySetInnerHTML` (FR-011).
- **Copiar**: `navigator.clipboard.writeText` com a confirmação "Copiado" por 2 s; se a API não existir, o botão não aparece.

## R9. 404 no detalhe

- **Decisão**: `ApiError` com status 404 mostra o estado "Ocorrência não encontrada ou sem acesso" e o link de volta. A classificação de recusa da spec 006 não encerra a sessão em 404.
- **Motivo**: FR-012; o Core usa a mesma resposta para inexistente, outra empresa e sem acesso.

## R10. Voltar com os filtros

- **Decisão**: ao abrir um item, a navegação passa `state: { from: location.search }`, e "Voltar para ocorrências" usa esse `search`; sem `state` (link direto), volta para `/ocorrencias`.
- **Motivo**: FR-013 sem poluir o endereço do detalhe.
- **Alternativas**: levar a query no endereço do detalhe (`?voltar=...`), descartado por deixar o link do detalhe longo e frágil.

## R11. Datas

- **Decisão**: formatar `lastSeenAt`, `firstSeenAt`, exemplos e histórico com `Intl.DateTimeFormat` no idioma e fuso do perfil (`useAppliedPreferences`), como as demais telas.

## R12. Testes

- **Decisão**: `tests/occurrences.test.mjs` com `node --test` para os módulos puros: leitura e escrita da query (valores inválidos, presets, página e tamanho), montagem do caminho do Core (`from` a partir do preset com relógio injetado), contagem de filtros ativos e rótulos de tipo e status. Telas e componentes são validados pelo quickstart, sem dependências novas (regra do `docs/instrucoes-agentes.md`).
