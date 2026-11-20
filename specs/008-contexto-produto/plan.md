# Plano: Contexto do produto para IA (Web)

**Branch**: `LLT-178-contexto-produto` (a partir da `Development` do Web) | **Data**: 19/11/2026 | **Spec**: [spec.md](spec.md)

## Summary

A aba "Contexto para IA" é refeita igual ao Figma, com os seis campos do Core. O cadastro e a edição passam a enviar o formato novo. A leitura e a validação ficam em funções puras, com testes.

## Referências

- **Tela:** `C:\Users\Pedro\Desktop\LhamaLog\LLT-produto-telas-web\figma\03-produto-contexto-ia.png` (abra a imagem antes de começar).
- **Componentes que já existem e devem ser reaproveitados, quando servirem:** `src/shared/ui` (`Input`, `Textarea`, `Select`, `Card`, `Button`, `Badge`) e o padrão `Section`/`HelpCard` do `ProductForm`.
- **Props opcionais novas em `shared/ui`** (analyze U1 e U2):
  - `hint?: string` em `Input`, `Textarea` e `Select`: é a ajuda cinza embaixo do campo, como no Figma, com id `${id}-hint` ligado ao `aria-describedby`. Quando há erro, a ajuda continua visível e o erro aparece embaixo dela;
  - `showCount?: boolean` em `Textarea`, padrão `true`: com `false`, o contador "n/max" some, como no Figma, e o `maxLength` continua valendo.

## Decisões do analyze (19/11/2026)

- **Testes da Fase 2 (C1):** o `npm test` só carrega `.ts`, sem JSX. Por isso a lógica dos campos fica em funções puras no `context.ts`, testadas na Fase 1, e os componentes `.tsx` só chamam essas funções:
  - `addListItem(list, value, limit)` devolve a lista nova ou um erro (vazio, repetido, limite de itens, tamanho do item);
  - `removeListItem(list, index)`;
  - `moveListItem(list, from, to)`.
- **Repetido (A1):** a comparação é feita depois do trim e sem diferenciar maiúscula de minúscula. Fica o primeiro.
- **Aba aberta no erro (A2):** `firstTabWithError(errors)` devolve a primeira aba com erro, na ordem `info`, `context`, `otel`.
- **409 (I1):** mostrar só `error.message`.
- **Moldura comum (I2):** o botão Voltar, as abas e o rodapé entram nesta branch, iguais ao Figma.

## Estrutura

```text
src/features/products/
├── types.ts                       # ProductContext novo, Personality, emptyProductContext
├── context.ts                     # NOVO: readProductContext, cleanContext, contextFieldErrors, contextErrorFor,
│                                  #       personalityOptions, languageOptions, addListItem, removeListItem,
│                                  #       moveListItem, firstTabWithError
└── components/
    ├── ProductForm.tsx            # aba de contexto usa os componentes novos; remove os campos antigos e o aviso
    ├── ProductContextFields.tsx   # NOVO: layout do Figma (descrição, personalidade, idioma, arquitetura, escopo, sensíveis)
    ├── SegmentedControl.tsx       # NOVO (ou em shared/ui, se fizer sentido): Simples | Padrão | Detalhado
    ├── ChipListField.tsx          # NOVO: arquitetura (chips com × e +)
    └── ReorderListField.tsx       # NOVO: escopo e dados sensíveis (alça, ×, + Adicionar item, mover por teclado)
src/shared/ui/
├── Input.tsx, Select.tsx          # prop opcional hint
└── Textarea.tsx                   # props opcionais hint e showCount
tests/
├── product-context.test.mjs       # NOVO
└── company-products.test.mjs      # ajustar o context do produto de teste
```

## Fases

1. Tipos e funções puras, com testes.
2. Componentes de campo (`SegmentedControl`, `ChipListField`, `ReorderListField`).
3. Aba montada igual ao Figma, mais envio e erros.
4. Fechamento: roteiro manual com comparação lado a lado com o Figma.
