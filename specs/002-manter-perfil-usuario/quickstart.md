# Quickstart: verificar o perfil do usuário

Roteiro para depois da implementação. Não substitui o código. Os comandos abaixo já existem no repositório.

## Pré-requisitos

- Node 26.12.1 e dependências instaladas (`npm install` na raiz, se `node_modules` não existir).
- Para o fluxo manual com dados reais: instância Clerk já usada pelo web e Core no ar, com `GET`/`PUT /api/user/profile` conforme [contracts/user-profile.md](contracts/user-profile.md). Sem isso, `npm test` e `npm run build` ainda verificam o cliente; a navegação autenticada fica bloqueada, como nas telas de empresa. Não criar atalho de autenticação.

## Automatizado

Na raiz de `lhamalog-web`:

```bash
npm test
npm run build
```

`npm test` inclui `tests/profile.test.mjs`. Resultado esperado:

- Um objeto `{ displayName, language, timezone, version }` é lido quando as três primeiras são strings e `version` é `null` ou número. Corpo sem `timezone`, ou só com `timeZone`, é rejeitado.
- O `GET` sem perfil (`displayName: ""`, `language: "pt-BR"`, `timezone: "America/Sao_Paulo"`, `version: null`) é lido.
- O `PUT` serializado tem só essas quatro chaves. A primeira gravação envia `version: null`. `displayName` vai sem espaços nas pontas.
- A confirmação do eco aceita os três valores iguais com uma `version` diferente da enviada, e recusa resposta que mude `displayName`, `language` ou `timezone`.
- `splitDisplayName("Ana Souza Silva")` devolve `Ana` / `Souza Silva`. `splitDisplayName("Ana")` devolve `Ana` / `""`.
- Nome vazio, nome de 201 caracteres, nome com caractere de controle, idioma diferente de `pt-BR` e `en` (inclusive `en-US`) e fuso fora da lista são inválidos para gravar. Nome de 1 e de 200 caracteres, `pt-BR`, `en` e `America/Sao_Paulo` são válidos.
- Os dois catálogos têm as mesmas chaves.
- `formatPercent` em `en` e em `pt-BR` não produz a mesma string para um número com parte decimal (separador diferente). O formatador não recebe fuso.

`npm run build` executa `tsc --noEmit` e o build Vite sem erro novo.

## Manual

Com o web e o Core no ar, entrar com uma pessoa que já tenha empresa.

1. Abrir `/empresa` e anotar o idioma e o fuso mostrados nas configurações da empresa.
2. Abrir o perfil pelo nome no cabeçalho e também pelo item Perfil em Configuração. Os três campos aparecem. Recarregar a página mostra os mesmos valores já gravados.
3. Limpar o nome, escolher um idioma inexistente se a interface permitir, ou um fuso que não esteja na lista. Salvar não grava e aponta o campo.
4. Informar um nome de duas palavras, `English` e `America/Manaus`. Salvar uma vez. O botão não dispara um segundo envio enquanto a resposta não volta. A primeira gravação envia `version: null`. A confirmação aparece em inglês. O cabeçalho mostra o nome devolvido pelo Core. A sessão Clerk fica com a primeira palavra no nome e o restante no sobrenome. O menu, o rodapé, sair, a faixa da empresa e o seletor de empresa ficam em inglês. A pré-visualização mostra o horário de Manaus.
4b. Repetir o salvamento com um nome de uma palavra. O sobrenome da sessão Clerk fica vazio. Se `user.update` falhar, o perfil no Core permanece e o cabeçalho continua com o nome devolvido.
5. Abrir a empresa e um produto. As frases dessas telas continuam em português. Um percentual e a data do histórico de contexto usam convenção em inglês. Essa data não muda para o fuso de Manaus.
6. Voltar ao perfil, trocar o fuso e cancelar. O valor e a pré-visualização voltam ao que foi gravado. A moldura não volta o idioma para o português.
7. Gravar de novo `Português (Brasil)` e `America/Sao_Paulo`, enviando a `version` recebida no salvamento anterior. A moldura e o seletor de empresa voltam ao português e o nome do cabeçalho é o nome salvo, sem novo login. Numa segunda aba com a versão antiga, salvar recebe conflito e a tela oferece recarregar, sem tratar essa edição como gravada.
8. Conferir que idioma e fuso da empresa continuam iguais ao anotado no passo 1.
9. Com o perfil em inglês, sair. A tela de entrada continua em português.
10. Confirmar que não surgiram telas de painel, de agendamento de varredura nem de composição de e-mail. O item Painel do menu, se visível, não abre uma tela nova.

## Evidência

Anotar neste arquivo, na implementação, a data, o commit e o resultado de `npm test`, `npm run build` e dos passos manuais que puderam ser executados. Se Clerk ou Core não estiverem disponíveis, registrar isso em vez de marcar o manual como feito.
