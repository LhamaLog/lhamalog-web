# Modelo: Convite para a empresa

O convite não é gravado no Core nem no `localStorage`. A fonte é a organização ativa da Clerk. Este arquivo descreve o que a tela lê, valida e envia.

## Cargo

| Valor enviado | Rótulo na tela | Quem pode usar |
| --- | --- | --- |
| `org:admin` | Administrador | Pode abrir `/equipe` e convidar, se for o papel da sessão |
| `org:member` | Membro | Pode ser convidado. Não vê Equipe e não convida |

Não há terceiro valor. Gestor, Visualizador e Usuário Master não são opções.

## Administrador da sessão

- Entrada: `orgRole` da sessão (`useAuth`), possivelmente `membership.role`.
- É administrador quando, depois de remover um prefixo `org:`, o valor é exatamente `admin`.
- `org:admin` e `admin` passam. `org:member`, vazio e qualquer outro valor não passam.
- Sem `orgId`, não há lista nem envio, mesmo que o papel exista.

## Rascunho do convite

| Campo | Regra |
| --- | --- |
| `emailAddress` | Obrigatório. `trim` antes de validar. Vazio é inválido. Precisa casar `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`, o mesmo critério de `src/features/company/validation.ts`. A comparação com membros e pendentes usa o valor em minúsculas. |
| `role` | Exatamente `org:admin` ou `org:member`. |

O rascunho não tem prazo, empresa editável nem identificador de usuário.

## Convite pendente (linha da lista)

| Campo | Origem | Regra |
| --- | --- | --- |
| `id` | Convite da organização | Identifica o `revoke`. Não é editável. |
| `emailAddress` | Convite | Texto mostrado. Comparação em minúsculas, com `trim`. |
| `role` | Convite | `org:admin` ou `org:member`. Outro valor aparece como texto cru e não vira opção do select. |
| `createdAt` | Convite | Data de criação. |
| `expiresAt` | `expiresAt` do objeto, se existir; senão `createdAt` + 7 dias | A coluna Validade mostra essa data em formato curto. Não é um campo do formulário. |
| `status` | Convite pedido com `status: ['pending']` | A lista só pede pendentes. Situação visível: Pendente. Se a validade calculada já passou, a situação visível é Expirado e a linha não é tratada como utilizável para um segundo envio. |

Página: tamanho 10, começando em 1, no formato já devolvido por `getInvitations` (`data` e `totalCount`). A tela usa a paginação existente quando `totalCount` for maior que 10.

## Regras de conjunto

- No máximo um convite utilizável por e-mail na empresa. Utilizável aqui significa pendente cuja validade ainda não passou.
- Envio novo: se já existir pendente utilizável para o e-mail, não chamar `inviteMember`. Explicar e apontar o reenvio.
- Reenvio: 1) revogar todos os pendentes daquele e-mail, em todas as páginas; 2) só se todos os `revoke` resolverem, chamar `inviteMember` uma vez com o mesmo e-mail e o mesmo `role` da linha; 3) se o passo 2 falhar, recarregar a lista e mostrar o erro. Não chamar `inviteMember` se algum `revoke` falhou.
- Membro existente: percorrer `getMemberships` até a última página. Se o identificador normalizado coincidir, não convidar. O e-mail primário da sessão obedece à mesma regra.
- Troca de `orgId` no meio do pedido: ignorar o efeito na tela. Não copiar a linha para a empresa nova.

## Frases fixas

| Situação | Texto |
| --- | --- |
| Sucesso do envio | `Convite enviado para {email} como {cargo}. Ele expira em 7 dias.` `{cargo}` é Administrador ou Membro |
| E-mail inválido | `Informe um e-mail válido.` |
| Pessoa já na empresa | `Esta pessoa já pertence à empresa.` |
| Pendente utilizável | `Já existe um convite pendente para este e-mail. Use reenviar.` |
| Lista vazia | `Não há convite pendente.` |
| Expirado, nas telas de entrada | `Este convite expirou e não pode ser usado.` |
| Revogado, nas telas de entrada | `Este convite foi revogado e não pode ser usado.` |
| Acesso direto sem ser administrador | `Você não tem acesso. Selecione uma empresa válida.` |

## O que não é entidade desta história

- Perfil (`displayName`, idioma, fuso).
- Configuração da empresa e contexto.
- Produto e vínculo de acesso a produto.
- Usuário já membro, além da checagem de "já pertence" que impede o convite. A LLT-168 é quem lista esses usuários.
