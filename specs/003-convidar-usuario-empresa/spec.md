# Feature Specification: Convidar usuário para a empresa

**Feature Branch**: `LLT-167-convidar-usuario-para-a-empresa`

**Created**: 2026-11-12

**Status**: Especificado

**Input**: User description: "LLT-167 Convidar usuário para a empresa (épico LLT-99, feature LLT-119 Gestão de usuários, E03.F1.1). Como administrador, quero convidar pessoas para acessar o sistema com um cargo. O convite é enviado por e-mail com prazo de validade. Ao aceitar, a pessoa fica vinculada à empresa (tenant) com o cargo escolhido. Convite expirado ou revogado não pode ser usado. Relacionado a USID_029 e USID_048. Este artefato cobre somente o aplicativo web."

## Clarifications

### Session 2026-11-12

- Q: Por onde o convite sai e quem guarda o cargo até o aceite? → A: O Web cria o convite de organização na sessão do administrador, pelo SDK do navegador (`organization.inviteMember`, `getInvitations` e `revoke`). A plataforma envia o e-mail, controla a validade e a revogação. O Core não guarda convite, não tem API de convite e não usa chave secreta. Esta decisão substitui, nesta história, a leitura do ADR_114. O comentário atual em `src/features/auth/components/CreateOrganizationPage.tsx` e a linha do README sobre `/organizacoes/nova` dizem que o convite de membros é feito pelo backend, não pela UI da plataforma. Isso fica em conflito com esta história e precisa ser reescrito na implementação: criar empresa continua sem a etapa de convite; convidar alguém passa a ser a tela `/equipe`, no navegador, sem segredo e sem API nova no Core.
- Q: Quais cargos a tela oferece? → A: Só o administrador convida. No convite ele escolhe Administrador (`org:admin`) ou Membro (`org:member`).
- Q: Qual é o prazo? → A: 7 dias, configurados no dashboard da plataforma por outra pessoa. A tela não pede um prazo. A documentação desta história lista o que precisa ser configurado, inclusive reativar convites se estiverem desligados.
- Q: Onde fica a tela e quem a enxerga? → A: Rota nova `/equipe`, aberta pelo item Equipe do menu. Visível e utilizável só pelo administrador da empresa selecionada. Quem não administra não vê o item e, no acesso direto, recebe a recusa padrão.
- Q: A lista de pendentes, com revogar e reenviar, entra nesta história? → A: Sim. A lista mostra e-mail, cargo, validade e situação, com revogar e reenviar. Reenviar não pode deixar dois convites utilizáveis para o mesmo e-mail.
- Q: Como a pessoa convidada aceita? → A: Pelas telas de entrada já existentes, sem rota nova. Expirado ou revogado é recusado com mensagem clara.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Enviar um convite com cargo (Priority: P1)

Um administrador, com uma empresa selecionada, abre Equipe, informa um e-mail e escolhe Administrador ou Membro. O convite segue por e-mail e vale 7 dias. Se o envio falha, não fica um convite que possa ser usado.

**Why this priority**: Sem o envio com cargo e prazo, a história não começa. É o menor recorte que um administrador percebe.

**Independent Test**: Com uma empresa selecionada, um administrador informa um e-mail válido, escolhe Administrador ou Membro, envia e vê a confirmação com o e-mail, o cargo e o prazo de 7 dias. Um e-mail inválido não envia.

**Acceptance Scenarios**:

1. **Given** um administrador com uma empresa selecionada, **When** abre Equipe, **Then** informa um e-mail, escolhe Administrador ou Membro e envia.
2. **Given** um envio bem-sucedido, **When** a confirmação aparece, **Then** ela identifica o e-mail, o cargo escolhido e o prazo de 7 dias.
3. **Given** um e-mail vazio ou malformado, **When** o administrador tenta enviar, **Then** o campo é explicado e nenhum convite utilizável é criado.
4. **Given** um envio em andamento, **When** o administrador tenta enviar de novo, **Then** há um único envio e o formulário fica bloqueado até a resposta.
5. **Given** falha no envio, **When** a resposta chega, **Then** há um alerta, os dados digitados permanecem para correção e não existe convite utilizável produzido por essa tentativa.
6. **Given** nenhuma empresa está selecionada, **When** a pessoa abre a área autenticada, **Then** não há envio e a orientação é a mesma já usada para pedir a seleção de uma empresa.
7. **Given** uma pessoa autenticada que não administra a empresa selecionada, **When** o menu é exibido, **Then** o item Equipe não aparece. **When** ela abre `/equipe` direto, **Then** vê a recusa "Você não tem acesso. Selecione uma empresa válida." e a sessão permanece aberta.

