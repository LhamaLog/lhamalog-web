# Research: Convidar usuário para a empresa

Decisões fechadas para o aplicativo web. O Core não participa do convite.

## 1. Canal do convite

- **Decision**: O administrador autenticado, com organização ativa, cria o convite com `organization.inviteMember({ emailAddress, role })` de `@clerk/react` 6.18.2. A lista usa `organization.getInvitations`. Revogar usa `invitation.revoke()`. A Clerk envia o e-mail, aplica o prazo e recusa link expirado ou revogado. Não há `fetch` direto, não há biblioteca nova e não há chamada a `apiRequest` / `useApi` nesta história.
- **Rationale**: O responsável alinhou com o Core: o Core não guarda convite, não tem API de convite e não usa chave secreta. O SDK do navegador já envia o e-mail na sessão do administrador, sem segredo no Web.
- **Alternatives considered**: API nova no Core (rejeitada: o Core não guarda convite). Segredo no Web para a Backend API (rejeitada: proibido). Híbrido em que o Core chama a Clerk (rejeitado nesta história).

## 2. Conflito com o ADR_114

- **Decision**: Esta história substitui a leitura do ADR_114. O comentário de `src/features/auth/components/CreateOrganizationPage.tsx` e a linha do README em `/organizacoes/nova` dizem que o convite de membros é feito pelo backend, não pela UI da Clerk. A implementação reescreve os dois textos: criar empresa continua com `skipInvitationScreen`; convidar alguém é `/equipe`, pelo SDK do navegador, sem API no Core e sem segredo. `skipInvitationScreen` não é removido.
- **Rationale**: Deixar o comentário antigo faria a implementação voltar o convite para o Core, contra a decisão fechada.
- **Alternatives considered**: Apagar o ADR_114 sem explicar a diferença entre criar empresa e convidar depois (rejeitado: as duas frases precisam continuar verdadeiras, cada uma no seu lugar). Manter o comentário e só documentar o conflito (insuficiente para quem for implementar).

## 3. Cargos

- **Decision**: O select oferece só Administrador (`org:admin`) e Membro (`org:member`). `inviteMember` recebe exatamente uma dessas duas strings. Administrador da sessão é `orgRole` igual a `org:admin` ou, sem prefixo, `admin`, que é o critério já usado em `CompanySession` no Core (`clerk.administrator-roles` padrão `admin`, com `org:` removido). `org:member` não vê Equipe e não convida.
- **Rationale**: É a única distinção que o JWT da organização já carrega. Gestor, Visualizador e Usuário Master continuam fora, na LLT-169.
- **Alternatives considered**: Lista vinda do Core (não existe). Três rótulos sem matriz (rejeitado pelo responsável).

## 4. Prazo de 7 dias

- **Decision**: A tela não envia prazo. `inviteMember` no navegador só aceita `emailAddress` e `role`; não aceita dias nem URL de retorno. O dashboard, configurado por outra pessoa, fica com convites ligados e validade de 7 dias. A lista mostra a validade em formato curto, no fuso local do navegador: `expiresAt` do objeto, quando for uma data; na ausência desse campo, `createdAt` mais 7 dias. O objeto de convite documentado para o navegador não traz `expiresAt` (esse campo está no objeto de backend, que este aplicativo não consulta).
- **Rationale**: O número 7 é decisão de produto e mora no dashboard. Somar 7 dias na tela faz a coluna "validade" bater com essa configuração sem segredo e sem API de backend.
- **Alternatives considered**: Passar `expiresInDays` pelo navegador (o método não tem esse parâmetro). Ler `expiresAt` no Core (não há API). Esconder a data e escrever só "7 dias" (a lista pede a validade de cada convite).

## 5. Aceite

- **Decision**: Não há rota nova. O link do e-mail usa as telas `/sign-in` e `/sign-up` já montadas com os componentes da Clerk. Como `inviteMember` não define URL de retorno, o dashboard precisa apontar o portal da conta para esses caminhos. Mensagens de expiração e de revogação são distintas, em português, nos textos que essas telas já localizam. Não se cria página `/convite/:token`.
- **Rationale**: O responsável pediu o aceite nas telas de entrada. O vínculo nasce quando a Clerk coloca a pessoa na organização com o papel do convite. O Core passa a ver esse papel no JWT, como já faz.
- **Alternatives considered**: Rota própria de aceite (rejeitada). Confirmação extra no Core antes de aplicar o cargo (rejeitada: o Core não guarda convite).

## 6. Lista, revogação e reenvio

