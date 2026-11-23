# Plano: Aba de integração e Chave de API (Web)

**Branch**: `LLT-179-tokens-ingestao` (a partir da `LLT-177-nome-unico-produto` do Web) | **Data**: 19/11/2026 | **Spec**: [spec.md](spec.md)

## Summary

A aba "Integração OpenTelemetry" é refeita igual ao Figma. A "Chave de API" usa os tokens do Core da LLT-179: gerar ou rotacionar, mostrar uma vez e copiar. Os elementos sem Core seguem a decisão F1.

## Estrutura

```text
src/features/products/
├── tokenContract.ts          # NOVO: readTokenList, activeToken, readCreatedToken, readRotation, caminhos
├── otelSnippet.ts            # NOVO: monta as variáveis de ambiente e o comando Java com endpoint e <sua-chave>
└── components/
    ├── ProductForm.tsx       # aba OTel monta os componentes novos; remove os campos antigos
    ├── OtelConnectionCard.tsx    # NOVO: endpoint, Chave de API, sinais, nível mínimo, configuração da aplicação
    ├── ApiKeyField.tsx           # NOVO: mascarado, Gerar nova (POST ou rotate), Copiar, valor só em memória
    ├── LogLevelSlider.tsx        # NOVO: DEBUG, INFO, WARN, ERROR
    └── ConnectionStatusPanel.tsx # NOVO: estados neutros (F1); Testar conexão desabilitado
src/shared/config.ts          # + leitura de VITE_OTLP_ENDPOINT (F4)
tests/
├── ingestion-tokens.test.mjs # NOVO
└── otel-snippet.test.mjs     # NOVO: o snippet nunca contém o valor real; usa <sua-chave>
```

## Fases

1. Funções puras e testes.
2. Layout da aba igual ao Figma (US1).
3. Chave de API: gerar, rotacionar e mostrar uma vez (US2).
4. Fechamento: roteiro manual com DevTools e comparação lado a lado.
