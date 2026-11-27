# Analysis: Gerenciar chaves de ingestão no Web

Feita em 2026-11-27, antes da implementação (T004) e de novo depois da Fase 3 (T017). Compara `spec.md`, `plan.md` e `tasks.md` entre si e com o código da branch `LLT-179-gerenciar-chaves-ingestao`. A constituição do Web ainda é o template; os portões vêm de `docs/instrucoes-agentes.md`.

## Cobertura dos requisitos

| Requisito | Onde | Situação |
|---|---|---|
| FR-K01 topo igual ao Figma e F5 | `OtelConnectionCard.tsx`, `ApiKeyField.tsx` (só muda a origem da permissão) | ok |
| FR-K02 lista com situação e datas | `IngestionTokensSection.tsx`, `tokenBadge`, `tokenDetails` | ok, com testes |
| FR-K03 revogar com confirmação, também no arquivado | `revoke`, `tokenActions`, seção fora do `fieldset` | ok, com testes |
| FR-K04 rotacionar de 1 a 168 h, chave uma vez | `rotate`, `transitionHoursOf`, `rotateTokenBody` | ok, com testes |
| FR-K05 nova chave com nome | `create`, `tokenNameError`, `createTokenBody` | ok, com testes |
| FR-K06 histórico com autor pelo nome | `readAuditList`, `auditLine`, `useOrganizationPeople` | ok, com testes |
| FR-K07 permissão (K6) | `canManageTokens`, `ProductForm.tsx` | ok, com testes |
| FR-K08 recusas sem encerrar a sessão | `endsSession`, `messageOf` | ok |
| FR-K09 chave só em memória | estado da seção; o formulário nunca recebe o valor | ok (busca do T015 limpa) |
| FR-K10 lógica em `.ts` puro | `tokenManagement.ts`, `tokenContract.ts` | ok, 15 testes novos |
| FR-K11 sem mudança no Core e no Coletor | — | ok |
| SC-K01 revogada recusada em 30 s | — | pendente: Parte D (ingestão real) |

## Achados

| Id | Severidade | Achado | Tratamento |
|---|---|---|---|
| A1 | média | A K7 pede Revogar no produto arquivado, mas a aba fica dentro de um `fieldset` desabilitado. | Seção montada fora do `fieldset` (research R1). |
| A2 | baixa | O plano dizia "uma leitura da lista", mas o topo e a seção leem cada um a sua. | Plano corrigido; a leitura dupla mantém o `ApiKeyField` do Figma quase intacto (R3). |
| A3 | baixa | A seção fica dentro do `<form>` do produto: Enter num campo dela enviaria o produto. | Enter confirma a ação da seção e não envia o formulário (`onEnter`). |
| A4 | baixa | A prop do `ApiKeyField` continua com o nome `admin`, mas agora vem da permissão. | Comentado no código e na R2; renomear mexeria mais no componente do Figma. |
| A5 | baixa | Arquivar e desarquivar continuam pelo cargo da Clerk, e não por `PRODUCTS_ARCHIVE`. | Fora desta entrega (LLT-123). Registrado como pendência para o time. |
| A6 | info | Falha de rede chega como `ApiError` com status 0. | A seção mostra o texto da ação ("Não foi possível revogar. Tente de novo."), como pede o edge case. |
| A7 | info | O formulário de rotação e o aviso da chave nova não foram capturados na conferência visual local. | Usam os mesmos `Input`, `Button` e `CopyButton` do formulário de nova chave, que foi conferido. Ficam para o roteiro da Parte D. |

Nenhum achado crítico.

## Conferência visual local (27/11/2026)

Sem login da Clerk, a seção foi montada numa página de teste fora do repositório, com dados falsos, um substituto da Clerk e o Tailwind do projeto. O print saiu com o Chrome sem janela. Ficaram conferidos o topo da aba (igual ao Figma), a lista com os três selos, as datas, "Usuário removido", o histórico aberto e o formulário "Nova chave". A página de teste não faz parte do repositório.
