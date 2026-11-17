# Feature Specification: Listar, editar e desativar usuários

**Feature Branch**: `LLT-168-listar-editar-e-desativar-usuarios`

**Created**: 2026-11-15

**Status**: Especificado

**Input**: User description: "LLT-168 Listar, editar e desativar usuários (épico Usuários, cargos e configurações do usuário, feature Gestão de usuários E03.F1). Como administrador, quero manter a lista de usuários da empresa. A lista mostra nome, e-mail, cargo, status e último acesso. O usuário desativado perde o acesso na próxima requisição. Não é possível desativar ou rebaixar o último administrador. Este artefato cobre somente o aplicativo web. A tela de convites já existe em Equipe e deve ser estendida, não refeita."

## Clarifications

### Session 2026-11-15

- Q: Como a pessoa desativada perde o acesso na próxima requisição? → A: Só uma marca de desativado no Core, conferida pelo Core em toda requisição. A pessoa não sai da organização. A tela não chama remoção de membro. Ela continua na lista de membros e aparece com status Desativado. O Web trata a recusa do Core para o próprio usuário desativado com a frase "Seu acesso a esta empresa foi desativado." A sessão permanece aberta.
- Q: De onde vem o último acesso? → A: Do Core: o instante da última requisição autenticada aceita daquela pessoa na empresa. Sem chave secreta. Sem uso registrado, a lista diz "Sem acesso registrado".
- Q: O que a edição cobre? → A: Só o cargo, entre Administrador e Membro, na sessão do administrador, com `organization.updateMember`. O Web envia `admin` ou `member`, sem prefixo. O nome mostrado é o nome público. Sem nome, a lista mostra o e-mail. O nome de outra pessoa não é editado aqui.
- Q: Onde fica a lista? → A: Na rota `/equipe`, em um bloco de usuários junto com o bloco de convites pendentes da LLT-167.
- Q: Como garantir o último administrador sem chave secreta? → A: O Web conta os administradores da organização que não estão `deactivated` no Core. Quem não aparece no Core conta como ativo. Se a ação deixasse zero, a tela recusa sem chamar o Core nem a troca de cargo. O Core também recusa o `POST` com 403, `code` `last_admin` e a frase "Não é possível desativar o último administrador." A frase local de rebaixar é "Não é possível rebaixar o último administrador." Se o Core ou a plataforma devolver erro, a tela mostra esse erro. O cargo e o status anteriores permanecem.
- Q: Desativar é reversível? → A: Sim. O administrador tira a marca no Core. A pessoa continua na organização o tempo todo. O status volta a Ativo.
- Q: Quem vê e altera a lista? → A: Só o administrador da empresa selecionada. Quem não administra não vê Equipe e não lista, edita, desativa nem reativa. Se chegar a chamar o Core, a resposta é 403, `code` `not_admin`, "Somente o administrador da empresa pode gerenciar os usuários."
- Q: Qual contrato o Web consome? → A: O publicado pelo Core em `specs/005-listar-editar-usuarios/contracts/company-members.md`, commit `4f32c77`. `GET /api/company/members` devolve `{ members: [{ userId, status, lastAccessAt }] }`. Desativar é `POST /api/company/members/{userId}/deactivation`, sem corpo. Reativar é `DELETE` no mesmo caminho, sem corpo. Não há `PUT`. Os 403 desta história trazem `code`: `user_deactivated`, `last_admin` e `not_admin`. O Web distingue por `code`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver quem pertence à empresa (Priority: P1)

Um administrador, com uma empresa selecionada, abre Equipe e vê as pessoas que já pertencem à empresa. Cada linha junta o nome, o e-mail e o cargo da organização com o status e o último acesso guardados no serviço. Os convites que ainda não foram aceitos continuam no bloco de pendentes e não entram nessa lista.

**Why this priority**: Sem a lista, o administrador não tem o que manter. É o menor recorte visível da história.

