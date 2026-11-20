# Análise da especificação (speckit-analyze)

## Antes de implementar (2026-11-20)

Feita fora do repositório enquanto a branch não existia (`LLT-produto-telas-web\rascunho-llt123-clarify-analyze.md`) e aplicada na spec quando a branch foi criada.

| ID | Severidade | Achado | Decisão |
|---|---|---|---|
| A1 | MÉDIO | O Figma pagina de 6 em 6, e a spec não dizia o tamanho | 6 por página (FR-W02) |
| A2 | MÉDIO | Não há diálogo em `shared/ui`, e o Figma não mostra a confirmação | `window.confirm`, como a desativação na Equipe |
| A3 | MÉDIO | O rascunho antigo tem campos que saem; `owner` não é o `team` antigo | ignorar as chaves antigas, sem migrar `team`; chave continua `v1` |
| A4 | MÉDIO | Faltava decidir as opções de Tipo, Área e Responsável | clarify N1 a N3 |
| A5 | BAIXO | Seletor "Últimos 7 dias" e setas de variação sem API | rótulo sem efeito, valores "—", sem setas |
| A6 | BAIXO | O `node --test` não carrega `.tsx` | lógica em `productView.ts` e `productEdit.ts` |
| A7 | BAIXO | Arquivar o que já está arquivado responde 200 | tratar como sucesso |
| A8 | BAIXO | Renomear a spec da LLT-120 do Web (005 para 007) | fazer na branch dela, não nesta |

## Final (T018, 2026-11-20, depois das Fases 1 a 5)

| ID | Categoria | Severidade | Achado | Situação |
|---|---|---|---|---|
| U1 | Cobertura | MÉDIO | SC-W01 (igual ao Figma) não conferido no navegador; faltam as chaves da Clerk | pendente, T017 |
| U2 | Subespecificação | MÉDIO | Caso "salvo neste navegador" quando só o rascunho muda | registrado na US3.5 |
| U3 | Subespecificação | MÉDIO | Na edição, obrigatórios locais não bloqueiam | registrado na spec |
| U4 | Subespecificação | MÉDIO | Limites das tags (10 de até 30) | registrado na US2 |
| I1 | Inconsistência | BAIXO | Paginação "1–6" no `Pagination` compartilhado; Figma "1 - 6" | aceito, registrado |
| I2 | Inconsistência | BAIXO | Texto da nota da F1 | atualizado na spec |
| I3 | Inconsistência | BAIXO | Plano previa `TagsField.tsx` e props no `ProductsHeader` | plano atualizado |
| I4 | Inconsistência | BAIXO | Texto e destino do desarquivar | registrado na US4.5 |
| I5 | Inconsistência | BAIXO | A frase antiga do 409 já não existia | anotado na US3.6 |
| C1 | Limpeza | BAIXO | Funções sem uso no `productListModel` (`statusTone`, `productMetrics`, `occurrenceText`, `formatPercent`, `filterProducts` antigo) | mantidas; limpeza à parte |
| C2 | Cobertura | BAIXO | Coluna direita do cartão mais larga na `/componentes` | conferir no T017 |
| C3 | Subespecificação | BAIXO | Opções de Área só dos produtos ativos | aceito |
| K1 | Constituição | — | Constituição do web é o template | nada a fazer |

## Cobertura

| Requisito | Tasks | Situação |
|---|---|---|
| FR-W01 lista com `ProductsView`, sem `ProductTable` | T007, T008 | feito |
| FR-W02 F1 sem número inventado, 6 por página | T003, T005, T007 | feito |
| FR-W03 aba igual ao Figma, rascunho novo | T005, T010 | feito |
| FR-W04 só o que mudou, versão encadeada | T004, T012 | feito |
| FR-W05 arquivar, desarquivar, Arquivados | T007, T014 | feito |
| FR-W06 arquivado só para leitura | T015 | feito |
| SC-W01 igual ao Figma | T017 | pendente |
| SC-W02 gerais e contexto independentes | T004, T012 | coberto pelos testes do `saveEdits` |
| SC-W03 `npm test` e build verdes | T006 a T016 | 89 de 89, build ok |

## Números

- Requisitos: 9 (6 FR e 3 SC). Tasks: 19. Cobertura: 100%.
- Ambiguidades: 0. Duplicações: 0. Críticos: 0.
- Achados finais: 13 (4 médios, 9 baixos).
