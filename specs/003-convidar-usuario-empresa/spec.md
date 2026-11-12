# Feature Specification: Convidar usuário para a empresa

**Feature Branch**: `LLT-167-convidar-usuario-para-a-empresa`

**Created**: 2026-11-12

**Status**: Draft — aguardando esclarecimento

**Input**: User description: "LLT-167 Convidar usuário para a empresa (épico LLT-99, feature LLT-119 Gestão de usuários, E03.F1.1). Como administrador, quero convidar pessoas para acessar o sistema com um cargo. O convite é enviado por e-mail com prazo de validade. Ao aceitar, a pessoa fica vinculada à empresa (tenant) com o cargo escolhido. Convite expirado ou revogado não pode ser usado. Relacionado a USID_029 e USID_048. Este artefato cobre somente o aplicativo web. O serviço que guarda o convite e o vínculo é especificado à parte, e o contrato entre os dois será alinhado depois. A configuração da plataforma de identidade fica com outra pessoa; aqui só se registra o que ela precisaria ajustar."

## Clarifications

### Session 2026-11-12

Nenhuma pergunta foi respondida. As cinco decisões abaixo estão abertas de propósito. A recomendação de cada uma serve para o responsável escolher; ela não foi copiada para os requisitos, os cenários nem os critérios de sucesso.

- Q: Por onde o convite sai e quem guarda o cargo até o aceite? → A: pendente (ver pergunta 1).
- Q: Quais cargos a tela oferece? → A: pendente (ver pergunta 2).
- Q: Onde fica a tela e quem a enxerga? → A: pendente (ver pergunta 3).
- Q: A lista de convites pendentes, com revogar e reenviar, entra nesta história? → A: pendente (ver pergunta 4).
- Q: Como a pessoa convidada aceita? → A: pendente (ver pergunta 5).

#### Pergunta 1 — Canal do convite

**Pergunta:** O e-mail do convite parte do navegador de quem convida, pela organização já usada na entrada, ou o aplicativo pede isso ao serviço da empresa?

**Por que importa:** Define se o web fala com a plataforma de identidade ou só com o serviço, onde o cargo fica guardado e quem garante o prazo e a revogação. O contrato com o serviço ainda não existe.

**Recomendação:** Opção C. O aplicativo só pede o convite ao serviço da empresa. O serviço é quem cria o convite de organização e envia o e-mail, e também guarda o cargo escolhido até o aceite. O segredo da plataforma continua só no serviço. Isso combina com o que o web já faz ao criar empresa (a tela de convite da plataforma fica desligada porque o convite é do serviço) e com o critério de vincular a pessoa à empresa com o cargo escolhido. A opção A cumpriria o e-mail e o prazo sem segredo no navegador, mas deixaria o cargo apenas na organização da entrada e dispensaria o serviço nesta história.

| Opção | Descrição |
| --- | --- |
| A | O navegador de quem já administra a empresa envia o convite de organização. A própria plataforma manda o e-mail, conta o prazo e recusa o que expirou ou foi revogado. O cargo é um papel dessa organização. |
| B | O aplicativo pede o convite ao serviço da empresa. O serviço manda o e-mail, conta o prazo e grava o cargo, sem usar o convite de organização da plataforma. |
| C | O aplicativo pede o convite ao serviço. O serviço cria o convite de organização (o e-mail, o prazo e a recusa de expirado ou revogado vêm daí) e grava o cargo na empresa. O segredo fica no serviço. |
| Curta | Outra resposta em até 5 palavras. |

#### Pergunta 2 — Cargos na tela

**Pergunta:** Quais cargos o administrador pode escolher ao convidar?

**Por que importa:** A história exige um cargo no aceite, mas o catálogo e a matriz de permissões ainda são outra história (LLT-169), não fechada. O serviço, hoje, só separa administrador de quem não é administrador.

**Recomendação:** Opção A. Oferecer Administrador e Membro usa a única distinção que a empresa já aplica. Gestor, Visualizador e Usuário Master aparecem em materiais antigos com a matriz ainda pendente; mostrá-los aqui prometeria permissões que esta história não entrega. Trocar o cargo de quem já entrou continua fora, na LLT-170.

