# Quickstart: hub de perfil

Verificação da história. Não substitui `tasks.md`. As regras puras rodam na suíte; a tela, neste roteiro.

## Pré-requisitos

- Dependências já instaladas. Não adicionar pacote.
- `npm test` executa `node --test tests/*.test.mjs`.
- App em `npm run dev`, com pessoa autenticada e uma empresa selecionada.
- Core com `GET`/`PUT /api/user/profile`. Para o caso antigo, um Core que ainda não devolve `bio` nem `jobTitle`.

## Suíte

```bash
npm test
```

Esperado: `tests/profile.test.mjs` aceita leitura sem `bio` e sem `jobTitle`, envia os dois no `PUT` e recusa bio acima de 160, cargo acima de 80 e quebra de linha. `tests/profile-hub.test.mjs` cobre tema local, sessão em uso sem revogação, foto contra iniciais, filtro de fuso e as chaves novas nos dois catálogos.

## Roteiro da tela

1. Abrir `/perfil`. A seção inicial é Conta. O cartão mostra foto ou iniciais, nome, e-mail, função, empresa, membro desde, bio, cargo e Editar. O cabeçalho mostra a mesma foto, ou as mesmas iniciais.
2. Sem escolher Editar, nome, bio e cargo não são campos. Editar libera só esses três. Cancelar volta ao último valor gravado.
3. Salvar bio e cargo válidos, reabrir e ver os mesmos valores. Esvaziar os dois, salvar e ver vazio. Bio acima de 160, cargo acima de 80 ou quebra de linha explica o campo e não grava.
4. Com um Core que não devolve os campos, a carga segue e os dois aparecem vazios. Se o `PUT` for recusado, a tela mostra o erro, não anuncia sucesso e mantém o rascunho.
5. Trocar a foto. Cartão e cabeçalho mudam sem novo login. Uma recusa mantém a foto anterior. Não há ação de remover.
6. Em janela larga, trocar de seção pela lista vertical. Em janela estreita, alcançar as cinco seções sem perder o cartão. A seção ativa tem rótulo visível e a navegação funciona por teclado.
7. Em Preferências, buscar um fuso pelo nome e pelo deslocamento, ver o deslocamento e a pré-visualização, salvar e reabrir. Cancelar devolve idioma e fuso e não mexe no tema.
8. Escolher escuro, o tema do sistema, reduzir movimento, sublinhar links e contraste. O efeito aparece na área autenticada, permanece ao recarregar neste navegador e não vai no `PUT`. Trocar de empresa não repõe. As telas de entrada não mudam.
9. Com English gravado, percorrer as cinco seções, inclusive notificações, carregamento, erro e vazio. As frases fixas estão em inglês. Voltar a Português (Brasil) e ver as mesmas frases em português. Outra tela continua em português. O texto que o Core devolve não é traduzido.
10. Em Notificações, o cartão antigo não aparece nas outras seções. Web continua obrigatório. Salvar, reabrir e ver a escolha. Trocar de empresa recarrega as preferências dessa empresa.
11. Em Segurança, o status da verificação corresponde ao estado, ou a seção mostra erro com nova tentativa e não trata falha como inativa. Não há código de pareamento. Trocar senha e gerenciar a verificação usam as rotas já existentes quando a tarefa inicia; sem tarefa, a seção conclui pela sessão aberta, sem desenho novo e sem código.
12. A sessão em uso está marcada e não tem revogação. Outra sessão pode ser revogada e sai da lista. Falha mantém a sessão e mostra o erro. Sair encerra a sessão em uso.
13. Em Ajuda, Privacidade, Termos de Uso e Suporte chegam aos mesmos `#privacidade`, `#termos` e `#suporte` do rodapé.
