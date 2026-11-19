# Feature Specification: Dashboards por produto e da empresa

**Feature Branch**: `LLT-145-dashboards-produto-empresa`

**Created**: 2026-11-17

**Updated**: 2026-11-18

**Status**: Draft

**Input**: User description: "LLT-145 Dashboards (Epic LLT-107 Dashboards e relatórios (Web), Feature E11.F1), cobrindo a LLT-222 Dashboard por produto com filtros e a LLT-223 Dashboard da empresa (multiproduto). São dashboards do produto para o cliente na Web (não é o Grafana operacional). Fontes: USID_031, USID_032, USID_034, USID_036; ADR_141, ADR_131, ADR_170, ADR_123, ADR_140, ADR_122, ADR_166, ADR_148, LLT-171, LLT-158, LLT-159. Premissas aceitas pelo dono (BimBot Escola de TI): Web só fala com o Core; rótulos ERROR/WARNING; cartões e ranking do dashboard por produto; protótipo Empresarial sem Desempenho/exportação; filtros com retenção do plano; permissões DONO/ADMIN/MEMBRO; atualização sob demanda; X-Correlation-Id; SSID_011 mantém agregações no MVP (forma aberta); gráficos SVG próprios. Fora do MVP: LLT-224, LLT-226, comparação real de consistência com lista de Ocorrências (LLT-104; placeholder de Ocorrências no gráfico entra no MVP), SLA/latência/disponibilidade/IA."

## Clarifications

### Session 2026-11-18

- Q: Fonte dos dados do MVP: contagens por severidade nos logs (OpenObserve, via novo endpoint do Core) mais volume aceito (fatos de uso no Core), ou Ocorrências quando o Módulo de Ocorrência existir? → A: Novo endpoint do Core que conta nos logs do OpenObserve (por severidade, produto, serviço e período) mais os fatos de uso já existentes no Core (`/internal/usage-facts`: registros e bytes aceitos por produto, logs e traces). O Web continua falando só com o Core (ADR_141).
- Q: Agregações do SSID_011: job pré-calculado já nesta entrega ou consulta na hora no MVP? → A: Construir já nesta entrega multi-repositório (Web spec 007 + Core spec 011 em `lhamalog-core/specs/011-consulta-metricas-dashboard`) o job de agregações pré-calculadas (ADR_166). Reconciliação com a fonte do MVP: o job do Core grava periodicamente agregados por empresa (tenant), produto, severidade (ERROR/WARNING/INFO), serviço e intervalo de tempo (hora), lendo os logs do OpenObserve; o endpoint de consulta responde com os agregados dos intervalos já consolidados e conta na hora no OpenObserve só o intervalo ainda não consolidado (a hora corrente ou o que o job ainda não processou); o volume vem dos fatos de uso. Conflito: o SSID_011 original diz que o job lê Ocorrências, mas o Módulo de Ocorrência ainda não existe (LLT-104); no MVP o job agrega logs, e as Ocorrências entram depois. A resposta do Core indica até quando os dados estão consolidados (campo de negócio “dados consolidados até”), para a tela informar isso.
- Q: DONO e ADMIN têm diferença no dashboard? O que vê um MEMBRO sem nenhum produto vinculado? → A: DONO e ADMIN veem exatamente o mesmo dashboard (todos os produtos da empresa). Um MEMBRO sem nenhum produto vinculado vê a tela vazia com um aviso (sem métricas, sem erro), tanto no dashboard por produto quanto no da empresa.
- Q: Quem é o responsável pela parte do Core (endpoint de consulta, LLT-159) e se o Felipe revisa o que tocar na Clerk? → A: A parte do Core (endpoints de consulta, job de agregação e o contrato da LLT-159) é feita pelo Michel com o agente de desenvolvimento, na spec `lhamalog-core/specs/011-consulta-metricas-dashboard` (branch `LLT-145-consulta-metricas-dashboard`; outra metade desta entrega multi-repositório). O Felipe revisa o que tocar em Clerk e em papéis/permissões. (Não é requisito funcional do Web; registrado em Dependências/Assumptions.)
- Q: Dashboard no plano Basic (FREE) vs. Standard (ADR_131): o que cada plano vê? → A: No MVP, o dashboard é igual para todos os planos (FREE, Starter, Pro, Business/Enterprise); a única diferença é o período máximo pelos `retentionDays` do plano (já no FR-003).
- Q: Quais limiares definem os selos Crítico / Atenção / Estável na lista “Produtos mais impactados”? → A: APROVADO pelo Michel em 18/11: Crítico quando ERROR ≥ 10% dos logs do produto no período; Atenção de 2% (inclusive) a 10% (exclusive); Estável abaixo de 2% (inclusive produto sem logs).
- Q: No gráfico de linhas do Web, como tratar Ocorrências enquanto a LLT-104 (lista de Ocorrências) não existe? → A: Decisão do Michel (18/11, 21:38): o gráfico de linhas MUST estar pronto para receber valores de ocorrências (props, tipos e campo opcional no contrato já previstos), mas a parte de Ocorrências fica com estado pendente e a UI mostra a mensagem “não implementado ainda” até a LLT-104 entregar a lista de Ocorrências. A comparação real de consistência (SC-004) continua dependente da LLT-104.
- Q: Com que frequência o job de agregados SSID_011 deve rodar? → A: Decisão do Michel (18/11, 21:39): o job roda a cada 1 hora para começar, com frequência configurável por propriedade (cron ou intervalo; padrão a cada 1h) para poder mudar depois.
- Q: Interpretação híbrida do job SSID_011 (A1) e fonte no MVP (logs vs Ocorrências)? → A: **CONFIRMADO** pelo Michel (18/11, 22:02): o job SSID_011 lê **logs** agora e passa a ler Ocorrências depois da LLT-104. A interpretação híbrida (agregados consolidados + contagem na hora do intervalo aberto; volume via fatos de uso; campo “dados consolidados até”) fica confirmada.
- Q: Unidade de volume na API e na tela? → A: Decisão do Michel (18/11, 22:02): a API trafega bytes (`volumeIngestaoBytes` / `volumeUsedBytes`, inteiros); a tela exibe em GiB (2^30 = 1073741824 bytes), formatado no locale do usuário com até 2 casas decimais e sufixo GiB.
- Q: Produto inacessível (outra empresa ou MEMBRO sem AcessoProduto): 403 ou 404? → A: Decisão do Michel (18/11, 22:02): o Core responde **404** (não 403). O Web trata 404 do produto como estado “produto não encontrado/sem acesso” sem métricas. 403 de segurança continua com a spec 006.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visualizar o dashboard por produto (Priority: P1)

