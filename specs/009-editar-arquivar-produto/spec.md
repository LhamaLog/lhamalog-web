# Feature Specification: Lista, cadastro e edição de produto, arquivar (Web)

**Feature Branch**: `LLT-123-editar-arquivar-produto` (no `lhamalog-web`; sai da `LLT-178-contexto-produto`, veja o LEIA-ME)

**Created**: 2026-11-19

**Status**: Draft (pré-preenchida; passa por clarify e analyze no Claude Code)

**Input**: lado Web da LLT-123. Duas fontes:

- **Telas:** o Figma final, recortes `C:\Users\Pedro\Desktop\LhamaLog\LLT-produto-telas-web\figma\01-produtos-lista.png` e `C:\Users\Pedro\Desktop\LhamaLog\LLT-produto-telas-web\figma\02-produto-informacoes.png`. A comparação está em `C:\Users\Pedro\Desktop\LhamaLog\LLT-produto-telas-web\figma\FIGMA-x-WEB-x-CORE.md`, seções 1 e 2.
- **API:** o Core mergeado (PR #3). O contrato está em `contracts/core-api.md`.

## Situação atual do Web

- **Lista:** a página real `/produtos` usa uma **tabela** com outros indicadores, e isso não bate com o Figma. O Vinicius já fez os componentes da lista do Figma (LLT-237: `ProductsHeader`, `ProductList`, `ProductCard`, `ProductsSummary`, `ProductsByEnvironment`, `LogsByProduct`, `ProductIndicators`, `ProductsView`), mas eles só são usados na demonstração `/componentes`.
- **Aba "Informações do produto":** tem três seções e campos que não estão no Figma.
- **Edição:** só salva o contexto. Não existe arquivar.

## Clarifications

- **F1** [NEEDS CLARIFICATION]: O que fazer com os dados do Figma que o Core não tem? Tipo, ambiente, responsável, e-mail da equipe, tags, status de integração, último log e os indicadores.
  - **Recomendação:** a tela fica igual ao Figma. Os campos de cadastro sem Core vão para o rascunho local (`sessionStorage`), como já é feito hoje, com a nota "Ainda não é salvo no servidor".
  - Os indicadores sem API mostram estado neutro, sem número inventado. Exemplos: status "Sem integração" no cartão, último log "Nenhum log recebido", painéis com "—".
- **F6** [NEEDS CLARIFICATION]: Arquivar e ver arquivados não estão no Figma.
  - **Recomendação:** "Arquivados" como opção dentro de "Filtros" (Situação: Ativos ou Arquivados).
  - "Arquivar" e "Desarquivar" como botão secundário no rodapé da tela de edição, só para admin.
- **F7** [NEEDS CLARIFICATION]: Como fica a tela de edição, já que o Figma só mostra o cadastro?
  - **Recomendação:** a mesma tela, com o título "Editar produto" e o botão "Salvar alterações".
- **W1** [NEEDS CLARIFICATION]: Quando a pessoa altera os dados gerais **e** o contexto, o salvar faz duas chamadas (gerais e depois contexto). E se a segunda falhar?
  - **Recomendação:** avisar "Os dados gerais foram salvos, mas o contexto não. Confira e salve de novo." e manter o formulário aberto com a `version` nova.
- **W2** [NEEDS CLARIFICATION]: Quem vê arquivar e desarquivar?
  - **Recomendação:** quem tem o cargo admin na Clerk (`orgRole`), que é o mesmo critério do Core. Quando a LLT-120 do Web entrar, troca por `can('PRODUCTS_ARCHIVE')`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Lista de produtos igual ao Figma (Priority: P1)

Como pessoa da empresa, quero ver os produtos na tela do Figma, com os dados reais do Core.

**Independent Test**: Compare `/produtos` com `01-produtos-lista.png`: cabeçalho, busca, cartões, paginação e painéis laterais no mesmo lugar e com os mesmos textos.

**Acceptance Scenarios**:

1. **Given** a página `/produtos`, **When** abre, **Then** usa a composição do `ProductsView` do Vinicius, com:
   - o título "Produtos" e o subtítulo do Figma;
   - os botões "Filtros" e "+ Cadastrar produto";
   - a busca "Buscar produtos...";
   - a lista de `ProductCard`;
   - a paginação "Mostrando X - Y de N produtos";
   - os painéis "Resumo dos produtos", "Produtos por ambiente", "Logs por produto", "Integrações ativas" e "Logs recebidos hoje".
2. **Given** um produto do Core, **When** o cartão aparece, **Then** mostra:
   - nome e descrição (Core);
   - as tags de tipo e área (área = `category` do Core; tipo do rascunho local, F1);
   - status, último log e ambiente conforme F1.
3. **Given** o painel "Resumo dos produtos", **When** carrega, **Then** "Total" é o número real de produtos ativos. Os demais seguem F1.
4. **Given** a busca, **When** a pessoa digita, **Then** filtra por nome e descrição.
5. **Given** "Filtros", **When** abre, **Then** mostra os filtros existentes (área e ambiente) e "Situação: Ativos ou Arquivados" (F6). O contador do botão mostra quantos filtros estão ativos.
6. **Given** clicar num cartão, **When** acontece, **Then** abre a tela de edição do produto.
7. **Given** nenhum produto, **When** carrega, **Then** aparece o estado vazio que já existe ("Nenhum produto disponível...").

---

### User Story 2 - Aba "Informações do produto" igual ao Figma (Priority: P1)

Como pessoa da empresa, quero cadastrar e editar os dados do produto na tela do Figma.

**Independent Test**: Compare a aba com `02-produto-informacoes.png`.

**Acceptance Scenarios**:

1. **Given** a aba, **When** abre, **Then** mostra uma única seção "Informações básicas", com:
   - Nome do produto \*;
   - Descrição;
   - Tipo de produto \*;
   - Ambiente \*;
   - Área \*;
   - Responsável pelo produto \*;
   - E-mail da equipe;
   - Versão atual;
   - Tags, com "+ Adicionar".

   Cada campo traz o texto de ajuda do Figma. A lateral é "Sobre o cadastro" + "Boas práticas", e o rodapé traz a nota, Cancelar e Salvar.
2. **Given** os campos que não estão no Figma (Criticidade, Projeto, Aplicação principal, Nível de log padrão, Produto ativo), **When** a aba abre, **Then** eles não aparecem.
3. **Given** o topo da tela, **When** abre, **Then** aparece "← Voltar para produtos" à direita, como no Figma.
4. **Given** os campos sem Core (F1), **When** a pessoa salva, **Then** eles vão para o rascunho local e o resto vai para o Core.

---

### User Story 3 - Editar os dados gerais (Priority: P1)

**Acceptance Scenarios**:

1. **Given** um produto ativo, **When** abre a edição (F7), **Then** nome, descrição, área e versão estão habilitados.
2. **Given** só os dados gerais mudaram, **When** salva, **Then** o Web envia só `PUT /api/products/{id}` com `{name, description, category, productVersion, version}`.
3. **Given** só o contexto mudou, **When** salva, **Then** o Web envia só `PUT .../context` (spec 008).
4. **Given** os dois mudaram, **When** salva, **Then** o Web envia os gerais, depois o contexto, com a `version` encadeada (W1).
5. **Given** nada mudou no Core, **When** salva, **Then** o Web não chama o Core. Só o rascunho local é atualizado, e aparece "Nenhuma alteração para salvar no servidor." quando for o caso.
6. **Given** o Core responde 409 de versão, **When** chega, **Then** aparece a mensagem do Core e o botão "Recarregar produto". A frase extra antiga ("Volte à lista e abra o produto novamente.") sai.

---

### User Story 4 - Arquivar, desarquivar e ver arquivados (Priority: P1)

**Acceptance Scenarios**:

1. **Given** um administrador (W2) na edição de um produto ativo, **When** clica em "Arquivar" no rodapé (F6), **Then** aparece a confirmação: "Arquivar X? O produto sai da lista de ativos e não pode ser editado até ser desarquivado. Os dados e o histórico continuam guardados."
2. **Given** a confirmação, **When** confirma, **Then** o Web envia `POST /api/products/{id}/archive` com `{version}`, volta para a lista e mostra "Produto X arquivado.".
3. **Given** "Filtros > Situação: Arquivados", **When** aplica, **Then** a lista usa `GET /api/products?archived=true`, e os cartões mostram o selo "Arquivado em dd/mm/aaaa".
4. **Given** um produto arquivado aberto, **When** a tela abre, **Then** aparece o aviso "Este produto está arquivado. Desarquive para editar.", os campos ficam desabilitados, o Salvar some e, para admin, aparece "Desarquivar" no rodapé.
5. **Given** "Desarquivar", **When** confirma, **Then** o Web envia `POST .../unarchive` com `{version}` e mostra "Produto X desarquivado.".
6. **Given** quem não é admin, **When** a tela abre, **Then** os botões de arquivo não aparecem. Um 403 com código mostra a mensagem do Core e mantém a sessão.

### Edge Cases

- **Mensagens do Core no 409:** o Web mostra a mensagem do Core (versão, arquivado; o nome em uso é da spec 010).
- **Arquivar de novo:** arquivar algo já arquivado responde 200 sem mudança. O Web trata como sucesso.
- **Ambiente no cartão:** ambiente, tipo e responsável vêm do rascunho local daquele navegador. Em outro navegador, esses campos aparecem vazios (F1). A nota da tela avisa isso.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-W01**: A página `/produtos` MUST usar os componentes da demonstração do Vinicius (`ProductsView` e afins), ligados aos dados do Core, e MUST deixar de usar a `ProductTable`. A `ProductTable` pode ser apagada se não sobrar uso.
- **FR-W02**: Os dados sem Core MUST seguir F1, sem número inventado. Uma função pura MUST montar as props dos componentes a partir do produto do Core e do rascunho local.
- **FR-W03**: A aba "Informações do produto" MUST seguir `02-produto-informacoes.png`. Os campos fora do Figma MUST sair, e o tipo do rascunho local MUST ganhar `owner`, `teamEmail` e `tags`.
- **FR-W04**: A edição MUST enviar só as partes alteradas (`changedParts`), com `version` encadeada (W1).
- **FR-W05**: Arquivar, desarquivar e a situação Arquivados MUST seguir F6 e W2.
- **FR-W06**: Produto arquivado MUST abrir só para leitura.

## Success Criteria *(mandatory)*

- **SC-W01**: A lista e a aba ficam visualmente iguais aos recortes do Figma (conferência lado a lado).
- **SC-W02**: Editar os dados gerais não altera o contexto, e o contrário também vale.
- **SC-W03**: `npm test` e `npm run build` ficam verdes.

## Assumptions

- Esta branch sai da `LLT-178-contexto-produto`. O merge segue a ordem 178, depois 123.
- Os componentes do Vinicius são usados e, se preciso, recebem props novas na branch do Pedro. A branch do Vinicius não é tocada.