| Opção | Descrição |
| --- | --- |
| A | Só Administrador e Membro. Administrador é quem já pode administrar a empresa; Membro é qualquer outra pessoa vinculada. |
| B | Administrador, Gestor e Visualizador, como rótulos do convite, sem aplicar uma matriz de permissões nesta história. |
| C | A tela mostra a lista que o serviço devolver. Enquanto essa lista não existir, não há convite. |
| D | Só Administrador. |
| Curta | Outra resposta em até 5 palavras. |

#### Pergunta 3 — Lugar da tela

**Pergunta:** Onde o administrador encontra o convite, e quem mais vê essa entrada?

**Por que importa:** O menu já tem o item Equipe, em Administração, e esse item hoje não abre tela. A história é de administrador. As configurações da empresa são outro dado e outro fluxo.

**Recomendação:** Opção A. Uma rota nova, aberta pelo item Equipe, visível e utilizável só pelo administrador da empresa selecionada. Quem não administra não vê o item e, se abrir o endereço, recebe a recusa de acesso já usada nas outras áreas. A rota sugerida é `/equipe`.

| Opção | Descrição |
| --- | --- |
| A | Rota nova no item Equipe, só para o administrador da empresa selecionada. |
| B | Seção nova dentro das configurações da empresa, só para o administrador. |
| C | Qualquer pessoa já vinculada à empresa selecionada vê e envia convite. |
| Curta | Outra resposta em até 5 palavras. |

#### Pergunta 4 — Pendentes, revogar e reenviar

**Pergunta:** Nesta história o administrador vê os convites ainda não aceitos e pode revogá-los e reenviá-los?

**Por que importa:** O critério de aceite exige que um convite revogado não seja usado. Sem uma ação na tela, a revogação não tem dono no aplicativo. A LLT-168 lista quem já pertence à empresa (nome, e-mail, cargo, status e último acesso); ela não descreve convite pendente.

**Recomendação:** Opção A. A lista de pendentes, com e-mail, cargo, validade e situação, mais revogar e reenviar, fica nesta história. Revogar torna o convite inutilizável. Reenviar repete o mesmo convite pendente, sem abrir um segundo convite utilizável para o mesmo e-mail. Quem já aceitou não aparece nessa lista.

| Opção | Descrição |
| --- | --- |
| A | Lista de pendentes, com revogar e reenviar, nesta história. |
| B | Esta história só envia. A lista, a revogação e o reenvio ficam para a LLT-168. |
| C | Lista de pendentes com revogar, sem reenviar. Um novo envio substitui o pendente do mesmo e-mail. |
| Curta | Outra resposta em até 5 palavras. |

#### Pergunta 5 — Aceite de quem foi convidado

**Pergunta:** A pessoa convidada aceita nas telas de entrada que já existem ou numa tela nova do LhamaLog?

**Por que importa:** O resultado obrigatório é o vínculo com o cargo. Uma tela nova de aceite muda o escopo e depende de um contrato que ainda será alinhado. O aplicativo hoje não tem endereço de aceite de convite.

**Recomendação:** Opção A. O link do e-mail abre as telas de entrada já existentes. Não há rota nova de aceite. Quando o aceite é válido, a pessoa passa a pertencer àquela empresa com o cargo escolhido no convite. Expirado ou revogado é recusado nesse mesmo fluxo, com uma mensagem clara, e não cria vínculo. O endereço de retorno depois do aceite é configuração da plataforma, anotada para outra pessoa.

| Opção | Descrição |
| --- | --- |
| A | O link do e-mail usa as telas de entrada já existentes. Sem rota nova. O vínculo e o cargo valem ao concluir um aceite válido. |
| B | Uma rota nova do LhamaLog mostra a empresa e o cargo e pede confirmação antes de vincular. |
| C | O link usa as telas de entrada, mas o cargo só vale depois que o serviço confirma. Se essa confirmação falhar, a pessoa entra na empresa sem o cargo e vê um aviso. |
| Curta | Outra resposta em até 5 palavras. |

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Enviar um convite com cargo (Priority: P1)

