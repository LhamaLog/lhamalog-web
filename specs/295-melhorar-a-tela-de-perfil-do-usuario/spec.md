# Feature Specification: Melhorar a tela de perfil do usuário

**Feature Branch**: `LLT-295-melhorar-a-tela-de-perfil-do-usuario`

**Created**: 2026-11-25

**Status**: Draft

**Input**: User description: "LLT-295. Reformular /perfil como hub de conta, inspirado nas configurações do GitHub e no mock mobile de perfil (não há mock web). Cartão de identidade, seções Conta, Preferências, Notificações, Segurança e Ajuda, foto no cabeçalho e textos desta tela nos dois idiomas já usados no perfil. Sem planejar nem implementar nesta rodada."

## User Scenarios & Testing *(mandatory)*

A pessoa autenticada, com uma empresa selecionada, abre o próprio perfil e encontra um hub da conta dela. O cartão de identidade permanece visível. As cinco seções ocupam o restante: em janela larga, uma lista vertical ao lado do conteúdo; em janela estreita, as mesmas seções em abas ou seletor. Ao abrir `/perfil`, a seção inicial é Conta. Uma seção aparece por vez.

Esta história substitui o limite da [especificação anterior do perfil](../002-manter-perfil-usuario/spec.md) que restringia a tela a nome, idioma e fuso e excluía avatar. Não reabre o que essa especificação já fechou sobre idioma, fuso, versão, nome na sessão e moldura. As notificações deixam de ficar empilhadas sob o formulário e passam para a seção Notificações, com as mesmas regras da [especificação de canais e filtros](../005-configurar-canais-filtros-notificacao/spec.md).

### User Story 1 - Reconhecer a conta e editar o que é da pessoa (Priority: P1)

A pessoa vê quem ela é na empresa selecionada e, só depois de escolher Editar, altera nome, bio e cargo. E-mail, função, empresa e membro desde aparecem e não viram campos. A foto grande do cartão e a foto do cabeçalho são a mesma. Sem foto, os dois lugares mostram as iniciais do nome.

**Why this priority**: É a diferença visível entre o formulário atual e o hub. Sem o cartão e a edição separada da leitura, as outras seções não têm onde se apoiar.

**Independent Test**: Com empresa selecionada, abrir `/perfil`, conferir o cartão em modo leitura, editar nome, bio e cargo, salvar, reabrir e ver os mesmos valores. Alterar a foto e ver a foto nova no cartão e no cabeçalho sem entrar de novo. Cancelar restaura o último valor gravado.

**Acceptance Scenarios**:

1. **Given** uma empresa selecionada e uma conta com foto, **When** a pessoa abre `/perfil`, **Then** o cartão mostra a foto grande, o nome, o e-mail somente leitura, a função na empresa, o nome da empresa, o membro desde, a bio, o cargo e o botão Editar. O cabeçalho mostra a mesma foto.
2. **Given** a conta não tem foto, **When** o cartão e o cabeçalho aparecem, **Then** os dois mostram as iniciais do nome, não um quadro vazio.
3. **Given** o perfil em leitura, **When** a pessoa ainda não escolhe Editar, **Then** nome, bio e cargo não são campos editáveis.
4. **Given** a pessoa escolhe Editar, **When** a seção Conta abre a edição, **Then** só nome, bio e cargo podem ser alterados. E-mail, função, empresa e membro desde continuam somente leitura.
5. **Given** nome, bio e cargo válidos, **When** a pessoa salva e reabre o perfil, **Then** os três valores gravados aparecem de novo e o cabeçalho usa o nome gravado, sem novo login.
6. **Given** alterações ainda não salvas, **When** a pessoa cancela, **Then** nome, bio e cargo voltam ao último valor gravado e a foto não muda.
7. **Given** uma foto nova aceita, **When** a troca termina, **Then** o cartão e o cabeçalho mostram essa foto sem novo login. **Given** a troca falha, **When** a resposta chega, **Then** a foto anterior permanece e a pessoa vê o erro.
8. **Given** bio ou cargo vazios, **When** a pessoa salva, **Then** o vazio é aceito e a reabertura mostra o campo vazio. **Given** nome vazio, longo demais ou com caractere de controle, **When** a pessoa salva, **Then** o campo é explicado e nada é gravado.

