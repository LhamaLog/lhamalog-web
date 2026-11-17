# Contract: usuários da empresa (consumido pelo web)

Fonte da verdade: `lhamalog-core`, branch `LLT-168-listar-editar-e-desativar-usuarios`, `specs/005-listar-editar-usuarios/contracts/company-members.md`, commit `4f32c77`. Este arquivo repete o que o Web consome. Se os dois divergirem, vale o do Core e este arquivo é que se ajusta.

Nome, e-mail, cargo exibido e a troca de cargo ficam na sessão do administrador. O Core não devolve esses campos e não tem caminho de cargo. Sem chave secreta e sem configuração nova de dashboard.

## Recurso

| Método | Caminho | Corpo |
| --- | --- | --- |
| `GET` | `/api/company/members` | sem corpo |
| `POST` | `/api/company/members/{userId}/deactivation` | sem corpo |
| `DELETE` | `/api/company/members/{userId}/deactivation` | sem corpo |

Não há `PUT`. Não há `/api/company/members/{userId}/role`. Com sessão autenticada, esse caminho continua 404.

Autenticação: `Authorization: Bearer` pelo `apiRequest` / `useApi`. A empresa é a do token. `userId`, `organizationId` e `tenantId` no corpo são ignorados. O `userId` da marca é o do caminho: texto de 1 a 200 caracteres, o `sub` da pessoa.

## GET 200

```json
{
  "members": [
    {
      "userId": "user_ana",
      "status": "active",
      "lastAccessAt": "2026-11-15T22:10:00Z"
    },
    {
      "userId": "user_bruno",
      "status": "deactivated",
      "lastAccessAt": null
    }
  ]
}
```

A ordem do Core é `userId` ascendente. A lista traz quem o Core já observou ou quem já foi desativado nesta empresa, não a organização inteira.

O Web cria uma linha por membro da organização, na ordem da página da organização:

- se o Core devolveu o `userId`, usa `status` e `lastAccessAt`;
- se não devolveu, a linha fica Ativo e "Sem acesso registrado";
- `userId` do Core que não está na organização não vira linha.

`status` `active` aparece como Ativo. `deactivated` aparece como Desativado. `lastAccessAt` é ISO-8601 em UTC ou `null`. Pode estar até 5 minutos atrás se o cargo observado não mudou. Abrir esta lista, sendo administrador ativo, é uma requisição aceita: o próprio administrador passa a estar observável.

O Web trata como falha de carga um 200 em que `members` não seja array, ou em que algum item não tenha `userId` string de 1 a 200 caracteres, `status` exatamente `active` ou `deactivated`, e `lastAccessAt` `null` ou string de data. Não completa esse 200 inválido com a lista da organização.

## POST e DELETE

`POST .../deactivation` grava `deactivated`. `DELETE .../deactivation` volta a `active`. Os dois respondem 200 com o registro, não com o array:

```json
{
  "userId": "user_bruno",
  "status": "deactivated",
  "lastAccessAt": "2026-11-15T22:10:00Z"
}
```

O `DELETE` devolve `status` `active` e o `lastAccessAt` que já estava gravado. Repetir o `POST` devolve 200 com `deactivated` e não reativa. Repetir o `DELETE` devolve 200 com `active` e não desativa. Nenhum dos dois altera `lastAccessAt`, o cargo ou a associação na organização. A marca é só da empresa da sessão.

`userId` vazio ou acima de 200 caracteres: 400, "Informe o usuário." O Web não envia `userId` vazio.

## Troca de cargo

Fora deste HTTP. `organization.updateMember({ userId, role })` na sessão do administrador. `role` é `admin` ou `member`, sem prefixo, os identificadores que o Core descreve como os do convite. `org:admin` e `org:member` continuam equivalentes na leitura que o Core faz do token. O Core não grava essa troca. Na próxima requisição aceita, o token traz o cargo novo.

A lista continua mostrando o `role` que `getMemberships` devolve. `org:admin` e `admin` são Administrador. `org:member` e `member` são Membro. Outro valor aparece como texto cru e não é opção de gravação.

Não chamar `membership.update`, `membership.destroy` nem `organization.removeMember`.

## Contagem do último administrador

Antes do `POST` e antes do `organization.updateMember` que rebaixa, o Web conta as pessoas da organização cujo cargo, sem o prefixo `org:`, é `admin` e cujo `status` no Core não é `deactivated`. Ausência no `GET` conta como ativo. A contagem percorre todas as páginas da organização e o `GET` inteiro, não só a página visível. Se a ação deixasse a conta em zero:

- o Web não chama o `POST` e mostra "Não é possível desativar o último administrador.";
- o Web não chama `organization.updateMember` e mostra "Não é possível rebaixar o último administrador."

Desativar quem não é administrador não reduz a conta. Desativar a si mesmo é permitido quando a conta restante permanece pelo menos um. A frase de rebaixar não é resposta do Core e não tem `code`.

## Erros

O corpo acrescenta `code` só quando existe. Sem `code`, continua `{ "message", "fieldErrors" }`. O Web distingue os três 403 desta lista por `code`, não pela frase, e mostra a `message`.

Marca desativada, em qualquer `/api/**` com empresa:

```json
{
  "message": "Seu acesso a esta empresa foi desativado.",
  "fieldErrors": {},
  "code": "user_deactivated"
}
```

Último administrador ativo conhecido:

```json
{
  "message": "Não é possível desativar o último administrador.",
  "fieldErrors": {},
  "code": "last_admin"
}
```

Membro em `GET`, `POST` ou `DELETE` deste recurso:

```json
{
  "message": "Somente o administrador da empresa pode gerenciar os usuários.",
  "fieldErrors": {},
  "code": "not_admin"
}
```

| Situação | Status | `code` | `message` |
| --- | --- | --- | --- |
| `userId` vazio ou acima de 200 caracteres | 400 | ausente | Informe o usuário. |
| Sem JWT | 401 | ausente | o comportamento atual do filtro; o `useApi` continua saindo só no 401 |
| Sem empresa | 403 | ausente | Selecione uma empresa para continuar. |
| Membro nos três caminhos | 403 | `not_admin` | Somente o administrador da empresa pode gerenciar os usuários. |
| Marca desativada em `/api/**` com empresa | 403 | `user_deactivated` | Seu acesso a esta empresa foi desativado. |
| Último administrador ativo conhecido | 403 | `last_admin` | Não é possível desativar o último administrador. |
| Caminho de troca de cargo | 404 | ausente | o comportamento atual de rota ausente |
| Falha de acesso aos dados | 503 | ausente | Não foi possível acessar os dados. Tente novamente. |

`fieldErrors` vem vazio nestes casos. O 403 de último administrador não muda o status gravado. `user_deactivated` não encerra a sessão. Em Equipe, essa recusa não oferece convite, cargo, desativar nem reativar.

O 403 sem `code` e sem `message` continua o fallback já usado pelo cliente: "Você não tem acesso. Selecione uma empresa válida." A recusa de quem abre `/equipe` sem ser administrador, antes de qualquer chamada, continua essa frase da LLT-167. `not_admin` é a resposta se a chamada ao recurso acontecer.

Os erros já publicados de empresa, perfil e produto não ganham `code`. O 403 "Somente o administrador da empresa pode alterar este cadastro." permanece sem `code`.

## Fora deste contrato

Convite da LLT-167. Perfil, empresa, contexto e produtos, fora o `user_deactivated` que também vale para essas chamadas. Matriz de permissões, auditoria e produtos por pessoa. Item novo de dashboard.
