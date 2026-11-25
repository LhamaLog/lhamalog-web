# Plano: Cargos e permissões (Web)

**Branch**: `LLT-120-cargos-permissoes` | **Data**: 17/11/2026 | **Spec**: [spec.md](spec.md)

## Summary

O Web passa a usar o papel e as permissões que vêm do Core (`access/me`) no lugar do `orgRole` da Clerk para liberar as telas. Na Equipe, o Web:

- identifica e protege o Dono;
- limita o convite de Administrador ao Dono;
- ganha o painel "Produtos" de cada Membro;
- ganha as abas "Cargos" e "Permissões".

Nenhuma chamada nova à Clerk e nenhuma mudança no login.

## Technical Context

- **Language/Version:** TypeScript 7.0.2, React 19.3.1, Node 26.12.1.
- **Primary Dependencies:** Vite 8, Tailwind 4, react-router-dom 7, `@clerk/react` 6. Nenhuma dependência nova.
- **Testing:** `node --test tests/*.test.mjs` (funções puras) e `npm run build` (`tsc --noEmit` + Vite).
- **Constraints:**
  - `docs/instrucoes-agentes.md`: o agente não roda Git, trabalha em pequenas entregas, preserva a Clerk (responsabilidade do Felipe) e não instala dependências sozinho;
  - sem chave secreta (ADR_026).

## Constitution Check

A constituição do Web ainda é o template vazio do Spec Kit. Valem as `docs/instrucoes-agentes.md` e, por coerência, os princípios do Core: Spec Kit completo, teste antes do merge, código em inglês e docs em português, sem segredos.

## Estrutura

```text
src/
├── features/access/
│   ├── accessContract.ts        # readMe(), readCatalog(), accessFailureStatus(), teamPageGate(); paths do Core
│   ├── AccessProvider.tsx       # contexto: role, permissions, ownerUserId, reload ao trocar de org
│   ├── useAccess.ts             # hook: can(permission), role
│   └── labels.ts                # mapas pt-BR de papéis, permissões, gravidades e tipos
├── features/team/
│   ├── productAccess.ts         # readProductAccess(), productAccessPath()
│   ├── ownerRules.ts            # isOwnerRow(), canDemote(), canDeactivate(), demoteGuard(), inviteRolesFor(role, ownerExists), resendBlocked()
│   └── components/
│       ├── TeamPage.tsx         # (LLT-168) + selo Dono, ocultar ações, convite limitado, ação "Produtos"
│       ├── TeamTabs.tsx         # abas Pessoas | Cargos | Permissões
│       └── MemberProductsPanel.tsx
├── features/notification-roles/
│   ├── roleContract.ts          # readRole(), readRoleList(), paths
│   ├── roleValidation.ts        # nome 1–60, listas >= 1
│   └── components/
│       ├── NotificationRolesPage.tsx
│       ├── RoleForm.tsx
│       └── RoleMembersPanel.tsx
├── features/access/components/PermissionsMatrix.tsx
├── shared/services/api.ts       # aceita 204 sem corpo (DELETE de cargo e de pessoa no cargo)
└── app/
    ├── routes/AppRoutes.tsx     # + /equipe/cargos, /equipe/permissoes
    └── layouts/CompanyWorkspace.tsx  # envolve com AccessProvider; menu por permissão; TeamSection escolhe a aba pela rota

tests/
├── access-contract.test.mjs
├── owner-rules.test.mjs
├── product-access.test.mjs
├── notification-roles.test.mjs
└── access-refusals.test.mjs     # recusas de negócio mantêm a sessão; subscription_required (22/11)
```

## Fases

1. **AccessProvider + menu por permissão (US1).**
2. **Dono na Equipe e convite limitado (US2, US3).**
3. **Painel "Produtos" (US4).**
4. **Aba "Cargos" e pessoas do cargo (US5, US6).**
5. **Aba "Permissões" (US7).**
6. **Fechamento:** `npm test`, `npm run build` e roteiro manual contra o Core local.

## Riscos

| Risco | Mitigação |
|---|---|
| `TeamPage.tsx` já tem 542 linhas | extrair as regras novas para `ownerRules.ts` e `MemberProductsPanel.tsx`. Na `TeamPage`, só a ligação |
| Mudar o comportamento do convite (LLT-167) | só filtrar as opções mostradas. A chamada `inviteMember` continua igual |
| Empresa sem plano (LLT-289) | o `access/me` responde `subscription_required`; o `AccessProvider` fica `unsubscribed`, sem erro por cima da tela de planos (22/11) |
| Core sem a LLT-120 no ambiente de alguém | o `access/me` com 404 cai no modo antigo (`orgRole` da Clerk) e mostra um aviso no console. Remover esse modo depois do merge do Core (pendência registrada no PR, 22/11) |
| ~~Nenhuma empresa tem Dono enquanto não existir o fluxo de compra~~ | resolvido em 22/11: a LLT-289 cria o Dono na compra. Só a organização de desenvolvimento fica sem Dono, e nela vale a W4 |
| ~~`node_modules` ausente nesta máquina (analyze WA1)~~ | resolvido em 22/11: o Pedro instalou, e o `npm run build` passou |
