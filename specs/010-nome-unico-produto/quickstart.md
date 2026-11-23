# Quickstart: LLT-177 (Web)

## Linha de base (T001)

| Momento | `npm test` | `npm run build` |
|---|---|---|
| Início da 177 (20/11/2026), saída da `LLT-123-editar-arquivar-produto` | 89 de 89 | ok, com o aviso de chunk acima de 500 kB, que já existia |
| Fim da Fase 1 da 177 (20/11/2026) | 92 de 92 (3 novos em `product-errors.test.mjs`) | ok |
| Fim da Fase 2 da 177 (20/11/2026) | 93 de 93 (1 novo: a recusa de nome não envia o contexto; passou de primeira, porque a ordem do `saveEdits` já garantia) | ok |

## Como rodar

```
npm test
npm run build
```

O roteiro manual (T008) precisa do Core local de pé e das chaves da Clerk, como o T017 da 123.

## Roteiro manual (T008)

A preencher na Fase 3.