Uma pessoa autenticada, com empresa ativa e acesso a pelo menos um produto, abre o dashboard por produto, escolhe o sistema (produto) que quer acompanhar e vê, no período padrão, os cartões de Total de logs, Logs ERROR, Logs WARNING, Traces recebidos e Volume usado no período comparado ao volume de ingestão do plano (`volumeIngestaoBytes`, ADR_131), além do gráfico de logs ERROR e WARNING e do ranking dos cinco serviços com mais logs ERROR. Os horários e agrupamentos seguem o fuso horário do perfil dela. A atualização ocorre quando ela aplica filtros ou pede atualizar — não há tempo real nem WebSocket. Quando o Core envia o campo “dados consolidados até”, a tela MUST exibir “Dados consolidados até …” no fuso do perfil (a ausência do campo não bloqueia as métricas).

**Why this priority**: É o USID_031 e o núcleo da LLT-222. Sem a visão por produto não há valor de monitoramento para o cliente na Web.

**Independent Test**: Com empresa e produto acessíveis e dados no período padrão (7 dias), abrir o dashboard por produto, selecionar o produto e conferir os cinco cartões (incluindo volume vs. `volumeIngestaoBytes`), o gráfico e o ranking dos cinco serviços. Sem dados no período, aparece “nenhum resultado encontrado”. Com `dadosConsolidadosAte` na resposta, a tela exibe “Dados consolidados até …” no fuso do perfil.

**Acceptance Scenarios**:

1. **Given** uma pessoa autenticada com empresa ativa e produto acessível, **When** abre o dashboard por produto e seleciona esse produto, **Then** vê os cartões Total de logs, Logs ERROR, Logs WARNING, Traces recebidos e Volume usado no período comparado ao volume de ingestão do plano (`volumeIngestaoBytes`), no período padrão.
2. **Given** o dashboard por produto carregado com dados, **When** a pessoa observa o gráfico, **Then** vê a evolução de logs ERROR e WARNING agrupada por hora se o período for de até 48 horas, ou por dia se for maior que 48 horas.
3. **Given** o dashboard por produto carregado com logs ERROR no período, **When** a pessoa observa o ranking, **Then** vê até cinco serviços (`service.name`) ordenados pelos que têm mais logs ERROR.
4. **Given** o perfil com um fuso horário definido, **When** o dashboard exibe horários e agrupamentos, **Then** esses valores estão no fuso do perfil, não em outro fuso fixo.
5. **Given** o produto selecionado sem dados no período, **When** a carga termina, **Then** a pessoa vê “nenhum resultado encontrado” e não vê números inventados.
6. **Given** a resposta do Core com “dados consolidados até”, **When** o dashboard por produto exibe as métricas, **Then** a tela MUST exibir “Dados consolidados até …” no fuso do perfil; se o campo estiver ausente, as métricas seguem normalmente.

---

### User Story 2 - Filtrar o dashboard por produto (Priority: P1)

A pessoa ajusta produto, período (24 horas, 7 dias, 30 dias ou personalizado; padrão 7 dias) e tipo (ERROR, WARNING, INFO; padrão todos), aplica os filtros e vê as métricas atualizadas. Na 1ª carga, antes da primeira resposta do Core, o teto do período é o seguro padrão de 7 dias (menor plano, FREE). Cada resposta de métricas devolve `retentionDays` e, a partir daí, o teto passa a ser o menor entre 30 dias e esses `retentionDays` (ADR_131: FREE 7, Starter 15, Pro 30, Business/Enterprise 90). Se um filtro da URL exceder o teto conhecido depois da resposta, ele é inválido (mensagem) e não é aplicado. Os filtros ficam na URL e permanecem até ela alterar ou remover. Filtro inválido não é aplicado e mostra mensagem. A atualização é sob demanda (Aplicar filtros / Atualizar).

**Why this priority**: É o USID_032 e critério de aceite da LLT-222 (seleção de produto e período). Sem filtros confiáveis o dashboard não serve para investigar um intervalo.