---

### User Story 2 - Aceitar e entrar na empresa com o cargo (Priority: P1)

A pessoa convidada aceita um convite ainda válido nas telas de entrada que já existem. A partir daí ela pertence à empresa daquele convite, com o cargo escolhido no envio, e não a outra empresa.

**Why this priority**: O e-mail sem o vínculo não cumpre a história. O aceite é o momento em que o cargo passa a valer.

**Independent Test**: Aceitar um convite válido para a empresa A como Membro, pelas telas de entrada já existentes, sem rota nova. A pessoa passa a acessar A como Membro. O mesmo aceite não dá acesso à empresa B. Repetir com Administrador.

**Acceptance Scenarios**:

1. **Given** um convite válido para uma empresa e um cargo, **When** a pessoa aceita nas telas de entrada já existentes, **Then** fica vinculada somente àquela empresa e o cargo do vínculo é o cargo escolhido no envio (`org:admin` ou `org:member`).
2. **Given** a pessoa já tem conta, **When** aceita um convite válido, **Then** o vínculo nasce como no caso de quem ainda vai criar a conta: a empresa e o cargo são os do convite.
3. **Given** um convite já aceito, **When** o link é usado de novo, **Then** não nasce um segundo vínculo e o cargo já aplicado permanece.
4. **Given** esta entrega concluída, **When** a pessoa percorre as rotas, **Then** não existe rota nova de aceite.

---

### User Story 3 - Acompanhar pendentes e impedir convite expirado ou revogado (Priority: P1)

O administrador vê os convites ainda não aceitos, com e-mail, cargo, validade e situação, e pode revogar ou reenviar. Um convite que passou dos 7 dias, ou que foi revogado, não entra. Reenviar não deixa dois convites utilizáveis para o mesmo e-mail.

**Why this priority**: É critério de aceite explícito. Sem a lista, o administrador não tem como revogar. Sem a recusa, um link antigo continuaria dando acesso.

**Independent Test**: Enviar um convite, vê-lo na lista e revogá-lo. O link revogado é recusado com mensagem de revogação e não cria vínculo. Reenviar um pendente e conferir que só um convite utilizável permanece para aquele e-mail. Um convite com o prazo de 7 dias vencido é recusado com mensagem de expiração, distinta da de revogação.

**Acceptance Scenarios**:

1. **Given** convites pendentes da empresa selecionada, **When** o administrador abre Equipe, **Then** a lista mostra e-mail, cargo, validade de 7 dias após a criação e a situação.
2. **Given** um convite pendente, **When** o administrador o revoga, **Then** ele sai dos convites utilizáveis.
3. **Given** um convite revogado, **When** a pessoa usa o link antigo, **Then** o aceite é recusado, nenhum vínculo é criado e a mensagem é "Este convite foi revogado e não pode ser usado."
4. **Given** um convite cujo prazo de 7 dias acabou, **When** a pessoa tenta aceitar, **Then** o aceite é recusado, nenhum vínculo é criado e a mensagem é "Este convite expirou e não pode ser usado."
5. **Given** um convite pendente para um e-mail, **When** o administrador reenvia, **Then** o pendente anterior deixa de ser utilizável antes do novo envio e, ao final, existe no máximo um convite utilizável para esse e-mail, com o mesmo cargo.
6. **Given** a revogação do reenvio funcionou e o novo envio falhou, **When** a resposta chega, **Then** não resta convite utilizável daquela tentativa e o administrador pode tentar de novo.
7. **Given** um convite já aceito, **When** ele é tratado como se ainda pudesse ser revogado, **Then** o vínculo existente permanece.

---

### Edge Cases