- **Decision**: `getInvitations({ status: ['pending'] })` alimenta a lista, com paginação. Antes de `inviteMember`, o aplicativo procura pendente do mesmo e-mail em todas as páginas, não só na página visível. E-mail comparado depois de `trim` e em minúsculas. Reenviar revoga todos os pendentes daquele e-mail e só então chama `inviteMember` uma vez, com o mesmo `role`. Se qualquer `revoke` falhar, não há `inviteMember`. Se o `inviteMember` falhar depois, não resta convite utilizável da tentativa e a lista é recarregada. Envio novo, com pendente já existente, não revoga sozinho: explica e aponta o reenvio.
- **Rationale**: A spec exige no máximo um convite utilizável por e-mail. Revogar antes de criar é o que o navegador permite sem deixar os dois ativos. A Clerk recusa um segundo pendente, mas o reenvio precisa de fato mandar outro e-mail.
- **Alternatives considered**: Chamar `inviteMember` de novo e confiar no erro de duplicidade (não reenvia). Revogar só o item da linha e ignorar outro pendente legado do mesmo e-mail (poderia deixar dois se a revogação do legado falhasse em silêncio; por isso a regra é revogar todos antes de criar).

## 7. Quem já é membro

- **Decision**: Antes de convidar, `organization.getMemberships` é percorrido página a página até achar o e-mail ou acabar as páginas. O e-mail comparado é o identificador do membro (`publicUserData.identifier`), normalizado como o do formulário. O e-mail primário de quem está na sessão entra nessa mesma regra. Não se usa a API de produtos nem de perfil do Core.
- **Rationale**: A primeira página não prova que a pessoa não está na empresa. O Core não é a fonte da lista de membros nesta história.
- **Alternatives considered**: Confiar só no erro da Clerk ao convidar quem já é membro (a spec pede a explicação antes, e o texto da plataforma pode não ser o da tela). Consultar `/api/products` ou um endpoint novo (fora de escopo).

## 8. Troca de empresa

- **Decision**: Cada chamada guarda o `orgId` do início. Se o `orgId` atual for outro quando a resposta chegar, a tela descarta o efeito (não mostra sucesso na empresa nova nem mistura a lista). A lista é sempre recarregada com a organização ativa. O convite que a Clerk já tiver criado fica na organização que estava ativa no clique, que é o comportamento esperado.
- **Rationale**: É o mesmo descarte de resposta atrasada da empresa e do perfil, aplicado ao SDK em vez de `AbortController` do `fetch` (o SDK não recebe o signal do `useApi`).
- **Alternatives considered**: Bloquear o seletor de empresa durante o envio (não existe esse bloqueio nas outras telas). Desfazer o convite na organização anterior se a pessoa trocou no meio (a spec não pede desfazer um convite que foi para a empresa certa).

## 9. Recusa de quem não administra

- **Decision**: O item Equipe some do menu quando a pessoa não é administradora. Em `/equipe`, a página mostra a frase já usada no cliente HTTP para acesso negado: "Você não tem acesso. Selecione uma empresa válida." Não chama `signOut`. Sem `orgId`, permanece o vazio já usado por `CompanyWorkspace`.
- **Rationale**: A spec chama isso de recusa padrão e pede para não encerrar a sessão. O `useApi` só faz `signOut` no 401; o 403 mostra essa frase. Aqui não há chamada HTTP, então a frase é local.
- **Alternatives considered**: Redirecionar para `/empresa` em silêncio (a pessoa não entende a recusa). Tratar como 401 e deslogar (a spec proíbe).

## 10. Testes

- **Decision**: `tests/team-invitations.test.mjs` cobre funções puras: e-mail, cargos, administrador, validade de 7 dias, "já existe pendente" e a ordem do reenvio (revogar todos os pendentes do e-mail, depois um único `inviteMember`; falha de revogação não convida). O e-mail real, o link e o aceite ficam no quickstart. Não há jsdom nem biblioteca nova.
- **Rationale**: O repositório testa contrato e validação com `node --test`, como em `tests/company-settings.test.mjs` e `tests/profile.test.mjs`.
- **Alternatives considered**: Teste de componente com dependência nova. Deixar a regra dos dois convites só no manual.

## 11. O que não muda

- **Decision**: Nenhuma rota nova além de `/equipe`. `/sign-in`, `/sign-up`, `/organizacoes/nova`, `/empresa`, `/produtos` e `/perfil` permanecem. Nenhuma dependência nova em `package.json`. Nenhuma variável `sk_` ou `CLERK_SECRET_KEY`. Nenhuma edição de `src/shared/services/api.ts` para convite.
- **Rationale**: O padrão do Web e a decisão de produto limitam o diff a uma feature, ao menu, à rota e ao texto que hoje cita o ADR_114 de forma vencida.
- **Alternatives considered**: Embutir a tela de convites pronta da Clerk (`OrganizationProfile`) no lugar de `/equipe` (não entrega a lista e os cargos no padrão visual do LhamaLog, e reabriria a UI que a criação de empresa desligou).