**Independent Test**: No dashboard por produto, alterar período e tipo, aplicar, recarregar a página e conferir que os mesmos filtros voltaram pela URL. Informar um período acima do máximo permitido pelo plano e conferir a mensagem sem mudança dos dados exibidos.

**Acceptance Scenarios**:

1. **Given** o dashboard por produto aberto, **When** a pessoa escolhe produto, período válido e tipo e aplica os filtros, **Then** os cartões, o gráfico e o ranking refletem somente o recorte escolhido.
2. **Given** filtros aplicados, **When** a pessoa recarrega a página ou compartilha a URL, **Then** os mesmos filtros válidos voltam aplicados.
3. **Given** um filtro inválido (período acima do máximo permitido — o menor entre 30 dias e `retentionDays` do plano —, tipo desconhecido, produto inacessível ou intervalo personalizado inválido), **When** a pessoa tenta aplicar, **Then** vê uma mensagem de filtro inválido, o filtro não é aplicado e os dados anteriores (ou o padrão) permanecem.
4. **Given** filtros na tela ainda não aplicados, **When** a pessoa não aciona Aplicar filtros nem Atualizar, **Then** as métricas não mudam sozinhas (sem tempo real nem WebSocket).

---

### User Story 3 - Visualizar o dashboard da empresa (Priority: P1)

Uma pessoa com permissão para o dashboard empresarial abre a visão multiproduto e vê métricas consolidadas somente dos produtos aos quais tem acesso: título “Dashboard Empresarial”, subtítulo orientando a visão consolidada, quatro cartões (Logs consolidados, Logs ERROR, Alertas = logs WARNING, Produtos monitorados), gráfico de linhas “Evolução de erros por produto”, lista “Produtos mais impactados” com selo de estado (Crítico, Atenção, Estável) e tabela por produto com Logs, Logs ERROR e Alertas (WARNING). Não há botão de exportar relatório nem coluna Desempenho (ADR_166 / LLT-224 fora). Sem permissão, a tela bloqueia com mensagem de restrição. DONO e ADMIN veem o mesmo conjunto (todos os produtos da empresa). MEMBRO sem nenhum produto vinculado vê a tela vazia com aviso (sem métricas, sem erro). Quando o Core envia o campo “dados consolidados até”, a tela MUST exibir “Dados consolidados até …” no fuso do perfil (a ausência do campo não bloqueia as métricas).

**Why this priority**: É o USID_034 e a LLT-223. Entrega a visão consolidada pedida pelo dono e pelo protótipo aprovado, dentro do MVP da ADR_166.

**Independent Test**: Com acesso a dois produtos e dados no período padrão, abrir o dashboard empresarial e conferir os quatro cartões (Alertas = WARNING), o gráfico, a lista com selos e a tabela. Com `dadosConsolidadosAte` na resposta, a tela exibe “Dados consolidados até …” no fuso do perfil. Sem permissão, conferir a mensagem de restrição sem métricas. MEMBRO sem produtos: tela vazia com aviso.

**Acceptance Scenarios**:

1. **Given** uma pessoa com acesso ao dashboard empresarial e a pelo menos um produto, **When** abre o Dashboard Empresarial, **Then** vê o título, o subtítulo, os quatro cartões (Alertas = logs WARNING), o gráfico de evolução de erros por produto, a lista de produtos mais impactados com selo e a tabela por produto com Logs, Logs ERROR e Alertas (WARNING).
2. **Given** a pessoa é MEMBRO e tem acesso só a parte dos produtos da empresa (AcessoProduto), **When** o dashboard empresarial carrega, **Then** aparecem somente os produtos permitidos a ela (ADR_122; critério LLT-223).
3. **Given** a pessoa não tem permissão para o dashboard empresarial, **When** tenta abri-lo, **Then** vê mensagem de restrição e não vê métricas de nenhum produto.
4. **Given** o protótipo com Exportar relatório e coluna Desempenho, **When** a pessoa usa o MVP, **Then** esses elementos não aparecem (exportação LLT-224 e Desempenho fora do escopo; ADR_166).
5. **Given** nenhum dado no período para os produtos permitidos, **When** a carga termina, **Then** a pessoa vê “nenhum resultado encontrado”.
6. **Given** a pessoa é MEMBRO sem nenhum produto vinculado (AcessoProduto vazio), **When** abre o dashboard por produto ou o da empresa, **Then** vê a tela vazia com um aviso, sem métricas e sem erro.
7. **Given** a pessoa é DONO ou ADMIN, **When** abre qualquer dos dashboards, **Then** vê exatamente o mesmo conjunto de produtos (todos os da empresa).
8. **Given** a resposta do Core com “dados consolidados até”, **When** o dashboard da empresa exibe as métricas, **Then** a tela MUST exibir “Dados consolidados até …” no fuso do perfil; se o campo estiver ausente, as métricas seguem normalmente.

---

### User Story 4 - Filtrar o dashboard da empresa (Priority: P2)

No dashboard empresarial, a pessoa filtra por um ou mais produtos (padrão “Todos os produtos autorizados”), período e tipo, aplica os filtros e mantém o recorte na URL até alterar ou remover. O período máximo é o menor entre 30 dias e os `retentionDays` do plano. Filtro inválido não é aplicado e mostra mensagem. Sem resultados, vê “nenhum resultado encontrado”.

**Why this priority**: É o USID_036. Completa a LLT-223 depois que a visão consolidada já existe; depende da User Story 3.

