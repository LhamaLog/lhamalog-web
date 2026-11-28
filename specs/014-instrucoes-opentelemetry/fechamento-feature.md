# Fechamento da Feature LLT-124 "Credenciais de ingestão OpenTelemetry" (LLT-179 e LLT-180)

**Data:** 27/11/2026 · **Epic:** LLT-100 · **Feature:** LLT-124 (E04.F3)

**Entregas:**
- Core `LLT-179-core-grava-products` (spec `013-produto-na-colecao-products`).
- Web `LLT-179-gerenciar-chaves-ingestao` (spec `013`, commit `1e5d4c0`).
- Web `LLT-180-instrucoes-opentelemetry` (spec `014`, commit `4b56dbf`).

**Evidência manual:** roteiro do `TESTE-MANUAL.md` com ingestão real, feito em 27/11/2026, das 19:40 às 19:55, no Chrome, com a conta do Pedro. O resultado de cada linha está nos `quickstart.md` das specs `013` e `014` do Web e da `013` do Core.

## 1. Matriz de aceite

### LLT-179: gerar, revogar e rotacionar token de ingestão do produto

| Critério do card | Status | Evidência |
|---|---|---|
| O token é exibido uma única vez e guardado só como hash | **OK** | Core: só o SHA-256 em `product_tokens` (spec `010`, PR #8). Web: a chave aparece no aviso único, com Copiar, e some ao fechar. Nenhum exemplo leva o valor (linhas 2, 4 e 19). `localStorage` e `sessionStorage` sem `llt_`, console limpo (linha 25). |
| O token revogado deixa de ser aceito pelo Coletor em tempo definido | **OK** | Revogada às 19:45. O envio logo depois deu `401`, e depois de 32 s também (linha 13). Prazo máximo: 30 s, o cache positivo do Coletor, informado na confirmação e na documentação pública. |
| Rotação com dois tokens válidos na transição | **OK** (com risco aceito) | Rotação de 2 h: a chave antiga ("Em transição", expira às 21:44) e a nova deram `200` (linhas 4, 10 e 11). O fim da transição não foi esperado (linha 15): fica coberto pelos testes do Core e do Coletor (`expiresAt` no passado é recusado). |
| Toda operação fica em auditoria | **OK** | O Histórico mostra Criada, Rotacionada (com o fim da transição), Criada e Revogada, com o nome de quem fez (linhas 6 e 14). A fonte é o `ProductTokenAudit` do Core. |

### LLT-180: ver instruções de integração com OpenTelemetry

| Critério do card | Status | Evidência |
|---|---|---|
| Endpoint OTLP HTTP e gRPC, cabeçalho de autenticação e exemplo do Collector | **OK** | Seletor HTTP/gRPC com `:4328`/`:4327` e o bloco "Cabeçalho de autenticação" (linhas 16 e 17). Os YAML do Collector, nos dois protocolos, passaram no `validate` do `otelcol-contrib` 0.163.1. Com o Collector real, o log foi entregue ao OpenObserve em HTTP e em gRPC (linhas 20 a 22). |
| Os exemplos usam o produto selecionado e nunca exibem o token completo | **OK** | Os três exemplos usam `gateway-de-pagamentos`, sem métricas, e Traces liga e desliga o envio de traces (linha 18). Com o aviso da chave aberto, nenhum exemplo continha o valor (linha 19). |
| Link para a documentação pública | **OK** | "Ver documentação completa" abre `/docs/opentelemetry` numa aba nova (linha 23). Num Chrome com perfil novo, sem login, a página abriu inteira, com os 10 tópicos e sem chamar o Core (linha 24). |

### Ponta a ponta (motivo da D1)

| Verificação | Status | Evidência |
|---|---|---|
| Chave gerada no Web é aceita pelo Coletor | **OK** | O produto foi gravado em `products` com `productId` igual ao `_id` (linha 1). As chaves deram `200`, e os logs chegaram ao OpenObserve com `productid`, `tenantid` e `servicename` (linhas 10 a 12, 21 e 22). |
| Chave inválida ou ausente é recusada | **OK** | `401` com `llt_errada` e sem cabeçalho; métricas dão `404` (linha 9). |

### Linhas não feitas à mão

- **Linha 7** (membro comum não vê a seção nem o "Gerar nova"): o Pedro não teve tempo. A regra está coberta pelo teste automático `who manages keys: only with INGESTION_TOKENS_MANAGE and a known access (K6)` (`tests/ingestion-token-management.test.mjs`): sem a permissão, carregando, com erro ou com cargo `org:member`, a resposta é "não gerencia". Do lado do Core, a lista recusa com 403 (testes da spec `010`). **Risco aceito.**
- **Linha 15:** risco aceito, como descrito acima.

## 2. Revisão do Michel (17/11) e como foi resolvida

| Ponto da revisão | Como foi resolvido |
|---|---|
| A LLT-179 não estava concluída: o Web só gerava e copiava, sem listar, revogar nem ver o histórico (a falta de revogar foi registrada como "importante para chave vazada") | Spec `013` do Web: a seção "Chaves deste produto" lista, revoga (também no produto arquivado), rotaciona com período, cria com nome e mostra o histórico. |
| A tela da LLT-180 não existia | Spec `014` do Web: protocolo HTTP/gRPC, cabeçalho explicado, exemplo do OpenTelemetry Collector, link e a página pública `/docs/opentelemetry`. |
| (Achado do fechamento) Nenhuma chave gerada pelo Core funcionava no Coletor: o Coletor buscava `products.productId`, e o Core gravava em `Produto._id` | D1 = B: o Core passa a gravar em `products`, com `productId`. O Coletor não muda de código: só o `MONGODB_URI` dele aponta para o banco do Core. Comprovado no roteiro (seção 1). |

## 3. Decisões

- **D1 = B** (Pedro, 27/11/2026): o Core grava os produtos em `products`, com o campo `productId` (`BeforeSaveCallback`, sem mudar o record `Product`), mais um índice único e parcial. Há um script de migração `Produto` → `products` no `quickstart.md` da spec `013` do Core. Não há PR no Coletor.
- **D2, ADRs propostas** (rascunhos em `claude\rascunhos\ADR-tokens-ingestao.md`, para o Pedro levar ao time):
  - **ADR_xxx:** token de ingestão guardado só como hash e exibido uma única vez (substitui a ADR_113 no armazenamento).
  - **ADR_yyy:** o Core grava os produtos em `products`, e o Coletor lê produtos e chaves do banco do Core, com usuário só de leitura.
- **D3:** a Feature é a LLT-124 (Epic LLT-100), mãe das histórias LLT-179 e LLT-180.

## 4. Pendências, com dono sugerido

| Pendência | Dono sugerido |
|---|---|
| **Figma:** desenhar a lista, a revogação, a rotação com período e o histórico; o seletor de protocolo, a aba Collector, o bloco do cabeçalho, o link e a página pública; trocar `x-api-key` por `Authorization: Bearer` | Design (Figma) |
| **C3:** a chave de um produto arquivado deve continuar enviando logs? Hoje continua. Para bloquear agora, o caminho é revogar as chaves | Time, com o Michel (Coletor) |
| **T010 da `014`:** comportamento da aba no produto arquivado. Hoje vale a C1 da `011` (aba só leitura). No roteiro, o Copiar do endpoint continuava habilitado no arquivado | Pedro |
| **Migração em cada ambiente:** rodar o script `Produto` → `products` antes de subir o Core novo; sem ele, os produtos antigos somem da tela | Quem sobe o ambiente (time) |
| **`MONGODB_URI` do Coletor** apontando para o banco do Core, com usuário só de leitura em `products` e `product_tokens` | Michel / infra |
| **Arquivar e desarquivar** ainda pelo cargo da Clerk, e não por `PRODUCTS_ARCHIVE` | Pendência da LLT-123 |
| **"Testar conexão" e "Status da conexão"** com números reais: não estão nos critérios destes cards e não existe API | Card novo (Core + Web) |
| **Constituição:** as branches não usam o prefixo `feature/` | Emenda pendente com o time |

A permissão `INGESTION_TOKENS_MANAGE` já está em uso: a LLT-120 entrou na `Development`.

## 5. Texto para colar no Jira

### Comentário na Feature LLT-124

> Fechamento em 27/11/2026. Os critérios das duas histórias foram atendidos e testados de ponta a ponta, com ingestão real (Web → Core → Coletor → OpenObserve).
>
> **LLT-179:** a chave aparece uma vez e fica guardada só como hash. Revogada, é recusada pelo Coletor em até 30 s (no teste, `401` logo depois). Na rotação, as duas chaves funcionam durante a transição (testado com 2 h). Toda operação aparece no Histórico, com o autor.
> **LLT-180:** endpoint HTTP e gRPC, cabeçalho de autenticação, exemplo do OpenTelemetry Collector (validado e testado em HTTP e gRPC), exemplos com o produto e sem a chave, e link para a documentação pública `/docs/opentelemetry` (abre sem login).
>
> Achado do fechamento: nenhuma chave gerada pelo Core era aceita pelo Coletor (produto em `Produto._id` × busca em `products.productId`). Decisão D1 = B: o Core passa a gravar em `products`, com `productId`, mais um script de migração. O Coletor não muda de código, só aponta o `MONGODB_URI` para o banco do Core.
>
> PRs, na ordem: Core `LLT-179-core-grava-products` → Web LLT-179 → Web LLT-180.
> Riscos aceitos: o fim da transição não foi esperado no teste manual (coberto por testes automáticos); o membro comum sem acesso às chaves foi coberto por teste automático, não à mão.
> Pendências: Figma (telas novas e `x-api-key` → `Bearer`), pergunta C3 (produto arquivado deve ingerir?), migração em cada ambiente antes do deploy, e um card novo para "Testar conexão" e "Status da conexão".
> ADRs propostas ao time: "token só como hash e exibido uma vez" (substitui a ADR_113 nesse ponto) e "Core grava em `products`, Coletor lê do banco do Core".

### Comentário na LLT-179

> Concluída em 27/11/2026. Web: seção "Chaves deste produto", com lista e situação, Revogar (também no produto arquivado), Rotacionar com período de 1 a 168 h, Nova chave com nome e Histórico com o autor. A permissão é `INGESTION_TOKENS_MANAGE`. Core: o produto passa a ser gravado em `products`, com `productId`, para o Coletor achar o produto da chave.
> Teste com ingestão real: chave criada → `200`; rotação de 2 h → antiga e nova `200`; revogada → `401`; logs no OpenObserve com produto e empresa. Testes automáticos: Web 185/185; Core 445/0.
> Atenção: rodar o script de migração (`quickstart.md` da spec 013 do Core) em cada banco antes de subir.

### Comentário na LLT-180

> Concluída em 27/11/2026. Na aba Integração OpenTelemetry: seletor HTTP/gRPC (endpoint gRPC pela nova `VITE_OTLP_GRPC_ENDPOINT`), bloco "Cabeçalho de autenticação", exemplo do OpenTelemetry Collector (chave em `${env:LHAMALOG_TOKEN}`, sem métricas) e link "Ver documentação completa" para a página pública `/docs/opentelemetry`.
> Teste: os YAML de HTTP e gRPC passaram no `validate` do `otelcol-contrib` 0.163.1, e um Collector real entregou os logs no OpenObserve nos dois protocolos. Nenhum exemplo mostra a chave. A documentação abre sem login e sem chamar o Core. Testes automáticos: Web 199/199.
> Diferença do Figma: `Authorization: Bearer` no lugar de `x-api-key`; seletor, aba Collector, bloco e página pública sem desenho (pendência do Figma).
