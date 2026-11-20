# Plano: Nome único de produto (Web)

**Branch**: `LLT-177-nome-unico-produto` (a partir da `LLT-123-editar-arquivar-produto` do Web) | **Data**: 19/11/2026 | **Spec**: [spec.md](spec.md)

## Summary

Reconhecer o 409 de nome em uso e mostrá-lo no campo nome, no cadastro e na edição, sem a frase genérica de 409 e sem enviar o contexto quando o nome falhar.

## Estrutura

```text
src/features/products/
├── productErrors.ts        # NOVO: NAME_IN_USE (texto do contrato), isNameInUse(error), nameFieldError(error)
└── components/ProductForm.tsx   # usa isNameInUse no catch; abre a aba Informações; limpa o erro ao digitar
tests/
└── product-errors.test.mjs # NOVO
```

## Fases

1. Funções puras e testes.
2. Ligação no `ProductForm`.
3. Roteiro manual e fechamento.