**Independent Test**: No dashboard empresarial, restringir a um produto e a ERROR, aplicar, recarregar e conferir URL e métricas. Limpar para “Todos os produtos autorizados” e conferir a volta ao consolidado permitido.

**Acceptance Scenarios**:

1. **Given** o dashboard empresarial aberto, **When** a pessoa escolhe um subconjunto dos produtos autorizados, período e tipo e aplica, **Then** cartões, gráfico, lista e tabela refletem só esse recorte.
2. **Given** filtros aplicados, **When** a pessoa recarrega a página, **Then** os filtros válidos permanecem (USID_036).
3. **Given** filtro inválido (inclusive período acima do máximo permitido pelo plano), **When** a pessoa tenta aplicar, **Then** vê mensagem, o filtro não entra e o recorte anterior (ou o padrão) permanece.
4. **Given** filtros válidos sem dados no período, **When** a carga termina, **Then** aparece “nenhum resultado encontrado”.

---

### User Story 5 - Placeholder de Ocorrências no gráfico (Priority: P3)

O gráfico de linhas MUST estar preparado para receber valores de ocorrências (props, tipos e campo opcional no contrato já previstos). Enquanto a LLT-104 (lista de Ocorrências) não existir, a série/indicador de Ocorrências permanece em estado **pendente** e a UI MUST exibir a mensagem “não implementado ainda”. A comparação real de consistência dos totais do dashboard com a lista de Ocorrências (critério LLT-222 / SC-004) só se aplica depois da LLT-104. Nos cartões e na criticidade, os rótulos continuam Logs ERROR e Logs WARNING (ADR_170); a legenda de Ocorrências no gráfico existe como placeholder, sem lógica de comparação neste MVP.

**Why this priority**: Entrega o encaixe visual e contratual no MVP sem bloquear a feature, e preserva o critério LLT-222 para depois da LLT-104.

**Independent Test**: Sem dados de ocorrências (campo ausente / estado pendente), o gráfico mostra indicador/legenda de Ocorrências com a mensagem “não implementado ainda”. Após a LLT-104: com o mesmo filtro no dashboard e na lista de Ocorrências, somar ERROR e WARNING e comparar com os cartões (SC-004).

**Acceptance Scenarios**:

1. **Given** resposta sem série/campo de ocorrências (ou estado pendente), **When** a pessoa observa o gráfico de linhas, **Then** vê o indicador/legenda de Ocorrências em estado pendente com a mensagem “não implementado ainda”.
2. **Given** a LLT-104 entregue e o mesmo produto, período e tipo no dashboard por produto e na lista de Ocorrências, **When** a pessoa compara Logs ERROR e Logs WARNING, **Then** os totais coincidem (SC-004).
3. **Given** um registro classificado pelas regras da ADR_170 no Core no MVP (sem lista de Ocorrências), **When** entra nas métricas no Web, **Then** a criticidade usada é só a severidade já normalizada (`ERROR`/`WARNING`/`INFO`; mapeamento bruto→enum feito no Core), a UI fala em logs ERROR / logs WARNING nos cartões, e Ocorrências no gráfico seguem o placeholder pendente até a LLT-104.

---

### Edge Cases

