# Tasks: Lista, cadastro e edição de produto, arquivar (Web)

Regras para o agente: não rodar Git; não instalar dependência; uma fase por vez, parando para revisão; `npm test` e `npm run build` ao fim de cada fase. Abra os recortes `01-produtos-lista.png` e `02-produto-informacoes.png` e use como gabarito visual.

## Fase 0

- [x] T001 Ler esta spec, `contracts/core-api.md`, `C:\Users\Pedro\Desktop\LhamaLog\LLT-produto-telas-web\figma\FIGMA-x-WEB-x-CORE.md` e `src/app/App.tsx` (montagem da demonstração). Abrir as imagens. Rodar `npm test` e `npm run build` como linha de base e anotar no `quickstart.md` (criar).
- [x] T002 Rodar `speckit-clarify` para F1, F6, F7, W1 e W2 e registrar as respostas.

## Fase 1: funções puras

- [x] T003 [P] Criar `tests/product-view.test.mjs`, cobrindo:
  - `toCardProps` com produto do Core e rascunho vazio (estados neutros de F1) e com rascunho preenchido;
  - `summaryFrom`: o Total é real, os demais são neutros;
  - filtro por busca, área, ambiente e situação;
  - paginação ("Mostrando X - Y de N").
- [x] T004 [P] Criar `tests/product-edit.test.mjs`, cobrindo:
  - `changedParts`: gerais, contexto, os dois e nenhum; espaços nas pontas não contam;
  - `isArchived`;
  - `generalFieldErrors`;
  - `canArchive`;
  - caminhos com id codificado.
- [x] T005 Criar `productView.ts` e `productEdit.ts`. Atualizar `types.ts` (`archivedAt` e o rascunho local novo, F1).
- [x] T006 Rodar `npm test` e `npm run build`. Parar para revisão.

## Fase 2: lista igual ao Figma (US1)

- [x] T007 Reescrever `ProductsPage.tsx` para montar o `ProductsView` com dados do Core (`toCardProps`, `summaryFrom`):
  - "Filtros" com área, ambiente e "Situação: Ativos ou Arquivados" (`?archived=true`);
  - clique no cartão abre a edição;
  - estados de carregando, vazio e erro.

  Se faltar prop nos componentes do Vinicius, acrescentar como opcional.
- [x] T008 Remover a `ProductTable` se não sobrar uso. Conferir que a demonstração `/componentes` continua funcionando.
- [x] T009 Rodar `npm test` e `npm run build`. Parar para revisão.

## Fase 3: aba Informações igual ao Figma (US2)

- [x] T010 No `ProductForm.tsx`, aba "Informações do produto":
  - uma seção "Informações básicas" com os campos, a ordem e as ajudas do Figma;
  - Tags com "+ Adicionar";
  - os campos fora do Figma saem;
  - nota F1 nos campos sem Core;
  - "← Voltar para produtos" no topo direito;
  - rodapé com a nota, Cancelar e Salvar;
  - lateral com os textos do Figma.
- [x] T011 Rodar `npm test` e `npm run build`. Parar para revisão.

## Fase 4: editar dados gerais (US3)

- [x] T012 No envio:
  - `changedParts`, com `PUT /api/products/{id}` e/ou `PUT .../context` e `version` encadeada;
  - salvamento parcial (W1);
  - título "Editar produto" e botão "Salvar alterações" (F7);
  - 409 com a mensagem do Core e "Recarregar produto";
  - a frase extra antiga sai.
- [x] T013 Rodar `npm test` e `npm run build`. Parar para revisão.

## Fase 5: arquivar e só leitura (US4)

- [x] T014 Diálogo de confirmação com `window.confirm` (analyze A2: não há diálogo em `src/shared/ui`), "Arquivar" e "Desarquivar" no rodapé para admin (W2, F6) e selo "Arquivado em" no cartão.
- [x] T015 Produto arquivado: aviso, `fieldset` desabilitado, Salvar oculto e "Desarquivar" para admin.
- [x] T016 Rodar `npm test` e `npm run build`. Parar para revisão.

## Fase 6: fechamento

- [ ] T017 Roteiro manual no `quickstart.md`, contra o Core local:
  - lista e aba lado a lado com o Figma (anotar as diferenças restantes);
  - cadastrar;
  - editar o nome;
  - editar o nome e o contexto juntos;
  - 409 de versão (duas abas);
  - arquivar como admin;
  - filtro Arquivados;
  - abrir o arquivado;
  - desarquivar;
  - entrar como membro;
  - conferir a `/componentes`.
- [x] T018 Rodar `speckit-analyze`.
- [x] T019 Entregar ao Pedro a mensagem de commit `LLT-123: alinha lista e cadastro de produto ao figma e permite editar e arquivar` e a lista de pendências do Core gerada pela F1.
