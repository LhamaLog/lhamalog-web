# Research: Ciclo de vida da ocorrência na tela

**Feature**: `013-ciclo-de-vida-ocorrencias` | **Data**: 25/11/2026

## R1. Onde ficam as ações

- **Decisão**: no detalhe, num cartão "Ações" logo abaixo do cabeçalho: `Select` com os três status, botão "Alterar status" (desabilitado no status atual) e botão "Arquivar"/"Desarquivar". A lista não ganha ações por item.
- **Motivo**: o card fala em marcar a ocorrência; o detalhe já tem a revisão que o Core exige. Ações na lista exigiriam a revisão de cada item, que a lista não devolve.

## R2. Concorrência e erros

- **Decisão**: `occurrenceActions.ts` classifica a resposta: 200 → `{ ok, detail }`; 409 com `code: occurrence_changed` → `{ conflict }` (mensagem do Core + "Recarregar", que chama o `reload` do detalhe); 404 → estado "não encontrada ou sem acesso" da spec 008; 400 → mensagem do campo; demais → mensagem genérica. A recusa de segurança continua com o `useApi` (spec 006).
- **Motivo**: FR-006; reaproveita a classificação existente sem mexer em `useApi`.

## R3. Situação da lista

- **Decisão**: `situacao=arquivadas` no endereço (ausente = ativas); `occurrencesPath` manda `archived=true`. Seletor "Situação" ao lado do tamanho de página, fora do painel de filtros, e não conta como filtro ativo. "Limpar filtros" volta para ativas. Vazio: "Nenhuma ocorrência arquivada" (com ou sem outros filtros, mantendo "Limpar filtros" quando houver filtro).
- **Motivo**: o card fala em "filtro arquivadas"; deixar fora do painel mostra a situação o tempo todo e evita esconder a lista inteira num filtro esquecido.

## R4. Autor no histórico

- **Decisão**: `useOrganization().organization.getMemberships()` uma vez por detalhe, mapeando `publicUserData.userId` → nome (ou identificador); falha ou ausência → mostra o id. "Sistema" para `SYSTEM`.
- **Motivo**: FR-003; a tela de Equipe já lê membros assim; nenhuma chamada nova ao Core.

## R5. Permissão

- **Decisão**: `can(access.permissions, 'OCCURRENCES_MANAGE')`; enquanto o acesso carrega ou falha, as ações ficam escondidas. Rótulo "Alterar status e arquivar ocorrências"; o modo legado inclui a permissão para administrador e membro (a regra do Core é a visibilidade do produto).
- **Motivo**: clarify; padrão da LLT-120 no web.
