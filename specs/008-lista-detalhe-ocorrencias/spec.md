# Feature Specification: Lista e detalhe de ocorrências

**Feature Branch**: `LLT-135-lista-e-detalhe`

**Created**: 19/11/2026

**Status**: Draft

**Input**: User description: "Feature LLT-135 (Lista e detalhe, épico LLT-104 Ocorrências (Web)): LLT-203 listar ocorrências com paginação, ordenada pela última ocorrência, mostrando tipo, título, produto, contagem, status e última vez, com estado vazio e erro de carregamento tratados; LLT-204 filtrar por data, tipo, status, produto e texto, com filtros combinados mantidos na paginação, visão multiproduto respeitando os produtos permitidos e limpar filtros voltando à lista padrão; LLT-205 ver o detalhe com exemplos de log mascarados, atributos OTel, contagem, primeira e última vez e histórico de status, e 404 para ocorrência de outro tenant ou produto. Os dados vêm do Core (spec 012-consultar-ocorrencias do lhamalog-core). Status da ADR_082 (ABERTA, EM_ANALISE, FECHADA), com recorrente como atributo. A tela segue o protótipo (Telas Oficiais/Ocorrencia) e reaproveita os componentes de ocorrências da LLT-237."

## Clarifications

### Session 2026-11-19

- Q: De onde a tela tira as ocorrências? → A: Do Core, pelas consultas da spec 012 do lhamalog-core. O web não fala com o Módulo Ocorrência nem com o banco.
- Q: Quais status a tela mostra? → A: Os da ADR_082, com rótulos em português: Aberta (ABERTA), Em análise (EM_ANALISE) e Fechada (FECHADA). "Recorrente" aparece como marca, não como status.
- Q: Quais repositórios e qual chave do Jira? → A: Core e web na branch `LLT-135-lista-e-detalhe`; esta é a spec do web.
- Q: O filtro de período compara qual data? → A: Entram as ocorrências que aconteceram no período (regra do Core, spec 012).
- Q: Ocorrências de produto arquivado aparecem? → A: Sim, na lista padrão e no filtro de produto, para quem tem acesso.
- Q: Períodos prontos ou datas livres? → A: Só períodos prontos nesta entrega: Todo o período, Últimas 24 horas, Últimos 7 dias e Últimos 30 dias.
- Q: Tamanhos de página? → A: 10, 20 e 50, com padrão 20.

### Session 2026-11-22 (contrato do Finder aprovado)

- Q: O que muda com o contrato Finder → Módulo aprovado em 20/11? → A: O detalhe mostra título e resumo (o resumo pode faltar); os exemplos de log não têm data; os atributos são host, serviço, trace, correlation id, módulo, número da linha e campos extraídos; aparece a indicação de dados sensíveis mascarados quando conhecida. Sem título gravado, o Core já devolve a mensagem da assinatura como título (spec 012 do core).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver a lista de ocorrências (Priority: P1)

Pelo item "Ocorrências" do menu, o usuário abre a tela de ocorrências da empresa ativa. Ele vê as ocorrências dos produtos a que tem acesso, da que aconteceu por último para a mais antiga, em páginas. Cada item mostra tipo, título, produto, contagem, status, a marca de recorrente e quando aconteceu por último. Abaixo da lista aparecem "Mostrando X a Y de Z ocorrências" e a paginação.

**Why this priority**: é a entrada do módulo de ocorrências (LLT-203). Filtro e detalhe partem daqui.

**Independent Test**: com o Core local e a carga de exemplo, abrir `/ocorrencias`, conferir a ordem, o total, trocar de página e trocar o tamanho da página.

**Acceptance Scenarios**:

1. **Given** uma sessão com empresa ativa e ocorrências no Core, **When** o usuário escolhe "Ocorrências" no menu, **Then** a tela `/ocorrencias` abre com a primeira página, o item do menu fica marcado e o caminho de navegação mostra "Ocorrências".
2. **Given** a lista carregada, **When** o usuário olha um item, **Then** vê o tipo (Erro, Alerta ou Informação, com a cor do tipo), o título, o produto, a contagem, o status, "Recorrente" quando for o caso, e a data e hora da última vez no fuso e idioma do perfil.
3. **Given** mais de uma página, **When** o usuário vai para a página seguinte, **Then** a lista mostra os itens seguintes e o texto "Mostrando X a Y de Z" acompanha.
4. **Given** a lista, **When** o usuário muda o tamanho da página para 10, 20 ou 50, **Then** a lista volta para a página 1 com o novo tamanho.
5. **Given** que não há ocorrências para o usuário, **When** a tela abre, **Then** aparece o estado vazio "Nenhuma ocorrência por aqui ainda", sem paginação.
6. **Given** que o Core não responde ou responde com erro, **When** a tela abre, **Then** aparece o estado de erro com a mensagem e o botão "Tentar de novo", que repete a consulta.
7. **Given** a consulta em andamento, **When** a tela espera a resposta, **Then** aparece o estado de carregamento, sem itens antigos misturados.

---

### User Story 2 - Filtrar e buscar ocorrências (Priority: P1)

O usuário busca por texto e abre o painel "Filtros de ocorrências" para escolher tipo, produto, período e status. Aplica os filtros, que se combinam e continuam valendo ao trocar de página. O botão de filtros mostra quantos filtros estão ativos. "Limpar filtros" volta à lista padrão. Os filtros ficam no endereço da página, então sobrevivem a recarregar, voltar do detalhe e compartilhar o link.

**Why this priority**: critério de aceite da LLT-204 e dos casos USID_002, USID_005 e USID_037.

**Independent Test**: aplicar tipo Erro, status Aberta e um produto, conferir os itens e o total, ir para a página 2, recarregar a página e conferir que os filtros continuam; depois limpar.

**Acceptance Scenarios**:

1. **Given** a lista, **When** o usuário digita na busca, **Then** depois de uma pausa curta a lista é refeita com o texto, na página 1, sem uma consulta por tecla.
2. **Given** o painel de filtros aberto, **When** o usuário escolhe um ou mais tipos, um ou mais produtos, um período e um ou mais status e aplica, **Then** a lista mostra só as ocorrências que atendem a todos, na página 1, e o botão de filtros mostra a quantidade de filtros ativos.
3. **Given** filtros aplicados, **When** o usuário troca de página, **Then** os filtros continuam valendo nos itens e no total.
4. **Given** o painel de produtos, **When** o usuário o abre, **Then** só aparecem os produtos que ele pode ver; sem nenhum escolhido, a lista cobre todos eles ("Todos os produtos").
5. **Given** filtros que nada satisfaz, **When** a lista volta vazia, **Then** aparece "Nenhuma ocorrência encontrada para os filtros aplicados", com o atalho "Limpar filtros", e a paginação some.
6. **Given** filtros e busca ativos, **When** o usuário clica em "Limpar filtros", **Then** busca e filtros são apagados e a lista padrão volta na página 1.
7. **Given** filtros aplicados, **When** o usuário recarrega a página ou volta do detalhe, **Then** a lista reabre com os mesmos filtros, busca e página.
8. **Given** o painel aberto com mudanças, **When** o usuário fecha sem aplicar, **Then** a lista continua com os filtros anteriores.
9. **Given** um endereço com filtro inválido (tipo ou status desconhecido, página que não é número), **When** a tela abre, **Then** o valor inválido é ignorado e a lista abre sem ele.

---

### User Story 3 - Ver o detalhe da ocorrência (Priority: P1)

Ao abrir uma ocorrência, o usuário vê a tela de detalhe: tipo, título, identificador com botão de copiar, produto, primeira e última vez. Na seção "Dados da ocorrência" estão status, recorrente, contagem, a indicação de dados sensíveis mascarados e os atributos técnicos (serviço, host, trace e os demais). Na seção "Mensagem e contexto" estão o resumo e os exemplos de log, já mascarados, com botão de copiar. O histórico de status lista as mudanças. "Voltar para ocorrências" retorna à lista com os filtros de antes.

