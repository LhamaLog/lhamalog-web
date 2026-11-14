# Feature Specification: Manter perfil do usuário

**Feature Branch**: `LLT-174-manter-perfil-do-usuario`

**Created**: 2026-11-12

**Status**: Draft

**Input**: User description: "LLT-174 Manter perfil do usuário (épico LLT-99, feature LLT-121 Configurações por usuário). Como usuário, quero ajustar nome, idioma e fuso horário. O fuso horário passa a valer em painéis, agendamentos de varredura e e-mails onde essas superfícies já existirem. Os dados de identidade da Clerk permanecem sincronizados. E-mail (LLT-172) e notificações (LLT-173) ficam de fora. Este artefato cobre somente o aplicativo web; o serviço que guarda o perfil é especificado à parte."

## Clarifications

### Session 2026-11-12

- Q: As decisões de repositório, fuso, nome sincronizado com a identidade e limite da tradução já estavam fechadas pelo product owner? → A: Sim. Foram aplicadas nesta especificação e não foram reabertas. Web apenas; o serviço grava o fuso e o aplicativo só o edita e o usa onde painel, agendamento de varredura ou e-mail já existam (hoje não existem). O nome é editado aqui e enviado ao serviço, que sincroniza a identidade. O idioma é gravado no serviço e aplicado à tela de perfil, à moldura e aos formatos de data e número, sem tradução integral do produto.
- Q: Depois de salvar um idioma novo, a confirmação de sucesso aparece no idioma anterior ou no idioma recém-gravado? → A: No idioma recém-gravado. A preferência aplicada muda no momento em que o salvamento é confirmado, e a mensagem faz parte dessa tela.

### Session 2026-11-12 — alinhamento com o Core

- Q: Quem atualiza o nome na sessão já aberta, e o que acontece se essa atualização falhar? → A: Depois de um `PUT` confirmado, o aplicativo atualiza a sessão do navegador com `user.update`: a primeira palavra do nome vira o nome e o restante o sobrenome; um nome de uma palavra preenche só o nome e limpa o sobrenome. Não há SDK Backend nem segredo da Clerk no web. Se `user.update` falhar, o perfil gravado no serviço permanece e a moldura mostra o `displayName` devolvido; a gravação não é desfeita. Se `user.update` funcionar, `user.reload()` ainda pode ser chamado; se o reload falhar, a moldura continua mostrando o nome do serviço.
- Q: Qual é o contrato do perfil? → A: O Core é a fonte. `GET` e `PUT /api/user/profile` usam `displayName`, `language`, `timezone` e `version`. O `PUT` envia os três valores e a versão. A primeira gravação envia `version: null`; as seguintes enviam a versão atual. `409` é versão desatualizada e a tela oferece recarregar. Não vale a última gravação silenciosa. Sem perfil gravado, o `GET` devolve `displayName: ""`, `language: "pt-BR"`, `timezone: "America/Sao_Paulo"` e `version: null`.
- Q: A tela oferece as mesmas etiquetas de idioma que o Core aceita? → A: Não. A tela oferece só `pt-BR` e `en`. O Core pode aceitar uma etiqueta mais ampla, como `en-US`; o web não a oferece.
- Q: O cabeçalho e o seletor de empresa acompanham o perfil confirmado, e a carga ocorre sem empresa? → A: O cabeçalho mostra o `displayName` confirmado. O seletor de empresa segue o idioma gravado e volta ao português ao sair. Sem empresa selecionada, o carregador não chama o serviço.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ajustar o próprio perfil (Priority: P1)

Uma pessoa que já entrou no LhamaLog e já selecionou uma empresa abre o próprio perfil, revê o nome, o idioma e o fuso horário, altera o que precisar e salva. O nome salvo passa a aparecer na moldura do aplicativo sem um novo login. Se o salvamento falhar, o perfil anterior continua valendo.

**Why this priority**: Sem gravar os três dados, não há preferência para aplicar no idioma nem fuso para os demais módulos consumirem. É o menor recorte que realiza a história.

**Independent Test**: Com uma empresa selecionada, abrir o perfil, alterar os três campos para valores válidos, salvar, sair da tela e voltar. Os três valores permanecem. O nome na moldura é o nome salvo. Uma tentativa inválida não grava e explica o campo.

