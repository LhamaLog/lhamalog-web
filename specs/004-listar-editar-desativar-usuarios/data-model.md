# Modelo: Usuários da empresa

A linha da tela não é uma entidade só. Nome, e-mail e cargo nascem da associação na organização. Status e último acesso nascem do Core. A chave da junção é `userId`.

## Cargo

| Valor | Rótulo | Administrador da sessão |
| --- | --- | --- |
| `org:admin` ou `admin` | Administrador | Sim, na leitura. A gravação por `organization.updateMember` envia `admin`, sem prefixo. |
| `org:member` ou `member` | Membro | Não administra. A gravação envia `member`, sem prefixo. |

Não há terceiro valor de gravação. Outro `role` lido na lista aparece como texto cru e não entra no controle de edição. Gestor, Visualizador e Usuário Master não são opções.

## Status

| Valor no Core | Rótulo | Significado |
| --- | --- | --- |
| `active` | Ativo | A próxima requisição autenticada desta pessoa nesta empresa pode ser aceita. |
| `deactivated` | Desativado | A próxima requisição desta pessoa nesta empresa é recusada. A pessoa continua na organização. |
| ausente | Ativo | O Core não devolveu esse `userId`. Equivale a sem marca e sem uso registrado. |

Transições feitas pelo administrador:

- `active` ou ausente → `deactivated`, por `POST /api/company/members/{userId}/deactivation`, sem corpo, se a ação não deixar zero administradores ativos.
- `deactivated` → `active`, por `DELETE` no mesmo caminho, sem corpo, sem mudar o cargo.
- Repetir o `POST` devolve `deactivated` e não produz `active`. Repetir o `DELETE` devolve `active` e não produz `deactivated`.
- Não há `PUT` nem corpo `{ "status" }`.

Desativar ou rebaixar não muda status nem cargo quando a contagem de administradores ativos ficaria em zero.

## Linha da lista

| Campo | Origem | Regra |
| --- | --- | --- |
| `userId` | `publicUserData.userId` | Chave da junção e do `PUT`. Sem esse valor, a linha é só leitura de nome, e-mail e cargo. |
| `name` | `firstName` e `lastName` | `trim` de cada parte, juntas por um espaço. Resultado vazio usa `identifier`. Os dois vazios deixam o nome vazio. |
| `email` | `publicUserData.identifier` | Texto da coluna E-mail. Pode ser telefone. Vazio permanece vazio. |
| `role` | `membership.role` | `org:admin` ou `org:member` têm rótulo. Qualquer outro valor é texto cru. |
| `status` | Core, pelo `userId` | `active`, `deactivated`, ou Ativo quando o Core não tem o `userId`. |
| `lastAccessAt` | Core, pelo `userId` | ISO-8601 em UTC, ou `null`. `null` mostra "Sem acesso registrado". Não usa `createdAt` nem `updatedAt` da associação. Pode estar até 5 minutos atrás se o cargo observado não mudou. |

Página: tamanho 10, começando em 1, no formato já devolvido por `getMemberships` (`data` e `totalCount`). A tela usa a paginação existente quando `totalCount` for maior que 10. A contagem de administradores não usa essa página: percorre `getMemberships({ role: ['org:admin'] })` até a última página.

## Regras de conjunto

- A lista de usuários não inclui convite pendente, expirado ou revogado.
- O Web não remove associação. Não há operação de `destroy` nem de `removeMember` neste modelo.
- Troca de cargo não altera `status` nem `lastAccessAt`. Desativar e reativar não alteram `role`.
- Troca de `orgId` no meio do pedido: ignorar o efeito na tela.
- Identificador de empresa no corpo não existe. A empresa é a do token.
- Desativar na empresa selecionada não descreve efeito sobre outra empresa. O Web só envia o pedido da empresa ativa.

## Trava do último administrador

A contagem, feita na tela antes da rede da ação, inclui a pessoa quando o cargo sem o prefixo `org:` é `admin` e o `status` no Core não é `deactivated`. Ausência no `GET` conta como ativo. A contagem usa todas as páginas da organização.

Entrada da função pura: essa quantidade, e se o alvo entra nela.

- Rebaixar: bloqueado quando o alvo entra na contagem e a quantidade é menor que 2. A frase é "Não é possível rebaixar o último administrador." Não chama `organization.updateMember`.
- Desativar: bloqueado nas mesmas condições. A frase é "Não é possível desativar o último administrador." Não chama o `POST`. Desativar quem não entra na contagem não é bloqueado por esta trava.
- A função não chama rede.
- Desativar a si mesmo segue a mesma conta: permitido quando, depois da ação, permanece pelo menos um.

A recusa do Core é 403 com `code` `last_admin` e a mesma frase de desativar. Não é 409. A tela mostra a `message` e não aplica Desativado.

## Frases fixas

| Situação | Texto |
| --- | --- |
| Lista de usuários vazia | `Não há usuário vinculado.` |
| Sem último acesso | `Sem acesso registrado` |
| Desativado, na próxima requisição da própria pessoa | `Seu acesso a esta empresa foi desativado.` `code` `user_deactivated` |
| Membro chama a lista, a desativação ou a reativação | `Somente o administrador da empresa pode gerenciar os usuários.` `code` `not_admin` |
| Último administrador, desativar, recusa local | `Não é possível desativar o último administrador.` |
| Último administrador, rebaixar, recusa local | `Não é possível rebaixar o último administrador.` |
| Sucesso ao desativar | `Usuário desativado.` |
| Sucesso ao reativar | `Acesso reativado.` |
| Sucesso ao trocar cargo | `Cargo atualizado para {cargo}.` `{cargo}` é Administrador ou Membro |
| Cargo inválido na edição | `Escolha Administrador ou Membro.` |
| Acesso direto sem ser administrador | `Você não tem acesso. Selecione uma empresa válida.` |
| Convites, lista vazia | `Não há convite pendente.` Esta frase permanece a da LLT-167. |

## O que não é entidade desta história

- Convite pendente, além de continuar no bloco que já existe.
- Perfil (`displayName`, idioma, fuso) como fonte do nome desta lista.
- Configuração da empresa, contexto e produto.
- Cargo fora de Administrador e Membro.