Um administrador, com uma empresa selecionada, convida uma pessoa pelo e-mail e escolhe um cargo. O convite segue por e-mail e tem prazo de validade. Se o envio falha, não fica um convite que possa ser usado.

**Why this priority**: Sem o envio com cargo e prazo, a história não começa. É o menor recorte que um administrador percebe.

**Independent Test**: Com uma empresa selecionada, um administrador informa um e-mail válido, escolhe um cargo permitido, envia e vê a confirmação de que o convite foi enviado e de que ele expira. Um e-mail inválido não envia.

**Acceptance Scenarios**:

1. **Given** um administrador com uma empresa selecionada, **When** abre o convite, **Then** informa um e-mail, escolhe um cargo da lista permitida e envia.
2. **Given** um envio bem-sucedido, **When** a confirmação aparece, **Then** ela identifica o e-mail, o cargo escolhido e o fato de que o convite expira.
3. **Given** um e-mail vazio ou malformado, **When** o administrador tenta enviar, **Then** o campo é explicado e nenhum convite utilizável é criado.
4. **Given** um envio em andamento, **When** o administrador tenta enviar de novo, **Then** há um único envio e o formulário fica bloqueado até a resposta.
5. **Given** falha no envio, **When** a resposta chega, **Then** há um alerta, os dados digitados permanecem para correção e não existe convite utilizável produzido por essa tentativa.
6. **Given** nenhuma empresa está selecionada, **When** a pessoa abre a área autenticada, **Then** não há envio e a orientação é a mesma já usada para pedir a seleção de uma empresa.
7. **Given** uma pessoa autenticada que não administra a empresa selecionada, **When** tenta convidar, **Then** o convite não é criado e ela vê que não tem acesso.

---

### User Story 2 - Aceitar e entrar na empresa com o cargo (Priority: P1)

A pessoa convidada aceita um convite ainda válido. A partir daí ela pertence à empresa daquele convite, com o cargo que foi escolhido no envio, e não a outra empresa.

**Why this priority**: O e-mail sem o vínculo não cumpre a história. O aceite é o momento em que o cargo passa a valer.

**Independent Test**: Aceitar um convite válido para a empresa A com um cargo escolhido. A pessoa passa a acessar A com esse cargo. O mesmo aceite não dá acesso à empresa B.

**Acceptance Scenarios**:

1. **Given** um convite válido para uma empresa e um cargo, **When** a pessoa aceita, **Then** fica vinculada somente àquela empresa e o cargo do vínculo é o cargo escolhido no envio.
2. **Given** a pessoa já tem conta, **When** aceita um convite válido, **Then** o vínculo nasce como no caso de quem ainda vai criar a conta: a empresa e o cargo são os do convite.
3. **Given** um convite já aceito, **When** o link é usado de novo, **Then** não nasce um segundo vínculo e o cargo já aplicado permanece.
4. **Given** o cargo escolhido no envio deixou de ser permitido, **When** a pessoa tenta aceitar, **Then** o aceite é recusado e nenhum outro cargo é atribuído no lugar.

---

### User Story 3 - Impedir convite expirado ou revogado (Priority: P1)

Um convite que passou do prazo, ou que o administrador revogou, não entra. Não cria vínculo e não aplica cargo.

**Why this priority**: É critério de aceite explícito. Sem isso, um link antigo continuaria dando acesso.

**Independent Test**: Tentar aceitar um convite com o prazo vencido. Tentar aceitar outro, ainda no prazo, depois que ele foi revogado. Nos dois casos a pessoa vê a recusa e continua sem vínculo naquela empresa. Quem executa a revogação na tela depende da pergunta 4.

**Acceptance Scenarios**:

1. **Given** um convite cujo prazo acabou, **When** a pessoa tenta aceitar, **Then** o aceite é recusado, nenhum vínculo é criado e a mensagem deixa claro que o convite expirou.
2. **Given** um convite pendente que foi revogado, **When** a pessoa usa o link, **Then** o aceite é recusado, nenhum vínculo é criado e a mensagem deixa claro que o convite foi revogado.
3. **Given** um convite já aceito, **When** ele é tratado como se ainda pudesse ser revogado, **Then** o vínculo existente permanece.

---

### Edge Cases