---

### User Story 2 - Ajustar idioma, fuso, tema e acessibilidade (Priority: P1)

Na seção Preferências, a pessoa continua escolhendo Português (Brasil) ou English e um fuso internacional. O fuso agora é buscável e cada opção mostra o deslocamento em relação ao tempo universal, além da pré-visualização de agora. No mesmo lugar ela escolhe tema claro, escuro ou o do sistema, e liga ou desliga reduzir movimento, sublinhar links e contraste maior. Idioma e fuso continuam valendo como na especificação anterior. Tema e acessibilidade mudam a área autenticada, não só este cartão, e não alteram a configuração da empresa.

**Why this priority**: Idioma e fuso já são o perfil gravado. A busca do fuso, o tema e a acessibilidade são o restante do que a pessoa espera encontrar num hub de conta.

**Independent Test**: Buscar um fuso pelo nome ou pelo deslocamento, ver o deslocamento e a pré-visualização antes de salvar, salvar e reabrir. Escolher escuro, o tema do sistema, reduzir movimento, sublinhar links e contraste, e perceber o efeito na área autenticada. Cancelar devolve idioma e fuso ao último valor gravado.

**Acceptance Scenarios**:

1. **Given** a seção Preferências, **When** a pessoa busca um fuso pelo nome ou pelo deslocamento, **Then** a lista se reduz às opções compatíveis e cada opção visível mostra o identificador e o deslocamento atual.
2. **Given** um fuso escolhido e ainda não salvo, **When** a pessoa olha a pré-visualização, **Then** vê a data e a hora atuais nesse fuso, identificadas como pré-visualização. **When** cancela, **Then** fuso e pré-visualização voltam ao último valor gravado.
3. **Given** English gravado, **When** a pessoa percorre as cinco seções, inclusive notificações, carregamento, erro e vazio desta tela, **Then** as frases estão em inglês. Com Português (Brasil), as mesmas frases estão em português. As frases das outras telas permanecem em português.
4. **Given** a pessoa escolhe tema escuro, claro ou o do sistema, **When** navega na área autenticada, **Then** a aparência segue essa escolha. No tema do sistema, a aparência acompanha a mudança do sistema operacional enquanto essa opção continuar selecionada.
5. **Given** reduzir movimento, sublinhar links ou contraste maior ligados, **When** a pessoa usa a área autenticada, **Then** a animação não essencial para, os links de texto ficam sublinhados ou o contraste fica maior do que o tema padrão, conforme o que foi ligado. Cada opção funciona sozinha.
6. **Given** idioma ou fuso ainda não salvos, **When** a pessoa olha a moldura e as outras telas, **Then** continuam no último idioma gravado e as datas fora desta tela não mudam de fuso.

---

### User Story 3 - Manter as notificações dentro do hub (Priority: P2)

A seção Notificações mostra o mesmo cartão que já existe, com os mesmos canais e filtros e a mesma gravação. Mudam o lugar e o idioma das frases fixas da tela. O cartão deixa de aparecer empilhado sob o formulário de perfil.

**Why this priority**: O hub precisa reunir o que já é da pessoa sem reabrir as regras de notificação.

**Independent Test**: Abrir a seção, alterar e-mail ou um filtro, salvar, reabrir e ver a mesma escolha. Web continua obrigatório. Trocar de empresa recarrega as preferências da empresa nova. As frases fixas do cartão seguem o idioma do perfil.

**Acceptance Scenarios**:

1. **Given** a pessoa abre Notificações, **When** o cartão carrega, **Then** vê os mesmos canais e filtros de antes, com web obrigatório, e não vê esse cartão nas outras seções.
2. **Given** uma alteração válida, **When** a pessoa salva e reabre, **Then** a escolha permanece. Uma alteração inválida não é gravada.
3. **Given** o idioma do perfil é English, **When** o cartão é exibido, **Then** títulos, botões, vazio, carregamento e erros fixos da seção estão em inglês. O texto que o serviço devolve continua como veio.

---

### User Story 4 - Cuidar da segurança da própria conta (Priority: P2)

