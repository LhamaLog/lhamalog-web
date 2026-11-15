# Modelo: Usuários da empresa

A linha da tela não é uma entidade só. Nome, e-mail e cargo nascem da associação na organização. Status e último acesso nascem do Core. A chave da junção é `userId`.

## Cargo

| Valor | Rótulo | Administrador da sessão |
| --- | --- | --- |
| `org:admin` | Administrador | Sim. Também vale `admin`, sem o prefixo, como em `isOrganizationAdmin`. |
| `org:member` | Membro | Não. Também vale `member` só para reconhecer que não administra. A gravação envia `org:member`, nunca `member`. |

Não há terceiro valor de gravação. Outro `role` lido na lista aparece como texto cru e não entra no controle de edição. Gestor, Visualizador e Usuário Master não são opções.

## Status

| Valor no Core | Rótulo | Significado |
| --- | --- | --- |
| `active` | Ativo | A próxima requisição autenticada desta pessoa nesta empresa pode ser aceita. |
| `deactivated` | Desativado | A próxima requisição desta pessoa nesta empresa é recusada. A pessoa continua na organização. |
| ausente | Ativo | O Core não devolveu esse `userId`. Equivale a sem marca e sem uso registrado. |

Transições feitas pelo administrador:

- `active` ou ausente → `deactivated`, se o alvo não for o único administrador.
- `deactivated` → `active`, sem mudar o cargo.
- Repetir `deactivated` não produz `active`. Repetir `active` não produz `deactivated`.

Desativar ou rebaixar quando a contagem de administradores da organização é menor que 2, e o alvo é administrador, não muda status nem cargo.

## Linha da lista

| Campo | Origem | Regra |
| --- | --- | --- |
| `userId` | `publicUserData.userId` | Chave da junção e do `PUT`. Sem esse valor, a linha é só leitura de nome, e-mail e cargo. |
| `name` | `firstName` e `lastName` | `trim` de cada parte, juntas por um espaço. Resultado vazio usa `identifier`. Os dois vazios deixam o nome vazio. |
| `email` | `publicUserData.identifier` | Texto da coluna E-mail. Pode ser telefone. Vazio permanece vazio. |
| `role` | `membership.role` | `org:admin` ou `org:member` têm rótulo. Qualquer outro valor é texto cru. |
| `status` | Core, pelo `userId` | `active`, `deactivated`, ou Ativo quando o Core não tem o `userId`. |
| `lastAccessAt` | Core, pelo `userId` | Instante, ou ausente. Ausente mostra "Sem acesso registrado". Não usa `createdAt` nem `updatedAt` da associação. |

Página: tamanho 10, começando em 1, no formato já devolvido por `getMemberships` (`data` e `totalCount`). A tela usa a paginação existente quando `totalCount` for maior que 10. A contagem de administradores não usa essa página: percorre `getMemberships({ role: ['org:admin'] })` até a última página.

## Regras de conjunto

- A lista de usuários não inclui convite pendente, expirado ou revogado.
- O Web não remove associação. Não há operação de `destroy` nem de `removeMember` neste modelo.
- Troca de cargo não altera `status` nem `lastAccessAt`. Desativar e reativar não alteram `role`.
- Troca de `orgId` no meio do pedido: ignorar o efeito na tela.
- Identificador de empresa no corpo não existe. A empresa é a do token.
- Desativar na empresa selecionada não descreve efeito sobre outra empresa. O Web só envia o pedido da empresa ativa.

## Trava do último administrador

Entrada da função pura: quantidade de administradores já contada em todas as páginas, e se o alvo é administrador (`org:admin` ou `admin`).

- Rebaixar: bloqueado quando o alvo é administrador e a quantidade é menor que 2.
- Desativar: bloqueado nas mesmas condições. Desativar quem não é administrador não é bloqueado por esta trava.
- A função não chama rede. A contagem é feita antes, na tela.
- Mensagens: "Não é possível rebaixar o último administrador." e "Não é possível desativar o último administrador."

A recusa do Core (`code: last_admin`) é outra porta. Ela não passa por essa função. A tela mostra a `message` e não aplica Desativado.

## Frases fixas

| Situação | Texto |
| --- | --- |
| Lista de usuários vazia | `Não há usuário vinculado.` |
| Sem último acesso | `Sem acesso registrado` |
| Desativado, na próxima requisição da própria pessoa | `Seu acesso a esta empresa está desativado.` |
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