**Acceptance Scenarios**:

1. **Given** um perfil já gravado e uma empresa selecionada, **When** a pessoa abre o perfil, **Then** vê o nome, o idioma e o fuso horário atuais, com rótulos visíveis.
2. **Given** o perfil aberto, **When** a pessoa altera o nome, o idioma e o fuso para valores válidos e salva, **Then** recebe uma confirmação de sucesso no idioma recém-gravado e, ao reabrir a tela, vê os mesmos três valores.
3. **Given** um salvamento de nome bem-sucedido, **When** a pessoa olha a moldura, **Then** o nome exibido é o nome salvo, sem precisar entrar de novo.
4. **Given** o perfil aberto com alterações ainda não salvas, **When** a pessoa cancela, **Then** os três campos voltam ao último valor gravado e a moldura não muda.
5. **Given** um nome vazio, longo demais ou com caracteres de controle, ou um idioma ou fuso que não estejam na lista permitida, **When** a pessoa tenta salvar, **Then** o campo é explicado, nada é gravado e o perfil anterior continua em vigor.
6. **Given** um salvamento em andamento, **When** a pessoa tenta enviar de novo, **Then** há um único envio e o formulário fica bloqueado até a resposta.
7. **Given** falha ao carregar, **When** a tela mostra o erro, **Then** a pessoa pode tentar de novo. **Given** falha ao salvar, **When** a resposta chega, **Then** há um alerta, os campos digitados permanecem para correção e o perfil aplicado antes da tentativa continua valendo.
8. **Given** o serviço responde sem confirmar os três valores enviados, **When** a tela trata a resposta, **Then** ela passa a mostrar o que o serviço devolveu e avisa que a gravação não foi confirmada por inteiro.
9. **Given** a pessoa troca de empresa ou deixa a tela com um pedido ainda em curso, **When** a resposta atrasada chega, **Then** ela é descartada e não substitui o perfil da sessão atual.
10. **Given** nenhuma empresa está selecionada, **When** a pessoa abre o perfil, **Then** não há carga nem gravação, e a orientação é a mesma já usada para pedir a seleção de uma empresa.
11. **Given** ainda não existe perfil gravado, **When** a carga sucede, **Then** o nome aparece vazio, o idioma é Português (Brasil), o fuso é `America/Sao_Paulo` e a gravação seguinte envia "sem versão".
12. **Given** um salvamento confirmado do nome `Ana Souza`, **When** a sessão do navegador é atualizada, **Then** o nome da sessão fica Ana e o sobrenome Souza. **Given** o nome confirmado é só `Ana`, **When** a sessão é atualizada, **Then** o nome fica Ana e o sobrenome da sessão fica vazio.
13. **Given** o serviço confirmou o perfil, **When** a atualização da sessão do navegador falha, **Then** o perfil gravado permanece, a confirmação de sucesso permanece e a moldura mostra o nome devolvido pelo serviço.
14. **Given** duas abas têm o mesmo perfil e uma já gravou, **When** a outra grava com a versão antiga, **Then** o serviço recusa o conflito e a tela oferece recarregar, sem tratar a edição local como gravada.

---

### User Story 2 - Aplicar o idioma na moldura e nos formatos (Priority: P2)

Depois que o idioma é gravado, a pessoa vê a tela de perfil e a moldura do aplicativo nesse idioma, e as datas e números que o aplicativo já formata passam a seguir a convenção desse idioma. O restante das frases do produto continua em português.

**Why this priority**: Guardar o idioma sem aplicá-lo não cumpre a decisão de produto. A aplicação fica limitada de propósito para não virar uma tradução de todo o LhamaLog.

**Independent Test**: Com o perfil já gravado em English, abrir o aplicativo autenticado e conferir a moldura, a tela de perfil e uma data ou número já existente (histórico de contexto da empresa ou percentual de produto). Esses itens seguem o inglês. As frases das telas de empresa, produtos, ocorrências e de entrada continuam em português. Repetir com Português (Brasil).

**Acceptance Scenarios**:

1. **Given** o idioma gravado é English, **When** a pessoa navega na área autenticada, **Then** os textos da tela de perfil (inclusive carregamento, erro e vazio dessa tela) e da moldura (menu, cabeçalho, rodapé, faixa de empresa selecionada, sair e a orientação para selecionar empresa) aparecem em inglês, e as datas e números já formatados usam a convenção em inglês.
2. **Given** o idioma gravado é Português (Brasil), **When** a pessoa navega na mesma área, **Then** esses mesmos textos e formatos usam a convenção de português do Brasil.
3. **Given** a pessoa só mudou o idioma no formulário e ainda não salvou, **When** olha a moldura e as outras telas, **Then** o idioma aplicado continua sendo o último gravado.
4. **Given** o perfil ainda não terminou de carregar, **When** a moldura aparece, **Then** ela permanece em Português (Brasil) e mostra o nome da sessão de entrada, até o perfil gravado chegar.
5. **Given** o idioma English está aplicado, **When** a pessoa abre dados da empresa, produtos, ocorrências ou as telas de entrada, **Then** as frases próprias dessas telas continuam em português, inclusive avisos literais como a ausência de registro em um produto. Só o formato de data, número, ordenação e caixa que já depende do idioma acompanha a preferência.
6. **Given** a pessoa altera o idioma do perfil, **When** volta às configurações da empresa, **Then** o idioma e o fuso da empresa permanecem os que estavam lá, sem serem regravados.

---

### User Story 3 - Conferir o fuso sem criar novas superfícies (Priority: P3)

A pessoa escolhe um fuso horário internacional, confere na própria tela de perfil que data e hora atuais respeitam esse fuso e grava a preferência para painéis, agendamentos de varredura e e-mails. Esta história não cria essas três superfícies: no aplicativo web elas ainda não existem, então o fuso não é espalhado para outras datas já exibidas.

**Why this priority**: O valor precisa ficar gravado e compreensível para quem edita. Aplicá-lo em painéis, varreduras e e-mails só cabe onde essas telas já existem. Inventá-las aqui aumentaria o escopo para fora da história.

**Independent Test**: Na tela de perfil, escolher outro fuso e ver a pré-visualização de "agora" mudar antes de salvar. Salvar, reabrir e confirmar o fuso. Conferir que o histórico de contexto da empresa e os tempos relativos de produto não mudam de fuso. Confirmar que não surgiram telas de painel, agendamento de varredura ou composição de e-mail.

**Acceptance Scenarios**:

1. **Given** a tela de perfil aberta, **When** a pessoa escolhe um fuso da lista, **Then** uma pré-visualização mostra a data e a hora atuais nesse fuso e deixa claro que é uma pré-visualização.
2. **Given** a pré-visualização mudou e a pessoa ainda não salvou, **When** cancela, **Then** o fuso e a pré-visualização voltam ao último valor gravado.
3. **Given** um fuso gravado, **When** a pessoa reabre o perfil, **Then** o fuso gravado e a pré-visualização correspondente aparecem.
4. **Given** o fuso do perfil foi alterado e gravado, **When** a pessoa olha datas que o aplicativo já mostrava fora desta tela (histórico de contexto da empresa e tempos relativos de produto), **Then** essas datas não passam a usar o fuso do perfil.
5. **Given** esta entrega concluída, **When** a pessoa percorre o aplicativo, **Then** não existe tela nova de painel, de agendamento de varredura nem de composição ou envio de e-mail criada por esta história.

---

### Edge Cases

