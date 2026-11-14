# Contract: perfil do usuário (consumido pelo web)

Contrato do Core, que é a fonte da verdade. O web consome este recurso e não redefine os nomes dos campos. O estilo de caminho segue `/api/company` e `/api/products`.

## Recurso

| | |
| --- | --- |
| Método e caminho | `GET /api/user/profile` e `PUT /api/user/profile` |
| Quem | A pessoa do token. O corpo não traz id de usuário, id de empresa nem e-mail. |
| Empresa no token | O cliente web só envia o pedido com empresa selecionada e com o claim de organização do Bearer igual a essa empresa. Sem empresa, o web não chama este recurso. O perfil gravado não é por empresa. |
| Clerk | Depois de um `PUT` confirmado, o web atualiza a sessão do navegador com `user.update`. Este HTTP não grava na Clerk. O web não usa SDK Backend nem segredo. |

Cabeçalhos enviados pelo cliente já existente (`apiRequest`):

- `Authorization: Bearer <token de sessão Clerk>`
- `Content-Type: application/json` no `PUT`

## Corpo

`GET` 200 e `PUT` 200 devolvem o mesmo formato. O `PUT` envia esse formato e nada além dele. O fuso chama-se `timezone`.

Perfil ainda não armazenado:

```json
{
  "displayName": "",
  "language": "pt-BR",
  "timezone": "America/Sao_Paulo",
  "version": null
}
```

Gravação seguinte, depois de o Core ter devolvido uma versão:

```json
{
  "displayName": "Ana Souza",
  "language": "en",
  "timezone": "America/Manaus",
  "version": 1
}
```

| Campo | Tipo | Valores |
| --- | --- | --- |
| `displayName` | string | No `PUT` válido pelo web: 1 a 200 caracteres depois do trim, sem caracteres de controle (`U+0000`–`U+001F` e `U+007F`). No `GET` sem perfil, `""`. |
| `language` | string | O web só envia `pt-BR` ou `en`. O Core pode aceitar uma etiqueta mais ampla, como `en-US`; o web não a oferece e não a reenvia sem o usuário escolher `pt-BR` ou `en`. |
| `timezone` | string | Identificador IANA, por exemplo `America/Sao_Paulo` ou `UTC`. Não usar o nome `timeZone` nem rótulos `(UTC-03:00) Brasília`. No `GET` sem perfil, `America/Sao_Paulo`. |
| `version` | `number` ou `null` | `null` no `GET` sem perfil e no primeiro `PUT`. Depois, o número da versão carregada. A resposta pode trazer outro número; o web guarda o que voltou. |

O web trata como falha de carga qualquer `200` em que `displayName`, `language` ou `timezone` não seja string, ou em que `version` não seja `null` nem número finito. Um corpo só com `timeZone` não satisfaz o contrato.

`serverConfirmedProfile`: o `PUT` está confirmado quando a resposta tem o mesmo `displayName` aparado, o mesmo `language` e o mesmo `timezone` enviados. `version` não precisa coincidir com a enviada. Resposta `200` que não ecoa os três valores faz a tela mostrar o que voltou, se for legível, e o aviso de que a gravação não foi confirmada. `user.update` não corre nesse caso.

Não há última gravação silenciosa. Duas abas: a que ainda tem a `version` antiga recebe `409`.

## Erros

O cliente já existente espera JSON `{ "message": string, "fieldErrors": { "<campo>": string } }` e usa estas mensagens quando o corpo não traz `message`:

| HTTP | Quando | O que o web faz |
| --- | --- | --- |
| 400 | Validação. `fieldErrors` usa as chaves `displayName`, `language`, `timezone`. | Mostra `message` no alerta e o texto de cada campo. Não traduz o texto do Core. Não altera o perfil aplicado nem chama `user.update`. |
| 401 | Sessão inválida. | O cliente sai para `/sign-in?motivo=deslogado`. |
| 403 | Sem acesso. | Mensagem já usada pelo cliente: selecionar uma empresa válida. |
| 409 | Versão desatualizada. | Alerta com `message` e ação de recarregar, que refaz o `GET`. Não chama `user.update` e não grava a edição local. |
| outro, ou rede, ou JSON inválido | Falha genérica. | Alerta. Na carga, estado de erro com nova tentativa. |

Exemplo de 400:

```json
{
  "message": "Confira os campos destacados.",
  "fieldErrors": {
    "displayName": "Informe um nome de 1 a 200 caracteres.",
    "timezone": "Escolha um fuso horário válido."
  }
}
```

Falha de `user.update` ou de `user.reload()` não é erro deste HTTP. O `PUT` confirmado permanece.

## Fora deste contrato

- E-mail e notificações (LLT-172, LLT-173).
- Idioma e fuso da empresa em `GET`/`PUT /api/company` (lá o fuso segue o nome já existente nesse recurso).
- SDK Backend da Clerk e lista de perfis de outras pessoas.

## Sessão do navegador, fora do JSON

Depois da confirmação, e só então:

1. `user.update({ firstName, lastName })` com a divisão de `clerkName.ts`. `lastName: ""` limpa o sobrenome quando o nome tem uma palavra.
2. Se essa chamada resolver, `user.reload()`.
3. Se qualquer uma falhar, o cabeçalho continua com o `displayName` do Core.