- E-mail com espaços nas pontas: os espaços são removidos antes de validar. Só espaços é vazio e é recusado. A comparação de e-mail ignora maiúsculas e minúsculas.
- E-mail já vinculado à empresa selecionada: nenhum convite novo é criado e o administrador vê que a pessoa já pertence à empresa. A procura não pode parar na primeira página de membros.
- Já existe convite pendente para o mesmo e-mail na mesma empresa: um envio novo não cria o segundo. A tela explica e aponta o reenvio.
- O administrador convida o próprio e-mail da sessão: tratado como pessoa que já pertence à empresa.
- Convite para outra empresa que não a selecionada: impossível. A empresa do convite é a empresa ativa.
- Troca de empresa ou saída da tela com um pedido em curso: a resposta atrasada não altera a lista da empresa que ficou na tela. O convite, se chegou a ser criado, permanece na empresa que estava ativa no envio.
- Sessão expirada: a pessoa volta a entrar, como nas configurações da empresa.
- Acesso negado no envio ou no endereço direto: a pessoa vê "Você não tem acesso. Selecione uma empresa válida." A sessão não é encerrada por essa recusa de negócio.
- Plataforma indisponível ou resposta ilegível: mensagem de falha, sem convite utilizável criado pela tentativa.
- Prazo e revogação ao mesmo tempo: se os 7 dias acabaram, a pessoa vê expiração. Se ainda estava no prazo e foi revogado, vê revogação. Nos dois casos não há vínculo.
- Cargo fora de Administrador e Membro: o envio é recusado e o campo é explicado.
- Validade na lista: 7 dias depois da data de criação do convite. A plataforma é quem recusa depois desse prazo. A tela não oferece outro número de dias.
- Lista com mais de uma página: o administrador percorre as páginas e nenhum pendente fica fora do alcance só porque não coube na primeira.
- Reenvio com mais de um pendente legado para o mesmo e-mail: todos os pendentes desse e-mail deixam de ser utilizáveis antes de criar um único convite novo.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O aplicativo MUST permitir que o administrador da empresa selecionada convide uma pessoa pelo e-mail, com exatamente um cargo escolhido na hora do envio.
- **FR-002**: Quem não administra a empresa selecionada MUST NOT ver o item Equipe e MUST NOT criar, reenviar nem revogar convite. No acesso direto a `/equipe`, a pessoa MUST ver "Você não tem acesso. Selecione uma empresa válida." e a sessão MUST permanecer aberta.
- **FR-003**: Sem empresa selecionada, o aplicativo MUST NOT criar, listar nem revogar convite e MUST orientar a pessoa a selecionar ou cadastrar uma empresa, como já faz nas outras áreas autenticadas.
- **FR-004**: O e-mail MUST ser obrigatório e MUST ser um endereço utilizável, depois de removidos os espaços das pontas, no mesmo critério já usado para o e-mail da empresa. Valor vazio ou malformado MUST mostrar "Informe um e-mail válido." e MUST NOT gerar convite.
- **FR-005**: O cargo MUST ser exatamente Administrador (`org:admin`) ou Membro (`org:member`). A tela MUST NOT oferecer outro cargo. Administrador da sessão é quem tem o papel `org:admin`. Se a sessão entregar esse mesmo papel sem o prefixo (`admin`), também conta, porque é o critério que o serviço já usa. `org:member` não administra.
- **FR-006**: Um envio confirmado MUST produzir um convite por e-mail, com prazo de 7 dias contados da criação, para a empresa que estava selecionada. A confirmação MUST mostrar o e-mail, o cargo e o prazo de 7 dias. O administrador MUST NOT informar outro prazo.
- **FR-007**: O aplicativo MUST criar o convite na sessão já aberta do administrador, com `organization.inviteMember`. A lista MUST usar `getInvitations`. Revogar MUST usar `revoke` do convite. A plataforma envia o e-mail, aplica a validade e recusa o que expirou ou foi revogado. O Core MUST NOT guardar convite, MUST NOT ter API de convite nesta história e MUST NOT usar chave secreta. O aplicativo MUST NOT receber nem guardar segredo. Criar empresa MUST continuar sem a etapa de convite da plataforma.
- **FR-008**: Falha de envio MUST ser um alerta, MUST preservar o que foi digitado e MUST NOT deixar convite utilizável nascido dessa tentativa. Durante o envio, a revogação ou o reenvio, o aplicativo MUST fazer um único pedido daquela ação e MUST manter o controle correspondente bloqueado até a resposta.
- **FR-009**: O aceite de um convite ainda válido MUST vincular a pessoa somente à empresa daquele convite e MUST aplicar o cargo escolhido no envio. MUST NOT vincular outra empresa nem substituir o cargo por um padrão diferente do escolhido.
- **FR-010**: Cargo diferente de `org:admin` e `org:member` MUST ser recusado no envio e MUST NOT ser atribuído no aceite no lugar do cargo escolhido.
- **FR-011**: Convite expirado MUST NOT ser aceito e MUST NOT criar vínculo. A mensagem MUST ser "Este convite expirou e não pode ser usado."
- **FR-012**: Convite revogado MUST NOT ser aceito e MUST NOT criar vínculo. A mensagem MUST ser "Este convite foi revogado e não pode ser usado." Revogar um convite já aceito MUST NOT desfazer o vínculo.
- **FR-013**: A tela MUST listar os convites pendentes da empresa selecionada com e-mail, cargo, validade e situação. A validade exibida MUST ser 7 dias depois da criação. O administrador MUST poder revogar um pendente e reenviá-lo. Reenviar MUST tornar inutilizável cada pendente daquele e-mail antes de criar o próximo. Ao final MUST existir no máximo um convite utilizável para esse e-mail, com o mesmo cargo. Se o novo envio falhar depois da revogação, MUST NOT restar convite utilizável daquela tentativa.
- **FR-014**: E-mail já vinculado à empresa selecionada, inclusive o e-mail de quem está convidando, MUST NOT receber convite novo. A tela MUST explicar "Esta pessoa já pertence à empresa." A comparação MUST percorrer os membros da empresa, não só a primeira página.
- **FR-015**: A rota MUST ser `/equipe`, aberta pelo item Equipe do grupo Administração, no mesmo espaço autenticado de `/empresa`, `/produtos` e `/perfil`. O item MUST aparecer só para o administrador da empresa selecionada.
- **FR-016**: O aceite MUST ocorrer nas telas de entrada já existentes (`/sign-in` e `/sign-up`). O aplicativo MUST NOT criar rota nova de aceite. Expirado e revogado MUST produzir mensagens claras e distintas nessas telas.
- **FR-017**: Trocar de empresa ou abandonar a tela MUST descartar o efeito visual de um pedido anterior. Essa resposta MUST NOT alterar a lista da empresa que ficou em foco.
- **FR-018**: Sessão expirada MUST seguir a recuperação já conhecida: entrar de novo. Falha de rede MUST permitir nova tentativa, sem convite utilizável criado pela tentativa falha.
- **FR-019**: Esta história MUST NOT listar, editar nem desativar quem já pertence à empresa, MUST NOT definir a matriz de permissões, MUST NOT alterar o cargo de quem já aceitou e MUST NOT escolher produtos do convidado.
- **FR-020**: Os campos do convite MUST ter rótulo visível ("E-mail" e "Cargo"), erro associado ao campo e operação por teclado, no mesmo padrão das configurações da empresa. Sucesso é um aviso de status no formato "Convite enviado para {email} como {cargo}. Ele expira em 7 dias." Erro é um alerta. Já existir pendente utilizável MUST explicar "Já existe um convite pendente para este e-mail. Use reenviar." A lista, quando vazia, MUST dizer "Não há convite pendente."
- **FR-021**: O aplicativo MUST NOT alterar, nesta história, perfil, dados da empresa, contexto da empresa nem produtos. O convite não regrava essas entidades e MUST NOT chamar a API do Core para criar, listar, revogar ou reenviar convite.
- **FR-022**: Se a lista tiver mais convites pendentes do que uma página, o administrador MUST conseguir ver as páginas seguintes. Um pendente fora da página visível ainda MUST impedir um segundo convite utilizável para o mesmo e-mail.

