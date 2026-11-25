# Análise da especificação (speckit-analyze)

O relatório completo de 2026-11-19 não foi salvo em arquivo na época. Este registro foi montado em 2026-11-20 a partir das decisões gravadas no `plan.md` antigo, no `tasks.md` (T012) e no `quickstart.md`.

## Antes de implementar (2026-11-19)

| ID | Achado | Decisão |
|---|---|---|
| C1 | O `npm test` só carrega `.ts`; os componentes da Fase 2 não teriam teste | a lógica das listas vai para funções puras no `context.ts` (`addListItem`, `removeListItem`, `moveListItem`), testadas na Fase 1 |
| C2 | Faltava teste para o idioma gravado fora da lista (W1) | `languageOptions` testado com `es-419` |
| A1 | "Repetido" não estava definido | comparação depois do trim, sem diferenciar maiúsculas; fica o primeiro |
| A2 | Não estava claro qual aba abrir com erro em duas abas | `firstTabWithError`, na ordem `info`, `context`, `otel` |
| I1 | O 409 acrescentava texto fixo do Web | mostrar só a mensagem do Core |
| I2 | A aba só fica igual ao Figma com a moldura comum | Voltar, abas e rodapé entram nesta branch |
| U1 | O Figma tem ajuda cinza embaixo dos campos, e `shared/ui` não tinha | prop opcional `hint` em `Input`, `Textarea` e `Select` |
| U2 | O Figma não mostra contador no textarea | prop opcional `showCount` em `Textarea` |

## Depois de implementar (T012, 2026-11-19)

- Todos os requisitos, de FR-W01 a FR-W09, estão implementados e cobertos por tasks.
- Sobra o SC-W01 (conferência visual com o Figma), que depende do roteiro manual (T011).
- Correção aplicada: o erro local passa a sumir quando a pessoa edita o campo (antes ficava até o próximo salvar).

## Números

- Requisitos: 12 (9 FR e 3 SC). Tasks: 13. Cobertura: 100%.
- Críticos: 0. Pendente: SC-W01 (T011).
