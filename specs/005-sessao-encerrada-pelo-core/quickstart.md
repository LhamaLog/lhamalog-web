# Quickstart: validar a sessão encerrada pelo Core

## Pré-requisitos

- Core da LLT-163 rodando (`http://localhost:8080`), com `CLERK_SECRET_KEY` e o ambiente de teste da spec 007 do `lhamalog-core`: organização A com Tenant, organização C sem Tenant e uma conta membro `+clerk_test` em A.
- Web com `.env` (`VITE_CLERK_PUBLISHABLE_KEY` da mesma instância e `VITE_API_URL=http://localhost:8080`) e `npm run dev`.
- Node.js 26.12.1.

## Verificações automáticas

```powershell
npm test
npm run build
```

Esperado: todos os testes passam (inclusive `tests/session-redirect.test.mjs`) e o build termina sem erro de tipo.

## Roteiro manual (registrar no PR da feature)

| Item | Passo | Esperado | Requisito |
|---|---|---|---|
| E1 | Entrar com segundo fator | Cai no aplicativo, sem cartão vazio | FR-009 |
| E2 | Com A, abrir Empresa, Produtos, Equipe e Perfil | Todas carregam | US4 |
| E3 | Em `/produtos?pagina=2`, apagar a sessão no Dashboard da Clerk (Users > sessão > Revoke) e agir na tela | Login; depois de entrar, volta a `/produtos?pagina=2`. O aviso "Você foi deslogado" só aparece quando a recusa vem do Core: se o SDK da Clerk perceber a revogação antes, o login abre sem o aviso | FR-001, FR-006 |
| E4 | Trocar para C (sem Tenant) e abrir a Empresa | Login com o aviso na primeira recusa, sem ver "Você não tem acesso" antes | FR-002, SC-001 |
| E5 | No E4, conferir no DevTools > Network o número de saídas | Uma navegação para `/sign-in`, um aviso | FR-005, SC-004 |
| E6 | Entrar com a conta membro e abrir Equipe | A Equipe mostra o bloqueio do Web (LLT-168, "Você não tem acesso. Selecione uma empresa válida."), sem chamar o Core, e a pessoa continua logada. O `not_admin` do Core é conferido no V7 da spec 007 do `lhamalog-core` | FR-003, SC-002 |
| E7 | Abrir `/sign-in?redirect_url=https%3A%2F%2Fevil.example` e entrar | Vai para `/` | FR-007, SC-003 |
| E8 | Com a sessão ativa, abrir `/sign-in?redirect_url=%2Fequipe` | Vai direto para `/equipe` | FR-009 |
| E9 | Abrir "Cadastrar empresa" | Aviso da FR-008 acima do formulário; a criação funciona | FR-008 |
| E10 | Desligar o Core e recarregar a Empresa | Mensagem de falha de conexão; a sessão continua | edge case |
| E11 | Sessão sem empresa selecionada (sair da organização no seletor) | Escolha de empresa, sem logout; a etapa mostra o aviso da FR-008 acima do formulário | FR-004, FR-008 |
| E12 | Duas abas abertas; repetir o E4 numa delas e depois agir na outra | A segunda aba vai ao login na próxima ação, sem laço entre login e aplicativo | edge case |

Registrar como `Item | Data | Resultado | Observação`, sem token, e-mail real ou `org_id` real.
