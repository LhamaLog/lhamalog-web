# Contract: usuários da empresa (esperado pelo web)

Contrato que o Web vai consumir. O Core é a fonte de status e de último acesso. Nome, e-mail e cargo não vêm deste HTTP.

**Alinhamento pendente.** Em 2026-11-15, `lhamalog-core` na branch `LLT-168-listar-editar-e-desativar-usuarios` tinha `specs/005-listar-editar-usuarios/spec.md` e `checklists/`, e não tinha `contracts/`. A spec do Core ainda listava corte de acesso, último administrador, edição, último acesso e reativação como decisões abertas. Este arquivo fecha o que o Web espera depois da decisão do responsável. Se o Core publicar outro caminho ou outros nomes, este arquivo muda antes da implementação. Não há chave secreta dos dois lados.

Pontos a alinhar com o Core:

- Caminho e nomes de campo, se o Core escolher outros.
- Como o Core passa a conhecer quem é administrador, já que não pode chamar a Clerk com segredo. O Web não envia a lista de cargos. Enquanto o Core não conhecer um administrador promovido, ele pode recusar uma desativação que a contagem do Web permitiria. A tela mostra esse erro.
- O HTTP 409 de `last_admin` pode ser outro status, desde que `code` e `message` permaneçam.
- O `GET` abaixo devolve só os usuários que o Core já registrou. Quem nunca teve requisição aceita nem marca fica de fora do array, e o Web trata como Ativo e sem último acesso.

## Papel da Clerk, fora deste HTTP

Isto não é endpoint. Acontece na sessão do administrador, com `@clerk/react` 6.18.2.

| Ação | Chamada | Fora desta história |
| --- | --- | --- |
| Listar quem pertence à empresa | `organization.getMemberships({ initialPage, pageSize: 10 })` | |
| Contar administradores | `organization.getMemberships({ role: ['org:admin'], initialPage, pageSize: 10 })` até a última página | |
| Trocar cargo | `membership.update({ role })` com `org:admin` ou `org:member` | |
| Remover da organização | não chama | `membership.destroy`, `organization.removeMember` |
| Gravar nome de outra pessoa | não chama | `user.update` é só da própria sessão, na LLT-174 |

Campos lidos de cada associação: `publicUserData.userId`, `publicUserData.firstName`, `publicUserData.lastName`, `publicUserData.identifier`, `role`. `createdAt` e `updatedAt` não alimentam a coluna de último acesso. `publicMetadata` não é gravado.

Não há item novo de dashboard. A gestão de membros que o administrador já possui basta para `getMemberships` e `membership.update`.

## Recurso

| | |
| --- | --- |
| Listar | `GET /api/company/members` |
| Gravar marca | `PUT /api/company/members/{userId}` |
| Quem lista e grava | Administrador da empresa do token. Membro recebe 403 sem `code: user_deactivated`. |
| Empresa | A organização do Bearer. O corpo não traz id de empresa. Um id de outra empresa, se vier, é ignorado. |
| Cliente | `apiRequest` / `useApi`, com `Authorization: Bearer` e `Content-Type: application/json` no `PUT`. Sem empresa selecionada, o Web não chama este recurso. |

`{userId}` é o `publicUserData.userId` da associação, sem espaços. O Web o envia codificado no caminho.

## Corpo

`GET` 200:

```json
{
  "members": [
    {
      "userId": "user_abc",
      "status": "active",
      "lastAccessAt": "2026-11-15T22:04:00.000Z"
    },
    {
      "userId": "user_def",
      "status": "deactivated",
      "lastAccessAt": null
    }
  ]
}
```

`PUT` envia só:

```json
{ "status": "deactivated" }
```

`active` reativa. `deactivated` desativa. O `PUT` 200 devolve o mesmo objeto de um item de `members`, não o array.

| Campo | Tipo | Valores |
| --- | --- | --- |
| `userId` | string | Não vazia. É a chave da junção. O `PUT` não reenvia `userId` no corpo; ele vai no caminho. |
| `status` | string | `active` ou `deactivated`. Outro valor é 400. |
| `lastAccessAt` | string ou `null` | Instante ISO-8601 da última requisição autenticada aceita daquela pessoa na empresa, ou `null` se não houver. O Web não envia este campo. |

O Web trata como falha de carga um `GET` 200 em que `members` não seja array, ou em que algum item não tenha `userId` string não vazia, `status` exatamente `active` ou `deactivated`, e `lastAccessAt` `null` ou string que represente uma data. O Web não completa esse `GET` inválido com a lista da Clerk.

Ausência de um `userId` no array não é falha. Na junção, esse usuário fica `active` e `lastAccessAt: null`.

O Core atualiza `lastAccessAt` quando aceita uma requisição autenticada dessa pessoa nesta empresa. A requisição recusada por desativado não passa a ser o último acesso. Este Web não grava esse instante.

Repetir `PUT` com o status que já está gravado devolve 200 com esse mesmo status. Não inverte.

## Erros

O cliente já espera JSON `{ "message": string, "code"?: string, "fieldErrors": { "<campo>": string } }`. `code` é lido só nos casos abaixo. Os demais erros continuam com `message` e `fieldErrors`, como o perfil.

| HTTP | `code` | Quando | O que o web faz |
| --- | --- | --- | --- |
| 400 |  | `status` fora de `active` e `deactivated`. `fieldErrors.status` explica. | Alerta com `message`. Não muda a linha. |
| 401 |  | Sessão inválida. | O cliente sai para `/sign-in?motivo=deslogado`, como já faz. |
| 403 | `user_deactivated` | A própria pessoa da sessão está desativada nesta empresa. Vale para este recurso e para os outros que já passam por `apiRequest`. | Mensagem `message`, ou, se ela vier vazia, "Seu acesso a esta empresa está desativado." Não encerra a sessão. Não usa a frase de empresa inválida. Em Equipe, não oferece convite, cargo, desativar nem reativar. |
| 403 |  | Quem não administra chama este recurso. | `message`, ou "Você não tem acesso. Selecione uma empresa válida." A sessão permanece. |
| 409 | `last_admin` | `PUT` com `deactivated` e, para o Core, o alvo é o último administrador ativo que ele conhece. | Alerta com `message`. Se `message` vier vazia, "Não é possível desativar o último administrador." O status permanece Ativo. |
| outro, ou rede, ou JSON inválido |  | Falha genérica. | Alerta. Na carga, estado de erro com nova tentativa. |

Exemplo de acesso desativado:

```json
{
  "message": "Seu acesso a esta empresa está desativado.",
  "code": "user_deactivated",
  "fieldErrors": {}
}
```

Exemplo de último administrador:

```json
{
  "message": "Não é possível desativar o último administrador.",
  "code": "last_admin",
  "fieldErrors": {}
}
```

O Core aplica `user_deactivated` antes do restante da requisição. Uma pessoa desativada não consegue desativar, reativar nem ler esta lista. O administrador que ainda está ativo é quem opera a lista.

O Core não chama a Clerk neste recurso. Não remove a associação. Não grava cargo. Não usa `CLERK_SECRET_KEY` nem valor `sk_`.

## Fora deste contrato

- Convite da LLT-167.
- `GET` e `PUT /api/user/profile`.
- Empresa, contexto e produtos, exceto pelo fato de que a recusa `user_deactivated` também vale para essas chamadas.
- Matriz de permissões, auditoria de cargo e produtos por pessoa.