- E-mail com espaços nas pontas: os espaços são removidos antes de validar. Só espaços é vazio e é recusado.
- E-mail já vinculado à empresa selecionada: nenhum convite novo é criado e o administrador vê que a pessoa já pertence à empresa.
- Já existe convite pendente para o mesmo e-mail na mesma empresa: não nasce um segundo convite utilizável.
- O administrador convida o próprio e-mail da sessão: tratado como pessoa que já pertence à empresa.
- Convite para outra empresa que não a selecionada: impossível. A empresa do convite é a empresa ativa.
- Troca de empresa ou saída da tela com um pedido em curso: a resposta atrasada é descartada e não cria convite na empresa que ficou na tela.
- Sessão expirada: a pessoa volta a entrar, como nas configurações da empresa.
- Acesso negado no envio: a pessoa vê que não tem acesso. A sessão não é encerrada por essa recusa de negócio.
- Serviço indisponível ou resposta ilegível: mensagem de falha, sem convite utilizável criado pela tentativa.
- Prazo e revogação ao mesmo tempo: se o prazo acabou, a pessoa vê expiração. Se ainda estava no prazo e foi revogado, vê revogação. Nos dois casos não há vínculo.
- Lista de cargos vazia ou cargo fora da lista: o envio é recusado e o campo é explicado.
- A forma de achar o convite para revogar, e se existe reenvio, dependem da pergunta 4. Enquanto ela estiver aberta, o cenário de revogação exige apenas que um convite revogado não possa ser aceito.
- O lugar do menu e o desenho da tela de aceite dependem das perguntas 3 e 5. Os resultados de envio, vínculo, expiração e revogação não dependem dessas escolhas.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O aplicativo MUST permitir que o administrador da empresa selecionada convide uma pessoa pelo e-mail, com exatamente um cargo escolhido na hora do envio.
- **FR-002**: Quem não administra a empresa selecionada MUST NOT criar, reenviar nem revogar convite. A tentativa MUST explicar a falta de acesso e MUST NOT encerrar a sessão por essa recusa.
- **FR-003**: Sem empresa selecionada, o aplicativo MUST NOT criar, listar nem revogar convite e MUST orientar a pessoa a selecionar ou cadastrar uma empresa, como já faz nas outras áreas autenticadas.
- **FR-004**: O e-mail MUST ser obrigatório e MUST ser um endereço utilizável, depois de removidos os espaços das pontas. Valor vazio ou malformado MUST ser explicado no campo e MUST NOT gerar convite.
- **FR-005**: O cargo MUST ser exatamente um valor da lista permitida naquele momento. A lista em si é [NEEDS CLARIFICATION: quais cargos aparecem — Administrador e Membro, os rótulos ainda não fechados do catálogo, a lista devolvida pelo serviço, ou só Administrador?].
- **FR-006**: Um envio confirmado MUST produzir um convite por e-mail, com prazo de validade, para a empresa que estava selecionada. A confirmação MUST mostrar o e-mail, o cargo e o fato de que o convite expira. O administrador MUST NOT informar um prazo avulso: a validade é a configurada para os convites.
- **FR-007**: O canal que envia o e-mail e guarda o cargo até o aceite é [NEEDS CLARIFICATION: convite de organização a partir do navegador, pedido só ao serviço, ou pedido ao serviço para que ele crie o convite de organização e grave o cargo?]. Em todas as opções o aplicativo MUST NOT receber nem guardar segredo da plataforma de identidade.
- **FR-008**: Falha de envio MUST ser um alerta, MUST preservar o que foi digitado e MUST NOT deixar convite utilizável nascido dessa tentativa. Durante o envio MUST haver um único pedido e o formulário MUST permanecer bloqueado até a resposta.
- **FR-009**: O aceite de um convite ainda válido MUST vincular a pessoa somente à empresa daquele convite e MUST aplicar o cargo escolhido no envio. MUST NOT vincular outra empresa nem substituir o cargo por um padrão diferente do escolhido.
- **FR-010**: Se o cargo escolhido no envio não for mais permitido no aceite, o aceite MUST ser recusado e MUST NOT atribuir outro cargo.
- **FR-011**: Convite expirado MUST NOT ser aceito e MUST NOT criar vínculo. A pessoa MUST entender que o prazo acabou.
- **FR-012**: Convite revogado MUST NOT ser aceito e MUST NOT criar vínculo. A pessoa MUST entender que o convite foi revogado. Revogar um convite já aceito MUST NOT desfazer o vínculo.
- **FR-013**: Onde o administrador revoga, e se pode reenviar, é [NEEDS CLARIFICATION: lista de pendentes com revogar e reenviar nesta história, só o envio nesta história, ou lista com revogar e sem reenviar?]. Enquanto houver convite pendente para o mesmo e-mail na mesma empresa, o aplicativo MUST NOT criar um segundo convite utilizável.
- **FR-014**: E-mail já vinculado à empresa selecionada, inclusive o e-mail de quem está convidando, MUST NOT receber convite novo. A tela MUST explicar que a pessoa já pertence à empresa.
- **FR-015**: O lugar da tela no menu e quem a vê são [NEEDS CLARIFICATION: rota nova no item Equipe só para administrador, seção dentro das configurações da empresa só para administrador, ou qualquer membro da empresa?].
- **FR-016**: O percurso de quem aceita é [NEEDS CLARIFICATION: link do e-mail nas telas de entrada já existentes, rota nova de confirmação no LhamaLog, ou entrada existente com o cargo só depois de uma confirmação extra do serviço?]. O resultado de um aceite válido permanece o de FR-009.
- **FR-017**: Trocar de empresa ou abandonar a tela MUST descartar a resposta de um pedido anterior. Essa resposta MUST NOT criar convite na empresa que ficou em foco.
- **FR-018**: Sessão expirada MUST seguir a recuperação já conhecida: entrar de novo. Falha de rede MUST permitir nova tentativa, sem convite utilizável criado pela tentativa falha.
- **FR-019**: Esta história MUST NOT listar, editar nem desativar quem já pertence à empresa, MUST NOT definir a matriz de permissões, MUST NOT alterar o cargo de quem já aceitou e MUST NOT escolher produtos do convidado.
- **FR-020**: Os campos do convite MUST ter rótulo visível, erro associado ao campo e operação por teclado, no mesmo padrão das configurações da empresa. Sucesso é um aviso de status. Erro é um alerta.
- **FR-021**: O aplicativo MUST NOT alterar, nesta história, perfil, dados da empresa, contexto da empresa nem produtos. O convite não regrava essas entidades.

