# Quickstart: Contexto do produto para IA (Web)

## Linha de base (19/11/2026, branch `LLT-178-contexto-produto`, antes de qualquer mudança)

| Comando | Resultado |
| --- | --- |
| `npm test` | 49 testes, 49 passaram, 0 falharam. Só o aviso `DEP0205` do Node, que já existia. |
| `npm run build` | Build ok. Só o aviso de pacote JS acima de 500 kB, que já existia. |

## Verificação por fase

| Fase | `npm test` | `npm run build` | Observação |
| --- | --- | --- | --- |
| 1 | Antes da implementação, os 8 testes novos falharam (o módulo não existia). Depois: 57 de 57 | ok | Ponte temporária no `ProductForm`: só a Descrição funcional, até a Fase 3 |
| 2 | 57 de 57 (a lógica dos campos já estava coberta pela Fase 1; o `node --test` não carrega `.tsx`) | ok | Componentes ainda não usados na tela; entram na Fase 3 |
| 3 | 57 de 57 | ok | Aba montada, ponte removida. A comparação no navegador fica para a T011: falta o `.env` e o Core local estava parado |

| 4 | 57 de 57 | ok | Correção: o erro local some ao editar o campo (antes ficava até o próximo salvar) |

## Busca dos campos antigos (T010)

Em `src/` e `tests/` não sobrou nenhum `problemSolved`, `targetAudience`, `differentiators`, `keywords` ou `restrictions` do produto. O que aparece é:

- `src/features/company/*` e `tests/company-settings.test.mjs`: contexto da **empresa**, que é outro campo e fica;
- `tests/product-context.test.mjs:33`: o teste que prova que os campos antigos são ignorados na leitura.

Nenhum valor `llt_` em `src/` ou `tests/`.

## Roteiro manual (T011)

Pré-requisitos: `.env` com a `VITE_CLERK_PUBLISHABLE_KEY`, o Core local (`Development`) em `localhost:8080`, `npm run dev` e um login com organização que tenha Tenant.

1. **Cadastrar com contexto.** Abra Produtos, clique em Cadastrar produto, preencha a aba Informações e, na aba Contexto para IA, preencha:
   - Descrição funcional;
   - Personalidade "Detalhado";
   - Idioma "English (US)";
   - três tecnologias em Arquitetura;
   - três itens em Escopo e dois em Dados sensíveis.

   Clique em Cadastrar produto. Esperado: a lista mostra "Produto ... salvo.".
2. **Recusa local (F2).** Num cadastro novo, deixe a Descrição funcional vazia e salve. Esperado: abre a primeira aba com erro e aparece "Informe a descrição funcional.", sem chamada ao Core (DevTools > Network sem `POST`). Digitar no campo apaga o erro.
3. **Limites.** Tente adicionar um item repetido ("java" depois de "Java"), um item de arquitetura com 81 caracteres e o 31º item. Esperado: o item não entra e a mensagem aparece embaixo do campo.
4. **Editar e reordenar.** Abra o produto, arraste o último item do Escopo para o topo e, pelo teclado (Tab até a linha, "Mover para cima"), mude outro item. Salve.
5. **Reabrir.** Abra o produto de novo. Esperado: todos os campos voltam iguais, inclusive a ordem nova do Escopo.
6. **Comparar com o Figma.** Abra `C:\Users\Pedro\Desktop\LhamaLog\LLT-produto-telas-web\figma\03-produto-contexto-ia.png` ao lado da aba e anote as diferenças abaixo.
7. **Produto arquivado.** Arquive um produto pela API do Core (a tela de arquivar é da LLT-123), abra-o e salve o contexto. Esperado: só a mensagem do Core ("Produto arquivado não pode ser editado.").

Resultado: pendente (o ambiente local não estava de pé em 19/11/2026).

## Diferenças em relação ao Figma (por leitura do código; confirmar no passo 6)

| Diferença | Motivo |
| --- | --- |
| Trilha "Administração › Produtos › Cadastrar produto" no topo | É do Header do `AppLayout`, fora desta branch |
| Descrição funcional um pouco mais alta (altura mínima do `Textarea` compartilhado) | Mantido o padrão do componente compartilhado |
| O "+" abre um campo para digitar o item | O Figma não mostra o estado de digitação |
| Botões "Mover para cima/baixo" aparecem ao passar o mouse ou focar com Tab | Acessibilidade por teclado (W2) |
| Na edição: "Editar produto" e "Salvar alterações" | F7 |
