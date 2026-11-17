# Feature Specification: Sessão encerrada pelo Core

**Feature Branch**: `LLT-163-validar-o-token-do-clerk-no-core`

**Created**: 2026-11-16

**Status**: Draft

**Input**: User description: "Tratar no Web o contrato 401/403 do Core da LLT-163 (ADR_032, `specs/002-validacao-token-clerk/contracts/http-security.md` no lhamalog-core) e o que mais faltar para o login com a Clerk funcionar pela Development enquanto o fluxo de compra e a criação do Tenant (LLT-157) não existem. Itens vindos da revisão do PR #4 e dos testes de 15 e 16/11. Ponto de partida para o plano."

## Clarifications

### Session 2026-11-16

- Q: Enquanto a LLT-157 não existe, o que o Web faz com "Cadastrar empresa" e com a criação de organização? → A: Mantém a criação, com um aviso na tela de criar organização de que a organização nova só funciona depois do fluxo de compra. Quem usa uma organização sem Tenant continua recebendo o 403 de segurança e volta ao login (User Story 1).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Sair na hora quando o Core encerra o acesso (Priority: P1)

Uma pessoa está usando o LhamaLog quando o Core recusa o acesso dela por segurança: a sessão expirou, o token é inválido (401) ou a organização ativa não tem acesso (403 de segurança, quando o Core também revoga as sessões na Clerk). O Web encerra a sessão local na primeira recusa e leva a pessoa ao login com o aviso "Você foi deslogado". Hoje só o 401 faz isso. No 403 a tela mostra "Você não tem acesso" e a pessoa fica presa até uma chamada seguinte voltar 401.

**Why this priority**: É o contrato da ADR_032 e a principal diferença entre a `Development` e o Core da LLT-163. Sem a chave secreta no Core, a pessoa fica presa na tela de erro.

**Independent Test**: Com uma organização sem Tenant ativa, abrir a Empresa. Na primeira resposta 403 de segurança a pessoa está no login, com o aviso.

**Acceptance Scenarios**:

1. **Given** uma sessão ativa, **When** o Core responde 401 a qualquer chamada, **Then** o Web encerra a sessão local e mostra o login com "Você foi deslogado".
2. **Given** uma sessão ativa, **When** o Core responde 403 de segurança (sem código de negócio), **Then** o Web encerra a sessão local e mostra o login com "Você foi deslogado".
3. **Given** uma sessão ativa, **When** o Core responde 403 com um código de negócio (`not_admin`, `user_deactivated`, `last_admin`), **Then** a pessoa continua logada e vê a mensagem de negócio na tela.
4. **Given** várias chamadas em andamento, **When** mais de uma volta 401 ou 403 de segurança, **Then** a pessoa sai uma vez só e vê um único aviso.
5. **Given** a pessoa não tem empresa selecionada, **When** uma tela tentaria chamar o Core, **Then** o Web não chama o Core, não encerra a sessão e leva à escolha de empresa.

---

### User Story 2 - Voltar para onde estava depois de entrar de novo (Priority: P1)

Depois de ser deslogada pelo Core, a pessoa entra de novo e volta à tela em que estava (por exemplo, Produtos), e não à Empresa. O destino guardado só pode ser uma rota interna do LhamaLog.

**Why this priority**: Sem isso cada sessão expirada custa o caminho de volta até a tela de trabalho. O destino externo é risco de redirecionamento malicioso.

**Independent Test**: Em `/produtos`, forçar uma resposta 401, entrar de novo e conferir que a tela final é `/produtos`.

**Acceptance Scenarios**:

1. **Given** a pessoa em `/produtos` deslogada pelo Core, **When** entra de novo, **Then** volta para `/produtos`.
2. **Given** o login aberto com um destino externo ou malformado (outro domínio, `//host`, esquema `javascript:`), **When** a pessoa entra, **Then** vai para a página inicial e o destino é descartado.
3. **Given** a sessão já ativa (por exemplo, logo depois do código de segundo fator), **When** a tela de login está aberta com um destino interno, **Then** a pessoa vai direto para esse destino, sem ficar num cartão de login vazio.

---

### User Story 3 - Criar organização enquanto não há fluxo de compra (Priority: P2)

Hoje a pessoa consegue criar uma organização pelo Web ("Cadastrar empresa"). A organização nova não tem Tenant até existir o fluxo de compra (LLT-157), e o Core responde 403 e revoga as sessões assim que ela é usada. A pessoa precisa saber disso antes de criar, ou a criação precisa ficar fora do caminho dela.

**Why this priority**: Afeta quem testa o ambiente e quem demonstra o produto. Não bloqueia o login com uma organização que já tem Tenant.

**Independent Test**: Abrir "Cadastrar empresa", conferir o aviso, criar a organização e trocar para ela.

**Acceptance Scenarios**:

1. **Given** a pessoa logada, **When** abre a criação de organização, **Then** vê o aviso de que a organização nova só dá acesso depois do fluxo de compra, e ainda pode criá-la.
2. **Given** uma organização recém-criada, sem Tenant, **When** a pessoa troca para ela, **Then** o resultado é o mesmo da User Story 1 (403 de segurança e volta ao login), sem tela quebrada.

---

### User Story 4 - Teste de ponta a ponta com a Clerk real (Priority: P2)

Com o Core da LLT-163 e uma organização de teste com Tenant (spec 007 do `lhamalog-core`), o responsável percorre um roteiro manual no Web: login com segundo fator, Empresa, Produtos, Equipe e Perfil, sessão expirada com volta à rota, 403 de segurança e 403 de negócio. O resultado de cada item fica registrado. Cobre a T009 da spec 001, que continua aberta.

