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

A preencher na Parte D.