**Why this priority**: critério de aceite da LLT-205 e do USID_002.

**Independent Test**: abrir uma ocorrência da carga de exemplo, conferir os campos, copiar o identificador, voltar e encontrar os filtros; abrir um identificador de outra empresa e ver a mensagem de não encontrada.

**Acceptance Scenarios**:

1. **Given** a lista, **When** o usuário abre um item, **Then** a tela `/ocorrencias/{id}` mostra cabeçalho, dados da ocorrência, mensagem e contexto e histórico de status.
2. **Given** o detalhe, **When** o usuário clica em copiar no identificador ou nos exemplos de log, **Then** o texto vai para a área de transferência e aparece a confirmação "Copiado".
3. **Given** uma ocorrência sem resumo, exemplos ou histórico, **When** o detalhe abre, **Then** cada parte vazia mostra um aviso curto ("Sem resumo", "Sem exemplos de log", "Sem mudanças de status") em vez de sumir.
4. **Given** um identificador inexistente, de outra empresa ou de produto sem acesso, **When** o detalhe abre, **Then** aparece "Ocorrência não encontrada ou sem acesso" e o link "Voltar para ocorrências", sem encerrar a sessão.
5. **Given** o detalhe aberto a partir de uma lista filtrada, **When** o usuário clica em "Voltar para ocorrências", **Then** volta para a lista com os mesmos filtros, busca e página.
6. **Given** falha do Core no detalhe, **When** a tela abre, **Then** aparece o estado de erro com "Tentar de novo".

---

### Edge Cases

- Troca de empresa no seletor com a tela aberta: a lista recarrega para a nova empresa, na página 1 e sem filtros de produto da empresa anterior.
- Página no endereço maior que a última: a lista mostra o estado vazio com a paginação para voltar à última página.
- Busca com caracteres especiais ou muito longa: o campo aceita até 200 caracteres; acima disso não digita mais.
- Respostas fora de ordem (o usuário digita rápido ou troca de página rápido): só a resposta da consulta mais recente aparece.
- Título ou linha de log muito longos: quebram linha sem estourar a largura da tela; os exemplos ficam em bloco de código com rolagem horizontal.
- Recusa de segurança do Core (401 ou 403 sem código): segue a regra da spec 006 e encerra a sessão; 403 `subscription_required` leva à tela de planos (spec 007).
- Tela estreita (celular): lista e detalhe em uma coluna, painel de filtros em tela cheia.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O item "Ocorrências" do menu MUST levar à tela `/ocorrencias` da empresa ativa, protegida como as demais telas da área logada.
- **FR-002**: A lista MUST mostrar, por item: tipo com cor e rótulo (Erro, Alerta, Informação), título, produto, contagem, status com rótulo em português, marca "Recorrente" quando for o caso e data e hora da última vez no fuso e idioma do perfil.
- **FR-003**: A lista MUST vir na ordem do Core (última vez mais recente primeiro) e MUST mostrar "Mostrando X a Y de Z ocorrências" e a paginação.
- **FR-004**: O usuário MUST poder escolher o tamanho da página entre 10, 20 e 50 (padrão 20); mudar o tamanho MUST voltar para a página 1.
- **FR-005**: A tela MUST tratar os estados de carregamento, vazio sem filtros, vazio com filtros e erro com "Tentar de novo".
- **FR-006**: A busca por texto MUST ter até 200 caracteres e MUST consultar o Core depois de uma pausa na digitação, voltando para a página 1.
- **FR-007**: O painel de filtros MUST oferecer: tipo (vários), produto (vários, só os que o usuário pode ver), período (Todo o período, Últimas 24 horas, Últimos 7 dias, Últimos 30 dias) e status (vários). Os filtros MUST valer só ao clicar em "Aplicar filtros".
- **FR-008**: Busca, filtros, página e tamanho MUST ficar no endereço da página e MUST ser restaurados ao recarregar, voltar do detalhe ou abrir o link; valores inválidos no endereço MUST ser ignorados.
- **FR-009**: O botão de filtros MUST mostrar a quantidade de filtros ativos; "Limpar filtros" MUST apagar busca e filtros e voltar à lista padrão na página 1.
- **FR-010**: Abrir um item MUST levar a `/ocorrencias/{id}`, com o detalhe da ocorrência: tipo, título, identificador com copiar, produto, primeira e última vez, status, recorrente, contagem, dados sensíveis mascarados (Sim, Não ou oculto quando desconhecido), atributos técnicos, resumo, exemplos de log (sem data) com copiar e histórico de status (status anterior, novo, data e autor).
- **FR-011**: Os exemplos de log MUST ser mostrados como texto, exatamente como vêm do Core, em bloco de código; a tela MUST NOT interpretar HTML vindo do log.
- **FR-012**: O 404 do Core no detalhe MUST mostrar "Ocorrência não encontrada ou sem acesso" com o link de volta, sem encerrar a sessão.
- **FR-013**: "Voltar para ocorrências" MUST voltar para a lista com a busca, os filtros e a página de antes.
- **FR-014**: Só a resposta da consulta mais recente MUST aparecer na lista; respostas antigas MUST ser descartadas.
- **FR-015**: Trocar de empresa MUST recarregar a lista da nova empresa, sem filtros de produto da anterior.
- **FR-016**: As recusas de segurança e de assinatura do Core MUST seguir as specs 006 e 007 do web.
- **FR-017**: Esta feature MUST NOT oferecer alterar status, arquivar, sugestão da IA, atualização em tempo real, gravidade, exportação nem os painéis de métricas da tela de demonstração; esses itens ficam para a LLT-206, LLT-207, LLT-208 e as features de painel.

