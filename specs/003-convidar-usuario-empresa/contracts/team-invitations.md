# Contrato: Convites da equipe

Não há endpoint HTTP. O Core não recebe e não grava convite. `src/shared/services/api.ts` e `useApi` não são chamados por esta feature. Se uma chamada ao Core for necessária no futuro, ela terá de passar por `apiRequest`. Esta história não cria essa chamada.

A sessão já aberta usa `@clerk/react` 6.18.2. Sem SDK Backend. Sem `CLERK_SECRET_KEY` e sem valor `sk_`.

## Envio

`organization.inviteMember`

| Campo | Obrigatório | Valores |
| --- | --- | --- |
| `emailAddress` | sim | E-mail depois do `trim`, válido por `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` |
| `role` | sim | `org:admin` ou `org:member` |

Não enviar prazo, URL de retorno, metadado nem identificador de organização no corpo: a organização é a ativa da sessão. Não existe parâmetro de dias nesse método.

Pré-condições, nesta ordem, todas na organização ativa:

1. Há `orgId` e a pessoa é administradora (`org:admin` ou `admin`).
2. O e-mail passa na validação.
3. O e-mail não é o de um membro já listado em `getMemberships`, percorrendo as páginas.
4. Não há convite pendente utilizável para esse e-mail em `getInvitations({ status: ['pending'] })`, também percorrendo as páginas.

Sucesso: a plataforma ficou responsável pelo e-mail. A tela confirma e-mail, cargo e prazo de 7 dias e recarrega a lista da organização que estava ativa no clique.

Falha: alerta, rascunho preservado, nenhum convite utilizável criado por essa tentativa.

## Lista

`organization.getInvitations({ status: ['pending'], initialPage, pageSize: 10 })`

Cada item exibe:

| Coluna | Valor |
| --- | --- |
| E-mail | `emailAddress` |
| Cargo | Administrador se `role` for `org:admin`; Membro se for `org:member`; senão o `role` cru |
| Validade | `expiresAt` do item, se for uma data; senão `createdAt` + 7 dias |
| Situação | Pendente, ou Expirado se a validade já passou |

Lista vazia: texto de que não há convite pendente. Mais de 10: paginação existente.

## Revogar

`invitation.revoke()` no item pendente da organização ativa.

Sucesso: o item deixa de ser utilizável e a lista recarrega. Não altera quem já aceitou.

## Reenviar

Para o e-mail normalizado da linha e o `role` dessa linha:

1. Buscar todos os pendentes desse e-mail.
2. `revoke()` em cada um. Se algum falhar, parar e não chamar `inviteMember`.
3. `inviteMember({ emailAddress, role })` uma vez.
4. Recarregar a lista.

Resultado exigido: no máximo um convite utilizável. Falha no passo 3 deixa zero convites utilizáveis dessa tentativa.

## Aceite

Fora deste contrato HTTP. O link do e-mail abre `/sign-in` ou `/sign-up` já existentes. Não há caminho `/convite`. Expirado e revogado são erros dessas telas, com frases distintas. O vínculo resultante é a associação da pessoa à organização, com o `role` do convite. O Core só enxerga isso depois, no JWT, como já faz.

## Configuração externa

Dashboard, feito por outra pessoa, não por este repositório:

- Convites de organização ligados. Se estiverem desligados, reativar.
- Validade de 7 dias.
- Papéis `org:admin` e `org:member`.
- Portal da conta apontando para `/sign-in` e `/sign-up` deste aplicativo, porque `inviteMember` não envia URL de retorno.
- Nenhuma chave secreta neste Web e nenhuma API de convite no Core.
