# Data Model: Gerenciar chaves de ingestão no Web

Só tipos do frontend. A fonte é o contrato do Core ([contracts/core-api.md](contracts/core-api.md)). Nada é gravado no navegador.

## TokenView (já existe, `tokenContract.ts`)

| Campo | Tipo | Uso |
|---|---|---|
| `id` | string | chave das ações |
| `name` | string | coluna "Nome" |
| `state` | `ACTIVE` \| `EXPIRING` \| `EXPIRED` \| `REVOKED` | selo e ações (R4) |
| `createdAt` | ISO | "Criada em" |
| `createdBy` | string \| null | "por", pelo nome (R7) |
| `expiresAt` | ISO \| null | "Expira em" (em transição) |
| `revokedAt`, `revokedBy` | ISO \| null, string \| null | "Revogada em ... por ..." |
| `replacedBy` | string \| null | não aparece |

Nunca contém o valor nem o hash.

## TokenActions (novo, `tokenManagement.ts`)

| Campo | Valores | Regra |
|---|---|---|
| `revoke` | boolean | `ACTIVE` ou `EXPIRING`, também no arquivado |
| `rotate` | `hidden` \| `enabled` \| `disabled` | `ACTIVE` sem `expiresAt`; `disabled` no arquivado |

## AuditEntry (novo, `tokenManagement.ts`)

| Campo | Tipo | Uso |
|---|---|---|
| `id` | string | chave da linha |
| `tokenId` | string | nome da chave pela lista |
| `action` | `CREATED` \| `ROTATED` \| `REVOKED` | rótulo |
| `actorUserId` | string \| null | quem fez, pelo nome (R7) |
| `at` | ISO | quando |
| `relatedTokenId` | string \| null | na rotação, a chave nova |
| `transitionEndsAt` | ISO \| null | na rotação, o fim da transição |

Itens sem `id`, `tokenId`, `action` conhecida ou `at` são descartados, como na leitura da lista.

## PeopleIndex (novo)

`Map<userId, nome>`, montado de `organization.getMemberships` (`publicUserData.userId`, `firstName`, `lastName`, `identifier`). `null` enquanto carrega ou quando a Clerk não responde.

## Estados da seção

| Estado | Quando | O que aparece |
|---|---|---|
| oculta | sem `INGESTION_TOKENS_MANAGE`, acesso carregando ou produto não salvo | nada (e nenhuma chamada) |
| carregando | primeira leitura | "Carregando chaves..." |
| erro | leitura recusada | mensagem do Core e "Tentar de novo" |
| vazia | lista vazia | "Nenhuma chave gerada ainda." e "Nova chave" |
| lista | uma ou mais chaves | linhas com selo e ações |
| chave nova | depois de criar ou rotacionar | aviso único com o valor, Copiar e o `notice` |