- Nome gravado vazio: o formulário mostra o campo vazio e bloqueia um novo salvamento até haver um nome válido. A moldura continua mostrando o nome da sessão de entrada, em vez de ficar em branco.
- Nome só com espaços: tratado como vazio e recusado.
- Nome com mais de 200 caracteres depois de remover espaços nas pontas: recusado.
- Nome com quebra de linha ou outro caractere de controle: recusado. Acentos, espaços internos, hífen, apóstrofo e ponto são aceitos.
- Idioma fora de Português (Brasil) e English: recusado. Não há terceira opção nesta história, mesmo que a empresa mostre outro rótulo de idioma.
- Fuso ausente da lista internacional suportada pelo navegador: a tela mostra o valor recebido e só permite salvar depois que a pessoa escolhe um fuso da lista.
- Resposta de carga sem `displayName`, `language` e `timezone` em string, ou sem `version` nula ou numérica: tratada como falha de carga, com nova tentativa.
- Etiqueta de idioma que a tela não oferece, como `en-US`: o valor recebido aparece, mas a lista só tem Português (Brasil) e English. Salvar exige uma dessas duas. Enquanto a etiqueta gravada não for exatamente uma delas, a moldura permanece em Português (Brasil).
- Sessão expirada: a pessoa é levada a entrar de novo, como já ocorre nas configurações da empresa.
- Acesso negado: a pessoa vê que não tem acesso e precisa selecionar uma empresa válida, como nas configurações da empresa.
- Conflito de versão (`409`): a tela oferece recarregar o perfil e não trata a edição local como gravada. Não há última gravação silenciosa.
- Serviço indisponível ou resposta ilegível: mensagem de falha, sem alterar o perfil aplicado e sem atualizar a sessão do navegador.
- `user.update` falha depois do `PUT` confirmado: o perfil no serviço permanece, a moldura mostra o `displayName` devolvido e a gravação não é desfeita.
- `user.update` funciona e `user.reload()` falha: a moldura continua mostrando o nome devolvido pelo serviço.
- Troca de empresa no meio da edição: a tela recarrega o perfil da pessoa com a nova sessão e descarta a resposta antiga. O perfil não é um dado da empresa; a troca só existe porque o acesso ao serviço hoje exige uma empresa selecionada.
- Campo de outra pessoa, identificador de usuário editável, e-mail, avatar, senha ou notificações: não aparecem nesta tela.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O aplicativo MUST permitir que a pessoa autenticada, com uma empresa selecionada, abra o próprio perfil a partir do nome na moldura e a partir do grupo Configuração do menu.
- **FR-002**: A tela MUST mostrar e permitir editar exatamente três preferências: nome de exibição, idioma e fuso horário.
- **FR-003**: O aplicativo MUST gravar as três preferências juntas, com a versão carregada, somente para a pessoa autenticada, e MUST NOT pedir nem enviar um identificador de outra pessoa. A primeira gravação envia ausência de versão. Uma versão desatualizada MUST ser recusada pelo serviço e a tela MUST oferecer recarregar.
- **FR-004**: O nome de exibição MUST ser obrigatório, ter de 1 a 200 caracteres depois de removidos os espaços das pontas, e MUST NOT conter caracteres de controle. Espaços internos e sinais comuns de nome são permitidos.
- **FR-005**: A tela MUST oferecer apenas Português (Brasil) e English, gravados como `pt-BR` e `en`. MUST NOT oferecer outras línguas, mesmo que o serviço aceite uma etiqueta mais ampla.
- **FR-006**: O fuso horário MUST ser um identificador internacional da lista suportada no navegador, por exemplo `America/Sao_Paulo`, e MUST NOT ser o rótulo já usado na empresa, como `(UTC-03:00) Brasília`.
- **FR-007**: O aplicativo MUST recusar valores inválidos antes de gravar, MUST explicar o campo com problema e MUST manter o último perfil gravado em vigor.
- **FR-008**: Durante a gravação, a tela MUST impedir um segundo envio e MUST impedir edição até a resposta.
- **FR-009**: A tela MUST distinguir carregando, erro de carga com nova tentativa, sucesso, erro de gravação e cancelamento. Sucesso é um aviso de status. Erro é um alerta. Cancelar restaura o último perfil gravado.
- **FR-010**: Se o serviço não devolver os mesmos três valores enviados, a tela MUST mostrar o que foi devolvido e MUST avisar que a gravação não foi confirmada por inteiro.
- **FR-011**: Depois de um salvamento confirmado, o cabeçalho MUST mostrar o `displayName` devolvido, sem novo login. Em seguida o aplicativo MUST atualizar a sessão já aberta com `user.update`: a primeira palavra é o nome, o restante é o sobrenome; uma única palavra preenche só o nome e limpa o sobrenome. Se `user.update` falhar, o perfil gravado MUST permanecer, a moldura MUST continuar com o nome devolvido e a gravação MUST NOT ser desfeita. Se `user.update` funcionar, `user.reload()` MAY ser chamado; se o reload falhar, a moldura MUST continuar com o nome devolvido.
- **FR-012**: O aplicativo MUST enviar o nome ao serviço de perfil. A atualização da sessão MUST usar o `user.update` do navegador já autenticado e MUST NOT acrescentar SDK Backend da Clerk nem segredo. O aplicativo MUST NOT alterar JWT, organizações ou a instância.
- **FR-013**: O idioma gravado `pt-BR` ou `en` MUST ser aplicado às frases da tela de perfil e da moldura autenticada, inclusive ao seletor de empresa, e aos formatos de data, número, ordenação e caixa que o aplicativo já calcula. Ao sair, o seletor volta ao português. MUST NOT ser aplicado ao restante das frases de empresa, produtos, ocorrências e entrada. Uma etiqueta diferente dessas duas não muda o idioma aplicado.
- **FR-014**: Uma alteração de idioma ainda não salva MUST NOT mudar o idioma já aplicado. Quando o salvamento é confirmado, o idioma aplicado MUST passar a ser o idioma gravado, inclusive na confirmação de sucesso. Antes de o perfil carregar, a moldura MUST permanecer em Português (Brasil) e MUST mostrar o nome da sessão de entrada. Se o nome gravado vier vazio, a moldura MUST continuar mostrando o nome da sessão em vez de um nome vazio, sem impedir que um idioma válido já gravado seja aplicado.
- **FR-015**: O fuso selecionado no formulário MUST alimentar uma pré-visualização de data e hora atuais na própria tela de perfil. O fuso gravado MUST NOT alterar o fuso das datas já exibidas em outras telas nesta história.
- **FR-016**: O aplicativo MUST NOT criar, nesta história, painel, agendamento de varredura ou composição e envio de e-mail. O fuso fica gravado para essas superfícies usarem quando elas existirem.
- **FR-017**: Gravar o perfil MUST NOT alterar idioma, fuso horário nem qualquer outra configuração da empresa. Alterar a empresa MUST NOT regravar o perfil.
- **FR-018**: Sem empresa selecionada, o aplicativo MUST NOT carregar nem gravar o perfil e MUST orientar a pessoa a selecionar ou cadastrar uma empresa, como já faz nas outras áreas autenticadas.
- **FR-019**: Sessão expirada, acesso negado, conflito e falha de rede MUST seguir a recuperação já conhecida nas configurações da empresa: entrar de novo, selecionar uma empresa válida, recarregar o perfil ou tentar mais tarde, respectivamente.
- **FR-020**: Trocar de empresa ou abandonar a tela MUST descartar respostas de pedidos anteriores.
- **FR-021**: A tela MUST NOT editar e-mail, notificações, avatar ou senha.
- **FR-022**: Os campos MUST ter rótulo visível, erro associado ao campo e operação completa por teclado, no mesmo padrão das configurações da empresa.