A pessoa vê se a verificação em duas etapas está ativa e encontra trocar senha, gerenciar essa verificação e as sessões ativas. Não existe nesta tela o código de pareamento, o aparelho autenticador nem o passo a passo do mock de segurança.

**Why this priority**: O mock e o hub pedem segurança, mas o pareamento desenhado no mock está fora. A pessoa precisa de um lugar claro para o que já existe.

**Independent Test**: Abrir Segurança, ler o status da verificação em duas etapas, localizar trocar senha e gerenciar a verificação, listar as sessões e revogar outra sessão. Confirmar que não há código de pareamento.

**Acceptance Scenarios**:

1. **Given** a verificação em duas etapas está ativa ou inativa, **When** a pessoa abre Segurança, **Then** o status mostrado corresponde a esse estado. **Given** o status não pôde ser lido, **When** a seção trata a falha, **Then** mostra erro com nova tentativa e não apresenta o estado como inativo.
2. **Given** a pessoa pede para trocar a senha ou gerenciar a verificação em duas etapas, **When** a ação é oferecida, **Then** o destino é o fluxo já existente de redefinir senha ou de configurar a verificação, sem formulário novo e sem código de pareamento. O que acontece quando não há uma tarefa pendente fica em aberto no FR-014.
3. **Given** há sessões ativas, **When** a pessoa abre a lista, **Then** distingue a sessão em uso das demais e consegue revogar uma sessão que não é a atual. A sessão revogada sai da lista e deixa de poder ser usada.
4. **Given** a revogação falha, **When** a resposta chega, **Then** a sessão permanece na lista e a pessoa vê o erro.

---

### User Story 5 - Achar ajuda sem sair do hub (Priority: P3)

A seção Ajuda reúne os mesmos destinos de Privacidade, Termos de Uso e Suporte que o rodapé já mostra. Onde ainda não existe endereço real, o destino continua o placeholder já usado no rodapé. A história não cria artigos, perguntas frequentes nem página de contato.

**Why this priority**: O mock tem ajuda, mas não há conteúdo novo para inventar. Reusar o que já está no rodapé evita um beco sem saída.

**Independent Test**: Abrir Ajuda e acionar os três destinos. Cada um chega ao mesmo lugar do link correspondente do rodapé. Não surge página nova de documentação ou de perguntas frequentes.

**Acceptance Scenarios**:

1. **Given** a seção Ajuda, **When** a pessoa olha os destinos, **Then** vê Privacidade, Termos de Uso e Suporte, cada um apontando para o mesmo destino do rodapé.
2. **Given** o rodapé ainda usa placeholder, **When** a pessoa aciona o destino na Ajuda, **Then** o resultado é o mesmo placeholder, sem endereço inventado.

---

### Edge Cases

