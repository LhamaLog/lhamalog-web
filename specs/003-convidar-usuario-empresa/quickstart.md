# Roteiro: Convidar usuário para a empresa

Verificação da LLT-167 no aplicativo web. O convite real depende de uma instância Clerk com organizações. O Core não precisa de endpoint novo e não deve receber chamada de convite.

## Antes de começar

- Aplicativo no ar com `VITE_CLERK_PUBLISHABLE_KEY` publicável (`pk_test_` ou `pk_live_`). Não definir `CLERK_SECRET_KEY` nem `sk_` no Web.
- No dashboard, feito por outra pessoa: convites de organização ligados (reativar se estiverem desligados), validade de 7 dias, papéis `org:admin` e `org:member`, portal da conta apontando para `/sign-in` e `/sign-up` deste aplicativo.
- Duas pessoas de teste: uma administradora (`org:admin`) da empresa A e uma que ainda não é membra. Uma terceira, se houver, membra comum (`org:member`) da mesma empresa.
- Empresa B, para conferir que o convite não vaza.

## Automático

Na raiz de `lhamalog-web`:

```bash
npm test
npm run build
```

`npm test` inclui `tests/team-invitations.test.mjs`. O build precisa passar sem dependência nova em `package.json`.

## Manual — enviar (US1)

1. Entrar como administrador, com a empresa A selecionada. O item Equipe aparece em Administração e abre `/equipe`.
2. Enviar um e-mail válido como Membro. A confirmação mostra o e-mail, Membro e 7 dias. A lista passa a ter a linha, com validade 7 dias depois da criação.
3. Repetir a escolha Administrador com outro e-mail válido e conferir o rótulo Administrador.
4. E-mail vazio, só espaços e sem `@` não enviam e explicam o campo.
5. E-mail de quem já é membro, e o próprio e-mail da sessão, não enviam e explicam que a pessoa já pertence à empresa.
6. Segundo envio para um e-mail que já está pendente não cria outra linha; a tela aponta o reenvio.
7. Durante o envio, o botão não dispara um segundo pedido.

## Manual — quem não administra e quem não tem empresa (US1)

1. Entrar como membro comum da empresa A. O item Equipe não aparece.
2. Abrir `/equipe` direto. A frase é "Você não tem acesso. Selecione uma empresa válida." A sessão continua aberta.
3. Sem empresa selecionada, Equipe não envia e mostra a orientação já usada nas outras áreas.

## Manual — aceite (US2)

1. No e-mail do convite válido, aceitar. A tela é `/sign-in` ou `/sign-up`, não uma rota nova.
2. Depois do aceite, a pessoa entra na empresa A com o cargo escolhido. A empresa B não recebe esse vínculo.
3. Usar o mesmo link de novo não cria outro vínculo.

O prazo real de 7 dias não é esperado nesta sessão. A coluna de validade é conferida no passo do envio. A recusa por prazo vencido fica no item de expiração abaixo, quando existir um convite já vencido na instância, ou quando os 7 dias tiverem passado.

## Manual — revogar, reenviar e links mortos (US3)

1. Revogar um pendente. A linha deixa de ser utilizável.
2. Abrir o link revogado nas telas de entrada. A mensagem diz que o convite foi revogado e não cria vínculo.
3. Reenviar um pendente. Ao final há uma linha utilizável para aquele e-mail, com o mesmo cargo, não duas.
4. Se for possível provocar falha depois da revogação (rede cortada no envio novo), a lista não fica com dois utilizáveis e o administrador consegue tentar de novo.
5. Convite com os 7 dias vencidos: o link é recusado com texto de expiração, diferente do texto de revogação.
6. Trocar para a empresa B no meio de um envio da empresa A. A lista de B não mostra o convite de A. O que tiver sido criado permanece em A.

## Fora deste roteiro

- Lista de membros, desativar usuário, último administrador (LLT-168).
- Gestor, Visualizador, matriz de permissões (LLT-169, LLT-170).
- Escolher produtos no convite (LLT-171).
- Chamar o Core para gravar o convite.
