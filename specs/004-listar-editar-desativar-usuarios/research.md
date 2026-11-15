# Research: Listar, editar e desativar usuários

Decisões fechadas para o aplicativo web. O Core guarda a marca e o último acesso. A Clerk só fornece a lista de membros e a troca de cargo.

## 1. Duas fontes, uma linha

- **Decision**: A linha visível junta `organization.getMemberships` com `GET /api/company/members` pelo `publicUserData.userId`. Nome, e-mail e cargo vêm da associação. Status e último acesso vêm do Core. Sem registro no Core, a linha fica Ativo e "Sem acesso registrado". Um `userId` que o Core devolve e que não está na página da Clerk não vira linha.
- **Rationale**: A associação do navegador traz `firstName`, `lastName`, `identifier`, `role` e `userId`. Não traz último acesso nem um status de desativado. O Core não lista a organização sem chave secreta. A página da Clerk é a lista de quem pertence à empresa.
- **Alternatives considered**: Pedir nome e cargo ao Core (rejeitado: o Core não lê a Clerk sem segredo). Tratar ausência no Core como erro de carga (rejeitado: quem ainda não fez requisição aceita precisa aparecer). Usar `updatedAt` do vínculo como último acesso (rejeitado pela spec).

## 2. Nome e e-mail

- **Decision**: O nome é `firstName` e `lastName` com um espaço, depois de `trim`. Se o resultado for vazio, o nome mostrado é `identifier`. A coluna de e-mail é `identifier`, mesmo quando for telefone. Sem `identifier`, a coluna de e-mail fica vazia e o nome, se também não houver, fica vazio; a linha continua.
- **Rationale**: É o que `PublicUserData` expõe em `@clerk/shared` 4.43.1. O perfil da LLT-174 não é a fonte desta lista.
- **Alternatives considered**: `displayName` do Core (rejeitado: a edição de nome de outra pessoa está fora, e o responsável pediu o nome público da Clerk).

## 3. Cargo

- **Decision**: A tela oferece só Administrador e Membro. Confirmar chama `organization.updateMember({ userId, role })` com `admin` ou `member`, sem prefixo, como o contrato do Core descreve. A leitura continua aceitando `org:admin` e `org:member`, que o Core trata como o mesmo cargo no token. Outro `role` vindo da lista aparece como texto cru e não é opção de gravação. Não chama `membership.update`.
- **Rationale**: O contrato do Core, commit `4f32c77`, é a fonte da verdade e nomeia `organization.updateMember` com o identificador sem prefixo. `UpdateMembershipParams` também só tem `userId` e `role`. Não há como alterar nome por esse método.
- **Alternatives considered**: Gravar o cargo no Core (rejeitado: o Core não tem caminho de cargo). `membership.update({ role: 'org:admin' })` (rejeitado neste alinhamento: o contrato publicado manda o outro método e o identificador sem prefixo). Editar nome (rejeitado).

## 4. Desativar e reativar

- **Decision**: `POST /api/company/members/{userId}/deactivation` sem corpo grava a marca. `DELETE` no mesmo caminho, sem corpo, tira a marca. Os dois respondem 200 com `{ userId, status, lastAccessAt }`. Não há `PUT`. A pessoa permanece em `getMemberships`. A tela não chama `membership.destroy` nem `organization.removeMember`. Repetir o `POST` não reativa. Repetir o `DELETE` não desativa.
- **Rationale**: É o contrato publicado pelo Core. A marca é o que a próxima requisição confere, com o token ainda válido. Tirar da organização esconderia a linha.
- **Alternatives considered**: `PUT` com `{ "status" }` (era a expectativa anterior do Web; o Core não tem esse caminho). `destroy` / `removeMember` (rejeitado). Esperar o token expirar (rejeitado).

## 5. Último administrador

- **Decision**: Antes do `POST` e antes de rebaixar, a tela conta quem tem cargo `admin` depois de remover o prefixo `org:` e cujo `status` no Core não é `deactivated`. Ausência no `GET` conta como ativo. A contagem usa todas as páginas. Se a ação deixasse zero, não chama o `POST` nem `organization.updateMember`. Frases: "Não é possível desativar o último administrador." e "Não é possível rebaixar o último administrador." Desativar um membro não reduz a conta. O Core recusa o `POST` com 403 e `code` `last_admin`, não com 409. A tela mostra a `message` e mantém Ativo. Se `organization.updateMember` falhar, a tela mostra `clerkErrorMessage` e mantém o cargo anterior.
- **Rationale**: É a regra do contrato do Core. Administrador já desativado continua na organização, então contar só `role: ['org:admin']` incluiria quem não pode mais acessar. O Core recusa pelo que ele conhece, e esse conjunto pode divergir até a próxima requisição aceita. O Web não envia a lista de cargos.
- **Alternatives considered**: Contar todo `org:admin` da Clerk, inclusive desativado (rejeitado pelo contrato publicado). Tratar `last_admin` como 409 (era a expectativa anterior; o Core responde 403). Só o Core (rejeitado: o rebaixamento não tem caminho no Core).

