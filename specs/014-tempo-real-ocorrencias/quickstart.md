# Quickstart: Aviso de ocorrências novas na tela

## Preparação

Core local da branch `LLT-137-atualizacao-em-tempo-real` (spec 015) com o Redis do compose, o JWT interno do Módulo (spec 013) para simular o Finder e o web com `npm run dev`.

## Roteiro

| # | Passo | Esperado |
|---|---|---|
| T1 | Abrir `/ocorrencias` e entregar pelo Finder um achado novo de um produto visível | em até 3 s, "1 ocorrência nova · Atualizar" |
| T2 | Entregar mais dois achados novos e um reaberto | "4 ocorrências novas · Atualizar" |
| T3 | Clicar em "Atualizar" | página 1 com os filtros, as novas no topo, aviso some |
| T4 | Filtro de produto B e achado novo do produto A | nenhum aviso |
| T5 | Situação Arquivadas e achado novo | nenhum aviso |
| T6 | Parar o Core por 20 s, entregar nada, subir | "Atualização automática pausada. Reconectando…" e depois some, sem aviso de novidades |
| T7 | Parar o Core, gravar uma ocorrência direto no banco (ou subir com a carga de exemplo num produto novo), subir | depois de reconectar, "Há ocorrências novas · Atualizar" |
| T8 | Deixar a lista aberta 3 minutos | continua recebendo avisos (renovação do token) |

## Verificações automáticas

```powershell
npm test
npm run build
```
