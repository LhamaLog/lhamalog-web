# Tasks: Contexto do produto para IA (Web)

Regras para o agente: não rodar Git; não instalar dependência; uma fase por vez, parando para revisão; `npm test` e `npm run build` ao fim de cada fase. Abra `C:\Users\Pedro\Desktop\LhamaLog\LLT-produto-telas-web\figma\03-produto-contexto-ia.png` e use como gabarito visual.

## Fase 0

- [X] T001 Ler `README.md`, `docs/instrucoes-agentes.md`, esta spec, `contracts/core-api.md` e `C:\Users\Pedro\Desktop\LhamaLog\LLT-produto-telas-web\figma\FIGMA-x-WEB-x-CORE.md`. Abrir a imagem do Figma. Rodar `npm test` e `npm run build` como linha de base e anotar no `quickstart.md` (criar).
- [X] T002 Rodar `speckit-clarify` para F2, F3, W1 e W2 e registrar as respostas. Todas seguiram a recomendação (sessão de 19/11/2026 na spec).

## Fase 1: tipos e funções puras

- [X] T003 [P] Criar `tests/product-context.test.mjs`, cobrindo:
  - `readProductContext`: completo, sem campos e com tipos errados;
  - `cleanContext`: tira espaços das pontas, descarta vazios e repetidos, mantém a ordem;
  - `contextFieldErrors`: descrição vazia (F2) e com 2001 caracteres; 31 itens; item de arquitetura com 81 e de escopo com 201; idioma inválido;
  - `contextErrorFor`: `context.scope[1]` vai para o campo escopo;
  - `cleanContext` e `addListItem`: "Java" e "java" contam como repetidos, e fica o primeiro (A1);
  - `addListItem`: entra no fim; recusa vazio, repetido, o 31º item e item acima de 80 (arquitetura) ou 200 (escopo e dados sensíveis), com as mensagens do cenário 3 (C1);
  - `removeListItem` e `moveListItem`: subir o primeiro e descer o último não mudam nada, e os outros itens mantêm a ordem (C1, W2);
  - `languageOptions`: `pt-BR`, `en-US` e `es-ES`; um código gravado fora da lista (`es-419`) entra como opção extra (C2, W1);
  - `firstTabWithError`: erro em Informações e no contexto abre `info`; erro só no contexto abre `context` (A2).
- [X] T004 Atualizar `types.ts` e criar `context.ts`. Ajustar `tests/company-products.test.mjs`.
- [X] T005 Rodar `npm test` e `npm run build`. Parar para revisão.

## Fase 2: componentes de campo

- [X] T006 Criar (a lógica de lista vem das funções puras testadas na Fase 1). Feito, com mais um componente auxiliar, `NewItemInput.tsx` (o campo do novo item usado pelas duas listas):
  - props opcionais `hint` em `Input`, `Textarea` e `Select`, e `showCount` em `Textarea` (U1, U2);
  - `SegmentedControl`: `role="radiogroup"`, setas do teclado;
  - `ChipListField`: chips com ×, botão +, Enter adiciona, limites (via `addListItem`);
  - `ReorderListField`: alça de arrastar, botões de mover por teclado (W2), ×, "+ Adicionar item", limites (via `addListItem`, `removeListItem` e `moveListItem`).
- [X] T007 Rodar `npm test` e `npm run build`. Parar para revisão.

## Fase 3: aba igual ao Figma

- [X] T008 Criar `ProductContextFields.tsx` com o layout, os textos e as ajudas do Figma (spec, cenário 1). Ligar no `ProductForm.tsx`:
  - remover os campos antigos e o aviso de campos vazios;
  - lateral "Sobre o contexto para IA" e "Boas práticas" com os textos do Figma;
  - validação e `cleanContext` antes de enviar; abrir a aba devolvida por `firstTabWithError` (A2);
  - mapear `fieldErrors`;
  - mostrar no 409 só a mensagem do Core (I1);
  - moldura comum igual ao Figma (I2): "← Voltar para produtos" no canto direito, abas com ícone e sublinhado, rodapé em cartão com o texto, Cancelar e o botão principal com ✓.
- [X] T009 Rodar `npm test` e `npm run build`. Parar para revisão. (O `Button` ganhou a variante opcional `secondary`, usada no Cancelar do rodapé.)

## Fase 4: fechamento

- [X] T010 Procurar os campos antigos em `src/features/products` e nos testes de produto. Não pode sobrar nenhum (o `targetAudience` da empresa é outro campo). Resultado no `quickstart.md`.
- [ ] T011 Roteiro manual no `quickstart.md`, contra o Core local (roteiro escrito; a execução está pendente porque faltava o `.env` e o Core local estava parado):
  - cadastrar com contexto;
  - editar, reordenar o escopo e salvar;
  - reabrir e conferir;
  - comparar lado a lado com o Figma e anotar as diferenças restantes;
  - produto arquivado: salvar mostra a recusa.
- [X] T012 Rodar `speckit-analyze`. Todos os requisitos, de FR-W01 a FR-W09, estão implementados. Sobra o SC-W01 (conferência visual), que depende da T011. Uma correção aplicada: o erro local agora some ao editar o campo.
- [X] T013 Entregar ao Pedro a mensagem de commit `LLT-178: refaz a aba de contexto do produto conforme o figma e os campos novos`.