**Independent Test**: Com uma empresa que já tem administrador e membro, o administrador abre Equipe e confere as cinco colunas. Um convite pendente aparece só no bloco de convites. Quem o serviço ainda não viu aparece como Ativo e com "Sem acesso registrado". Quem não administra não vê Equipe e, em `/equipe`, recebe a recusa já usada nessa rota.

**Acceptance Scenarios**:

1. **Given** um administrador com uma empresa selecionada e pessoas já vinculadas, **When** abre Equipe, **Then** a lista mostra, para cada pessoa, nome, e-mail, cargo, status e último acesso.
2. **Given** a pessoa não tem nome público, **When** a lista é exibida, **Then** o nome mostrado é o e-mail.
3. **Given** o serviço não tem registro daquela pessoa, **When** a lista é exibida, **Then** o status é Ativo e o último acesso é "Sem acesso registrado".
4. **Given** convites pendentes e pessoas já vinculadas, **When** o administrador olha Equipe, **Then** os pendentes ficam no bloco de convites e a lista de usuários só tem quem já pertence à empresa.
5. **Given** mais pessoas do que cabem em uma página, **When** o administrador avança a página, **Then** vê as demais sem perder as cinco colunas.
6. **Given** uma pessoa autenticada que não administra a empresa selecionada, **When** o menu é exibido, **Then** o item Equipe não aparece. **When** ela abre `/equipe` direto, **Then** vê "Você não tem acesso. Selecione uma empresa válida." e a sessão permanece aberta.
7. **Given** nenhuma empresa está selecionada, **When** a pessoa abre a área autenticada, **Then** não há lista e a orientação é a mesma já usada para pedir a seleção de uma empresa.

---

### User Story 2 - Editar o cargo de quem já pertence (Priority: P1)

O administrador altera só o cargo de uma pessoa que já pertence à empresa, entre Administrador e Membro. A lista passa a mostrar o cargo novo. Nome, e-mail, status e último acesso não mudam por essa ação.

**Why this priority**: Editar, nesta história, é rebaixar ou promover. É o único dado do vínculo que o administrador altera na sessão, sem chave secreta e sem configuração nova.

**Independent Test**: Com dois administradores, rebaixar um para Membro e ver o cargo novo na lista. Promover um Membro a Administrador e ver o cargo novo. O nome e o e-mail permanecem. Tentar um cargo fora desses dois não altera a lista. Com um único administrador, o rebaixamento é recusado.

**Acceptance Scenarios**:

1. **Given** um membro e pelo menos um administrador, **When** o administrador promove o membro a Administrador, **Then** a lista mostra Administrador para essa pessoa e o nome, o e-mail, o status e o último acesso permanecem.
2. **Given** dois administradores, **When** um rebaixa o outro a Membro, **Then** a lista mostra Membro e a empresa continua com administrador.
3. **Given** um único administrador, **When** alguém tenta rebaixá-lo a Membro, **Then** a ação é recusada com "Não é possível rebaixar o último administrador." e o cargo continua Administrador.
4. **Given** uma edição em andamento, **When** o administrador tenta de novo, **Then** há uma única alteração e o controle fica bloqueado até a resposta.
5. **Given** falha na edição, **When** a resposta chega, **Then** há um alerta com o erro devolvido, o cargo anterior permanece e a lista não mostra um cargo que não foi confirmado.
6. **Given** troca de empresa ou saída da tela com a edição ainda em curso, **When** a resposta atrasada chega, **Then** ela não altera a lista da empresa que ficou na tela.

---

### User Story 3 - Desativar, reativar e proteger o último administrador (Priority: P1)

O administrador desativa uma pessoa que não é o único administrador. Ela continua na empresa e na lista, com status Desativado. A próxima requisição dela ao serviço é recusada, e o aplicativo mostra "Seu acesso a esta empresa foi desativado." sem encerrar a sessão. O administrador reativa essa pessoa tirando a marca. Desativar ou rebaixar o único administrador é recusado.

