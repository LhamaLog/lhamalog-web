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

- **Decision**: A tela oferece só Administrador (`org:admin`) e Membro (`org:member`). Confirmar chama `membership.update({ role })` com uma dessas duas strings. `organization.updateMember({ userId, role })` não é usado, para haver um único caminho. `roleLabel` e `isInviteRole` já existentes continuam valendo. Outro `role` vindo da lista aparece como texto cru e não é uma opção de gravação.
- **Rationale**: `UpdateOrganizationMembershipParams` só tem `role`. Não há como alterar nome por esse método. O responsável pediu o mínimo de mudança na Clerk.
- **Alternatives considered**: Gravar o cargo no Core (rejeitado: o cargo da sessão é o da organização). Editar nome (rejeitado).

## 4. Desativar e reativar

- **Decision**: `PUT /api/company/members/{userId}` com `{ "status": "deactivated" }` ou `{ "status": "active" }`. A pessoa permanece em `getMemberships`. A tela não chama `membership.destroy` nem `organization.removeMember`. Repetir o mesmo status não inverte o outro.
- **Rationale**: A marca no Core é o que a próxima requisição confere, com o token ainda válido. Tirar da organização esconderia a linha e exigiria readmissão.
- **Alternatives considered**: `destroy` / `removeMember` (rejeitado pelo responsável). Os dois juntos (rejeitado). Esperar o token expirar (rejeitado: não corta a próxima requisição).

## 5. Último administrador

- **Decision**: Imediatamente antes de `membership.update` para um cargo que não seja administrador, e imediatamente antes de desativar alguém cujo `role` normalizado é `admin`, a tela percorre todas as páginas de `getMemberships({ role: ['org:admin'] })`. Se a contagem for menor que 2, recusa sem chamar a Clerk nem o Core. Frases: "Não é possível rebaixar o último administrador." e "Não é possível desativar o último administrador." Desativar um membro não consulta essa trava. Se o Core responder `code: last_admin`, a tela mostra `message` e mantém Ativo. Se `membership.update` falhar, a tela mostra `clerkErrorMessage` e mantém o cargo anterior.
- **Rationale**: O Web enxerga os administradores da organização na sessão, sem segredo. O Core recusa pelo que ele conhece, e esse conjunto pode divergir até a pessoa promovida fazer uma requisição aceita. As duas recusas convivem. O Web não envia a lista de cargos ao Core.
- **Alternatives considered**: Só a contagem da tela (rejeitado: o responsável pediu a recusa do Core também). Só o Core (rejeitado: o Core não lê a organização sem segredo, e o rebaixamento acontece na Clerk). Confiar só no componente pronto da Clerk (rejeitado: a tela é a de Equipe).

## 6. Frase de acesso desativado

- **Decision**: `apiRequest` trata HTTP 403 com `code: user_deactivated`. A mensagem fica "Seu acesso a esta empresa está desativado." quando o corpo não trouxer `message`. Se trouxer `message`, o Web mostra esse texto. O 403 sem esse `code` continua "Você não tem acesso. Selecione uma empresa válida." quando não houver `message`. O 401 continua levando ao `signOut` já existente em `useApi`. `user_deactivated` não é 401 e não encerra a sessão. Em Equipe, essa recusa substitui o formulário de convite e as ações de cargo, desativar e reativar.
- **Rationale**: O cliente já mostra `body.message`. O `code` impede que a frase genérica de 403 apareça quando o Core omitir `message`. A pessoa desativada continua na organização, então a sessão da Clerk segue aberta.
- **Alternatives considered**: Encerrar a sessão (rejeitado: a spec manda mantê-la). Reusar a frase de não administrador (rejeitado: são recusas diferentes).

## 7. Onde a tela muda

- **Decision**: Só `TeamPage.tsx` e o cliente HTTP. A rota `/equipe`, o item Equipe e a recusa de quem não administra permanecem. Página de 10, com `Pagination` já usado nos convites. O `orgId` do início de cada chamada continua a ser conferido; resposta atrasada não altera a empresa que ficou na tela.
- **Rationale**: O responsável pediu o bloco na mesma rota. A LLT-167 já fechou o acesso.
- **Alternatives considered**: Rota nova (rejeitado). Mover os convites para outra rota (rejeitado).

## 8. Contrato ainda não publicado pelo Core

- **Decision**: [contracts/company-members.md](contracts/company-members.md) descreve o que o Web vai consumir. Em 2026-11-15, `lhamalog-core` na branch `LLT-168-listar-editar-e-desativar-usuarios` tinha `specs/005-listar-editar-usuarios/spec.md` e `checklists/`, sem pasta `contracts/`, e a spec do Core ainda listava as decisões como abertas. A implementação do Web espera o alinhamento desse arquivo antes de fixar os nomes no código, se o Core publicar outro caminho ou outros campos.
- **Rationale**: O responsável pediu para descrever o esperado e marcar o alinhamento quando a pasta ainda não existir.
- **Alternatives considered**: Inventar o consumo sem documento (rejeitado: a LLT-174 versionou o contrato do perfil). Bloquear o plano até o Core publicar (rejeitado: o Web já tem decisão suficiente para o contrato esperado).

## 9. Testes

- **Decision**: `tests/team-members.test.mjs` cobre funções puras: nome, junção, status padrão, último acesso ausente, trava do último administrador, papéis aceitos e a ausência de plano de remoção. `tests/api.test.mjs` cobre `user_deactivated` sem cair na frase genérica de 403 e sem virar 401. Sem jsdom e sem dependência nova.
- **Rationale**: É o mesmo estilo de `tests/team-invitations.test.mjs` e `tests/api.test.mjs`. A spec pede essa checagem automática.
- **Alternatives considered**: Teste de componente com biblioteca nova (rejeitado). Deixar a junção só no roteiro manual (rejeitado: a regra é pura e cabe no `node --test`).

## 10. O que não muda

- **Decision**: Nenhuma rota nova. Nenhuma dependência em `package.json`. Nenhuma variável `sk_` ou `CLERK_SECRET_KEY`. Nenhum passo novo de dashboard. Convite, perfil, empresa e produtos permanecem, fora o reconhecimento de `user_deactivated` no cliente compartilhado, que passa a valer para qualquer chamada que já use `apiRequest`.
- **Rationale**: O responsável pediu o mínimo na Clerk e nada de dashboard ou segredo. A frase de acesso desativado precisa aparecer na próxima requisição, esteja a pessoa em Equipe, empresa, produtos ou perfil.
- **Alternatives considered**: Tratar a frase só dentro de `TeamPage` (insuficiente: o membro desativado nem abre Equipe, e o administrador que se desativou também chama os outros recursos).
