# Roteiro: Listar, editar e desativar usuários

Verificação da LLT-168 no aplicativo web. A marca e o último acesso dependem do Core com o contrato de [contracts/company-members.md](contracts/company-members.md). A lista de nomes e a troca de cargo dependem da organização na sessão. Este passo do Spec Kit não executa o roteiro.

## Resultado desta entrega

- `npm test`: passou, 34 testes, em 2026-11-17, neste ambiente (Node 22.23.4; o `package.json` pede Node 26.12.1 e o npm avisou a diferença).
- `npm run build`: passou (`tsc --noEmit` e `vite build`), na mesma data.
- Roteiro manual: **bloqueado por ambiente**. Este ambiente não tem instância Clerk nem Core. Nenhum passo manual abaixo foi executado: lista real, troca de cargo, confirmação de desativação, reativação e a próxima requisição da pessoa desativada. Não foi criada chave secreta nem atalho de autenticação.

## Antes de começar

- Aplicativo no ar com `VITE_CLERK_PUBLISHABLE_KEY` publicável (`pk_test_` ou `pk_live_`). Não definir `CLERK_SECRET_KEY` nem `sk_` no Web nem no Core.
- Core no ar no contrato do commit `4f32c77`: `GET /api/company/members`, `POST` e `DELETE /api/company/members/{userId}/deactivation`, com `code` `user_deactivated`, `last_admin` e `not_admin`. Não há `PUT`.
- Nenhuma configuração nova de dashboard. Organizações, convites e os papéis `org:admin` e `org:member` continuam os da LLT-167.
- Duas pessoas administradoras da empresa A, e uma membra. Uma quarta, se houver, desativada só na empresa B, para conferir que a marca não atravessa empresa.
- Confirmar, no contrato publicado pelo Core, caminho e nomes de campo. Se divergirem de [contracts/company-members.md](contracts/company-members.md), alinhar esse arquivo antes de codar.

## Automático

Na raiz de `lhamalog-web`:

```bash
npm test
npm run build
```

`npm test` inclui `tests/team-members.test.mjs` e o caso novo de `tests/api.test.mjs`. O build precisa passar sem dependência nova em `package.json`.

O que o automático prova, sem rede:

- Nome vazio cai no identificador.
- Sem registro no Core, a linha fica Ativo e sem último acesso.
- `deactivated` continua na linha; a junção não descarta o `userId`.
- Rebaixar ou desativar com menos de dois administradores, sendo o alvo administrador, é recusado pelas frases fixas.
- Desativar um membro com um único administrador na empresa não é recusado por essa trava.
- 403 com `code` `user_deactivated` usa "Seu acesso a esta empresa foi desativado." e não é 401. 403 com `code` `last_admin` usa "Não é possível desativar o último administrador." e não é 409. 403 com `code` `not_admin` usa "Somente o administrador da empresa pode gerenciar os usuários." Administrador `deactivated` no Core não entra na contagem; ausência no Core conta como ativo; administrador sem `userId` não entra na contagem.
- Nenhuma função pura descreve remoção da organização.

## Manual — lista (US1)

1. Entrar como administrador, com a empresa A selecionada. Equipe abre `/equipe` e mostra o bloco de convites e o bloco de usuários.
2. Cada pessoa da página tem nome, e-mail, cargo, Ativo ou Desativado, e um horário ou "Sem acesso registrado".
3. Pessoa sem nome na organização mostra o e-mail na coluna de nome.
4. Convite pendente não aparece no bloco de usuários.
5. Segunda página, se houver mais de 10, mantém as cinco colunas.
6. Entrar como membro. O item Equipe não aparece. Abrir `/equipe` mostra "Você não tem acesso. Selecione uma empresa válida." e a sessão continua.
7. Sem empresa selecionada, a moldura pede a seleção e não chama a lista.

## Manual — cargo (US2)

1. Com dois administradores, rebaixar um a Membro. A lista mostra Membro. Nome, e-mail, status e último acesso não mudam.
2. Promover um Membro a Administrador. A lista mostra Administrador.
3. Com um único administrador, rebaixar é recusado com "Não é possível rebaixar o último administrador." O cargo permanece.
4. Durante a troca, o controle não dispara um segundo pedido.
5. Trocar de empresa no meio do pedido não altera a lista da empresa que ficou na tela.

## Manual — desativar, reativar e último administrador (US3)

1. Desativar um membro. A tela pede confirmação antes do pedido. A linha permanece, com Desativado. "Usuário desativado." Cancelar a confirmação não muda a linha.
2. Com a sessão dessa pessoa ainda aberta, a próxima abertura de empresa, produtos ou perfil mostra "Seu acesso a esta empresa foi desativado." A sessão não cai em `/sign-in`. O último acesso pode não mudar dentro de 5 minutos se o cargo observado for o mesmo.
3. Reativar. A linha volta a Ativo. "Acesso reativado." A próxima requisição aceita dessa pessoa volta a passar.
4. Desativar o segundo administrador, restando outro. A linha fica Desativado. Desativar o único administrador que resta é recusado, por "Não é possível desativar o último administrador." ou pelo erro do Core, e o status continua Ativo.
5. Se o Core recusar porque ainda não conhece um administrador que a tela já contou, a tela mostra o erro do Core e não marca Desativado.
6. Administrador que desativou a si mesmo, havendo outro, vê a frase de acesso desativado na próxima requisição e Equipe não oferece convite, cargo, desativar nem reativar.
7. Desativar na empresa A não muda o status da mesma pessoa na empresa B.
8. Repetir desativar em quem já está Desativado não volta o status para Ativo.

## Fora deste roteiro

- Configurar dashboard.
- Chave secreta para listar membros ou para remover alguém da organização.
- Cargo fora de Administrador e Membro.
- Editar nome, e-mail, idioma ou fuso por esta tela.