- Empresa sem produtos acessíveis ao usuário: dashboards não inventam produtos; mostram vazio ou orientação de ausência de produtos, sem dados de outros tenants.
- MEMBRO sem nenhum produto vinculado (AcessoProduto vazio): vê a tela vazia com um aviso (sem métricas, sem erro), tanto no dashboard por produto quanto no da empresa.
- DONO e ADMIN veem exatamente o mesmo dashboard (todos os produtos da empresa); MEMBRO vê só os do AcessoProduto, inclusive no dashboard da empresa (ADR_122). Não há diferença operacional entre DONO e ADMIN nos dashboards deste MVP.
- Revogação de acesso a produto ou papel: vale na hora; o Web MUST NOT manter cache de permissão (LLT-171).
- Pedido de dados de outra empresa / tenant diferente do `tenantId` do token, ou produto inacessível (MEMBRO sem AcessoProduto / produto inexistente): o Core responde **404** no endpoint por produto (não 403); 401 e 403 de segurança seguem a spec 006 (LLT-158).
- Período personalizado com data inicial depois da final, ou acima do máximo permitido (menor entre 30 dias e `retentionDays` do plano): filtro inválido, mensagem, sem aplicar.
- Tipo ou produto na URL que a pessoa não pode ver: tratados como inválidos, não aplicados, com mensagem; não vazam dados.
- Falha de rede ou do serviço de métricas: estado de erro com “tentar novamente” e exibição do identificador de correlação (`X-Correlation-Id`) para suporte; a sessão não é encerrada por falha de rede (spec 006).
- Recusa 401 ou 403 de segurança: segue a spec 006 (encerra sessão e aviso “Você foi deslogado”). 403 de negócio (ex.: sem permissão ao dashboard empresarial): permanece na tela com a mensagem. 404 de produto inacessível: estado “produto não encontrado/sem acesso” sem métricas.
- Troca de empresa enquanto uma consulta está em andamento: a resposta da empresa anterior é descartada e não mistura métricas.
- Sem fuso no perfil: usa o padrão já adotado pelo perfil do usuário no produto (America/Sao_Paulo, conforme perfil existente), sem quebrar a tela.
- Produto monitorado sem logs ERROR no período: aparece na visão empresarial com zeros ou ausência de impacto, sem sumir da tabela se estiver no filtro; selo Estável quando a proporção de ERROR fica abaixo de 2% (inclusive produto sem logs / zero ERROR), conforme limiares aprovados (Session 2026-11-18).
- Série/campo de ocorrências ausente na resposta (ou estado pendente): o gráfico mostra indicador/legenda de Ocorrências com a mensagem “não implementado ainda”, sem inventar números e sem comparação com lista até a LLT-104.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O Web MUST oferecer o dashboard por produto (LLT-222 / USID_031) com seleção de produto e exibição, no período vigente, dos cartões Total de logs, Logs ERROR, Logs WARNING, Traces recebidos e Volume usado no período comparado ao volume de ingestão do plano (`volumeIngestaoBytes`, ADR_131). A API trafega volume em **bytes** (inteiros: `volumeUsedBytes`, `volumeIngestaoBytes`); a tela MUST exibir o volume em **GiB** (1 GiB = 2^30 = 1073741824 bytes), formatado no locale do usuário com até 2 casas decimais e sufixo `GiB`.
- **FR-002**: O Web MUST oferecer o dashboard da empresa (LLT-223 / USID_034) com os quatro cartões Logs consolidados, Logs ERROR, Alertas (logs WARNING) e Produtos monitorados, o gráfico Evolução de erros por produto, a lista Produtos mais impactados com selo Crítico / Atenção / Estável e a tabela por produto com Logs, Logs ERROR e Alertas (WARNING), alinhados ao protótipo WEB_Dashboard_Empresarial sem Exportar relatório e sem coluna Desempenho.
- **FR-003**: O Web MUST permitir filtrar ambos os dashboards por produto (um no por produto; um ou mais no empresarial, com padrão “Todos os produtos autorizados”), período (24 horas, 7 dias, 30 dias e personalizado; padrão 7 dias) e tipo (ERROR, WARNING, INFO; padrão todos), conforme USID_032 e USID_036. O período máximo MUST ser o menor entre 30 dias e os `retentionDays` do plano informados pelo Core (ADR_131: FREE 7, Starter 15, Pro 30, Business/Enterprise 90). Na 1ª carga, antes da primeira resposta do Core, o filtro MUST usar o teto seguro padrão de 7 dias (menor plano, FREE). Cada resposta de métricas (produto e empresa) MUST devolver `retentionDays`; a partir daí o teto MUST passar a `min(30, retentionDays)`. Se um filtro aplicado da URL exceder o teto conhecido depois da resposta, ele MUST ser tratado como inválido (mensagem) e MUST NOT ser aplicado.
- **FR-004**: Filtros válidos MUST permanecer na URL até a pessoa alterar ou remover. Filtros inválidos MUST NOT ser aplicados e MUST mostrar mensagem clara.
- **FR-005**: A atualização das métricas MUST ser sob demanda (Aplicar filtros / Atualizar). O Web MUST NOT usar WebSocket nem tempo real para este MVP.
- **FR-006**: Horários e agrupamentos temporais MUST usar o fuso horário do perfil da pessoa. Períodos até 48 horas MUST agrupar o gráfico por hora; períodos maiores MUST agrupar por dia.
- **FR-007**: O dashboard por produto MUST exibir o ranking dos até cinco serviços (`service.name`) com mais logs ERROR no recorte filtrado.
- **FR-008**: O Web MUST preparar o gráfico de linhas para receber valores opcionais de ocorrências (props, tipos e campo no contrato já previstos). Enquanto não houver dados de ocorrências, a série/indicador MUST ficar em estado pendente e a UI MUST exibir “não implementado ainda”. O critério de consistência da LLT-222 (números do dashboard por produto batem com a lista de ocorrências do mesmo filtro) MUST permanecer condicionado à entrega da LLT-104; a comparação real (SC-004) MUST NOT fazer parte da lógica deste MVP. Cartões e criticidade MUST continuar rotulando Logs ERROR e Logs WARNING (ADR_170).
- **FR-009**: Isolamento MUST garantir só dados da empresa ativa (`tenantId` do token) e dos produtos permitidos à pessoa. `org:admin` mapeia DONO/ADMIN e `org:member` mapeia MEMBRO (ADR_123), distinguidos por `Membro.papel` (ADR_140). DONO e ADMIN veem exatamente o mesmo dashboard (todos os produtos da empresa); MEMBRO vê só os do AcessoProduto, inclusive no dashboard da empresa (ADR_122). MEMBRO sem nenhum produto vinculado MUST ver a tela vazia com um aviso (sem métricas, sem erro), tanto no dashboard por produto quanto no da empresa. O Web MUST NOT cachear permissão: revogação vale na hora (LLT-171). Produto inacessível (outra empresa / tenant diferente do token, ou MEMBRO sem AcessoProduto / produto inexistente) MUST resultar em **404** no endpoint por produto (não 403); o Web MUST tratar esse 404 como estado “produto não encontrado/sem acesso” sem métricas (LLT-158).
- **FR-010**: Sem permissão para o dashboard empresarial, o Web MUST bloquear com mensagem de restrição e MUST NOT exibir métricas (USID_034). No MVP, o dashboard MUST ser igual para todos os planos (FREE, Starter, Pro, Business/Enterprise); a única diferença por plano MUST ser o período máximo pelos `retentionDays` (FR-003 / ADR_131).
- **FR-011**: Prioridade/criticidade de um registro nas métricas MUST vir somente da severidade vigente (ADR_170: classes ERROR, WARNING e INFO). O mapeamento de severidades (ADR_170: erro/error/fatal → ERROR; alerta/warn/warning → WARNING; info/debug/trace → INFO) MUST ser feito no Core; o Web MUST consumir somente os enums já normalizados (`ERROR`, `WARNING`, `INFO`) e o parser MUST rejeitar valores desconhecidos. Sem métricas de SLA, latência, disponibilidade ou insights de IA neste MVP.
- **FR-012**: O Web MUST apresentar estados de carregamento, vazio (“nenhum resultado encontrado”), produto indisponível (404 do endpoint por produto) e erro com ação de tentar novamente. Em erro, a tela MUST exibir o identificador de correlação da requisição para suporte. Recusas 401 e 403 de segurança MUST seguir a spec 006; 403 de negócio (ex.: dashboard empresarial) permanece na tela com a mensagem; 404 de produto inacessível MUST exibir estado “produto não encontrado/sem acesso” sem métricas.
- **FR-013**: O Web MUST conversar somente com o Core (ADR_141), por um novo endpoint de consulta do Core, e MUST NOT acessar o OpenObserve diretamente. A fonte do MVP chega ao Web só via Core: contagens nos logs do OpenObserve (via Core, por severidade, produto, serviço e período) mais os fatos de uso já existentes (`/internal/usage-facts`: registros e bytes aceitos por produto, logs e traces). A spec descreve só os campos de negócio que o Web recebe (totais, séries temporais, ranking de serviços, consolidado por produto, selos, volume vs. `volumeIngestaoBytes`, `retentionDays`, “dados consolidados até”), não a implementação interna do Core.
- **FR-014**: Exportação PDF/Excel (LLT-224) e dashboard mobile (LLT-226) MUST permanecer fora do escopo (ADR_166). A ADR_166 (aceita) MANTÉM as agregações pré-calculadas (SSID_011) no MVP: o job de agregações MUST ser construído já nesta entrega multi-repositório (Web spec 007 + Core spec 011 em `lhamalog-core/specs/011-consulta-metricas-dashboard`, branch do Core `LLT-145-consulta-metricas-dashboard`). O job do Core MUST rodar a cada 1 hora por padrão, com frequência configurável por propriedade (cron ou intervalo; padrão a cada 1h) para poder mudar depois (decisão Michel 18/11, 21:39). O job grava periodicamente agregados por empresa (tenant), produto, severidade (ERROR/WARNING/INFO), serviço e intervalo de tempo (hora), lendo os logs do OpenObserve; o endpoint de consulta responde com os agregados dos intervalos já consolidados e conta na hora no OpenObserve só o intervalo ainda não consolidado (a hora corrente ou o que o job ainda não processou); o volume vem dos fatos de uso. **CONFIRMADO** (Michel 18/11, 22:02 / A1): no MVP o job lê **logs**; passa a ler Ocorrências depois da LLT-104 (o SSID_011 original previa Ocorrências, ainda inexistentes). Quando o Core enviar o campo de negócio “dados consolidados até”, o Web MUST exibir “Dados consolidados até …” no fuso do perfil nos dois dashboards; a ausência do campo MUST NOT bloquear as métricas.
- **FR-015**: A apresentação de gráficos do MVP MUST estender os componentes SVG próprios já existentes (Sparkline e afins em `src/shared/ui`). O Web MUST NOT introduzir biblioteca externa nova de gráficos (sem Recharts).
- **FR-016**: Cada requisição do Web ao Core MUST enviar o identificador de correlação no cabeçalho que o Core já usa, `X-Correlation-Id` (classe `CorrelationId` do lhamalog-core; o Core devolve o mesmo id). A tela de erro MUST mostrar esse id para suporte.

