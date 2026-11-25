# Quickstart: LLT-123 (Web)

## Linha de base (T001)

| Momento | `npm test` | `npm run build` |
|---|---|---|
| Fim da LLT-178 (19/11/2026) | 57 de 57 | ok |
| Fim da Fase 1 da 123 (20/11/2026) | 74 de 74 (57 + 17 novos) | ok, com o aviso de chunk acima de 500 kB, que já existia |
| Fim da Fase 2 da 123 (20/11/2026) | 77 de 77 (3 novos: caminho da lista e painéis laterais) | ok |
| Fim da Fase 3 da 123 (20/11/2026) | 81 de 81 (4 novos: tipos, responsável, tags e validação; o teste antigo do `productFieldErrors` virou o teste das chaves antigas descartadas) | ok |
| Fim da Fase 4 da 123 (20/11/2026) | 87 de 87 (6 novos do `saveEdits`: só gerais, só contexto, os dois com versão encadeada, nada mudou, salvamento parcial e recusas) | ok |
| Fim da Fase 5 da 123 (20/11/2026) | 89 de 89 (2 novos: arquivar e desarquivar com a versão, textos da confirmação) | ok |

A Fase 1 foi escrita em 20/11 numa cópia fora do repositório, com os testes primeiro (os 17 falharam antes de os módulos existirem). Depois foi copiada para esta branch, conferindo antes que `types.ts` e `draft.ts` não tinham mudado desde a 178.

## Como rodar

```
npm test
npm run build
npm run dev
```

O roteiro manual (T017) precisa do Core local de pé e das chaves da Clerk em `.env.local` (`VITE_CLERK_PUBLISHABLE_KEY`) e em `lhamalog-core\.env` (`CLERK_ISSUER`, `DEV_TENANT_CLERK_ORG_ID`).

## Roteiro manual (T017)

A preencher na Fase 6.
