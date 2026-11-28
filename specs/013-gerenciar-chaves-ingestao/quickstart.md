# Quickstart: LLT-179 gerenciar chaves (Web)

## Exceção às regras do Web (27/11/2026)

O `docs/instrucoes-agentes.md` proíbe o agente de rodar Git e de instalar dependências. Na sessão de 27/11/2026, o Pedro autorizou, só nessa sessão: `npm ci` no `lhamalog-web`, e Git pelo agente para criar, commitar e publicar **apenas** as branches `LLT-179-gerenciar-chaves-ingestao`, `LLT-180-instrucoes-opentelemetry` e `LLT-179-coletor-le-produto-do-core`. Sem abrir PR e sem mexer na `Development`, na `main` ou em branch de outra pessoa. A branch foi criada com `git switch -c LLT-179-gerenciar-chaves-ingestao origin/Development` (`7a0b243`), sem upstream para a `Development`. O `npm ci` não foi preciso: o `package-lock.json` é o mesmo, e o `node_modules` já existia.

## Linha de base e resultados

| Momento | `npm test` | `npm run build` |
|---|---|---|
| Início (27/11/2026), `origin/Development` `7a0b243` | 170 de 170 | ok, com o aviso de chunk acima de 500 kB, que já existia |
| Fase 1 (T005, T006) | 185 de 185 (15 novos em `ingestion-token-management.test.mjs`; os 15 falharam antes do código) | ok |
| Fase 2 (T007 a T010) | 185 de 185 | ok |
| Fase 3 (T011 a T014) | 185 de 185 | ok |
| Fase 4 (T015 a T017), final | 185 de 185 | ok |

Busca do T015: `llt_` só aparece no valor falso `llt_teste` dos testes; `sk_` só nas checagens que já recusavam chave secreta (`config.ts` e o teste dela); nenhum `eyJ`. A seção não usa `console`, `localStorage` nem `sessionStorage`.

## Como rodar

```
npm test
npm run build
```

O roteiro manual precisa do Core local de pé, das chaves da Clerk e, para a ingestão real, do `lhamalog-collector`. Ele é a Parte D do pacote da LLT-124 (`TESTE-MANUAL.md`, linhas 1 a 15).

## Roteiro manual

Parte D da LLT-124, em 27/11/2026, feita pelo Claude no Chrome com a conta do Pedro (admin da "Empresa A LLT-119"). Ambiente: Web na `LLT-180-instrucoes-opentelemetry` (contém a 179), Core na `LLT-179-core-grava-products` (D1 = B), Coletor na `main` `627af74`, os dois no `mongo-teste`/`lhamalog_otel_local`. O banco era novo: o plano Free foi contratado no simulador local do Asaas antes da linha 1. A chave nunca foi mostrada nem gravada: o Claude usou o botão Copiar e leu a área de transferência direto no comando de envio, limpando-a no fim. O `window.confirm` foi trocado na página por uma versão que registra o texto e responde OK, porque o diálogo trava a extensão.

| # | Resultado |
|---|---|
| 1 | **OK.** Produto criado (gravado em `products`, com `productId` = `_id`); topo da aba igual ao Figma; "Nenhuma chave gerada ainda." |
| 2 | **OK.** `cluster-producao` criada (POST 201); a chave aparece uma vez, com Copiar; ao fechar, some da tela e fica "Ativa". |
| 3 | **OK.** Vazio: "Informe o nome da chave."; 101 caracteres: "O nome da chave pode ter até 100 caracteres."; nenhuma chamada a `/tokens`. |
| 4 | **OK.** Confirmação: "Rotacionar a chave "cluster-producao"? A chave atual continua funcionando por 2 horas e depois para. ..."; POST `/rotate` 201; a nova aparece uma vez; a antiga fica "Em transição", "Expira em 27/11/2026 21:44". |
| 5 | **OK.** 0 e 169: "Informe um número inteiro de horas entre 1 e 168", sem chamada a `/rotate` e sem confirmação. |
| 6 | **OK.** Histórico: Rotacionada (com "Transição até 21:44"), Criada e Criada, com "Pedro Alvaro". A Rotacionada e a Criada nova são do mesmo minuto. |
| 7 | **risco aceito (27/11):** não feita à mão; o Pedro não teve tempo. Coberta pelo teste automático `who manages keys: only with INGESTION_TOKENS_MANAGE and a known access (K6)` e pelo 403 do Core na lista (spec `010`). |
| 8 | **OK.** Arquivado: "Nova chave", "Rotacionar" e "Gerar nova" desabilitados, com "Produto arquivado não pode receber tokens novos. Revogar continua disponível."; Revogar habilitado. Desarquivado no fim. |
| 9 | **OK.** `Bearer llt_errada`: `401` (sem cabeçalho também `401`; `/v1/metrics` `404`). |
| 10 | **OK.** Chave antiga em transição: `200`. |
| 11 | **OK.** Chave nova: `200`. |
| 12 | **OK.** OpenObserve, stream `logs`: os dois logs com `productid` = id do produto, `tenantid` da empresa e `servicename` `gateway-de-pagamentos`. |
| 13 | **OK.** Confirmação com o texto da K8; revogada às 19:45; envio logo depois: `401`; depois de 32 s: `401` (o cache de 30 s da linha 11 já tinha vencido). |
| 14 | **OK.** Histórico com "Revogada", "Pedro Alvaro", 19:45; a chave aparece "Revogada em ... por Pedro Alvaro". |
| 15 | **risco aceito:** a transição de 2 h não foi esperada; coberta pelos testes do Core e do Coletor (`expiresAt` no passado é recusado). |

Correção do `TESTE-MANUAL.md`: no Windows PowerShell 5.1, `-d $body` tira as aspas do JSON e o Coletor responde `400`. Gravar o corpo num arquivo e usar `--data-binary "@arquivo"`.
