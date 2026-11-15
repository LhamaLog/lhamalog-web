# Feature Specification: Listar, editar e desativar usuários

**Feature Branch**: `LLT-168-listar-editar-e-desativar-usuarios`

**Created**: 2026-11-15

**Status**: Aguardando esclarecimento

**Input**: User description: "LLT-168 Listar, editar e desativar usuários (épico Usuários, cargos e configurações do usuário, feature Gestão de usuários E03.F1). Como administrador, quero manter a lista de usuários da empresa. A lista mostra nome, e-mail, cargo, status e último acesso. O usuário desativado perde o acesso na próxima requisição. Não é possível desativar ou rebaixar o último administrador. Este artefato cobre somente o aplicativo web. A tela de convites já existe em Equipe e deve ser estendida de preferência, não refeita."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver quem pertence à empresa (Priority: P1)

Um administrador, com uma empresa selecionada, abre Equipe e vê as pessoas que já pertencem à empresa. Cada linha mostra nome, e-mail, cargo, status e último acesso. Os convites que ainda não foram aceitos continuam no bloco de pendentes e não entram nessa lista.

**Why this priority**: Sem a lista, o administrador não tem o que manter. É o menor recorte visível da história.

**Independent Test**: Com uma empresa que já tem administrador e membro, o administrador abre Equipe e confere as cinco colunas de cada pessoa. Um convite pendente aparece só no bloco de convites. Quem não administra não vê Equipe e, em `/equipe`, recebe a recusa já usada nessa rota.

**Acceptance Scenarios**:

1. **Given** um administrador com uma empresa selecionada e pessoas já vinculadas, **When** abre Equipe, **Then** a lista mostra, para cada pessoa, nome, e-mail, cargo, status e último acesso.
2. **Given** a pessoa não tem nome público, **When** a lista é exibida, **Then** o nome mostrado é o e-mail.
3. **Given** convites pendentes e pessoas já vinculadas, **When** o administrador olha Equipe, **Then** os pendentes ficam no bloco de convites e a lista de usuários só tem quem já pertence à empresa.
4. **Given** mais pessoas do que cabem em uma página, **When** o administrador avança a página, **Then** vê as demais sem perder as cinco colunas.
5. **Given** uma pessoa autenticada que não administra a empresa selecionada, **When** o menu é exibido, **Then** o item Equipe não aparece. **When** ela abre `/equipe` direto, **Then** vê "Você não tem acesso. Selecione uma empresa válida." e a sessão permanece aberta.
6. **Given** nenhuma empresa está selecionada, **When** a pessoa abre a área autenticada, **Then** não há lista e a orientação é a mesma já usada para pedir a seleção de uma empresa.

---

### User Story 2 - Editar o cargo de quem já pertence (Priority: P1)

O administrador altera o cargo de uma pessoa que já pertence à empresa, entre Administrador e Membro. A lista passa a mostrar o cargo novo. O que mais a edição pode alterar, além do cargo, está em aberto.

**Why this priority**: "Editar" é parte do título da história. O cargo é o único dado do vínculo que o administrador já consegue alterar na sessão, sem chave secreta.

**Independent Test**: Com dois administradores, rebaixar um para Membro e ver o cargo novo na lista. Promover um Membro a Administrador e ver o cargo novo. Tentar um cargo fora desses dois não altera a lista.

**Acceptance Scenarios**:

1. **Given** um membro e pelo menos um administrador, **When** o administrador promove o membro a Administrador, **Then** a lista mostra Administrador para essa pessoa.
2. **Given** dois administradores, **When** um rebaixa o outro a Membro, **Then** a lista mostra Membro e a empresa continua com administrador.
3. **Given** uma edição em andamento, **When** o administrador tenta de novo, **Then** há uma única alteração e o controle fica bloqueado até a resposta.
4. **Given** falha na edição, **When** a resposta chega, **Then** há um alerta, o cargo anterior permanece e a lista não mostra um cargo que não foi confirmado.
5. **Given** troca de empresa ou saída da tela com a edição ainda em curso, **When** a resposta atrasada chega, **Then** ela não altera a lista da empresa que ficou na tela.

---

### User Story 3 - Desativar sem deixar a empresa sem administrador (Priority: P1)

O administrador desativa uma pessoa que não é o único administrador. O status dela passa a desativado e a próxima requisição dela não acessa o produto. Desativar ou rebaixar a única pessoa administradora é recusado, e ela continua administradora.

**Why this priority**: São os outros dois critérios de aceite. A lista sem a desativação e sem a trava do último administrador não fecha a história.

**Independent Test**: Desativar um membro e, na requisição seguinte dessa pessoa, confirmar que o acesso não segue. Com um único administrador, tentar desativá-lo e tentar rebaixá-lo: as duas tentativas são recusadas e ele continua administrador.