### Key Entities

- **Dashboard por produto**: visão de métricas de um único produto acessível, com cartões (incluindo volume vs. `volumeIngestaoBytes`), gráfico de logs ERROR/WARNING no tempo (com placeholder opcional de Ocorrências em estado pendente até a LLT-104) e ranking de serviços por logs ERROR.
- **Dashboard da empresa**: visão multiproduto consolidada dos produtos autorizados à pessoa, com cartões (Alertas = logs WARNING), evolução por produto, produtos mais impactados (com selo) e tabela por produto.
- **Filtro de dashboard**: combinação de produto(s), período (limitado por `retentionDays` do plano; teto inicial seguro de 7 dias até a 1ª resposta) e tipo (severidade), persistida na URL quando válida.
- **Métrica filtrada**: totais e séries devolvidos pelo endpoint de consulta do Core para o recorte (logs, ERROR, WARNING, traces, volume, evolução e ranking), sempre no contexto do tenant e do acesso a produto, com indicação de “dados consolidados até”.
- **Dados consolidados até**: campo de negócio na resposta do Core indicando até quando os intervalos de agregação já estão consolidados pelo job (SSID_011); quando presente, a tela MUST exibi-lo no fuso do perfil.
- **Selo de impacto**: estado Crítico, Atenção ou Estável associado a um produto na lista de mais impactados — limiares APROVADOS (Session 2026-11-18): Crítico se ERROR ≥ 10%; Atenção se 2% ≤ ERROR < 10%; Estável se ERROR < 2% (sem SLA neste MVP).
- **Severidade**: classificação ERROR, WARNING ou INFO segundo a ADR_170; mapeamento bruto→enum feito no Core; o Web só consome enums normalizados.
- **Correlação**: identificador `X-Correlation-Id` enviado em cada chamada ao Core e exibido na tela de erro para suporte.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em 100% das aberturas com produto acessível e dados no período, a pessoa vê os cartões do dashboard por produto (incluindo volume comparado ao `volumeIngestaoBytes`) preenchidos com o recorte padrão (7 dias) sem precisar configurar nada além da seleção do produto.
- **SC-002**: Em 100% das aplicações de filtro válido, cartões e gráficos passam a refletir só o recorte escolhido; em 100% dos filtros inválidos (incluindo período acima do máximo permitido pelo plano e filtro da URL que excede o teto conhecido após a resposta com `retentionDays`), a pessoa vê mensagem e os dados aplicados não mudam para o valor inválido.
- **SC-003**: Em 100% das visualizações do dashboard empresarial com permissão, aparecem somente produtos autorizados à pessoa (DONO/ADMIN: todos, com visão idêntica entre DONO e ADMIN; MEMBRO: AcessoProduto); em 100% das tentativas sem permissão, há mensagem de restrição e zero métricas; em 100% dos casos de MEMBRO sem produtos vinculados, a tela fica vazia com aviso (sem métricas, sem erro) nos dois dashboards.
- **SC-004**: Em 100% das visualizações do gráfico sem dados de ocorrências, a UI exibe o indicador/legenda de Ocorrências em estado pendente com a mensagem “não implementado ainda”. Quando a LLT-104 existir, em 100% dos casos de teste do critério LLT-222 os totais de Logs ERROR e Logs WARNING do dashboard por produto coincidem com a lista de Ocorrências para o mesmo filtro.
- **SC-005**: Em 100% das exibições com fuso no perfil, horários e rótulos de agrupamento do gráfico estão nesse fuso.
- **SC-006**: Em 100% das falhas de carga recuperáveis, a pessoa vê erro com tentar novamente e o identificador de correlação; em 100% dos períodos sem dados, vê “nenhum resultado encontrado”.
- **SC-007**: Exportar relatório e coluna Desempenho não aparecem para nenhum usuário neste MVP (0 ocorrências na interface entregue).
- **SC-008**: Em 100% das requisições de métricas ao Core, o Web envia `X-Correlation-Id`; em 100% das telas de erro dessas falhas, o mesmo id fica visível para suporte.
- **SC-009**: Em 100% das respostas de métricas com o campo “dados consolidados até”, a tela MUST exibir “Dados consolidados até …” no fuso do perfil nos dois dashboards; a ausência do campo não bloqueia as métricas; o dashboard é o mesmo para todos os planos, diferindo só pelo período máximo (`retentionDays`).