- Sem empresa selecionada: não há carga nem gravação, e a orientação é a mesma já usada para pedir a seleção de uma empresa.
- Nome, idioma, fuso, versão desatualizada, sessão expirada, resposta atrasada e troca de empresa no meio da edição seguem a especificação anterior do perfil. Trocar de empresa atualiza função, nome da empresa, membro desde e as notificações. Não muda nome, bio, cargo, idioma nem fuso, porque esses dados são da pessoa.
- Bio ou cargo ausentes na leitura: a carga do restante continua válida e os dois aparecem vazios.
- Bio ou cargo só com espaços: tratados como vazios.
- Bio ou cargo acima do limite ou com caractere de controle: recusados, com explicação no campo, sem gravar.
- Fuso fora da lista: o valor recebido aparece e só pode ser salvo depois que a pessoa escolhe um fuso da lista.
- Foto recusada ou troca interrompida: a foto anterior permanece.
- Lista de sessões vazia: a seção diz que não há outra sessão para mostrar e ainda indica a sessão em uso quando ela for conhecida.
- Falha ao carregar uma seção: as outras seções e o cartão de identidade continuam utilizáveis. A seção com falha oferece nova tentativa.
- Tema e acessibilidade não são configuração da empresa. Trocar de empresa não os repõe com o tema da empresa.
- Ajuda não ganha destino que o rodapé não tenha.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A pessoa autenticada, com uma empresa selecionada, MUST abrir o próprio perfil em `/perfil` e MUST ver o cartão de identidade junto com uma seção por vez: Conta, Preferências, Notificações, Segurança e Ajuda. A seção inicial MUST ser Conta.
- **FR-002**: Em janela larga, as seções MUST aparecer como lista vertical ao lado do conteúdo. Em janela estreita, as mesmas cinco seções MUST permanecer alcançáveis por abas ou seletor. O cartão MUST permanecer visível nos dois casos. A navegação MUST ser completa por teclado, com rótulo visível na seção ativa.
- **FR-003**: O cartão MUST mostrar foto grande ou iniciais, ação de alterar foto, nome, e-mail somente leitura, função na empresa selecionada, nome dessa empresa, membro desde, bio, cargo e Editar.
- **FR-004**: Antes de Editar, nome, bio e cargo MUST NOT ser campos. Depois de Editar, só esses três MUST ser editáveis na seção Conta. E-mail, função, empresa e membro desde MUST permanecer somente leitura.
- **FR-005**: Nome MUST continuar obrigatório, de 1 a 200 caracteres depois de remover os espaços das pontas, sem caractere de controle. Bio e cargo MUST ser opcionais. Cargo MUST ter no máximo 200 caracteres e bio no máximo 500, depois do recorte. Vazio MUST gravar vazio. Espaços só nas pontas MUST ser removidos. Caractere de controle MUST ser recusado.
- **FR-006**: Salvar a conta MUST gravar nome, bio e cargo da pessoa autenticada junto com a versão carregada, sem apagar idioma e fuso já gravados. A primeira gravação continua sem versão. Versão desatualizada MUST ser recusada e a tela MUST oferecer recarregar, sem tratar o rascunho como gravado.
- **FR-007**: O cabeçalho MUST mostrar a mesma foto da conta. Sem foto, o cartão e o cabeçalho MUST mostrar as iniciais do nome. Uma troca de foto bem-sucedida MUST atualizar os dois sem novo login. Uma troca falha MUST manter a foto anterior e MUST explicar o erro. Esta história MUST NOT oferecer remover a foto.
- **FR-008**: Função, empresa e membro desde MUST refletir a empresa selecionada e MUST NOT ser editados nesta tela. Membro desde é a data em que a pessoa passou a pertencer a essa empresa. Sem data, a tela MUST dizer que a data está indisponível. Trocar de empresa MUST atualizar esses três dados e MUST NOT regravar o perfil.
- **FR-009**: Preferências MUST oferecer só Português (Brasil) e English, e um fuso internacional buscável por nome ou deslocamento. Cada opção de fuso MUST mostrar o deslocamento atual. A pré-visualização de agora MUST seguir o fuso selecionado e MUST NOT alterar as datas das outras telas. Salvar preferências MUST NOT apagar nome, bio e cargo já gravados.
- **FR-010**: A pessoa MUST poder escolher tema claro, escuro ou o do sistema, e MUST poder ligar ou desligar, cada um por si, reduzir movimento, sublinhar links e contraste maior. O efeito MUST valer na área autenticada. Essas escolhas MUST NOT alterar a configuração da empresa. Onde essas quatro preferências são gravadas MUST ser [NEEDS CLARIFICATION: ficam só neste navegador, ou passam a acompanhar o perfil da pessoa no mesmo serviço que já guarda idioma e fuso?].
- **FR-011**: Todas as frases novas e antigas desta tela, inclusive as do cartão de notificações, MUST existir no catálogo de português e no de inglês já usados pelo perfil. O idioma gravado MUST ser aplicado a esta tela e à moldura como já ocorre hoje. MUST NOT traduzir o restante do aplicativo.
- **FR-012**: Notificações MUST manter canais, filtros, gravação, conflito e escopo por pessoa e empresa já aceitos. MUST aparecer só na seção Notificações. Web MUST continuar obrigatório.
- **FR-013**: Segurança MUST mostrar a verificação em duas etapas como ativa ou inativa. Se o status não puder ser lido, MUST mostrar erro com nova tentativa e MUST NOT apresentá-lo como inativo. MUST NOT mostrar código de pareamento, aparelho autenticador, último pareamento nem o passo a passo do mock de segurança.
- **FR-014**: Trocar senha e gerenciar a verificação em duas etapas MUST usar os fluxos já existentes em `/tarefas/redefinir-senha` e `/tarefas/configurar-mfa`, sem formulário novo e sem mudança no painel do provedor de identidade. O que a pessoa já autenticada encontra ao acionar esses fluxos fora de uma tarefa pendente MUST ser [NEEDS CLARIFICATION: a tela apenas abre esses endereços, mesmo que o fluxo não possa começar, ou a seção precisa concluir a mesma ação pela sessão já aberta quando o endereço sozinho não inicia a tarefa?].
- **FR-015**: Segurança MUST listar as sessões ativas, marcar a sessão em uso e permitir revogar uma sessão que não é a atual. A sessão revogada MUST sair da lista e MUST deixar de poder ser usada. Falha na revogação MUST manter a sessão e MUST explicar o erro. Revogar a sessão em uso nesta lista MUST ser [NEEDS CLARIFICATION: a sessão em uso também pode ser revogada aqui, encerrando a entrada, ou só termina pelo Sair já existente?].
- **FR-016**: Ajuda MUST oferecer Privacidade, Termos de Uso e Suporte com os mesmos destinos do rodapé. Destino que hoje é placeholder MUST continuar placeholder. A história MUST NOT criar documentação, perguntas frequentes nem página de contato.
- **FR-017**: Cada gravação de conta, preferências ou notificações MUST impedir um segundo envio até a resposta. Erro de gravação MUST preservar o rascunho. Cancelar MUST restaurar o último valor gravado daquele grupo. Uma resposta de pedido abandonado, por saída da tela ou troca de empresa, MUST ser descartada.
- **FR-018**: Sem empresa selecionada, o aplicativo MUST NOT carregar nem gravar perfil ou notificações. Sessão expirada e acesso negado MUST seguir a recuperação já usada nas configurações da empresa.
- **FR-019**: O aplicativo MUST NOT usar chave secreta do provedor de identidade, MUST NOT alterar o painel desse provedor e MUST NOT editar o perfil de outra pessoa, o e-mail, integrações, auditoria ou um perfil público.