**Why this priority**: São os critérios de aceite que faltam: corte na próxima requisição, status visível e a trava do último administrador. A reativação faz parte da mesma marca.

**Independent Test**: Desativar um membro, ver Desativado na lista e, na requisição seguinte dessa pessoa, ver a frase de acesso desativado com a sessão ainda aberta. Reativar e ver Ativo. Com um único administrador, desativar e rebaixar são recusados e ele continua administrador e Ativo.

**Acceptance Scenarios**:

1. **Given** um membro, ou um administrador que não é o único, **When** o administrador o desativa, **Then** ele continua na lista com status Desativado e a próxima requisição dele ao serviço não acessa o produto.
2. **Given** a pessoa desativada faz uma requisição ao serviço, **When** a recusa chega, **Then** a frase é "Seu acesso a esta empresa foi desativado." e a sessão permanece aberta.
3. **Given** uma pessoa desativada, **When** o administrador reativa, **Then** o status volta a Ativo e a próxima requisição aceita dela volta a passar.
4. **Given** a empresa tem um único administrador, **When** alguém tenta desativá-lo, **Then** a ação é recusada, ele continua administrador e Ativo, e a lista não muda o cargo nem o status dele.
5. **Given** o serviço recusa a desativação porque, para ele, aquele é o último administrador, **When** a resposta chega, **Then** a tela mostra o erro do serviço e o status permanece Ativo.
6. **Given** a desativação, a reativação ou a edição está em andamento, **When** o administrador repete a ação, **Then** há um único pedido e o controle fica bloqueado até a resposta.
7. **Given** falha ao desativar ou ao reativar, **When** a resposta chega, **Then** há um alerta e a pessoa continua com o status que tinha antes da tentativa.
8. **Given** sessão expirada no meio da ação, **When** a plataforma recusa a sessão, **Then** a pessoa volta a entrar, como nas configurações da empresa.

---

### Edge Cases

