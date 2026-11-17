# Specification Analysis Report

Segundo passe, depois do alinhamento aprovado pelo product owner. Os achados U1, U2 e I1 do passe anterior foram escritos em `spec.md`, `plan.md`, `research.md`, `data-model.md` e `tasks.md`. Este passe não alterou esses arquivos de novo.

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|
| — | — | — | — | Nenhum achado novo de severidade baixa ou maior. | Seguir para a implementação quando ela for autorizada. |

O passe anterior pedia três ajustes. Estado atual:

| Achado anterior | Estado |
| --- | --- |
| U1 Cabeçalho e setter de locale | Fechado. T009 chama o setter na carga; T010 liga o `displayName` ao cabeçalho; T011 repete os dois no salvamento confirmado; T008 volta ao português no sign-out. |
| U2 `useApi` sem empresa | Fechado. T009 não chama `useApi` quando não há empresa selecionada. |
| I1 T016 em paralelo com a rota | Fechado. A tarefa da moldura passou a ser T017 e só corre depois de T012, em paralelo apenas com T014, T015 e T016. |

**Coverage Summary Table:**

| Requirement Key | Has Task? | Task IDs | Notes |
|-----------------|-----------|----------|-------|
| FR-001 | Yes | T012 | Link no nome e item Perfil |
| FR-002 | Yes | T011 | Três campos |
| FR-003 | Yes | T005, T011 | PUT com `version`; `409` recarrega |
| FR-004 | Yes | T003, T006, T011 | 1–200 após trim; rejeita controle |
| FR-005 | Yes | T001, T006 | Só `pt-BR` e `en` na tela |
| FR-006 | Yes | T002, T006 | IANA no campo `timezone` |
| FR-007 | Yes | T006, T011 | Validação local antes do PUT |
| FR-008 | Yes | T011 | Um envio. Manual em T020 |
| FR-009 | Yes | T011 | Carga, erro, sucesso, cancelar |
| FR-010 | Yes | T005, T011 | Eco de `displayName`, `language`, `timezone` |
| FR-011 | Yes | T007, T010, T011 | Cabeçalho com o nome do Core; `user.update` depois; falha não desfaz |
| FR-012 | Yes | T008, T011 | `user.update` no navegador; sem SDK Backend |
| FR-013 | Yes | T001, T008, T009, T011, T013, T014, T015, T016, T017 | Moldura, seletor e formatadores; sign-out em português |
| FR-014 | Yes | T009, T011 | Idioma só depois da confirmação |
| FR-015 | Yes | T014, T015, T016, T018 | Pré-visualização; outras datas sem `timezone` |
| FR-016 | Yes | T012, T018, T020 | Sem rota de painel, varredura ou e-mail |
| FR-017 | Yes | T011, T019 | Perfil não chama `/api/company` |
| FR-018 | Yes | T009, T010, T011 | Sem empresa, sem `useApi` |
| FR-019 | Yes | T011 | 401/403 pelo cliente; `409` recarrega |
| FR-020 | Yes | T009, T011 | Abortar e trocar de empresa |
| FR-021 | Yes | T011 | Sem e-mail, notificação, avatar ou senha |
| FR-022 | Yes | T011 | `Input` e `Select` da empresa |
| SC-001 | Yes | T020 | Roteiro manual |
| SC-002 | Yes | T011, T020 | Reabrir mostra o confirmado |
| SC-003 | Yes | T010, T011, T020 | Nome do Core no cabeçalho mesmo se a sessão falhar |
| SC-004 | Yes | T013, T014, T015, T016, T017, T020 | Idioma na moldura e nos formatos |
| SC-005 | Yes | T003, T006, T011 | Inválidos não gravam |
| SC-006 | Yes | T012, T018 | Pré-visualização sem superfície nova |
| SC-007 | Yes | T019, T020 | Empresa intacta |
| SC-008 | Yes | T009, T011 | Resposta abandonada ignorada |

**Constitution Alignment Issues:**

`.specify/memory/constitution.md` continua o template sem MUST ratificado. Nenhum conflito.

**Unmapped Tasks:**

Nenhuma. T001–T020 mapeiam para requisito, história ou verificação.

**Metrics:**

- Total Requirements: 22 funcionais (FR-001–FR-022) e 8 critérios de sucesso (SC-001–SC-008)
- Total Tasks: 20 (T001–T020), todas por fazer
- Coverage % (requirements with >=1 task): 100%
- Ambiguity Count: 0
- Duplication Count: 0
- Critical Issues Count: 0

## Next Actions

Não há issue crítica nem achado aberto deste passe. A implementação continua fora deste commit.