### Key Entities *(include if feature involves data)*

- **Perfil da pessoa**: Nome, bio, cargo, idioma, fuso horário e a versão que impede gravar por cima de uma edição mais nova. Uma pessoa, não uma empresa. Bio e cargo são opcionais. E-mail e foto vêm da sessão de entrada e não são gravados neste perfil.
- **Vínculo com a empresa selecionada**: Função, nome da empresa e data de entrada. Somente leitura. Mudam quando a empresa selecionada muda.
- **Aparência e acessibilidade**: Tema claro, escuro ou do sistema, e as três opções de reduzir movimento, sublinhar links e contraste. Não pertencem à empresa. O lugar em que ficam gravadas está em aberto no FR-010.
- **Preferência de notificação**: A mesma entidade já aceita, por pessoa e empresa. Esta história só muda onde ela aparece e em que idioma as frases fixas são mostradas.
- **Sessão ativa**: Uma entrada ainda válida da conta, distinguindo a que está em uso. Pode ser revogada, com a ressalva em aberto no FR-015.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Uma pessoa com empresa selecionada encontra foto ou iniciais, nome, e-mail, função, empresa, membro desde, bio e cargo numa única abertura de `/perfil`, em menos de 1 minuto.
- **SC-002**: Em 100% das reaberturas depois de um salvamento confirmado de nome, bio e cargo, os três valores exibidos são os confirmados. Nome inválido não altera o perfil em 100% das tentativas.
- **SC-003**: Depois de uma troca de foto confirmada, o cartão e o cabeçalho mostram a nova foto sem novo login. Sem foto, os dois mostram iniciais. Numa troca falha, a foto anterior permanece em 100% dos casos.
- **SC-004**: A pessoa localiza um fuso pela busca, vê o deslocamento e a pré-visualização de agora antes de salvar, e conclui a escolha em menos de 1 minuto.
- **SC-005**: Com English gravado, 100% das frases fixas das cinco seções, inclusive notificações, aparecem em inglês. Com Português (Brasil), aparecem em português. As frases das outras telas permanecem em português nos dois casos.
- **SC-006**: Uma preferência de notificação salva nesta seção permanece na reabertura e é a mesma escolha que a tela anterior já era capaz de gravar.
- **SC-007**: A seção Segurança não exibe código de pareamento em nenhuma abertura. Revogar outra sessão remove essa sessão da lista e impede o uso dela.
- **SC-008**: Em janela larga a pessoa troca de seção pela lista vertical. Em janela estreita alcança as mesmas cinco seções sem perder o cartão de identidade. Ajuda não abre destino diferente do rodapé.

