# Analysis: Ver instruções de integração com OpenTelemetry

Feita em 2026-11-27, antes da implementação (T003) e de novo no fechamento (T017). Compara `spec.md`, `plan.md` e `tasks.md` entre si e com o código da branch `LLT-180-instrucoes-opentelemetry`.

## Critérios do card LLT-180

| Critério | Onde | Evidência automática | Pendente |
|---|---|---|---|
| Endpoint HTTP **e** gRPC, cabeçalho de autenticação e exemplo do Collector | `OtelConnectionCard.tsx` (seletor, campo, bloco do cabeçalho, aba Collector), `config.ts`, `render-config.sh`, `collectorSnippet.ts` | testes de `public-config`, `otel-snippet` e `collector-snippet`; os 4 YAMLs (HTTP e gRPC, local e https) passaram no `otelcol-contrib validate` 0.163.1 | ingestão real pelo Collector (Parte D, linhas 20 a 22) |
| Exemplos com o produto selecionado, sem o token completo | `serviceName`, `envSnippet`, `javaSnippet`, `collectorSnippet` | testes "nunca contém a chave", mesmo recebendo uma por engano | conferir com o aviso aberto (Parte D, linha 19) |
| Link para a documentação pública | link da aba, `/docs/opentelemetry` | teste da rota pública e da página sem chamada ao Core | abrir sem login (Parte D, linhas 23 e 24) |

## Cobertura dos requisitos

| Requisito | Situação |
|---|---|
| FR-I01 protocolo e endpoint de cada um | ok |
| FR-I02 cabeçalho de cada protocolo, com `<sua-chave>` | ok |
| FR-I03 três exemplos, do produto e do protocolo | ok |
| FR-I04 nenhum valor de chave | ok (busca do T015 limpa) |
| FR-I05 link "Ver documentação completa" | ok (`target=_blank`, `rel=noopener noreferrer`) |
| FR-I06 página pública com a I6 | ok |
| FR-I07 `VITE_OTLP_GRPC_ENDPOINT` com a mesma validação e os dois caminhos | ok (Vite, `/config.js`, os dois `compose`) |
| FR-I08 exemplos em `.ts` puro, com teste | ok |
| FR-I09 o que é igual ao Figma continua igual | ok (conferido na página de teste local) |
| FR-I10 sem mudança no Core e no Coletor | ok |

## Achados

| Id | Severidade | Achado | Tratamento |
|---|---|---|---|
| B1 | alta | O `otelcol-contrib validate` recusou o YAML gRPC com `https://` sem porta ("missing port in address"). | O exemplo do Collector completa a porta padrão (443 ou 80) no gRPC; teste novo; os 4 YAMLs passaram. |
| B2 | média | O exporter gRPC do Collector usa TLS por padrão, e o Coletor local não tem TLS. | `tls: insecure: true` só com `http://` (research R3). |
| B3 | média | `upsert` no processor `resource` trocaria o nome de todos os serviços de um Collector agregador. | `action: insert` (clarify I7). |
| B4 | baixa | `.env.example` e os `compose` usam LF, e o resto do Web usa CRLF. | Mantido o fim de linha de cada arquivo. |
| B5 | info | Produto arquivado: a aba continua desabilitada (C1 da `011`). | Reservado para o Pedro (T010). |
| B6 | info | O YAML do Collector é longo no cartão. | Mantido sem limite de altura, para não esconder parte do arquivo que a pessoa copia. |

Nenhum achado crítico aberto.