### Key Entities *(include if feature involves data)*

- **Perfil do usuário**: As preferências da pessoa autenticada. Atributos: nome de exibição, idioma, fuso horário e a versão usada para não gravar por cima de uma edição mais nova. Existe um perfil por pessoa, não por empresa. A pessoa só lê e altera o próprio.
- **Preferências aplicadas**: O idioma e o nome que a moldura está usando agora, mais o fuso usado na pré-visualização depois de gravado. Atualizam na carga bem-sucedida e depois de um salvamento confirmado. O rascunho do formulário pode divergir até salvar ou cancelar.
- **Configuração da empresa**: Idioma, fuso e demais dados da organização já existentes. É outra entidade. Não é lida nem gravada por esta tela, e os formatos de valor não são intercambiáveis com o perfil.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Uma pessoa com empresa selecionada revê e grava nome, idioma e fuso horário válidos em menos de 2 minutos, sem sair da área autenticada.
- **SC-002**: Em 100% das reaberturas depois de um salvamento confirmado, os três valores exibidos são os que foram confirmados.
- **SC-003**: Depois de um salvamento confirmado, o nome do cabeçalho coincide com o nome gravado sem novo login, inclusive quando a atualização da sessão do navegador falha. Depois de uma falha do serviço, o nome anterior do cabeçalho permanece em 100% dos casos.
- **SC-004**: Com English gravado, a tela de perfil, os textos da moldura autenticada e as datas e números já formatados seguem a convenção em inglês. Com Português (Brasil), seguem a convenção brasileira. Em ambos os casos, as frases das telas de empresa, produtos, ocorrências e de entrada permanecem em português.
- **SC-005**: 100% das tentativas com nome, idioma ou fuso inválidos terminam com explicação no campo e sem mudar o perfil aplicado.
- **SC-006**: A tela de perfil mostra a data e a hora atuais no fuso selecionado. A entrega não acrescenta tela de painel, de agendamento de varredura nem de e-mail.
- **SC-007**: Depois de gravar o perfil, idioma e fuso horário exibidos nas configurações da empresa permanecem iguais aos de antes da gravação.
- **SC-008**: 100% das respostas de um pedido abandonado, por saída da tela ou troca de empresa, deixam de alterar o que a pessoa vê.