### Key Entities *(include if feature involves data)*

- **Convite**: Pedido da plataforma para uma pessoa entrar na empresa ativa. Atributos visíveis: e-mail, cargo (`org:admin` ou `org:member`), data de criação, validade (criação mais 7 dias) e situação. Pendente pode ser revogado ou reenviado. Aceito não volta para a lista de pendentes e não é desfeito por uma revogação tardia. Expirado e revogado não criam vínculo. Existe no máximo um convite utilizável por e-mail em cada empresa. O Core não persiste esta entidade.
- **Vínculo com a empresa**: A pessoa passa a pertencer à organização da empresa do convite, com o cargo escolhido no envio. Nasce no aceite válido, na plataforma. Não nasce de convite expirado, revogado ou falho. O serviço continua reconhecendo a empresa pelo id da organização e o administrador pelo papel `admin`.
- **Cargo**: Só Administrador (`org:admin`) e Membro (`org:member`). Não é o nome da empresa mostrado hoje no cabeçalho.
- **Administrador da empresa**: Quem, na empresa selecionada, tem o papel `org:admin` (ou `admin`, se a sessão vier sem prefixo). Só essa pessoa vê Equipe e convida.
- **Empresa selecionada**: A organização ativa da sessão. É o tenant do convite. Não há convite sem ela, nem convite para uma empresa diferente da ativa.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um administrador com empresa selecionada preenche e-mail válido e um dos dois cargos e recebe a confirmação de envio, com prazo de 7 dias, em menos de 2 minutos, sem sair da área autenticada.
- **SC-002**: Em 100% dos aceites de convite ainda válido, a pessoa fica vinculada somente à empresa do convite e o cargo do vínculo é `org:admin` ou `org:member`, o que tiver sido escolhido no envio.
- **SC-003**: Em 100% das tentativas de usar convite expirado ou revogado, o aceite é recusado, nenhum vínculo novo aparece e a mensagem distingue expiração de revogação.
- **SC-004**: Em 100% das tentativas de quem não administra a empresa selecionada, o item Equipe não aparece, o acesso direto a `/equipe` mostra a recusa padrão e nenhum convite é criado.
- **SC-005**: Em 100% dos casos sem empresa selecionada, nenhum convite é criado e a pessoa vê a orientação para selecionar ou cadastrar uma empresa.
- **SC-006**: Em 100% das falhas de envio e dos e-mails inválidos, não resta convite utilizável produzido por aquela tentativa.
- **SC-007**: Em 100% das respostas de um pedido abandonado, por saída da tela ou troca de empresa, a lista da empresa atual não muda por causa dessa resposta.
- **SC-008**: Em 100% dos reenvios concluídos, existe no máximo um convite utilizável para aquele e-mail na empresa. Se o novo envio falha depois da revogação, esse número é zero para a tentativa.