**Acceptance Scenarios**:

1. **Given** um membro, ou um administrador que não é o único, **When** o administrador o desativa, **Then** a próxima requisição dessa pessoa não acessa o produto. Se ela continuar na lista, o status fica Desativado. Se a decisão do FR-006 a retirar da lista, ela deixa de aparecer.
2. **Given** a empresa tem um único administrador, **When** alguém tenta desativá-lo ou rebaixá-lo a Membro, **Then** a ação é recusada, ele continua administrador e a lista não muda o cargo nem o status dele.
3. **Given** a desativação ou a edição está em andamento, **When** o administrador repete a ação, **Then** há um único pedido e o controle fica bloqueado até a resposta.
4. **Given** falha ao desativar, **When** a resposta chega, **Then** há um alerta e a pessoa continua com o acesso que tinha antes da tentativa.
5. **Given** sessão expirada no meio da ação, **When** a plataforma recusa a sessão, **Then** a pessoa volta a entrar, como nas configurações da empresa.

---

### Edge Cases

- E-mail com diferença de maiúsculas: a comparação ignora maiúsculas e minúsculas. A lista mostra o identificador que a plataforma devolve.
- Identificador que não é e-mail, por exemplo telefone: a coluna de e-mail mostra esse identificador. A pessoa não some da lista por isso.
- Nome ausente: a coluna de nome mostra o e-mail.
- Convite pendente, expirado ou revogado: não entra na lista de usuários. O bloco de convites da LLT-167 permanece.
- Empresa sem nenhum membro além de quem criou: a lista tem pelo menos esse administrador, e a trava de último administrador se aplica a ele.
- O administrador desativa a si mesmo, havendo outro administrador: a ação é permitida. Se ele for o único, a trava recusa.
- O administrador rebaixa o próprio cargo, havendo outro administrador: a ação é permitida. Se ele for o único, a trava recusa.
- Dois administradores agem ao mesmo tempo sobre os dois últimos cargos de administrador: a tela volta a contar os administradores imediatamente antes de cada ação. Se ainda assim a plataforma recusar, a tela mostra o erro e recarrega a lista. O que essa contagem não fecha sozinha está na premissa de trabalho da trava.
- Troca de empresa com pedido em curso: a resposta atrasada não altera a lista da empresa que ficou na tela.
- Sessão expirada: a pessoa entra de novo. A lista não é alterada por uma ação que a sessão não chegou a confirmar.
- Acesso negado: "Você não tem acesso. Selecione uma empresa válida." A sessão não é encerrada por essa recusa.
- Plataforma ou serviço indisponível, ou resposta ilegível: alerta, lista anterior permanece, nova tentativa é possível.
- Cargo fora de Administrador e Membro: a edição é recusada e o cargo anterior permanece.
- Pessoa desativada com token de sessão ainda válido: o critério é perder o acesso na próxima requisição. O token da plataforma continua válido até expirar. O modo de cumprir o critério está em aberto no FR-006.
- Reativar alguém: não há botão nem regra enquanto o FR-006 não for fechado. A reversibilidade acompanha esse mecanismo.
- Último acesso sem fonte fechada: a coluna existe. O que ela mostra está em aberto no FR-007. A data de entrada ou de atualização do vínculo não é tratada como último acesso.
- Paginação: uma pessoa fora da primeira página continua protegida pela trava de último administrador. A contagem não pode parar na página visível.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O administrador da empresa selecionada MUST ver a lista de quem já pertence à empresa, com nome, e-mail, cargo, status e último acesso em cada linha.
- **FR-002**: Quem não administra a empresa selecionada MUST NOT ver o item Equipe e MUST NOT listar, editar nem desativar usuários. No acesso direto a `/equipe`, a pessoa MUST ver "Você não tem acesso. Selecione uma empresa válida." e a sessão MUST permanecer aberta.
- **FR-003**: Sem empresa selecionada, o aplicativo MUST NOT listar, editar nem desativar usuários e MUST orientar a pessoa a selecionar ou cadastrar uma empresa, como já faz nas outras áreas autenticadas.
- **FR-004**: A lista, a edição e a desativação MUST aparecer na rota `/equipe`, aberta pelo item Equipe, em bloco distinto dos convites pendentes. O envio, a revogação, o reenvio e o aceite de convite MUST permanecer como na LLT-167.
- **FR-005**: A edição MUST alterar o cargo da pessoa na empresa selecionada, e o cargo MUST ser exatamente Administrador ou Membro. O que mais a edição cobre MUST ser [NEEDS CLARIFICATION: só o cargo, o cargo e o nome de outra pessoa, ou o cargo com o nome apenas exibido e editado pela própria pessoa no perfil?].
- **FR-006**: Uma pessoa desativada, que não seja o único administrador, MUST perder o acesso ao produto na próxima requisição. O modo de cumprir isso MUST ser [NEEDS CLARIFICATION: marca no serviço conferida a cada requisição, saída da empresa na sessão do administrador, os dois, ou esperar o token expirar?].
- **FR-007**: A coluna de último acesso MUST aparecer na lista. A origem do valor MUST ser [NEEDS CLARIFICATION: instante da última requisição aceita no serviço, último login da plataforma, data do vínculo, ou coluna vazia até existir fonte?].
- **FR-008**: O aplicativo MUST impedir desativar e MUST impedir rebaixar o único administrador da empresa selecionada. Essa pessoa MUST continuar administradora. A tela MUST explicar a recusa. A contagem MUST incluir os administradores das outras páginas, não só os da página visível.
- **FR-009**: Cada pessoa visível na lista MUST ter um status. Quem pode acessar MUST aparecer como Ativo. Se a pessoa desativada continuar na lista, MUST aparecer como Desativado. Se o mecanismo do FR-006 a retirar da empresa, ela MUST deixar de aparecer nesta lista.
- **FR-010**: O nome exibido MUST ser o nome público da pessoa. Se não houver nome, MUST ser o e-mail. O e-mail exibido MUST ser o identificador da pessoa na empresa. O cargo exibido MUST ser Administrador ou Membro, com o mesmo critério já usado nos convites.
- **FR-011**: Durante listar, editar ou desativar, o aplicativo MUST fazer um único pedido daquela ação e MUST manter o controle correspondente bloqueado até a resposta. Falha MUST ser um alerta e MUST NOT apresentar como concluída uma mudança que não foi confirmada.
- **FR-012**: Trocar de empresa ou abandonar a tela MUST descartar o efeito visual de um pedido anterior. Essa resposta MUST NOT alterar a lista da empresa que ficou em foco.
- **FR-013**: Sessão expirada MUST seguir a recuperação já conhecida: entrar de novo. Falha de rede MUST permitir nova tentativa, sem aplicar a mudança que falhou.
- **FR-014**: Se a lista tiver mais pessoas do que uma página, o administrador MUST conseguir ver as páginas seguintes.
- **FR-015**: Os controles novos MUST ter rótulo visível, erro associado à ação e operação por teclado, no mesmo padrão de Equipe. Sucesso é um aviso de status. Erro é um alerta. Uma falha de carga MUST ser distinta de uma lista vazia. A lista vazia MUST explicar que não há usuários vinculados. A empresa nasce com quem a criou, então a lista vazia não é o caso comum.
- **FR-016**: O aplicativo MUST NOT receber nem guardar chave secreta da plataforma, e o serviço MUST NOT passar a usar chave secreta por causa desta história. A tela MUST NOT apagar a conta da pessoa na plataforma.
- **FR-017**: Esta história MUST NOT alterar o perfil que a própria pessoa edita (nome, idioma e fuso), os dados da empresa, o contexto da empresa nem os produtos. MUST NOT criar cargo além de Administrador e Membro. MUST NOT definir a matriz de permissões nem esconder outras ações do produto segundo essa matriz.
- **FR-018**: O administrador MUST poder desativar a si mesmo e MUST poder rebaixar o próprio cargo somente quando existir outro administrador. Sendo o único, as duas ações MUST ser recusadas pelo FR-008.