## Assumptions

- Os dashboards desta feature são os do produto para o cliente na Web; não substituem o Grafana operacional.
- O Web conversa só com o Core (ADR_141), por um novo endpoint de consulta; nunca acessa o OpenObserve diretamente. Esta spec descreve só o que o Web recebe (campos de negócio), não a implementação do Core.
- Fonte do MVP no Core: contagens nos logs do OpenObserve (por severidade, produto, serviço e período) via o endpoint de consulta, mais fatos de uso já existentes (`/internal/usage-facts`: registros e bytes aceitos por produto, logs e traces). Detalhe do job/consulta híbrida: FR-014.
- Interpretação híbrida do job SSID_011 **CONFIRMADA** (Michel 18/11, 22:02 / A1): agregados consolidados + contagem na hora do intervalo aberto; volume via fatos de uso; campo “dados consolidados até”. No MVP o job lê **logs**; passa a ler Ocorrências depois da LLT-104. No Web, Ocorrências ficam pendentes no gráfico com “não implementado ainda” até a LLT-104 (decisão Michel 18/11, 21:38).
- Conflito SSID_011 vs. LLT-104: o SSID_011 original prevê que o job leia Ocorrências, mas o Módulo de Ocorrência ainda não existe; no MVP o job agrega logs (**CONFIRMADO** Michel 18/11, 22:02); no Web a série de Ocorrências fica pendente com “não implementado ainda” até a LLT-104.
- Rótulos de UI: Logs ERROR e Logs WARNING (ADR_170) nos cartões/criticidade. No gráfico, indicador/legenda de Ocorrências em estado pendente com “não implementado ainda” até a LLT-104. Alertas no dashboard empresarial = logs WARNING. Mapeamento bruto→enum de severidade é feito no Core; o Web só consome `ERROR`/`WARNING`/`INFO`.
- O período padrão é 7 dias; o tipo padrão é todos (ERROR, WARNING e INFO); no dashboard empresarial o produto padrão é “Todos os produtos autorizados”.
- Período máximo = menor entre 30 dias e `retentionDays` do plano (ADR_131: FREE 7, Starter 15, Pro 30, Business/Enterprise 90). Na 1ª carga, teto seguro de 7 dias até a primeira resposta com `retentionDays`. No MVP o dashboard é igual para todos os planos; só o período máximo muda.
- Volume usado no período é comparado ao volume de ingestão do plano (`volumeIngestaoBytes`, ADR_131). API em bytes (inteiros); UI em GiB (2^30 = 1073741824 bytes), locale do usuário, até 2 casas decimais + sufixo GiB (Michel 18/11, 22:02).
- Filtros ficam na URL; a pessoa controla a atualização por Aplicar filtros / Atualizar (sem WebSocket / tempo real).
- O fuso horário já existe no perfil do usuário e é reutilizado aqui.
- Permissões: `org:admin` = DONO/ADMIN e `org:member` = MEMBRO (ADR_123), via `Membro.papel` (ADR_140); DONO e ADMIN veem o mesmo dashboard (todos os produtos); MEMBRO só AcessoProduto, inclusive no dashboard da empresa (ADR_122). MEMBRO sem produtos vinculados vê tela vazia com aviso (sem métricas, sem erro) nos dois dashboards. Sem cache de permissão no Web (LLT-171). `tenantId` do token; produto inacessível (outra empresa ou MEMBRO sem AcessoProduto) → **404** (não 403) no endpoint por produto (Michel 18/11, 22:02 / LLT-158); 401/403 de segurança conforme spec 006. Felipe revisa o que tocar em Clerk/papéis.
- A criticidade exibida deriva só da severidade (ADR_170); não há score de SLA, latência, disponibilidade ou IA neste MVP. Selos Crítico/Atenção/Estável: limiares APROVADOS (Session 2026-11-18).
- Exportação (LLT-224) fora (ADR_166). Mobile (LLT-226) fora. Placeholder de Ocorrências no gráfico entra no MVP (estado pendente + “não implementado ainda”); comparação real de consistência com a lista (SC-004) condicionada à LLT-104.
- A ADR_166 (aceita) mantém agregações pré-calculadas (SSID_011) no MVP; o job é construído já nesta entrega multi-repositório (Web 007 + Core 011), com frequência padrão a cada 1h configurável por propriedade — detalhe em FR-014; interpretação híbrida **CONFIRMADA** (A1, Michel 18/11, 22:02): job lê logs no MVP e Ocorrências após a LLT-104.
- Gráficos: estender componentes SVG próprios (Sparkline e afins de `src/shared/ui`); sem biblioteca externa nova (sem Recharts).
- Cada chamada ao Core leva `X-Correlation-Id`; a tela de erro mostra o id para suporte.
- Parte do Core (endpoints de consulta, job de agregação e contrato da LLT-159): responsabilidade do Michel com o agente de desenvolvimento, em spec própria do lhamalog-core (`lhamalog-core/specs/011-consulta-metricas-dashboard`, branch `LLT-145-consulta-metricas-dashboard`). O Felipe revisa o que tocar em Clerk e em papéis/permissões.
- Neste repositório (`lhamalog-web`), o OK do Michel no chat do agente dele substitui as restrições de `docs/instrucoes-agentes.md` para commit, push e dependências (sem alterar o arquivo de instruções).
- Branch de trabalho (Web): `LLT-145-dashboards-produto-empresa`; branch do Core: `LLT-145-consulta-metricas-dashboard`; commits no formato `LLT-145: descricao` (ADR_148).
- Referência visual aprovada: protótipo WEB_Dashboard_Empresarial em Design/Telas/LhamaLog_WEB_Organizado/02_Dashboards; o dashboard por produto reutiliza o mesmo visual restrito a um produto.