- E-mail com diferença de maiúsculas: a comparação ignora maiúsculas e minúsculas. A lista mostra o identificador que a organização devolve.
- Identificador que não é e-mail, por exemplo telefone: a coluna de e-mail mostra esse identificador. A pessoa não some da lista por isso.
- Nome ausente: a coluna de nome mostra o e-mail.
- Convite pendente, expirado ou revogado: não entra na lista de usuários. O bloco de convites da LLT-167 permanece.
- Pessoa sem registro no serviço: continua na lista, como Ativo, com "Sem acesso registrado".
- Pessoa sem identificador de usuário na organização: a linha aparece com nome, e-mail e cargo. Desativar, reativar e a junção com o serviço não ocorrem para essa linha, porque não há chave para o serviço. O cargo também não é alterado nessa linha.
- Empresa sem nenhum membro além de quem criou: a lista tem pelo menos esse administrador, e a trava de último administrador se aplica a ele.
- O administrador desativa a si mesmo, havendo outro administrador: a ação é permitida. A próxima requisição dele recebe a frase de acesso desativado. Equipe deixa de oferecer convite, troca de cargo, desativar e reativar depois dessa recusa. Se ele for o único administrador, a trava recusa.
- O administrador rebaixa o próprio cargo, havendo outro administrador: a ação é permitida. Se ele for o único, a trava recusa.
- Repetir a desativação de quem já está Desativado não reativa. Repetir a reativação de quem já está Ativo não desativa.
- Desativar na empresa selecionada não altera o status dessa pessoa em outra empresa.
- Dois administradores agem ao mesmo tempo sobre os dois últimos cargos de administrador: a tela volta a contar os administradores imediatamente antes de cada ação. Se o serviço ou a plataforma recusar, a tela mostra o erro e recarrega a lista. Pelo menos um administrador Ativo permanece.
- Troca de empresa com pedido em curso: a resposta atrasada não altera a lista da empresa que ficou na tela.
- Sessão expirada: a pessoa entra de novo. A lista não é alterada por uma ação que a sessão não chegou a confirmar.
- Acesso negado de quem não administra: "Você não tem acesso. Selecione uma empresa válida." A sessão não é encerrada por essa recusa. Essa frase é diferente da frase de acesso desativado.
- Serviço ou plataforma indisponível, ou resposta ilegível: alerta, lista anterior permanece, nova tentativa é possível.
- Cargo fora de Administrador e Membro: a edição é recusada e o cargo anterior permanece.
- Pessoa desativada com token ainda válido: a próxima requisição ao serviço é recusada pela marca. A pessoa continua na organização. A tela não remove o membro.
- Último acesso: não usa a data de entrada nem a data de atualização do vínculo. Usa o `lastAccessAt` devolvido pelo serviço, ou "Sem acesso registrado". Dentro de 5 minutos, com o mesmo cargo, o serviço pode não gravar um instante novo.
- Paginação: um administrador fora da primeira página continua protegido pela trava. A contagem percorre todas as páginas de administradores.
- Promoção recente que o serviço ainda não conhece: a contagem da tela pode permitir a desativação e o serviço pode recusar. A tela mostra o erro do serviço e mantém o status.
- Editar ou gerenciar a organização pelo seletor: a navegação vai para `/equipe`. O perfil padrão da plataforma, com a gestão de membros, não abre. Quem não administra vê a recusa dessa rota.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O administrador da empresa selecionada MUST ver a lista de quem já pertence à empresa, com nome, e-mail, cargo, status e último acesso em cada linha.
- **FR-002**: Quem não administra a empresa selecionada MUST NOT ver o item Equipe e MUST NOT listar, editar, desativar nem reativar usuários. No acesso direto a `/equipe`, a pessoa MUST ver "Você não tem acesso. Selecione uma empresa válida." e a sessão MUST permanecer aberta.
- **FR-003**: Sem empresa selecionada, o aplicativo MUST NOT listar, editar, desativar nem reativar usuários e MUST orientar a pessoa a selecionar ou cadastrar uma empresa, como já faz nas outras áreas autenticadas.
- **FR-004**: A lista, a edição, a desativação e a reativação MUST aparecer na rota `/equipe`, aberta pelo item Equipe, em bloco distinto dos convites pendentes. O envio, a revogação, o reenvio e o aceite de convite MUST permanecer como na LLT-167.
- **FR-005**: A edição MUST alterar só o cargo da pessoa na empresa selecionada. O cargo enviado MUST ser `admin` ou `member`, sem prefixo, por `organization.updateMember` na sessão do administrador. Nome, e-mail, status e último acesso MUST NOT mudar por essa ação.
- **FR-006**: Desativar MUST gravar a marca com `POST /api/company/members/{userId}/deactivation`, sem corpo. A pessoa MUST continuar na organização e na lista, com status Desativado. A próxima requisição dela ao serviço MUST ser recusada com 403, `code` `user_deactivated`. O aplicativo MUST NOT remover o membro da organização e MUST NOT usar `PUT`.
- **FR-007**: O último acesso MUST ser o `lastAccessAt` devolvido pelo serviço. Sem esse instante, a lista MUST mostrar "Sem acesso registrado". A data de entrada ou de atualização do vínculo MUST NOT ser usada como último acesso. O valor pode estar até 5 minutos atrás quando o cargo observado não mudou.
- **FR-008**: O aplicativo MUST impedir desativar e MUST impedir rebaixar quando a ação deixaria zero administradores ativos. A contagem MUST percorrer todas as páginas e MUST incluir só quem tem cargo de administrador, tem `userId` e não está `deactivated` no serviço. Associação de administrador sem `userId` MUST NOT entrar na contagem. Quem o serviço não devolve, e tem `userId`, MUST contar como ativo. A recusa local de desativar MUST dizer "Não é possível desativar o último administrador." e MUST NOT chamar o `POST`. A recusa local de rebaixar MUST dizer "Não é possível rebaixar o último administrador." e MUST NOT chamar a troca de cargo. Se o serviço responder 403 com `code` `last_admin`, ou se a plataforma recusar a troca de cargo, a tela MUST mostrar esse erro e MUST manter o cargo e o status anteriores.
- **FR-009**: Cada pessoa visível na lista MUST ter um status. Quem pode acessar MUST aparecer como Ativo. Quem foi desativado MUST aparecer como Desativado e MUST continuar na lista. Quem o serviço ainda não registrou MUST aparecer como Ativo.
- **FR-010**: O nome exibido MUST ser o nome público da pessoa. Se não houver nome, MUST ser o e-mail. O e-mail exibido MUST ser o identificador da pessoa na empresa. O cargo exibido MUST ser Administrador ou Membro, com o mesmo critério já usado nos convites. A lista MUST juntar nome, e-mail e cargo da organização com status e último acesso do serviço pelo identificador do usuário.
- **FR-011**: Durante listar, editar, desativar ou reativar, o aplicativo MUST fazer um único pedido daquela ação e MUST manter o controle correspondente bloqueado até a resposta. Falha MUST ser um alerta e MUST NOT apresentar como concluída uma mudança que não foi confirmada.
- **FR-012**: Trocar de empresa ou abandonar a tela MUST descartar o efeito visual de um pedido anterior. Essa resposta MUST NOT alterar a lista da empresa que ficou em foco.
- **FR-013**: Sessão expirada MUST seguir a recuperação já conhecida: entrar de novo. Falha de rede MUST permitir nova tentativa, sem aplicar a mudança que falhou.
- **FR-014**: Se a lista tiver mais pessoas do que uma página, o administrador MUST conseguir ver as páginas seguintes.
- **FR-015**: Os controles novos MUST ter rótulo visível, erro associado à ação e operação por teclado, no mesmo padrão de Equipe. Sucesso é um aviso de status. Erro é um alerta. Uma falha de carga MUST ser distinta de uma lista vazia. A lista vazia MUST explicar "Não há usuário vinculado." A empresa nasce com quem a criou, então a lista vazia não é o caso comum.
- **FR-016**: O aplicativo MUST NOT receber nem guardar chave secreta da plataforma, e o serviço MUST NOT passar a usar chave secreta por causa desta história. A tela MUST NOT apagar a conta da pessoa na plataforma e MUST NOT remover a pessoa da organização.
- **FR-017**: Esta história MUST NOT alterar os dados da empresa, o contexto da empresa nem os produtos. MUST NOT criar cargo além de Administrador e Membro. MUST NOT definir a matriz de permissões nem esconder outras ações do produto segundo essa matriz. MUST NOT pedir configuração nova no dashboard da plataforma. As mudanças de perfil e de estilo presentes neste PR são aceitas e vêm da LLT-174: enquanto o perfil ainda não foi salvo, o nome vazio pode ser preenchido com o nome da sessão da Clerk, sem gravar até a pessoa salvar; os campos de formulário usam o fundo `#f8f8f8` (`--color-field`). Fora isso, esta história MUST NOT alterar o perfil que a própria pessoa edita (nome, idioma e fuso).
- **FR-018**: O administrador MUST poder desativar a si mesmo e MUST poder rebaixar o próprio cargo somente quando existir outro administrador. Sendo o único, as duas ações MUST ser recusadas pelo FR-008.
- **FR-019**: Reativar MUST retirar a marca com `DELETE /api/company/members/{userId}/deactivation`, sem corpo. O status MUST voltar a Ativo. A pessoa MUST continuar na organização. A próxima requisição aceita dela MUST voltar a passar. Reativar MUST NOT mudar o cargo.
- **FR-020**: Quando o serviço recusar o próprio usuário com `code` `user_deactivated`, o aplicativo MUST mostrar a `message`, que é "Seu acesso a esta empresa foi desativado." MUST NOT usar a frase de quem não administra e MUST NOT encerrar a sessão. Depois dessa recusa, Equipe MUST NOT oferecer convite, troca de cargo, desativar nem reativar. Os três 403 desta lista MUST ser distinguidos por `code`, não pela frase.
- **FR-021**: O seletor de organização MUST NOT abrir o perfil padrão da plataforma, onde é possível remover membro ou trocar cargo fora de `/equipe`. A ação de editar ou gerenciar a organização MUST navegar para `/equipe`. Quem não administra, se acionar essa ação, MUST cair na recusa já usada nessa rota. A sessão MUST permanecer aberta.

