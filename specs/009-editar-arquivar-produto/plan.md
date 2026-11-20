# Plano: Lista, cadastro e edição de produto, arquivar (Web)

**Branch**: `LLT-123-editar-arquivar-produto` (a partir da `LLT-178-contexto-produto` do Web) | **Data**: 19/11/2026 | **Spec**: [spec.md](spec.md)

## Summary

A lista de produtos passa a seguir o Figma, reaproveitando os componentes que o Vinicius já fez para a demonstração. A aba "Informações do produto" fica igual ao Figma. A edição salva os dados gerais e o contexto, só o que mudou. Arquivar e desarquivar entram de forma mínima, no padrão visual do Figma.

## Referências

- `C:\Users\Pedro\Desktop\LhamaLog\LLT-produto-telas-web\figma\01-produtos-lista.png` e `C:\Users\Pedro\Desktop\LhamaLog\LLT-produto-telas-web\figma\02-produto-informacoes.png`.
- `src/app/App.tsx`, que mostra como a demonstração monta o `ProductsView` com dados de exemplo. Use como guia de props.

## Estrutura

```text
src/features/products/
├── types.ts                 # + archivedAt; ProductUiDraft: + owner, teamEmail, tags; − criticality, project, service, logLevel, active
├── productView.ts           # NOVO: toCardProps, summaryFrom, filtros, paginação de 6, productsPath, sidePanelsFrom (F1, sem inventar número)
├── productEdit.ts           # NOVO: changedParts, saveEdits, setArchived, formFieldErrors, addTag, ownerOptions, canArchive(orgRole), caminhos e textos
├── useOwnerOptions.ts       # NOVO: pessoas da organização com getMemberships, a mesma chamada da Equipe (N3)
└── components/
    ├── ProductsPage.tsx     # passa a montar o ProductsView com dados do Core; Filtros com Situação (F6)
    ├── ProductsView.tsx     # (Vinicius) + props opcionais filters e listState (painel de filtros e estados da lista)
    ├── ProductCard.tsx      # (Vinicius) + props opcionais onOpen (seta e clique) e archivedLabel; environment aceita null
    ├── ProductsSummary.tsx  # (Vinicius) valor aceita texto ("—")
    ├── ProductsByEnvironment.tsx # (Vinicius) valores aceitam null ("—")
    ├── ProductForm.tsx      # aba Informações igual ao Figma, com o TagsField interno; rodapé; Arquivar/Desarquivar; só leitura
    └── ProductTable.tsx     # apagada (sem uso)
src/shared/ui/DistributionBars.tsx # + formattedValue opcional
tests/
├── product-view.test.mjs    # NOVO
└── product-edit.test.mjs    # NOVO
```

## Fases

1. Funções puras (`productView`, `productEdit`) e testes.
2. Lista igual ao Figma (US1).
3. Aba Informações igual ao Figma (US2).
4. Edição dos dados gerais (US3).
5. Arquivar, desarquivar e só leitura (US4).
6. Fechamento: roteiro manual com comparação lado a lado.

## Riscos

| Risco | Mitigação |
|---|---|
| Rascunho local guarda dados que o time pode achar que estão no servidor | nota visível na aba ("ainda não são salvos no servidor: ficam guardados só neste navegador") e lista de pendências para o Core (F1) |
| Mudar componentes da demonstração quebra a `/componentes` | props novas opcionais; conferir `/componentes` no roteiro manual |
| Duas chamadas no salvar | ordem fixa e mensagem de salvamento parcial (W1) |