## Out of Scope

- Manter e-mail (LLT-172) e manter notificações (LLT-173), inclusive qualquer campo dessas preferências nesta tela.
- Traduzir o aplicativo inteiro. Fora da tela de perfil e da moldura autenticada, as frases permanecem como estão.
- Construir painel, agendamento de varredura ou envio de e-mail para "usar" o fuso. Essas superfícies não existem hoje neste aplicativo; o item de menu Painel não abre uma tela.
- SDK Backend da Clerk, segredo, JWT, organizações e configuração da instância. A sessão já aberta pode ser atualizada com `user.update` depois de um `PUT` confirmado.
- Editar o perfil de outra pessoa, ou fazer o perfil variar por empresa.
- Alterar os campos de idioma e fuso já existentes na configuração da empresa.
- Avatar, senha, autenticação de múltiplos fatores e a galeria interna de componentes.

## Assumptions

- O Core é a fonte do perfil. O web grava por `GET`/`PUT /api/user/profile` com `displayName`, `language`, `timezone` e `version`. Depois de um `PUT` confirmado, o web atualiza a sessão do navegador com `user.update`. O Core não precisa ser chamado de novo por causa de uma falha dessa sessão.
- A Clerk continua sendo o provedor de identidade do login já existente. O nome mostrado antes de o perfil carregar, ou quando o nome gravado vem vazio, é o nome dessa sessão. Depois de um salvamento confirmado, o cabeçalho usa o `displayName` devolvido.
- O contrato usa um único nome de exibição. A divisão em nome e sobrenome só existe na atualização da sessão: primeira palavra e restante.
- A tela oferece somente Português (Brasil) e English (`pt-BR` e `en`). O Core pode aceitar outra etiqueta; o web não a lista. O rótulo Espanhol da empresa não entra no perfil.
- O fuso do perfil usa o campo `timezone` com identificador internacional. O fuso da empresa continua com o rótulo e o campo próprios dessa tela. São preferências diferentes.
- O acesso ao serviço continua exigindo pessoa autenticada e empresa selecionada. Sem empresa, o carregador não chama o serviço. O dado gravado é da pessoa, não da empresa.
- Sem perfil gravado, o `GET` devolve nome vazio, `pt-BR`, `America/Sao_Paulo` e `version: null`. O nome vazio bloqueia a gravação; idioma e fuso desse retorno já são válidos.
- Cada gravação envia a `version` carregada. A primeira envia `null`. `409` pede recarga. Não há última gravação silenciosa.
- A verificação automática do mapeamento, da validação e do envio único faz parte da conclusão, no mesmo tipo de checagem já usado para as configurações da empresa.
- Os textos da moldura controlados pelo aplicativo (menu, cabeçalho, rodapé, faixa da empresa, sair e a orientação para selecionar empresa) e todos os textos da tela de perfil, inclusive carregamento, erro e vazio dessa tela, acompanham o idioma aplicado. Frases que as telas de empresa e de produtos já escrevem permanecem em português. O título e o botão padrão dos componentes compartilhados, quando essas telas não os substituem, também permanecem em português, para não traduzi-las por efeito colateral.
- O seletor de empresa que já faz parte da moldura autenticada acompanha o idioma aplicado. As telas de entrada, cadastro e tarefas de sessão permanecem em português.
- Mensagens produzidas por esta tela seguem o idioma aplicado. O texto de erro devolvido pelo serviço é mostrado como veio, sem tradução nesta história.
- Um nome de exibição ainda vazio, depois de o perfil carregar, não apaga o nome da sessão na moldura.