**Why this priority**: Os testes automatizados do Web não usam a Clerk real. É a evidência para fechar a integração do login.

**Independent Test**: Executar o quickstart desta feature e anexar o resultado ao PR da feature.

**Acceptance Scenarios**:

1. **Given** uma conta com segundo fator e uma organização com Tenant, **When** a pessoa entra, **Then** chega ao aplicativo e as quatro telas integradas carregam.
2. **Given** a sessão expirada no meio do uso, **When** a pessoa age numa tela, **Then** é levada ao login e, depois de entrar, volta à mesma tela.

---

### Edge Cases

- A sessão é revogada na Clerk com uma chamada já em andamento: a chamada termina em 401 e o fluxo é o da User Story 1, sem uma segunda mensagem de erro na tela.
- Duas abas abertas: a saída numa aba leva a outra ao login na próxima ação, sem loop entre login e aplicativo.
- O Core está fora do ar ou a rede falha: o Web mostra a falha e a opção de tentar de novo, sem encerrar a sessão.
- Um 403 sem corpo ou com corpo que não é JSON: conta como 403 de segurança.
- A própria pessoa foi desativada na empresa (`user_deactivated`): continua logada e vê "Seu acesso a esta empresa foi desativado.", como define a LLT-168.
- Sessão `pending` (tarefa da Clerk em aberto): continua contando como deslogada e segue para as telas de tarefa (ADR_024). Não é tratada como 401.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O Web MUST encerrar a sessão local e abrir o login com o aviso "Você foi deslogado" quando o Core responder 401.
- **FR-002**: O Web MUST fazer o mesmo quando o Core responder 403 sem código de negócio e sem mensagem (403 de segurança, corpo `{"error":"forbidden"}` ou sem corpo legível).
- **FR-003**: O Web MUST manter a sessão e mostrar a mensagem correspondente quando o 403 trouxer um código de negócio (`not_admin`, `user_deactivated`, `last_admin` ou outro) ou uma mensagem do Core. Códigos de negócio novos MUST seguir a mesma regra, sem encerrar a sessão.
- **FR-004**: Sem empresa selecionada, o Web MUST NOT chamar o Core nem encerrar a sessão. Ele leva a pessoa à escolha de empresa.
- **FR-005**: Várias recusas simultâneas MUST resultar numa única saída e num único aviso.
- **FR-006**: Ao encerrar a sessão, o Web MUST guardar a rota atual como destino de volta, e o login MUST levar a pessoa a esse destino depois de entrar.
- **FR-007**: O destino de volta MUST ser aceito só quando for uma rota interna do Web. Caso contrário, o destino é a página inicial.
- **FR-008**: Enquanto a LLT-157 não existir, a tela de criar organização MUST mostrar, antes da criação, um aviso de que a organização nova só dá acesso ao LhamaLog depois do fluxo de compra. A criação continua disponível pelo "Cadastrar empresa" e pelo seletor de organização.
- **FR-009**: Com a sessão já ativa, a tela de login MUST levar a pessoa ao destino interno, ou à página inicial, sem mostrar um cartão de login vazio (já corrigido no PR #7 para a página inicial; esta feature estende ao destino).
- **FR-010**: A mensagem de erro mostrada ao usuário MUST vir do campo de mensagem do Core quando existir. Quando não existir, o Web usa um texto próprio por status ou código, sem expor detalhes técnicos.
- **FR-011**: A feature MUST ter um roteiro manual de ponta a ponta com a Clerk real (quickstart), cobrindo a User Story 4. O resultado de cada item fica registrado no PR da feature.

### Key Entities

- **Recusa do Core**: resposta 401 ou 403. Classificada em recusa de segurança (encerra a sessão) ou recusa de negócio (mantém a sessão), pelo status e pela presença de um código de negócio.
- **Destino de volta**: rota interna em que a pessoa estava quando foi deslogada. Usada uma vez, depois do login.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em 100% das recusas de segurança, a pessoa vê o login com o aviso na primeira recusa, sem ver antes uma tela de erro.
- **SC-002**: Em 100% das recusas de negócio, a pessoa continua logada e na mesma tela.
- **SC-003**: Depois de ser deslogada e entrar de novo, a pessoa volta à tela anterior em 100% dos casos com destino interno, e 0 destinos externos são seguidos.
- **SC-004**: Com três ou mais recusas simultâneas, a pessoa vê exatamente um aviso.
- **SC-005**: 100% dos itens do roteiro de ponta a ponta têm resultado registrado antes do merge da feature.

## Assumptions

- O contrato do Core é o da LLT-163: 401 `{"error":"unauthorized"}` e 403 `{"error":"forbidden"}` com revogação das sessões na Clerk. Os 403 de negócio vêm da LLT-168, com `code` e `message`.
- A revogação de todas as sessões no 403 é feita pelo Core, não pelo Web (ADR_032). O Web só encerra a sessão local.
- O ambiente de teste (login, organização e Tenant de desenvolvimento) é o da spec 007 do `lhamalog-core`.
- Os testes automatizados seguem sem dependências novas: a lógica de classificação de recusas e de validação do destino é extraída como função pura e testada com `node --test`. Bibliotecas de teste de componente entram só com aprovação.
- O README já descreve o login e a organização de teste com um link para o guia do Core. Atualizar o README depois da LLT-176 (nome e função fixos no Header, o hook e as pastas) entra no plano desta feature.
- O "403 de negócio permanece na tela" (USID_030.1, research da spec 001) fica confirmado por esta spec: vale só para os códigos de negócio. O 403 de segurança sempre encerra a sessão.