### Key Entities

- **Item da lista de ocorrências**: identificador, tipo, título, produto, contagem, status, recorrente, primeira e última vez (contrato da spec 012 do core).
- **Detalhe da ocorrência**: o item mais resumo, exemplos de log (textos), atributos técnicos, dados sensíveis e histórico de status.
- **Filtros da lista**: busca, tipos, produtos, período, status, página e tamanho, guardados no endereço da página.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O usuário chega da tela inicial à lista de ocorrências em 1 clique e a um detalhe em 2 cliques.
- **SC-002**: Em 100% dos testes de filtro combinado, os itens e o total exibidos são os que o Core devolve para aqueles filtros, em qualquer página.
- **SC-003**: Em 100% dos testes, recarregar a lista ou voltar do detalhe preserva busca, filtros, página e tamanho.
- **SC-004**: Com o Core local, a primeira página aparece em até 2 segundos depois de abrir a tela.
- **SC-005**: Em 100% dos testes, um identificador de outra empresa mostra a mensagem de não encontrada e a sessão continua ativa.
- **SC-006**: Os quatro estados da lista (carregando, vazio, vazio com filtros e erro) aparecem no roteiro manual.

## Assumptions

- O Core entrega as consultas da spec `012-consultar-ocorrencias` do lhamalog-core (lista paginada com filtros e detalhe). Enquanto o Módulo Ocorrência não existe, os dados vêm da carga de exemplo do Core no perfil local.
- A tela reaproveita os componentes da LLT-237 (`OccurrencesView`, `OccurrenceCard`, `OccurrencesHeader`, `SeverityIndicator`) e os componentes compartilhados (`Pagination`, `FilterButton`, `EmptyState`, `ErrorState`, `LoadingState`), ajustando-os aos dados reais. Os painéis de métricas da demonstração ficam fora.
- O protótipo mostra filtro de "Criticidade" e rótulo "Crítica"; gravidade não está na entrega do Core e fica fora. "Projeto" do protótipo é o "Produto" do sistema.
- Datas aparecem no fuso e idioma do perfil (spec 002), como nas demais telas.
- Intervalo com datas livres fica para depois; o Core já aceita início e fim livres.
- A constituição do web ainda é o template; os portões vêm de `docs/instrucoes-agentes.md`.