### Key Entities *(include if feature involves data)*

- **Usuário da empresa**: Pessoa que já pertence à empresa selecionada. Atributos visíveis: nome, e-mail, cargo, status e último acesso. Não inclui convite ainda não aceito. O nome vem do nome público; na falta dele, do e-mail. A origem do último acesso está em aberto.
- **Cargo**: Só Administrador e Membro, os mesmos do convite. Não é o nome da empresa no cabeçalho.
- **Status**: Ativo para quem pode acessar. Desativado para quem foi desativado e continua visível na lista. Se o mecanismo em aberto retirar a pessoa da empresa, ela sai da lista em vez de permanecer como Desativado. A volta para Ativo, quando existir, depende desse mesmo mecanismo.
- **Administrador da empresa**: Quem, na empresa selecionada, tem o cargo de administrador, no mesmo critério já usado em Equipe. A empresa não pode ficar sem pelo menos um.
- **Empresa selecionada**: A organização ativa da sessão. A lista, a edição e a desativação valem só para ela.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um administrador com empresa selecionada vê nome, e-mail, cargo, status e último acesso de cada pessoa da página em uma única abertura de Equipe, em menos de 1 minuto, sem sair da área autenticada.
- **SC-002**: Em 100% das desativações confirmadas de quem não é o único administrador, a próxima requisição dessa pessoa não acessa o produto.
- **SC-003**: Em 100% das tentativas de desativar ou rebaixar o único administrador, a ação é recusada, o cargo dele continua administrador e o status dele não muda.
- **SC-004**: Em 100% das tentativas de quem não administra a empresa selecionada, o item Equipe não aparece, o acesso direto a `/equipe` mostra a recusa padrão e nenhuma pessoa é editada ou desativada.
- **SC-005**: Em 100% das trocas de cargo confirmadas entre Administrador e Membro, a lista mostra o cargo novo. Em 100% das falhas, o cargo anterior permanece.
- **SC-006**: Em 100% das respostas de um pedido abandonado, por saída da tela ou troca de empresa, a lista da empresa atual não muda por causa dessa resposta.
- **SC-007**: Em 100% dos casos sem empresa selecionada, nenhuma lista é alterada e a pessoa vê a orientação para selecionar ou cadastrar uma empresa.