### Key Entities *(include if feature involves data)*

- **Convite**: O pedido para uma pessoa entrar numa empresa. Atributos: e-mail, cargo escolhido, empresa, quem convidou, prazo de validade e situação. A situação é pendente, aceito, expirado ou revogado. Existe no máximo um convite utilizável por e-mail em cada empresa.
- **Vínculo com a empresa**: A pessoa passa a pertencer à empresa do convite, com o cargo escolhido no envio. Nasce no aceite válido. Não nasce de convite expirado, revogado ou falho.
- **Cargo**: O papel escolhido no convite e aplicado no vínculo. A lista oferecida na tela depende da pergunta 2. Não é o nome da empresa mostrado hoje no cabeçalho.
- **Administrador da empresa**: A pessoa que, na empresa selecionada, já pode administrar. Só ela convida. A definição fina de quem mais verá a tela depende da pergunta 3.
- **Empresa selecionada**: A organização ativa da sessão. É o tenant do convite. Não há convite sem ela, nem convite para uma empresa diferente da ativa.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um administrador com empresa selecionada preenche e-mail válido e um cargo permitido e recebe a confirmação de envio em menos de 2 minutos, sem sair da área autenticada.
- **SC-002**: Em 100% dos aceites de convite ainda válido, a pessoa fica vinculada somente à empresa do convite e o cargo do vínculo é o cargo escolhido no envio.
- **SC-003**: Em 100% das tentativas de usar convite expirado ou revogado, o aceite é recusado, nenhum vínculo novo aparece e a mensagem distingue expiração de revogação.
- **SC-004**: Em 100% das tentativas de quem não administra a empresa selecionada, nenhum convite é criado.
- **SC-005**: Em 100% dos casos sem empresa selecionada, nenhum convite é criado e a pessoa vê a orientação para selecionar ou cadastrar uma empresa.
- **SC-006**: Em 100% das falhas de envio e dos e-mails inválidos, não resta convite utilizável produzido por aquela tentativa.
- **SC-007**: Em 100% das respostas de um pedido abandonado, por saída da tela ou troca de empresa, o que a pessoa vê na empresa atual não muda por causa dessa resposta.

