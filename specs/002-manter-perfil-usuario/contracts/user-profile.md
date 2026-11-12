# Contract: perfil do usuário (consumido pelo web)

Contrato que o aplicativo web vai chamar e que o Core precisa expor. O estilo de caminho segue as chamadas já existentes neste repositório (`/api/company`, `/api/products`), não um prefixo `/api/v1`.

**Assumption**: o Core ainda não publicou este endpoint neste workspace. O caminho, os três campos e o fato de a pessoa só alterar o próprio perfil estão combinados. Se o Core escolher outro caminho ou nomes de campo, este arquivo e o cliente web precisam mudar juntos. Não há envelope legado: o JSON é plano.

## Recurso

| | |
| --- | --- |
| Método e caminho | `GET /api/user/profile` e `PUT /api/user/profile` |
| Quem | A pessoa do token. O corpo não traz id de usuário, id de empresa nem e-mail. |
| Empresa no token | O cliente web atual só envia o pedido com empresa selecionada e com o claim de organização do Bearer igual a essa empresa. Isso autoriza a chamada. O perfil gravado não é por empresa: a mesma pessoa, em outra empresa, lê e grava o mesmo perfil. |
| Clerk | O Core grava `displayName` de volta na identidade Clerk. O web não chama a API Backend da Clerk. |

Cabeçalhos enviados pelo cliente já existente (`apiRequest`):

- `Authorization: Bearer <token de sessão Clerk>`
- `Content-Type: application/json` no `PUT`

## Corpo

`GET` 200 e `PUT` 200 devolvem o mesmo formato. O `PUT` envia esse formato e nada além dele.

```json
{
  "displayName": "Ana Souza",
  "language": "pt-BR",
  "timeZone": "America/Sao_Paulo"
}
```

| Campo | Tipo | Valores |
| --- | --- | --- |
| `displayName` | string | No `PUT` válido: 1 a 200 caracteres depois do trim, sem caracteres de controle (`U+0000`–`U+001F` e `U+007F`). No `GET`, string vazia significa ainda não escolhido. |
| `language` | string | `pt-BR` ou `en`. No `GET`, string vazia significa ainda não escolhido. Não usar `en-US`, `pt` nem rótulos traduzidos. |
| `timeZone` | string | Identificador IANA, por exemplo `America/Sao_Paulo` ou `UTC`. Não usar rótulos `(UTC-03:00) Brasília`. No `GET`, string vazia significa ainda não escolhido. |

O web trata como falha de carga qualquer `200` em que um dos três campos não seja string.

`serverConfirmedProfile`: depois do `PUT`, o web só considera a gravação confirmada se a resposta relida tiver o mesmo `displayName` aparado, o mesmo `language` e o mesmo `timeZone` enviados. Resposta `200` que não ecoa isso faz a tela mostrar o que voltou (se for legível) e o aviso de que a gravação não foi confirmada.

Não há campo `version`. Duas gravações seguidas: a última aceita pelo Core prevalece.

## Erros

O cliente já existente espera JSON `{ "message": string, "fieldErrors": { "<campo>": string } }` e usa estas mensagens quando o corpo não traz `message`:

| HTTP | Quando | O que o web faz |
| --- | --- | --- |
| 400 | Validação. `fieldErrors` usa as chaves `displayName`, `language`, `timeZone`. | Mostra `message` no alerta e o texto de cada `fieldErrors` no campo. Não traduz o texto do Core. Não altera o perfil aplicado. |
| 401 | Sessão inválida. | O cliente sai para `/sign-in?motivo=deslogado`. |
| 403 | Sem acesso. | Mensagem já usada pelo cliente: selecionar uma empresa válida. |
| 409 | Conflito, se o Core quiser informar. Não é obrigatório neste contrato. | Alerta com `message` e ação de recarregar, que refaz o `GET`. |
| outro, ou rede, ou JSON inválido | Falha genérica. | Alerta. Na carga, estado de erro com nova tentativa. |

Exemplo de 400:

```json
{
  "message": "Confira os campos destacados.",
  "fieldErrors": {
    "displayName": "Informe um nome de 1 a 200 caracteres."
  }
}
```

Se o Core não conseguir sincronizar o nome com a Clerk, a resposta deve ser de erro e o perfil anterior deve continuar valendo. O web não tem salvamento parcial: ou os três valores voltaram confirmados, ou a tentativa falhou.

## Fora deste contrato

- E-mail e notificações (LLT-172, LLT-173).
- Idioma e fuso da empresa em `GET`/`PUT /api/company`.
- Qualquer escrita direta do web na Clerk.
- Lista de perfis de outras pessoas.

## Alinhamento esperado com o Core

O agente do Core, no branch de mesmo nome, deve expor este recurso ou registrar no contrato dele a diferença exata (caminho ou nome de campo). Enquanto a diferença não existir, o web implementa o que está nesta página.