## Out of Scope

- Verificação em duas etapas por código de pareamento, aparelho autenticador e o fluxo desenhado no mock de segurança.
- Integrações, auditoria e demais configurações da empresa.
- Perfil público e editar o perfil de outra pessoa.
- Alterar e-mail, remover foto e criar documentação, perguntas frequentes ou página de contato.
- Traduzir o restante do aplicativo. Fora desta tela e da moldura já coberta pela especificação anterior, as frases permanecem como estão.
- Chave secreta do provedor de identidade e qualquer mudança no painel desse provedor.
- Painel, agendamento de varredura e e-mail que ainda não existem. O fuso continua gravado para eles, como na especificação anterior.

## Assumptions

- A especificação anterior do perfil permanece em vigor para nome, idioma `pt-BR` e `en`, fuso internacional, versão, conflito, atualização do nome na sessão já aberta, moldura e a exigência de empresa selecionada. Esta história acrescenta bio, cargo, foto, hub, tema, acessibilidade, segurança e ajuda, e move as notificações para uma seção.
- Bio e cargo entram no mesmo perfil que já guarda nome, idioma e fuso. O serviço, em trabalho paralelo, passa a aceitá-los na leitura e na gravação. Se a leitura ainda não trouxer os campos, a tela trata os dois como vazios e não falha a carga. A gravação da conta os envia. Se o serviço recusar, a tela mostra o erro, não anuncia sucesso e mantém o rascunho. Os limites de 200 e 500 caracteres deixam o aceite testável. Não foram confirmados pelo product owner nem pelo contrato publicado do serviço. Se o serviço publicar outro limite, o planejamento substitui estes números.
- A foto é a da sessão de entrada já aberta. Alterar a foto usa essa mesma sessão. Não há chave secreta e não há mudança no painel do provedor. O formato e o tamanho aceitos são os que essa sessão já aceita. A recusa é mostrada à pessoa.
- Membro desde é a entrada na empresa selecionada, não a data de criação da conta. A função é o papel desse vínculo. O cabeçalho continua mostrando o nome do perfil e o nome da empresa. A única mudança do cabeçalho nesta história é a foto.
- Tema e acessibilidade valem para a área autenticada. As telas de entrada não mudam. Gravar ou não essas quatro escolhas no perfil está em aberto no FR-010. Enquanto isso não for decidido, elas não podem ser tratadas como configuração da empresa.
- Os três destinos de Ajuda são os do rodapé: Privacidade, Termos de Uso e Suporte. Hoje são os placeholders `#privacidade`, `#termos` e `#suporte`. Não há outro endereço real para reutilizar.
- A fronteira entre a sessão de identidade, o perfil no serviço e as preferências da conta está na ADR_171 de `lhamalog-docs`, título "Conta do usuário no Web - fronteira Clerk, Core e preferências de perfil". Esta especificação não reabre essa fronteira. No momento da escrita, o arquivo ainda não estava na branch `main` desse repositório. O planejamento deve reler a ADR quando ela estiver publicada e ajustar só o que a contradisser.
- Salvar a conta reenvia o idioma e o fuso já confirmados, para não apagá-los. Salvar preferências reenvia o nome, a bio e o cargo já confirmados, pelo mesmo motivo. Notificações continuam numa gravação separada.
- Revogar uma sessão que não é a atual está decidido. O que acontece com a sessão em uso está em aberto no FR-015. O Sair já existente continua encerrando a entrada atual.
- Textos devolvidos pelo serviço continuam como vieram, sem tradução nesta história. Rótulos de tipos e severidades que o serviço envia também.
