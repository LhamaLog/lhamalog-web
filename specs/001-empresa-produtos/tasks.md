# Tarefas frontend Empresa e Produtos

## Preparação
- [x] T001 Conferir base Clerk e componentes existentes em `src/`.
- [x] T002 Criar referências de especificação e plano em `specs/001-empresa-produtos/`.

## Empresa US1
- [x] T003 [US1] Implementar transporte Bearer e tratamento de erros em `src/shared/services/`.
- [x] T004 [US1] Implementar página/formulário em `src/features/company/`.
- [x] T005 [US1] Conectar rotas e seleção de empresa em `src/app/routes/` e `src/app/layouts/`.

## Produtos US2
- [x] T006 [US2] Implementar lista/cadastro/contexto em `src/features/products/`.
- [x] T007 [US2] Testar transporte em `tests/api.test.mjs` e envios duplicados no navegador com backend real, evidência em `quickstart.md`.

## Validação
- [x] T008 Validar build, interface e integração; registrar resultado em `quickstart.md`.

Dependências: esclarecimentos e contrato Core → T003 → T004/T005 → T006/T007 → T008. Sem alteração dos componentes de login/logout.

- [ ] T009 Conferir sessão real Clerk (login/logout/criação de organização) e registrar em `quickstart.md`.