## Dependências

- Novo endpoint de consulta no Core (`lhamalog-core` / LLT-159) que devolva métricas filtradas por produto, período e tipo (contagens nos logs do OpenObserve + fatos de uso `/internal/usage-facts`), respeitando tenant e acesso a produto, e que inclua `retentionDays`, `volumeIngestaoBytes` e o campo de negócio “dados consolidados até”.
- Job de agregações pré-calculadas (SSID_011 / ADR_166) no Core, construído já nesta entrega multi-repositório (Web spec 007 + Core spec 011): agregados por tenant, produto, severidade, serviço e hora a partir dos logs do OpenObserve; frequência padrão a cada 1h, configurável por propriedade (cron ou intervalo); consulta híbrida (agregados consolidados + contagem na hora do intervalo aberto); volume via fatos de uso. No MVP agrega logs (não Ocorrências — LLT-104 ainda inexistente).
- Spec própria do Core (`lhamalog-core/specs/011-consulta-metricas-dashboard`, branch `LLT-145-consulta-metricas-dashboard`): Michel com o agente de desenvolvimento entrega endpoints de consulta, job de agregação e contrato da LLT-159. O Felipe revisa o que tocar em Clerk e em papéis/permissões.
- Perfil do usuário com fuso horário (spec de perfil já existente).
- Comportamento de sessão 401/403 da spec 006.
- Listagem e regras de acesso a produtos (AcessoProduto) e papéis DONO/ADMIN/MEMBRO já usados na empresa ativa.
- **US5 no MVP (placeholder)**: gráfico pronto para série opcional de ocorrências com estado pendente e mensagem “não implementado ainda” (FR-008).
- **Dependência explícita pós-MVP para comparação real**: LLT-104 (lista de Ocorrências) — critério LLT-222 “números batem com a lista de ocorrências do mesmo filtro” / parte de SC-004 só se aplica depois dessa entrega; depois disso o job SSID_011 pode passar a considerar Ocorrências.
- Fora desta entrega, porém relacionados: LLT-224 (exportação), LLT-226 (mobile).