## Out of Scope

- Listar, editar e desativar usuários já vinculados (LLT-168), inclusive último acesso e a proteção do último administrador.
- Fechar o catálogo de cargos e a matriz de permissões (LLT-169) e passar a esconder ações conforme essa matriz (LLT-170).
- Restringir produtos no momento do convite (LLT-171). O acesso automático de administrador a todos os produtos, e o acesso dos demais só ao que já têm vínculo, permanece como está.
- Manter e-mail (LLT-172), notificações (LLT-173) e perfil (LLT-174).
- Convite em massa, convite sem cargo e prazo digitado pelo administrador.
- Configurar a plataforma de identidade. Outra pessoa faz isso; a lista do que ajustar está nas premissas.
- Colocar segredo da plataforma no aplicativo web.
- Travar nesta especificação o contrato do serviço. Ele será alinhado com a especificação paralela do serviço.
- Redesenhar entrada, cadastro, criação de empresa ou a etapa de escolher organização.

## Assumptions

- A empresa ativa da sessão é o tenant. O serviço já recusa pedido sem essa empresa e já trata como administrador quem tem o papel de organização `admin`, com ou sem o prefixo `org:`. O cabeçalho hoje mostra o nome da empresa onde um rótulo de cargo poderia aparecer; isso não é o cargo desta história.
- O aplicativo web não lê, hoje, o papel de administrador para esconder menu. Esta história passa a precisar dessa distinção, alinhada à regra que o serviço já usa. Quem exatamente vê o item de menu depende da pergunta 3.
- Criar empresa continua sem a tela de convite da plataforma. O comentário já existente atribui o convite de membros ao serviço. A pergunta 1 decide se esta história mantém esse caminho.
- O prazo não é um campo do formulário. Ele é o prazo configurado para os convites. A tela só precisa deixar claro que o convite expira.
- Um segundo convite utilizável para o mesmo e-mail e a mesma empresa não é criado enquanto o anterior puder ser aceito. O que a tela oferece nesse caso (explicar, revogar ou reenviar) depende da pergunta 4.
- Textos desta tela ficam em português, como os textos próprios de empresa e de produtos. O idioma do perfil não passa a traduzir esta tela.
- Chamadas ao serviço da empresa, quando a pergunta 1 as exigir, usam o cliente autenticado já existente. Não entra biblioteca nova. Não entra segredo. Se a pergunta 1 escolher o convite direto no navegador, esse envio não passa pelo serviço; o segredo continua de fora mesmo assim.
- A especificação do serviço, na branch de mesmo nome, pode detalhar persistência, e-mail e vínculo. Este arquivo não fixa caminho, corpo nem códigos além do comportamento visível ao administrador e à pessoa convidada.
- Verificação automática do formulário, da validação do e-mail e do envio único faz parte da conclusão, no mesmo tipo de checagem já usado para as configurações da empresa, depois que as perguntas abertas forem respondidas.

### Configuração da plataforma (outra pessoa)

Isto não é implementação do aplicativo. É o que precisaria estar ajustado na plataforma de identidade para o convite funcionar, conforme a decisão da pergunta 1:

- Convites de organização habilitados, se o e-mail for o convite de organização.
- Prazo de validade desse convite, porque a tela não pede um prazo.
- Papéis de organização iguais aos cargos que a pergunta 2 deixar na tela. Hoje o serviço reconhece administrador pelo papel `admin`.
- Endereço para onde a pessoa volta depois de aceitar, apontando para o aplicativo, se a pergunta 5 usar as telas de entrada já existentes.
- O segredo da plataforma permanece fora do aplicativo web em qualquer opção. Se o serviço criar o convite, o segredo fica só no serviço.
