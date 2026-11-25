# Research: Melhorar a tela de perfil do usuário

## Tema e acessibilidade só neste navegador

- **Decision**: `localStorage` com `lhamalog.theme` (`light`, `dark` ou `system`), `lhamalog.reduceMotion`, `lhamalog.underlineLinks` e `lhamalog.contrast`. `system` segue `matchMedia('(prefers-color-scheme: dark)')` e muda junto com o sistema. `CompanyWorkspace` grava os atributos em `document.documentElement` ao montar e os remove ao desmontar. As regras visuais ficam em `src/styles.css`. Nada disso entra no `PUT` do perfil.
- **Rationale**: o FR-010 fechou o lugar: o navegador, não o Core. Tirar o atributo ao sair da área autenticada deixa as telas de entrada como estão.
- **Alternatives considered**: gravar no Core; marcar `dark:` em cada componente. Os dois ampliam o que esta história precisa.

## Bio e cargo

- **Decision**: o web lê e grava `bio` e `jobTitle`. Campo ausente na leitura vale `""` e a carga segue. O `PUT` da conta e o de preferências enviam os dois, já recortados; texto só com espaços vira `""`. A confirmação exige o eco dos dois. Sem eco, ou com recusa, não há sucesso e o rascunho fica. Bio até 160, cargo até 80. A mesma faixa de controle do nome, que já inclui quebra de linha, recusa os dois.
- **Rationale**: é o contrato paralelo e o comportamento pedido para o Core que ainda não devolve os campos.
- **Alternatives considered**: falhar a carga se o campo não vier; manter os limites antigos de 500 e 200.

## Foto no cartão e no cabeçalho

- **Decision**: trocar com `user.setProfileImage({ file })` na sessão já aberta. Mostrar `imageUrl` só quando `hasImage` é verdadeiro. Sem foto, cartão e cabeçalho usam as iniciais. `profilePhotoSrc` é a função única dos dois lugares. Não se chama `setProfileImage({ file: null })`. Falha mantém a foto anterior.
- **Rationale**: `imageUrl` existe mesmo sem foto enviada; `hasImage` separa a foto das iniciais. Remover a foto está fora.
- **Alternatives considered**: usar `imageUrl` sempre, o que mostraria o avatar gerado pela Clerk no lugar das iniciais.

## Senha e verificação em duas etapas

- **Decision**: se a sessão já tem a tarefa `reset-password`, a seção abre `/tarefas/redefinir-senha`, que já monta `TaskResetPassword`. Sem essa tarefa, a troca de senha pela sessão aberta pede a senha atual e a nova no `PasswordInput` já existente, via `user.updatePassword({ currentPassword, newPassword })`, sem `signOutOfOtherSessions`. Isso não conta como desenho novo (I1). Ligar a verificação quando ela está desligada acontece só pelo fluxo existente `/tarefas/configurar-mfa`, que já monta `TaskSetupMFA`. No hub, o bloco da verificação só mostra o status `user.twoFactorEnabled` e permite desligar com `user.disableTOTP()` (I2). Senha e sessões continuam na mesma seção. Sem `createTOTP` e sem pareamento no hub: não se desenha segredo, URI nem QR. Se `/tarefas/configurar-mfa` não iniciar, o hub não completa o pareamento. `useReverification`, se a Clerk o exigir para `updatePassword` ou `disableTOTP`, continua sendo o SDK de sessão. Sem chave secreta e sem mudança no painel.
- **Rationale**: I1 fecha que o `PasswordInput` já existente não é desenho novo. I2 separa ligar, que fica no fluxo existente, de desligar, que o hub faz com `disableTOTP`. As rotas atuais só andam com tarefa pendente. O hub não substitui a de verificação por pareamento.
- **Alternatives considered**: tratar o pedido da senha atual e da nova como desenho novo; chamar `createTOTP` no hub quando `/tarefas/configurar-mfa` não inicia; desenhar o pareamento do mock; criar a tarefa pelo SDK Backend, que exige segredo; só navegar e aceitar a rota vazia.

## Sessões

- **Decision**: `user.getSessions()` lista as sessões. O id em uso vem de `useSession().session.id`. `sessions.ts` marca esse id e não o oferece à revogação. As outras chamam `revoke()` no objeto devolvido. Sucesso tira o id da lista local, porque `getSessions()` guarda cache. Falha mantém a linha e mostra o erro. Se não houver outra sessão, a seção diz isso e ainda mostra a atual quando o id é conhecido. O Sair continua o `SignOutButton`.
- **Rationale**: o FR-015 separa a sessão em uso das demais. Revogar a atual por efeito colateral da troca de senha apagaria essa separação.
- **Alternatives considered**: `signOutOfOtherSessions: true` no `updatePassword`; botão de revogar também na sessão em uso.

## Função, empresa e membro desde

- **Decision**: o vínculo da empresa selecionada vem de `user.getOrganizationMemberships()`. Função e data são `role` e `createdAt` desse vínculo. O nome da empresa continua `useOrganization()`. `org:admin` e `org:member` têm frase no catálogo do perfil; papel desconhecido aparece como veio. Sem `createdAt`, a tela diz que a data está indisponível. Nada disso é gravado de volta.
- **Rationale**: são dados da sessão, só leitura, e mudam com a empresa. `roleLabel` da equipe está só em português.
- **Alternatives considered**: um recurso novo no Core para o vínculo.

## Idioma das frases da tela

- **Decision**: toda frase fixa das cinco seções, inclusive as de `NotificationPreferences`, entra nos dois catálogos de `messages.ts`. O cartão de notificações lê `profileMessage` com o idioma já aplicado. Texto que o Core devolve, rótulo de tipo e de severidade inclusive, fica como veio. As outras telas não ganham tradução.
- **Rationale**: o FR-011 e o SC-005 cobrem esta tela e o cartão que muda de seção. O catálogo e o teste de chaves iguais já existem.
- **Alternatives considered**: biblioteca nova de i18n; catálogo separado só para notificações.

## Fuso buscável

- **Decision**: filtrar `timeZoneOptions()` pelo nome ou pelo deslocamento atual, sem componente novo. Cada opção mostra o identificador e o deslocamento. A pré-visualização continua local a esta tela.
- **Rationale**: a lista IANA já está no perfil. A busca é um filtro em cima dela.
- **Alternatives considered**: biblioteca de fuso horário.

## ADR_171

- **Decision**: ponteiro apenas, com o título já citado na spec. Este plano não busca o arquivo em `lhamalog-docs` e não copia o texto.
- **Rationale**: a ADR ainda não está publicada, e a rodada pediu para não depender dela.
- **Alternatives considered**: bloquear o plano até a publicação.

## Testes

- **Decision**: `tests/profile.test.mjs` passa a exigir `bio` e `jobTitle` no contrato e na validação. `tests/profile-hub.test.mjs` cobre aparência, a regra de não revogar a sessão em uso, a foto, o filtro de fuso e as chaves novas dos dois catálogos.
- **Rationale**: o executor atual importa `.ts` e não renderiza componente. O teste que hoje exige só quatro campos no `PUT` precisa mudar junto.
- **Alternatives considered**: adicionar renderizador de componente só para esta história.
