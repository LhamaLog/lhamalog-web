# Feature Specification: Ver instruções de integração com OpenTelemetry

**Feature Branch**: `LLT-180-instrucoes-opentelemetry`
**Spec**: `specs/014-instrucoes-opentelemetry` (014 conferido livre na `origin/Development` em 27/11/2026)
**Feature (Jira)**: LLT-124 "Credenciais de ingestão OpenTelemetry" (Epic LLT-100), card LLT-180
**Status**: Implementada em 27/11/2026 (Fases 0 a 5), menos o T010 (produto arquivado, reservado para o Pedro). Roteiro no navegador pendente (Parte D)

**Input**: LLT-180 (Epic LLT-100 "Empresa e produtos (multiproduto)", Feature "Credenciais de ingestão OpenTelemetry", E04.F3.2, USID_015, prioridade Alta). "Como usuário, quero um passo a passo para apontar meu OTel Collector/SDK ao LhamaLog." Critérios de aceite do card:

1. A tela mostra o endpoint OTLP (HTTP **e** gRPC), o cabeçalho de autenticação e um exemplo de configuração do **Collector**.
2. Os exemplos usam o produto selecionado, mas **nunca** exibem o token completo depois de criado.
3. Há link para a documentação pública.

Na revisão de 17/11, o Michel registrou que a tela pedida nos critérios ainda não existia. Desde então, o Web da 179 (spec `011`, PR #15) entregou a aba "Integração OpenTelemetry" igual ao Figma, com:
- o endpoint HTTP (`VITE_OTLP_ENDPOINT`);
- o exemplo "Variáveis de ambiente" e "Java (agente)", com `Authorization=Bearer%20<sua-chave>`;
- o nome do serviço tirado do nome do produto.

**Falta para os critérios:** o endpoint gRPC, o cabeçalho de autenticação explicado em texto (HTTP e gRPC), o exemplo do OpenTelemetry Collector e o link para a documentação pública, que ainda não existe.

**Fontes:**
- **Tela:** o Figma final, recorte `figma/04-produto-integracao-otel.png`. O que já está igual ao Figma continua igual.
- **Comportamento do receptor:** o `README.md` e o `specs/001-otlp-receiver/contracts/otlp-export.md` do `lhamalog-collector`. Resumo:
  - OTLP/HTTP `POST /v1/logs` e `/v1/traces` (protobuf ou JSON, gzip opcional), porta 4318 em produção e 4328 no local;
  - OTLP/gRPC `LogsService/Export` e `TraceService/Export`, porta 4317 em produção e 4327 no local;
  - autenticação `Authorization: Bearer <token>` (no gRPC, metadata `authorization`);
  - métricas recusadas (HTTP 404, gRPC `UNIMPLEMENTED`);
  - respostas 200 (`partial_success`), 400, 401, 413, 415 e 503 com `Retry-After`.

## Clarifications

- **I1. Onde ficam as instruções?** → Recomendação: na própria aba "Integração OpenTelemetry" do Figma, que já é a tela do produto selecionado. No cartão "Configuração da aplicação":
  - um seletor **Protocolo: HTTP | gRPC** acima do exemplo;
  - as abas do exemplo passam a ser "Variáveis de ambiente", "Java (agente)" e **"OpenTelemetry Collector"**;
  - abaixo do exemplo, um bloco curto "Cabeçalho de autenticação" e o link **"Ver documentação completa"**.

  *Alternativa:* uma aba nova "Instruções". Ela foge do Figma, que tem três abas.
- **I2. Endpoint gRPC.** → Recomendação: variável nova `VITE_OTLP_GRPC_ENDPOINT`, com a mesma validação da `VITE_OTLP_ENDPOINT` (http ou https, sem usuário, senha, parâmetros ou âncora). Ela vale no `npm run dev` e no `/config.js` do contêiner (`infra/nginx/render-config.sh`) e fica documentada no README e no `.env.example` (local: `http://localhost:4327`). O campo "Endpoint de recebimento" do Figma mostra o endpoint do protocolo escolhido. Sem valor, mostra "Endereço ainda não configurado.".
- **I3. Exemplo do Collector.** → Recomendação: um `config.yaml` mínimo e válido do OpenTelemetry Collector:
  - `receivers.otlp` (http e grpc locais);
  - `exporters` com `otlphttp/lhamalog` (endpoint HTTP) **ou** `otlp/lhamalog` (endpoint gRPC, conforme o seletor) e `headers: { authorization: "Bearer ${env:LHAMALOG_TOKEN}" }`;
  - `service.pipelines` para `logs` e, se Traces estiver marcado, `traces`. Nunca `metrics`.

  A chave nunca entra no texto: o exemplo usa a variável de ambiente `LHAMALOG_TOKEN`, com a instrução de definir essa variável no servidor do Collector.
- **I4. gRPC no SDK.** → Recomendação: com gRPC escolhido, "Variáveis de ambiente" e "Java (agente)" trocam para `OTEL_EXPORTER_OTLP_PROTOCOL=grpc`, o endpoint gRPC e `OTEL_EXPORTER_OTLP_HEADERS=authorization=Bearer%20<sua-chave>`.
- **I5. Token nunca completo.** → Recomendação: todos os exemplos usam sempre o marcador `<sua-chave>` (Variáveis e Java) ou `${env:LHAMALOG_TOKEN}` (Collector), **inclusive** logo depois de gerar a chave. O valor real só aparece no aviso único da geração.
- **I6. Documentação pública.** O LhamaLog não tem site de documentação. → Recomendação: rota pública no Web, `/docs/opentelemetry`, **sem login**, com o guia completo:
  - o que é e como funciona;
  - endpoints HTTP e gRPC;
  - autenticação e chaves (gerar, rotacionar e revogar, com o prazo de 30 s);
  - SDK por variáveis de ambiente, Java (agente) e OpenTelemetry Collector;
  - sinais aceitos (logs e traces, sem métricas);
  - limites e respostas do receptor (401, 413, 415, 503 com `Retry-After`, `partial_success`);
  - "problemas comuns".

  O link da aba abre essa página. Os exemplos da página usam marcadores genéricos (`meu-servico` e `<sua-chave>`).

  *Alternativa:* um `.md` público no GitHub. Ele depende do repositório estar público e fica fora do produto.
- **I7. Produto selecionado.** → Recomendação: o `service.name` continua vindo do nome do produto (N3 da spec `011`). O Collector também ganha o atributo `service.name` no processor `resource`, para quem usa o Collector como agregador.
- **I8. Figma.** O cabeçalho do Figma é `x-api-key` e o Coletor aceita `Authorization: Bearer` (N1 da `011`). → Recomendação: manter o que funciona (`Authorization: Bearer`) e acrescentar à lista de pendências do Figma o seletor de protocolo, a aba Collector e o link.

### Session 2026-11-27

O Pedro autorizou seguir sem ele, pelo celular, adotando as recomendações e reservando as decisões sensíveis. I1 a I8 ficaram pela recomendação, e o edge case do produto arquivado ficou **reservado**. Tudo entra na revisão dele.

- Q: I1, onde ficam as instruções? → A: na própria aba, no cartão do Figma: seletor "Protocolo: HTTP | gRPC", as abas "Variáveis de ambiente", "Java (agente)" e "OpenTelemetry Collector", o bloco "Cabeçalho de autenticação" e o link "Ver documentação completa".
- Q: I2, endpoint gRPC? → A: `VITE_OTLP_GRPC_ENDPOINT`, com a mesma validação e os mesmos dois caminhos (Vite e `/config.js`) da `VITE_OTLP_ENDPOINT`, também nos dois `compose`. No local, `http://localhost:4327`.
- Q: I3, exemplo do Collector? → A: pela recomendação. Detalhe técnico: com o gRPC e um endpoint `http://`, o exporter `otlp/lhamalog` ganha `tls: insecure: true`, porque sem isso o Collector tenta TLS e não conecta no Coletor local. Com `https://` não ganha.
- Q: I4, gRPC no SDK? → A: pela recomendação (`OTEL_EXPORTER_OTLP_PROTOCOL=grpc` e `authorization=Bearer%20<sua-chave>`).
- Q: I5, token nunca completo? → A: pela recomendação. As funções de exemplo nem recebem a chave.
- Q: I6, documentação pública? → A: rota `/docs/opentelemetry`, fora do `ProtectedRoute`, sem chamada ao Core, com os tópicos da I6.
- Q: I7, produto selecionado no Collector? → A: `service.name` no processor `resource` com `action: insert`, que só preenche quando a aplicação não mandou o próprio nome. Com `upsert`, um Collector agregador trocaria o nome de todos os serviços pelo do produto.
- Q: I8, Figma? → A: pela recomendação (`Authorization: Bearer`; seletor, aba Collector e link vão para a lista de pendências do Figma).
- Q: produto arquivado (edge case) → A: **reservado para o Pedro.** Até ele decidir, fica como a C1 da `011` faz hoje: a aba aparece só para leitura, com os botões desabilitados (inclusive Copiar, o seletor e as abas do exemplo). Liberar só a leitura dos exemplos exige tirar o cartão do `fieldset` desabilitado. É uma mudança pequena, que fica para depois da resposta.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Endpoint e autenticação por protocolo (Priority: P1)

**Acceptance Scenarios**:

1. **Given** as duas variáveis configuradas, **When** o usuário escolhe HTTP, **Then** o campo mostra o endpoint HTTP, e o bloco "Cabeçalho de autenticação" mostra `Authorization: Bearer <sua-chave>`.
2. **When** escolhe gRPC, **Then** o campo mostra o endpoint gRPC, e o bloco mostra a metadata `authorization: Bearer <sua-chave>`.
3. **Given** a variável do protocolo escolhido sem valor, **Then** aparece "Endereço ainda não configurado.", e o Copiar fica desabilitado.

### User Story 2 - Exemplos com o produto, sem a chave (Priority: P1)

**Acceptance Scenarios**:

1. **Given** o produto "Gateway de Pagamentos", **Then** os três exemplos usam `gateway-de-pagamentos` como nome do serviço.
2. **Given** uma chave recém-gerada (aviso aberto), **Then** nenhum exemplo contém o valor dela; só `<sua-chave>` ou `${env:LHAMALOG_TOKEN}` (I5).
3. **Given** Traces desmarcado, **Then** os exemplos não enviam traces, e o Collector não tem o pipeline `traces`. Nenhum exemplo tem métricas.
4. **Given** o Copiar de um exemplo, **Then** o texto copiado é igual ao que está na tela.

### User Story 3 - Exemplo do OpenTelemetry Collector (Priority: P1)

**Acceptance Scenarios**:

1. **Given** a aba "OpenTelemetry Collector", **Then** aparece um `config.yaml` com receiver `otlp`, o exporter do protocolo escolhido, o cabeçalho com `${env:LHAMALOG_TOKEN}` e os pipelines (I3).
2. **Given** esse YAML, **When** é validado com `otelcol-contrib validate` (ou equivalente, no teste manual), **Then** é aceito.

### User Story 4 - Documentação pública (Priority: P1)

**Acceptance Scenarios**:

1. **Given** a aba, **When** o usuário clica em "Ver documentação completa", **Then** abre `/docs/opentelemetry` numa aba nova.
2. **Given** alguém sem login, **When** abre `/docs/opentelemetry`, **Then** a página aparece inteira, sem pedir login e sem chamar o Core.
3. **Given** a página, **Then** ela cobre todos os tópicos da I6, e os exemplos nunca contêm chave real.

### Edge Cases

- Produto sem nome (cadastro novo): `meu-servico`.
- Produto arquivado: as instruções continuam visíveis para leitura (o modo só leitura da LLT-123 não esconde o texto), e o Copiar dos exemplos continua funcionando. **Confirmar com o Pedro**, porque a C1 da spec `011` desabilitava a aba inteira no arquivado.
- Endpoint com barra final: removida, como já acontece.

## Requirements *(mandatory)*

- **FR-I01**: A aba MUST oferecer o protocolo HTTP e gRPC e mostrar o endpoint de cada um (I2).
- **FR-I02**: A aba MUST mostrar o cabeçalho de autenticação de cada protocolo, sempre com `<sua-chave>`.
- **FR-I03**: Os exemplos MUST ser "Variáveis de ambiente", "Java (agente)" e "OpenTelemetry Collector", todos do produto aberto e do protocolo escolhido.
- **FR-I04**: Nenhum exemplo, texto ou página MUST conter o valor de uma chave (I5).
- **FR-I05**: A aba MUST ter o link "Ver documentação completa" para `/docs/opentelemetry`.
- **FR-I06**: `/docs/opentelemetry` MUST ser pública (sem login e sem chamada ao Core) e MUST cobrir a I6.
- **FR-I07**: `VITE_OTLP_GRPC_ENDPOINT` MUST ter a mesma validação e os mesmos dois caminhos de configuração da `VITE_OTLP_ENDPOINT`.
- **FR-I08**: A geração dos exemplos MUST ficar em `.ts` puro (`otelSnippet.ts` e um novo `collectorSnippet.ts`), com teste.
- **FR-I09**: O que já está igual ao Figma MUST continuar igual.
- **FR-I10**: Nenhuma mudança no Core nem no Coletor.

## Success Criteria

- **SC-I01**: Seguindo só a aba (ou só a documentação pública), o Pedro manda um log real para o Coletor local pelo OpenTelemetry Collector, com HTTP e com gRPC, e o Coletor responde com sucesso (Etapa D).
- **SC-I02**: Os três critérios do card ficam marcados com evidência no relatório de fechamento.
