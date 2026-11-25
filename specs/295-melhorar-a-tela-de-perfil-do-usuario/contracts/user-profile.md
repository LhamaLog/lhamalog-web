# Contract: bio e cargo no perfil

Estende o contrato que o web já consome em [user-profile.md](../../002-manter-perfil-usuario/contracts/user-profile.md). O Core, em trabalho paralelo, é a fonte. O web não cria outro caminho.

## Recurso

`GET /api/user/profile` e `PUT /api/user/profile`, a mesma pessoa do token e a mesma regra de empresa selecionada. Este HTTP não grava tema, acessibilidade, foto, senha, verificação nem sessão.

## Campos novos

`bio` e `jobTitle`, os dois string.

| Ação | Efeito no Core |
| --- | --- |
| `PUT` sem o campo | Mantém o valor já gravado. |
| `PUT` com `""` | Apaga. |
| `GET` sem texto | Devolve `""`. |

O web, ao salvar a conta ou as preferências, envia os dois campos. Não omite para "manter": reenvia o valor confirmado, e `""` quando o confirmado é vazio. Assim um salvamento não apaga bio nem cargo por omissão acidental.

Exemplo de perfil já gravado:

```json
{
  "displayName": "Ana Souza",
  "language": "pt-BR",
  "timezone": "America/Sao_Paulo",
  "version": 1,
  "bio": "Observabilidade",
  "jobTitle": "SRE"
}
```

Leitura em que o Core ainda não manda `bio` nem `jobTitle`: o web aceita o corpo, mostra os dois vazios e não falha a carga. Os campos antigos continuam obrigatórios como no contrato anterior.

## O que o web considera válido

| Campo | No `PUT` enviado pela tela |
| --- | --- |
| `bio` | Depois do recorte, 0 a 160 caracteres. Sem `U+0000`–`U+001F` nem `U+007F`. Quebra de linha entra nessa faixa e é recusada. |
| `jobTitle` | Depois do recorte, 0 a 80 caracteres. A mesma regra de texto. |

Confirmação: o `200` ecoa `displayName`, `language`, `timezone`, `bio` e `jobTitle` iguais ao que foi enviado, já recortados. `version` pode mudar. Sem o eco de `bio` ou de `jobTitle`, a tela não anuncia sucesso e mantém o rascunho. `user.update` do nome só corre quando o perfil enviado foi confirmado, como hoje.

## Erros

Os HTTP do contrato anterior continuam. No `400`, `fieldErrors` pode usar `bio` e `jobTitle` além das chaves que já existiam. O texto do Core não é traduzido. Recusa: erro visível, sem sucesso, rascunho mantido. `409` continua oferecendo recarregar, sem tratar o rascunho como gravado.

## Fora deste contrato

Tema, acessibilidade, foto, senha, verificação em duas etapas e sessões. Isso fica na sessão do navegador ou no `localStorage`, não neste JSON.