### Key Entities *(include if feature involves data)*

- **Usuário da empresa**: Pessoa que já pertence à empresa selecionada. Nome, e-mail e cargo vêm da organização. Status e último acesso vêm do serviço, ligados pelo identificador do usuário. Não inclui convite ainda não aceito. Sem nome público, o nome mostrado é o e-mail. Sem registro no serviço, o status é Ativo e o último acesso é "Sem acesso registrado".
- **Cargo**: Só Administrador (`org:admin`) e Membro (`org:member`), os mesmos do convite. A edição troca só esse valor, na sessão do administrador. Não é o nome da empresa no cabeçalho.
- **Status**: Ativo ou Desativado, por empresa. Desativado é a marca no serviço. A pessoa desativada continua na organização e na lista. Reativar tira a marca.
- **Último acesso**: `lastAccessAt` do serviço, instante ISO-8601 em UTC ou ausência. Não é a data do vínculo nem o último login da plataforma. Pode ficar até 5 minutos atrás se o cargo observado não mudou.
- **Administrador da empresa**: Quem, na empresa selecionada, tem o cargo de administrador, no mesmo critério já usado em Equipe. A empresa não pode ficar sem pelo menos um. A tela conta os administradores da organização. O serviço recusa desativar o último administrador que ele conhece.
- **Empresa selecionada**: A organização ativa da sessão. A lista, a edição, a desativação e a reativação valem só para ela.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um administrador com empresa selecionada vê nome, e-mail, cargo, status e último acesso de cada pessoa da página em uma única abertura de Equipe, em menos de 1 minuto, sem sair da área autenticada.
- **SC-002**: Em 100% das desativações confirmadas de quem não é o único administrador, a pessoa permanece na lista como Desativado e a próxima requisição dela ao serviço é recusada.
- **SC-003**: Em 100% das tentativas de desativar ou rebaixar o único administrador, a ação é recusada, o cargo dele continua administrador e o status dele continua Ativo.
- **SC-004**: Em 100% das tentativas de quem não administra a empresa selecionada, o item Equipe não aparece, o acesso direto a `/equipe` mostra a recusa padrão e nenhuma pessoa é editada, desativada ou reativada.
- **SC-005**: Em 100% das trocas de cargo confirmadas entre Administrador e Membro, a lista mostra o cargo novo e o nome, o e-mail, o status e o último acesso permanecem. Em 100% das falhas, o cargo anterior permanece.
- **SC-006**: Em 100% das respostas de um pedido abandonado, por saída da tela ou troca de empresa, a lista da empresa atual não muda por causa dessa resposta.
- **SC-007**: Em 100% dos casos sem empresa selecionada, nenhuma lista é alterada e a pessoa vê a orientação para selecionar ou cadastrar uma empresa.
- **SC-008**: Em 100% das requisições recusadas porque a própria pessoa está desativada, a frase exibida é "Seu acesso a esta empresa foi desativado." e a sessão permanece aberta.
- **SC-009**: Em 100% das reativações confirmadas, o status volta a Ativo, a pessoa continua na lista e a próxima requisição aceita dela volta a passar.

