# Quickstart: LLT-179 (Web)

## Linha de base (T001)

| Momento | `npm test` | `npm run build` |
|---|---|---|
| Início da 179 (20/11/2026), saída da `LLT-177-nome-unico-produto` | 93 de 93 | ok, com o aviso de chunk acima de 500 kB, que já existia |
| Fim da Fase 1 da 179 (20/11/2026) | 105 de 105 (12 novos: 5 de tokens, 5 do exemplo e 2 da configuração; todos falharam antes do código) | ok |
| Fim da Fase 2 da 179 (20/11/2026) | 107 de 107 (2 novos: rascunho com Traces e nível mínimo, e sinais ativos; o teste do rascunho da 123 passou a conferir `otelTraces` no lugar do `otelService`, que saiu) | ok |
| Fim da Fase 3 da 179 (20/11/2026) | 110 de 110 (3 novos: criar ou rotacionar, texto da chave anterior, lista atualizada sem o valor da chave) | ok |

## Como rodar

```
npm test
npm run build
```

`VITE_OTLP_ENDPOINT` é opcional no `.env` (por exemplo `https://otlp.lhamalog.com`). Sem ele, a aba mostra "Endereço ainda não configurado.". Mudou o valor: pare e inicie de novo o `npm run dev`; no Docker, `docker compose up -d`.

O roteiro manual (T011) precisa do Core local de pé e das chaves da Clerk, como os roteiros da 178, da 123 e da 177. Para conferir a chave contra o Coletor, o `lhamalog-collector` também precisa estar de pé.

## Roteiro manual (T011)

A preencher na Fase 4.
