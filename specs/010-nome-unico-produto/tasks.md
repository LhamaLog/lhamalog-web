# Tasks: Nome único de produto (Web)

Regras para o agente: não rodar Git; não instalar dependência; parar para revisão ao fim de cada fase.

## Fase 0

- [x] T001 Ler esta spec e `contracts/core-api.md`. Rodar `npm test` e `npm run build` como linha de base e anotar no `quickstart.md` (criar).
- [x] T002 Rodar `speckit-clarify` para W1 e registrar a resposta.

## Fase 1

- [x] T003 [P] Criar `tests/product-errors.test.mjs`: `isNameInUse` verdadeiro só para 409 com a mensagem do contrato, falso para os 409 de versão e de arquivado e para outros status.
- [x] T004 Criar `src/features/products/productErrors.ts`.
- [x] T005 Rodar `npm test` e `npm run build`. Parar para revisão.

## Fase 2

- [x] T006 No `ProductForm.tsx`, no cadastro e na edição, o 409 de nome vira erro do campo `name` e abre a aba "Informações do produto", sem a frase genérica e sem "Recarregar produto". Editar o nome limpa o erro. Na edição com duas partes, a recusa de nome não envia o contexto.
- [x] T007 Rodar `npm test` e `npm run build`. Parar para revisão.

## Fase 3

- [ ] T008 Roteiro manual no `quickstart.md`:
  - cadastrar um nome repetido (com maiúsculas e espaços diferentes);
  - nome de um produto arquivado;
  - renomear para um nome existente;
  - mudar só as maiúsculas do próprio nome (aceita).
- [x] T009 Rodar `speckit-analyze`.
- [x] T010 Entregar ao Pedro a mensagem de commit `LLT-177: mostra o nome de produto repetido no campo nome`.
