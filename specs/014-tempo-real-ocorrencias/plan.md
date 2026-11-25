# Implementation Plan: Aviso de ocorrências novas na tela

**Branch**: `LLT-137-atualizacao-em-tempo-real` | **Date**: 25/11/2026 | **Spec**: [spec.md](spec.md)

A branch sai da `LLT-136-ciclo-de-vida` em `ca4da1d` (PR #19). PR empilhado: ordem #18 → #19 → este, com merge commit.

## Summary

Um hook `useOccurrenceStream` abre o WebSocket do Core (spec 015), autentica com o token da Clerk (`useAuth().getToken`) numa mensagem, renova a cada 50 s e reconecta com espera crescente. A lógica sem React (endereço, mensagens, se um aviso conta para a lista, espera, comparação na sincronização) fica no módulo puro `occurrenceStream.ts`, testado com `node --test`. A `OccurrencesPage` mostra o aviso "N ocorrências novas · Atualizar" e o estado de pausa.

## Technical Context

**Language/Version**: TypeScript 5, React 19, Node.js 26.12.1

**Primary Dependencies**: `@clerk/react` (só `useAuth().getToken`, como o `useApi`), WebSocket do navegador. Nenhuma dependência nova.

**Testing**: `node --test` para `occurrenceStream.ts`; telas pelo quickstart.

**Constraints**: token nunca na URL; `useApi`, `useApiResource` e autenticação sem mudança; a lista continua funcionando sem a conexão.

## Constitution Check

Portões de `docs/instrucoes-agentes.md`: entregas pequenas com revisão, Clerk só lida (o `getToken` que o `useApi` já usa), sem dependências novas. Sem violações.

## Project Structure

```text
src/features/occurrences/
├── occurrenceStream.ts        # novo: wsUrl, mensagens, countsFor(query, aviso), backoff, novidades na sincronização
├── useOccurrenceStream.ts     # novo: conexão, auth, renovação, reconexão, estado (conectado/pausado/parado)
└── components/
    └── OccurrencesPage.tsx    # + aviso de novidades, estado de pausa, "Atualizar"
tests/
└── occurrence-stream.test.mjs # novo
```
