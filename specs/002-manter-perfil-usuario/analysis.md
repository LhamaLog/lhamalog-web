# Specification Analysis Report

Read-only pass over `spec.md`, `plan.md`, and `tasks.md` after task generation. Findings were not applied.

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|
| U1 | Underspecification | HIGH | spec.md:L113, spec.md:L167, tasks.md:L42-L44, tasks.md:L59 | FR-011 exige o nome gravado na moldura, e a suposição do seletor de empresa exige que ele acompanhe o idioma. T007 cria `clerkLocale.ts`, T008 guarda o perfil e T010 atualiza as preferências no salvamento, mas nenhuma tarefa manda o cabeçalho usar o `displayName` aplicado nem chama o setter que troca o localization da Clerk. | Acrescentar em T008 e T010: sem nome gravado, o cabeçalho continua com o nome da sessão; com nome confirmado, `CompanyWorkspace` passa esse nome ao `Header`. No mesmo ponto, chamar o setter de `clerkLocale.ts` com `pt-BR` ou `en`, e no sign-out voltar ao português. |
| U2 | Underspecification | MEDIUM | spec.md:L120, tasks.md:L43 | FR-018 proíbe carregar o perfil sem empresa. T008 manda usar `useApi`, que hoje lança erro se não houver `orgId`. A tarefa não diz para não chamar o serviço nesse caso. | Em T008, se não houver empresa selecionada, não chamar `useApi`, manter `pt-BR` e o nome da sessão, e deixar o estado vazio que `CompanyWorkspace` já mostra. |
| I1 | Inconsistency | LOW | tasks.md:L80, tasks.md:L128 | T016 está marcada `[P]` e edita `CompanyWorkspace.tsx`, o mesmo arquivo de T009 e T011. A seção de dependências avisa que T016 espera T011, mas o marcador sozinho não diz isso. | Manter T016 em paralelo só com T013–T015, depois de T011. Não iniciar T016 junto com T011. |

**Coverage Summary Table:**

| Requirement Key | Has Task? | Task IDs | Notes |
|-----------------|-----------|----------|-------|
| FR-001 | Yes | T011 | Nome no cabeçalho vira link; item Perfil em Configuração |
| FR-002 | Yes | T010 | Três campos na tela |
| FR-003 | Yes | T005, T010 | PUT só dos três campos, sem id de outra pessoa |
| FR-004 | Yes | T003, T006, T010 | 1–200 após trim; rejeita `/[\u0000-\u001F\u007F]/` |
| FR-005 | Yes | T001, T006 | Só `pt-BR` e `en` |
| FR-006 | Yes | T002, T006 | IANA, não o rótulo da empresa |
| FR-007 | Yes | T006, T010 | Validação local antes do PUT |
| FR-008 | Yes | T010 | Um envio; fieldset desabilitado. Conferência manual em T019 |
| FR-009 | Yes | T010 | Carga, erro, sucesso, alerta, cancelar |
| FR-010 | Yes | T005, T010 | Eco dos três valores |
| FR-011 | Partial | T008, T010, T007 | Estado e `user.reload()` existem; falta ligar o nome ao cabeçalho (U1) |
| FR-012 | Yes | T007, T010 | Sem API Backend da Clerk |
| FR-013 | Partial | T001, T012, T013, T014, T015, T016, T007 | Frases próprias e formatadores cobertos; o seletor Clerk não tem chamador (U1) |
| FR-014 | Yes | T008, T010 | Idioma só depois da confirmação; nome vazio não apaga a sessão |
| FR-015 | Yes | T013, T014, T015, T017 | Pré-visualização na tela; outras datas sem fuso do perfil |
| FR-016 | Yes | T011, T017, T019 | Sem rota nova de painel, varredura ou e-mail |
| FR-017 | Yes | T010, T018 | Perfil não chama `/api/company` |
| FR-018 | Partial | T009, T010, T011 | A página fica atrás do estado vazio atual; o provider ainda não tem a guarda (U2) |
| FR-019 | Yes | T010 | 401/403 pelo cliente existente; 409 recarrega |
| FR-020 | Yes | T008, T010 | AbortController e troca de empresa |
| FR-021 | Yes | T010 | Sem e-mail, notificação, avatar ou senha |
| FR-022 | Yes | T010 | `Input` e `Select` já usados na empresa |
| SC-001 | Yes | T019 | Tempo de tarefa, roteiro manual |
| SC-002 | Yes | T010, T019 | Reabrir mostra o confirmado |
| SC-003 | Partial | T010, T019 | Mesma lacuna de U1 |
| SC-004 | Yes | T012, T013, T014, T015, T016, T019 | Idioma na moldura e nos formatos |
| SC-005 | Yes | T003, T006, T010 | Inválidos não gravam |
| SC-006 | Yes | T011, T017 | Pré-visualização sem superfície nova |
| SC-007 | Yes | T018, T019 | Empresa intacta |
| SC-008 | Yes | T008, T010 | Resposta abandonada ignorada |

**Constitution Alignment Issues:**

`.specify/memory/constitution.md` continua o template sem princípios ratificados e sem MUST/SHOULD reais. Não há conflito a registrar e não há gate a reprovar. A ausência de constituição preenchida não foi tratada como defeito crítico dos artefatos desta história.

**Unmapped Tasks:**

Nenhuma. T001–T019 mapeiam para requisito, história ou verificação do quickstart.

**Metrics:**

- Total Requirements: 22 funcionais (FR-001–FR-022) e 8 critérios de sucesso (SC-001–SC-008)
- Total Tasks: 19 (T001–T019), todas por fazer
- Coverage % (requirements with >=1 task): 100% dos FR e SC têm ao menos uma tarefa; 3 linhas da tabela ficam parciais por U1 e U2 (FR-011, FR-013, FR-018, e SC-003 junto de FR-011)
- Ambiguity Count: 0
- Duplication Count: 0
- Critical Issues Count: 0

## Next Actions

Não há issue crítica. Dá para implementar a partir de `tasks.md`, desde que U1 seja fechado antes de considerar a moldura pronta: sem isso, o nome pode continuar só na sessão Clerk e o seletor de empresa pode permanecer em português com o perfil em inglês.

Sugestão objetiva, ainda não aplicada:

- Em T008 e T010, ligar o `displayName` aplicado ao `user.name` do cabeçalho em `src/app/layouts/CompanyWorkspace.tsx`, com fallback para o nome da sessão quando o gravado vier vazio.
- Nos mesmos pontos, chamar o setter de `src/features/profile/clerkLocale.ts`. T007 já volta ao português no sign-out.
- Em T008, não chamar `useApi` quando não houver empresa selecionada.

Essas edições não foram aplicadas neste passe.
