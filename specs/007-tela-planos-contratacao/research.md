# Research: Tela de planos e contratação

**Feature**: [spec.md](spec.md) | **Plano**: [plan.md](plan.md) | **Data**: 2026-11-18

## R1. Como levar quem está sem plano até a tela

- **Decisão**: o `useApi` chama `notifySubscriptionRequired()` (módulo `shared/services/subscriptionRedirect.ts`) quando recebe um `ApiError` com `code === 'subscription_required'`, e relança o erro como antes. O `CompanyWorkspace` registra, com `onSubscriptionRequired`, uma função que navega para `/plano` (com `replace`) se a pessoa não estiver lá.
- **Por quê**: um lugar só cobre todas as telas (Empresa, Produtos, Perfil, Equipe, Notificações), sem mexer em cada uma. A regra da spec 006 não muda: o erro continua classificado como recusa de negócio e a sessão fica.
- **Alternativas**: botão "Ver planos" no `ErrorState` de cada tela. Rejeitado: exige ler o código em cinco telas. Consultar o pedido ao abrir o workspace: rejeitado, uma empresa do seed local não tem pedido e mesmo assim tem plano.

## R2. Estado do pedido

- **Decisão**: `GET /api/billing/order` ao abrir a tela. 404 com `no_order` vira "nenhum pedido", sem erro. `subscriptionActive: true` mostra o plano ativo e esconde "Contratar". `PENDING` mostra "Continuar pagamento" com o `paymentUrl`.
- **Por quê**: contrato da spec 010 do core. Evita contratar de novo quem já pagou.
- **Alternativas**: `useApiResource`. Rejeitado só nesta chamada, porque ele guarda a mensagem e não o código, e o 404 `no_order` é um estado normal da tela.

## R3. Navegação ao `paymentUrl`

- **Decisão**: `window.location.assign(paymentUrl)` só se o endereço for `http:` ou `https:` (`isHttpUrl`). Fora disso, mensagem de erro.
- **Por quê**: o pagamento é uma página externa (hoje o simulador no Core, depois o checkout do Asaas). A checagem evita navegar para `javascript:` ou outro esquema vindo de uma resposta adulterada.

## R4. Validação e dados

- **Decisão**: o nome da empresa começa com o nome da organização ativa da Clerk e é validado no front com as mesmas regras do Core (2 a 120 caracteres depois do `trim`). As respostas são lidas por funções que devolvem `null` para formato inesperado (`readPlans`, `readOrder`, `readCheckout`), no padrão de `notificationPreferences/model.ts`.
- **Por quê**: SC-003 (nenhuma chamada com nome inválido) e resiliência a resposta inesperada.

## R5. Quem contrata

- **Decisão**: `isOrganizationAdmin(orgRole)` (já existe em `features/team/invitations.ts`) habilita "Contratar". Os demais veem os planos com o botão desativado e o aviso. O Core recusa com `not_admin` de qualquer jeito.

## R6. Formatação do preço

- **Decisão**: `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`, com "/mês". FREE aparece como "R$ 0,00/mês".

## R7. Fora do escopo

- Design definitivo do Figma ("Planos de Assinatura" e "Gerenciamento de Assinatura").
- Troca, cancelamento e reembolso (LLT-232/233).
- Textos em inglês (o seletor de idioma do Perfil vale só para o shell).
