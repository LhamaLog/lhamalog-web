# Análise da especificação (speckit-analyze, T013)

Feita em 2026-11-20, depois das Fases 1 a 3, comparando `spec.md`, `plan.md` e `tasks.md` entre si e com o código. A constituição do web ainda é o template; os portões vêm de `docs/instrucoes-agentes.md`. Não há `.specify/extensions.yml`. A busca do T012 achou `llt_` só no valor falso `llt_teste` de `tests/ingestion-tokens.test.mjs` e `tests/otel-snippet.test.mjs`.

| ID | Categoria | Severidade | Onde | Achado | Situação |
|---|---|---|---|---|---|
| U1 | Cobertura | MÉDIO | SC-W01, SC-W02, T011 | Igual ao Figma e chave fora do armazenamento ainda não conferidos no navegador (faltam as chaves da Clerk) | pendente, T011 |
| U2 | Subespecificação | MÉDIO | US1.1 | Diferenças de propósito com o Figma: ajuda do nível mínimo sem prometer filtro; texto solto "Ative para relacionar logs a traces..." fora; comentário Java virou a aba "Java (agente)" | registrado na spec |
| U3 | Cobertura | MÉDIO | `ApiKeyField`, `ConnectionStatusPanel` | `.tsx` sem teste automático (`node --test` não carrega `.tsx`); a lógica está em `tokenContract.ts` e `otelSnippet.ts` | conferir no T011 |
| U4 | Subespecificação | BAIXO | US2.1 | O olho oculta ou mostra o valor só enquanto a chave está na memória | registrado na spec |
| U5 | Subespecificação | BAIXO | W1 | Para quem não é admin, o selo do painel mostra "—" | registrado na spec |
| U6 | Subespecificação | BAIXO | F4 | `VITE_OTLP_ENDPOINT` inválido impede a página de abrir, como o `VITE_API_URL` | registrado na spec e no README |
| C1 | Cobertura | BAIXO | US2.5 | No arquivado, o modo só leitura da LLT-123 desabilita a aba inteira | aceito, registrado na spec |
| I1 | Inconsistência | BAIXO | plan.md | `CopyButton.tsx` faltava na árvore | corrigido no plano |
| I2 | Inconsistência | BAIXO | F1 | Texto da nota dos campos locais | atualizado na spec |
| K1 | Constituição | — | constitution.md | Template | nada a fazer |

## Cobertura

| Requisito | Tasks | Situação |
|---|---|---|
| FR-W01 aba igual ao Figma, campos antigos fora | T007 | feito |
| FR-W02 Chave de API (F5) com funções puras | T003, T005, T009 | feito, 8 testes |
| FR-W03 valor só logo depois de gerar, nunca guardado | T004, T009, T012 | feito; testes do exemplo e da lista |
| FR-W04 `VITE_OTLP_ENDPOINT`, README, `.env.example`, `/config.js` | T005 | feito; script testado com `sh` |
| FR-W05 sinais, nível e status (F1, N2) | T007, T009 | feito |
| FR-W06 cabeçalho Bearer e nome do serviço (N1, N3) | T004, T005 | feito, 5 testes |
| SC-W01 igual ao Figma | T011 | pendente |
| SC-W02 chave fora do armazenamento | T011 | pendente (por leitura: nenhum caminho grava a chave) |
| SC-W03 `npm test` e build verdes | T006, T008, T010 | 110 de 110, build ok |

## Números

- Requisitos: 9 (6 FR e 3 SC). Tasks: 14. Cobertura: 100%.
- Ambiguidades: 0. Duplicações: 0. Críticos: 0.
- Achados: 10 (3 médios, 6 baixos, 1 informativo).

## Pendências geradas

- **Core:** status da integração e último log por produto; logs nas últimas 24 h; rota para "Testar conexão"; guardar sinais e nível mínimo.
- **Figma:** cabeçalho `Authorization: Bearer` no exemplo; Métricas não é recebido; ajuda do nível mínimo; texto solto sem controle; tela de revogação da chave (F5).
- **Coletor:** confirmar se `/v1/metrics` continua fora; se entrar, a caixa Métricas pode ser liberada.
