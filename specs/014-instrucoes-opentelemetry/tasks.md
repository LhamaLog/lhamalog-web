# Tasks: Ver instruções de integração com OpenTelemetry

Regras: não rodar Git (exceção da sessão de 27/11/2026: Git pelo agente só nesta branch, ver `quickstart.md`); não instalar dependência; uma fase por vez, parando para revisão; `npm test` e `npm run build` ao fim de cada fase, com o resultado no `quickstart.md`. Gabarito visual: `C:\Users\Pedro\Desktop\LhamaLog\LLT-179-180-credenciais-otel\figma\04-produto-integracao-otel.png`.

## Fase 0: preparação

- [X] T001 Ler esta spec, a spec `011-tokens-ingestao`, a `013-gerenciar-chaves-ingestao`, `src/features/products/otelSnippet.ts`, `components/OtelConnectionCard.tsx`, `src/shared/config.ts`, `infra/nginx/render-config.sh`, `.env.example`, `README.md` e `src/app/routes/AppRoutes.tsx` (rotas públicas). Ler também, só para consulta, o `README.md` e o `specs/001-otlp-receiver/contracts/otlp-export.md` do `lhamalog-collector`. Linha de base: `npm test` e `npm run build`, no `quickstart.md` (criar).
- [X] T002 `speckit-clarify` com I1 a I8 e o edge case do produto arquivado, mostrando a recomendação de cada um. Registrar as respostas.
- [X] T003 `speckit-plan` (`plan.md`, `research.md`, `data-model.md` e `quickstart.md`). `speckit-analyze` antes de implementar.

## Fase 1: configuração do endpoint gRPC

- [X] T004 [P] Testes primeiro: em `tests/public-config.test.mjs`, a validação de `VITE_OTLP_GRPC_ENDPOINT` (igual à da HTTP: vazio, http, https, inválido, com usuário, com parâmetros e barra final).
- [X] T005 `src/shared/config.ts` (`otlpGrpcEndpoint`), `infra/nginx/render-config.sh` (mesma validação e mensagens), `.env.example` (`# VITE_OTLP_GRPC_ENDPOINT=http://localhost:4327`) e `README.md`.
- [X] T006 `npm test` e `npm run build`. Parar para revisão.

## Fase 2: exemplos (funções puras)

- [X] T007 [P] Testes primeiro em `tests/otel-snippet.test.mjs` (ampliar) e `tests/collector-snippet.test.mjs` (novo):
  - variáveis de ambiente e Java em HTTP e gRPC (protocolo, endpoint e cabeçalho, I4);
  - Collector em HTTP (`otlphttp/lhamalog`) e gRPC (`otlp/lhamalog`), com e sem traces, sempre sem métricas, com `${env:LHAMALOG_TOKEN}` e `service.name` (I3, I7);
  - nenhum exemplo contém um valor `llt_` real, mesmo recebendo uma chave na entrada por engano (I5);
  - bloco "Cabeçalho de autenticação" de cada protocolo;
  - nome do serviço sem nome de produto (`meu-servico`).
- [X] T008 Implementar em `otelSnippet.ts` (protocolo) e no novo `collectorSnippet.ts`. `npm test` e `npm run build`. Parar para revisão.

## Fase 3: aba

- [X] T009 No `OtelConnectionCard.tsx`:
  - seletor "Protocolo: HTTP | gRPC";
  - o campo "Endpoint de recebimento" mostra o endpoint do protocolo;
  - abas do exemplo "Variáveis de ambiente", "Java (agente)" e "OpenTelemetry Collector";
  - bloco "Cabeçalho de autenticação";
  - link "Ver documentação completa" (`/docs/opentelemetry`, nova aba, `rel="noopener"`).

  O resto continua igual ao Figma.
- [ ] T010 Produto arquivado, conforme a resposta do clarify. **Reservado para o Pedro** (clarify de 27/11): o comportamento atual (C1 da `011`) foi mantido.
- [X] T011 `npm test` e `npm run build`. Parar para revisão.

## Fase 4: documentação pública

- [X] T012 [P] Teste: a rota `/docs/opentelemetry` está na lista de rotas públicas (não passa pelo `ProtectedRoute`) e o conteúdo é gerado das mesmas funções puras (por exemplo, a seção de exemplos usa `envSnippet`, `javaSnippet` e `collectorSnippet` com `meu-servico`).
- [X] T013 Criar `src/features/docs/OpenTelemetryDocsPage.tsx` e a rota pública. A página cobre todos os tópicos da I6, com índice no topo, blocos de código com Copiar e o visual do Figma (cartões e tipografia). Os endpoints vêm da configuração pública; sem valor, aparece "consulte o administrador do LhamaLog". Nada de chamada ao Core.
- [X] T014 `npm test` e `npm run build`. Parar para revisão.

## Fase 5: fechamento

- [X] T015 Procurar `llt_` (só o falso dos testes), `sk_` e `eyJ` em `src/`, `tests/`, `README.md` e `.env.example`.
- [X] T016 No `quickstart.md`: as diferenças em relação ao Figma (I8), a lista de pendências do Figma e o roteiro manual (as linhas do `TESTE-MANUAL.md` do pacote).
- [X] T017 `speckit-analyze`. `npm test` e `npm run build` finais.
- [X] T018 Entregar ao Pedro a mensagem de commit `LLT-180: mostra as instrucoes de integracao opentelemetry e a documentacao publica` e o rascunho do PR.