## Out of Scope

- Mudar o convite da LLT-167: envio, prazo de 7 dias, revogação, reenvio e aceite nas telas de entrada.
- Fechar o catálogo de cargos e a matriz de permissões (LLT-169) e passar a esconder ações conforme essa matriz (LLT-170). Gestor, Visualizador e Usuário Master não entram nesta lista.
- Restringir produtos por pessoa (LLT-171).
- Manter e-mail (LLT-172), notificações (LLT-173) e o perfil que a própria pessoa edita (LLT-174).
- Apagar a conta da pessoa na plataforma de acesso, banir a conta fora desta empresa, remover a pessoa da organização ou encerrar a sessão com chave secreta.
- Convite em massa, desativação em massa e edição em massa.
- Configurar o dashboard da plataforma. Esta história não pede item novo.
- Colocar chave secreta no aplicativo web ou no serviço.
- Fazer o serviço consultar a organização com chave secreta para montar a lista ou para conhecer os administradores.

## Assumptions

- A empresa ativa da sessão é o tenant. Administrador continua sendo quem tem o cargo de administrador da empresa, com ou sem o prefixo que a sessão já usa hoje. Membro não vê Equipe.
- A rota `/equipe` e o item Equipe já existem e só o administrador os usa. Esta história acrescenta o bloco de usuários ao lado do bloco de convites.
- A organização, na sessão do administrador, fornece o nome público, o identificador, o cargo e o identificador do usuário. Não fornece status nem último acesso. A sessão também troca o cargo. Esta história não usa a capacidade de retirar a pessoa da organização.
- O token de sessão continua válido até expirar. A marca no serviço é o que recusa a próxima requisição. A pessoa desativada continua membro da organização.
- O nome da lista é o nome público. O e-mail da lista é o identificador da pessoa na empresa. O perfil da LLT-174 continua sendo a edição da própria pessoa.
- A contagem de administradores da tela percorre todas as páginas. Entra quem tem cargo de administrador, sem o prefixo `org:`, e cujo status no serviço não é `deactivated`. Ausência no `GET` conta como ativo. Desativar um membro não reduz essa conta. O serviço recusa o `POST` com 403 e `code` `last_admin` quando, pelos registros que ele tem, o alvo é o último administrador ativo. O Web não envia a lista de cargos ao serviço e não usa chave secreta. Se as duas contagens divergirem, vale o erro devolvido e o status não muda.
- O contrato consumido é o do Core no commit `4f32c77`. Não há `PUT`. Desativar é `POST` e reativar é `DELETE` em `/api/company/members/{userId}/deactivation`, sem corpo.
- Textos próprios desta tela ficam em português, como os de Equipe. O rótulo Equipe do menu continua o que a moldura já traduz. Datas de último acesso usam o formato curto de data e hora no fuso local do navegador.
- Nenhuma chave secreta (`sk_` ou `CLERK_SECRET_KEY`) entra no web nem no serviço. As chamadas novas ao serviço passam pelo cliente já usado pelo aplicativo.
- A verificação automática da junção da lista, da trava do último administrador, dos dois cargos, dos dois status e da frase de acesso desativado faz parte da conclusão, no mesmo tipo de checagem já usado em Equipe. O acesso real da pessoa desativada e a troca de cargo na organização ficam no roteiro manual.
- O contrato do serviço está publicado em `lhamalog-core`, `specs/005-listar-editar-usuarios/contracts/company-members.md`, commit `4f32c77`. O arquivo `contracts/company-members.md` deste repositório o acompanha.

### Configuração da plataforma (outra pessoa)

Esta história não pede configuração de dashboard. Não há prazo, URL, papel novo nem chave para criar. A troca de cargo usa a gestão de membros que o administrador da organização já possui. A LLT-167 continua dona do que a outra pessoa configura para convites.