## Out of Scope

- Mudar o convite da LLT-167: envio, prazo de 7 dias, revogação, reenvio e aceite nas telas de entrada.
- Fechar o catálogo de cargos e a matriz de permissões (LLT-169) e passar a esconder ações conforme essa matriz (LLT-170). Gestor, Visualizador e Usuário Master não entram nesta lista.
- Restringir produtos por pessoa (LLT-171).
- Manter e-mail (LLT-172), notificações (LLT-173) e o perfil que a própria pessoa edita (LLT-174).
- Apagar a conta da pessoa na plataforma de acesso, banir a conta fora desta empresa ou encerrar todas as sessões com chave secreta.
- Convite em massa, desativação em massa e edição em massa.
- Configurar o dashboard da plataforma. Outra pessoa faz isso; o que esta história precisa está nas premissas.
- Colocar chave secreta no aplicativo web ou no serviço.

## Assumptions

- A empresa ativa da sessão é o tenant. Administrador continua sendo quem tem o cargo de administrador da empresa, com ou sem o prefixo que a sessão já usa hoje. Membro não vê Equipe.
- A rota `/equipe` e o item Equipe já existem e só o administrador os usa. Esta história acrescenta o bloco de usuários ao lado do bloco de convites. É a leitura do pedido, que pede para estender essa tela. A premissa não está fechada: se a lista for para outra rota, o FR-004 muda.
- A sessão do administrador já consegue listar quem pertence à empresa, com nome, identificador, cargo e as datas de criação e de atualização do vínculo. Essa lista não traz último acesso. Também já consegue trocar o cargo e retirar a pessoa da empresa. Não consegue alterar o nome de outra pessoa, nem gravar um metadado do vínculo, nem ler o último login das outras pessoas. Esses três últimos dependem de chave secreta, que está proibida no web e no serviço.
- O token de sessão da plataforma continua válido até expirar. Retirar a pessoa da empresa não invalida, por si, um token que já foi emitido. Por isso o FR-006 não escolhe o mecanismo.
- O nome da lista é o nome público. O e-mail da lista é o identificador da pessoa na empresa. O perfil da LLT-174 continua sendo a edição da própria pessoa e não é a tela em que o administrador edita os outros.
- A trava do último administrador é premissa de trabalho, não decisão fechada: imediatamente antes de rebaixar ou desativar, a tela percorre todas as páginas de administradores e recusa se houver apenas um. Se a plataforma recusar a ação, a tela mostra o erro e recarrega. O serviço não enxerga a lista de membros sem chave secreta, então não é a trava sozinho. Duas ações simultâneas continuam um risco residual.
- Não há, nesta versão da spec, botão de reativar. Cada opção do mecanismo de desativação diz se a pessoa continua na lista e se a volta é possível. Isso não foi escolhido.
- Textos próprios desta tela ficam em português, como os de Equipe. O rótulo Equipe do menu continua o que a moldura já traduz.
- Nenhuma chave secreta (`sk_` ou `CLERK_SECRET_KEY`) entra no web nem no serviço. Se uma chamada nova ao serviço for necessária depois do esclarecimento, ela passa pelo cliente já usado pelo aplicativo. Esta história não cria essa chamada antes da decisão.
- A verificação automática da trava do último administrador, dos dois cargos e da separação entre convite pendente e usuário vinculado faz parte da conclusão, no mesmo tipo de checagem já usado em Equipe. O acesso real da pessoa desativada fica no roteiro manual, porque depende do mecanismo ainda aberto.

### Configuração da plataforma (outra pessoa)

Isto não é implementação do aplicativo. Além do que a LLT-167 já pediu (organizações habilitadas, convites, prazo de 7 dias, papéis de administrador e de membro, retorno para as telas de entrada), esta história não pede item novo no dashboard:

- O administrador da empresa já lê e gere os membros por padrão. Sem isso, a lista, a troca de cargo e a retirada da empresa não funcionam na sessão.
- Não criar chave secreta no aplicativo web nem no serviço para listar, editar ou desativar.
- Não há prazo, URL de retorno nem papel novo para configurar por causa desta história.
