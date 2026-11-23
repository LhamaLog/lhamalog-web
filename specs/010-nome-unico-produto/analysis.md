# Análise da especificação (speckit-analyze, T009)

Feita em 2026-11-20, depois das Fases 1 e 2, comparando `spec.md`, `plan.md` e `tasks.md` entre si e com o código. A constituição do web ainda é o template; os portões vêm de `docs/instrucoes-agentes.md`. Não há `.specify/extensions.yml`.

| ID | Categoria | Severidade | Onde | Achado | Situação |
|---|---|---|---|---|---|
| U1 | Cobertura | MÉDIO | SC-W01, T008 | "Em 100% das recusas o erro aparece no campo" ainda não foi conferido no navegador (faltam as chaves da Clerk) | pendente, T008 |
| I1 | Inconsistência | BAIXO | plan.md × `productErrors.ts` | O plano chamava as funções de `NAME_IN_USE` e `nameFieldError`; o código usa `nameInUseMessage`, `nameInUseErrors` e `nameInUseNotice` | corrigido no plano |
| U2 | Subespecificação | BAIXO | FR-W03 | O código também tira o aviso do topo quando o nome muda | registrado na FR-W03 |
| U3 | Cobertura | BAIXO | US1.5 | Mudar só maiúsculas do próprio nome é regra do Core (200); o Web só envia o `PUT` normal | conferir no T008 |
| U4 | Cobertura | BAIXO | FR-W02, FR-W03 | A ligação no `.tsx` não tem teste automático (`node --test` não carrega `.tsx`); a lógica está em `productErrors.ts` | conferir no T008 |

## Cobertura

| Requisito | Tasks | Situação |
|---|---|---|
| FR-W01 `isNameInUse` pela mensagem | T003, T004 | feito, 3 testes |
| FR-W02 erro no campo, aba Informações, sem frase genérica e sem "Recarregar" | T006 | feito |
| FR-W03 editar o nome limpa o erro | T006 | feito |
| FR-W04 a recusa de nome não envia o contexto | T006 | feito, 1 teste |
| SC-W01 100% das recusas no campo | T008 | pendente |
| SC-W02 `npm test` e build verdes | T005, T007 | 93 de 93, build ok |

## Números

- Requisitos: 6. Tasks: 10. Cobertura: 100%.
- Ambiguidades: 0. Duplicações: 0. Críticos: 0.
- Achados: 5 (1 médio, 4 baixos).

Sem bloqueio para o commit. Pendência para o Core: mandar `code: "product_name_in_use"` nessa recusa.