## Out of Scope

- Listar, editar e desativar usuários já vinculados (LLT-168), inclusive último acesso e a proteção do último administrador.
- Fechar o catálogo de cargos e a matriz de permissões (LLT-169) e passar a esconder ações conforme essa matriz (LLT-170). Gestor, Visualizador e Usuário Master não entram nesta tela.
- Restringir produtos no momento do convite (LLT-171). O acesso automático de administrador a todos os produtos, e o acesso dos demais só ao que já têm vínculo, permanece como está.
- Manter e-mail (LLT-172), notificações (LLT-173) e perfil (LLT-174).
- Convite em massa, convite sem cargo e prazo digitado pelo administrador.
- Configurar o dashboard da plataforma. Outra pessoa faz isso; a lista do que ajustar está nas premissas.
- Colocar segredo da plataforma no aplicativo web ou no Core para esta história.
- API de convite no Core, persistência de convite no Core e qualquer chamada nova do Web ao Core para convidar.
- Redesenhar entrada, cadastro, criação de empresa ou a etapa de escolher organização. A criação de empresa continua sem a etapa de convite.
- Rota nova de aceite.

## Assumptions

- A empresa ativa da sessão é o tenant. O serviço já trata como administrador quem tem o papel `admin`, com ou sem o prefixo `org:`. O cabeçalho hoje mostra o nome da empresa onde um rótulo de cargo poderia aparecer; isso não é o cargo desta história.
- O aplicativo ainda não esconde item de menu por papel. Esta história passa a esconder Equipe de quem não administra.
- O comentário de `CreateOrganizationPage.tsx` e a frase do README sobre ADR_114 atribuem o convite de membros ao backend. A decisão desta história substitui essa leitura: o convite sai do navegador do administrador. A implementação reescreve o comentário e o README para não deixar as duas leituras ao mesmo tempo. `skipInvitationScreen` permanece.
- O método de convite do navegador não recebe quantidade de dias nem endereço de retorno. Os 7 dias e o retorno para as telas de entrada já existentes dependem do dashboard. A validade mostrada na lista é a criação mais 7 dias, para coincidir com essa configuração. O recurso de convite no navegador não expõe a data de expiração calculada pela plataforma.
- Um envio novo, com pendente utilizável para o mesmo e-mail, não cria outro. O reenvio é a ação que revoga e só então cria um.
- Textos próprios desta tela ficam em português, como os de empresa e de produtos. O rótulo Equipe do menu continua o que a moldura já traduz.
- Nenhuma chamada desta história usa `apiRequest` ou `useApi`, porque não há API de convite no Core. O padrão do Web permanece: se uma chamada ao Core existir no futuro, ela passa por esse cliente. Esta história não cria essa chamada. Não entra biblioteca nova. Não entra segredo.
- A verificação automática do e-mail, dos dois cargos, do prazo de 7 dias, da regra de um convite utilizável e do reconhecimento de administrador faz parte da conclusão, no mesmo tipo de checagem já usado para as configurações da empresa. Envio real, e-mail e aceite ficam no roteiro manual.

### Configuração da plataforma (outra pessoa)

Isto não é implementação do aplicativo. Outra pessoa ajusta o dashboard:

- Reativar convites de organização se estiverem desligados, e manter organizações habilitadas.
- Prazo de validade do convite em 7 dias. O navegador não envia esse número.
- Papéis `org:admin` e `org:member` disponíveis na organização.
- O link do e-mail precisa cair nas telas de entrada já existentes deste aplicativo (`/sign-in` e `/sign-up`). O método do navegador não define o endereço de retorno; o caminho da conta na plataforma é que aponta para cá.
- Nenhuma chave secreta no aplicativo web e nenhuma chave secreta no Core para convite. Não criar API de convite no Core.