## 6. Frase de acesso desativado

- **Decision**: `apiRequest` copia `body.code` quando for string. Os três 403 desta lista são distinguidos por `code`, não pela frase. `user_deactivated` mostra "Seu acesso a esta empresa foi desativado." `last_admin` mostra "Não é possível desativar o último administrador." `not_admin` mostra "Somente o administrador da empresa pode gerenciar os usuários." Se o `code` vier e a `message` vier vazia, o Web usa essa frase do código. O 403 sem `code` e sem `message` continua "Você não tem acesso. Selecione uma empresa válida." O 401 continua levando ao `signOut` já existente em `useApi`. `user_deactivated` não encerra a sessão. Em Equipe, essa recusa não oferece convite, cargo, desativar nem reativar.
- **Rationale**: O contrato do Core, commit `4f32c77`, acrescenta `code` opcional e manda o Web distinguir por ele. A frase de acesso desativado usa "foi", não "está". A pessoa desativada continua na organização, então a sessão da Clerk segue aberta.
- **Alternatives considered**: Distinguir só pela frase (desnecessário: o `code` existe). Encerrar a sessão (rejeitado). Tratar `last_admin` como 409 (rejeitado: o status é 403).

## 7. Onde a tela muda

- **Decision**: Só `TeamPage.tsx` e o cliente HTTP. A rota `/equipe`, o item Equipe e a recusa de quem não administra permanecem. Página de 10, com `Pagination` já usado nos convites. O `orgId` do início de cada chamada continua a ser conferido; resposta atrasada não altera a empresa que ficou na tela.
- **Rationale**: O responsável pediu o bloco na mesma rota. A LLT-167 já fechou o acesso.
- **Alternatives considered**: Rota nova (rejeitado). Mover os convites para outra rota (rejeitado).

## 8. Contrato publicado pelo Core

- **Decision**: [contracts/company-members.md](contracts/company-members.md) acompanha o arquivo do Core no commit `4f32c77`. O `GET` usa o envelope `members`. Desativar e reativar não têm corpo. O `code` existe para `user_deactivated`, `last_admin` e `not_admin`.
- **Rationale**: O responsável definiu o contrato do Core como fonte da verdade e pediu para substituir a expectativa anterior do Web.
- **Alternatives considered**: Manter o `PUT` com `{ "status" }` (rejeitado: o Core não publica esse caminho). Esperar um `code` que não veio (o commit seguinte ao `a976683` acrescentou o campo).

## 9. Testes

- **Decision**: `tests/team-members.test.mjs` cobre funções puras: nome, junção, status padrão, último acesso ausente, trava do último administrador, papéis aceitos e a ausência de plano de remoção. `tests/api.test.mjs` cobre `user_deactivated` sem cair na frase genérica de 403 e sem virar 401. Sem jsdom e sem dependência nova.
- **Rationale**: É o mesmo estilo de `tests/team-invitations.test.mjs` e `tests/api.test.mjs`. A spec pede essa checagem automática.
- **Alternatives considered**: Teste de componente com biblioteca nova (rejeitado). Deixar a junção só no roteiro manual (rejeitado: a regra é pura e cabe no `node --test`).

## 10. O que não muda

- **Decision**: Nenhuma rota nova. Nenhuma dependência em `package.json`. Nenhuma variável `sk_` ou `CLERK_SECRET_KEY`. Nenhum passo novo de dashboard. Convite, perfil, empresa e produtos permanecem, fora o reconhecimento de `user_deactivated` no cliente compartilhado, que passa a valer para qualquer chamada que já use `apiRequest`.
- **Rationale**: O responsável pediu o mínimo na Clerk e nada de dashboard ou segredo. A frase de acesso desativado precisa aparecer na próxima requisição, esteja a pessoa em Equipe, empresa, produtos ou perfil.
- **Alternatives considered**: Tratar a frase só dentro de `TeamPage` (insuficiente: o membro desativado nem abre Equipe, e o administrador que se desativou também chama os outros recursos).
