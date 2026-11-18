# Feature Specification: Tela de planos e contratação (Asaas simulado)

**Feature Branch**: `LLT-289-criar-o-tenant-na-confirmacao-de-pagamento-asaas-simulado`

**Created**: 2026-11-18

**Status**: Draft

**Input**: User description: "Criar uma tela de planos, provisória, para conseguirmos seguir sem precisar contratar pelo console do navegador. Usa o fluxo de contratação do Core (spec 010 do lhamalog-core, PR #14, LLT-289): lista de planos, checkout, página do simulador do Asaas e volta ao Web. Corrigir também o README do Web, que ainda diz que organização sem Tenant é deslogada."

## Clarifications

### Session 2026-11-18

- Q: Tela definitiva ou provisória? → A: Provisória. Serve para o time seguir enquanto a cobrança real e o design de "Planos de Assinatura" (Figma, telas do André) não entram. Usa os componentes atuais, sem seguir o Figma.
- Q: Quem vai para a tela de planos? → A: Qualquer pessoa com a empresa ativa, pelo item "Plano" do menu. Quando o Core responde `subscription_required`, o Web leva a pessoa para a tela de planos sozinho.
- Q: Membro que não é administrador? → A: Vê os planos e a situação, mas não contrata; a tela diz que só o administrador contrata.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Contratar um plano sem usar o console (Priority: P1)

O administrador de uma empresa sem plano abre a tela de planos, confere o nome da empresa, escolhe um plano e clica em "Contratar". O navegador vai para a página de pagamento do gateway (hoje, o simulador local do Asaas). Depois do pagamento, o link de volta leva à Empresa, já com acesso.

**Why this priority**: Hoje a contratação só funciona colando código no console do navegador. É o que bloqueia quem pega o repositório do zero.

**Independent Test**: Com o Core da spec 010 e uma organização nova, entrar, abrir "Plano", contratar o STARTER, clicar em "Simular pagamento" e em "Voltar ao LhamaLog": a Empresa carrega sem recusa.

**Acceptance Scenarios**:

1. **Given** um administrador de empresa sem plano, **When** abre a tela de planos, **Then** vê cada plano com nome e preço mensal em reais e um botão "Contratar".
2. **Given** a tela de planos, **When** clica em "Contratar" com um nome de empresa válido, **Then** o navegador vai para a página de pagamento devolvida pelo Core.
3. **Given** o nome da empresa vazio ou com menos de 2 ou mais de 120 caracteres, **When** clica em "Contratar", **Then** a tela mostra o erro no campo e não chama o Core.
4. **Given** o Core recusa a contratação (já tem plano, plano indisponível, pagamento indisponível), **When** a resposta chega, **Then** a tela mostra a mensagem do Core e continua logada.

---

### User Story 2 - Ser levado à tela de planos quando a empresa não tem plano (Priority: P1)

Uma pessoa entra com uma empresa sem plano. Em vez do card "Não foi possível carregar os dados", o Web a leva para a tela de planos.

**Why this priority**: Sem isso a pessoa fica numa tela de erro sem saber o que fazer.

**Independent Test**: Entrar com uma organização sem plano e abrir `/empresa`: a tela de planos aparece, com o aviso de que a empresa ainda não tem plano.

**Acceptance Scenarios**:

1. **Given** uma empresa sem plano, **When** qualquer tela chama o Core e recebe `subscription_required`, **Then** o Web vai para a tela de planos, sem encerrar a sessão.
2. **Given** a tela de planos aberta, **When** carrega, **Then** não chama nenhuma rota que responda `subscription_required` (só as de contratação).

---

### User Story 3 - Ver a situação da contratação (Priority: P2)

A tela mostra a situação do pedido mais recente: pagamento pendente (com o link para continuar), plano ativo (com o botão para a Empresa) ou nenhum pedido.

**Why this priority**: Evita contratar de novo quem já pagou ou quem só precisa terminar o pagamento.

**Independent Test**: Contratar, voltar à tela sem pagar (pendente com link), pagar e voltar (plano ativo).

**Acceptance Scenarios**:

1. **Given** um pedido pendente, **When** a tela carrega, **Then** mostra "Pagamento pendente" e o link "Continuar pagamento".
2. **Given** a empresa com plano ativo, **When** a tela carrega, **Then** mostra o plano ativo, o botão "Ir para a empresa" e não oferece "Contratar".
3. **Given** um membro que não é administrador, **When** abre a tela, **Then** vê os planos e a situação, mas os botões de contratar ficam desativados com o aviso de que só o administrador contrata.

---

### Edge Cases

- A empresa tem plano pelo seed local (`DEV_TENANT_CLERK_ORG_ID`) e nenhum pedido: o Core responde "nenhum pedido"; a tela oferece os planos e, se a pessoa tentar contratar, mostra a recusa "já tem um plano ativo".
- A resposta de planos ou de pedido vem num formato inesperado: a tela mostra o erro com "Tentar novamente", sem quebrar.
- A pessoa troca de empresa com a tela aberta: a tela recarrega para a empresa nova.
- O `paymentUrl` devolvido não é http(s): a tela não navega e mostra erro.
- O Core está fora do ar: a mensagem padrão de conexão aparece, com "Tentar novamente".

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O Web MUST ter a rota `/plano`, dentro da área logada, aberta pelo item "Plano" do menu lateral.
- **FR-002**: A tela MUST listar os planos do Core (`GET /api/billing/plans`) com nome e preço mensal formatado em reais.
- **FR-003**: A tela MUST ter o campo "Nome da empresa", preenchido com o nome da organização ativa, validado com 2 a 120 caracteres sem espaços nas pontas antes de chamar o Core.
- **FR-004**: "Contratar" MUST chamar `POST /api/billing/checkout` com o plano e o nome e, em sucesso, levar o navegador ao `paymentUrl` (só http ou https).
- **FR-005**: Recusas do Core MUST aparecer na tela com a mensagem dele, sem encerrar a sessão.
- **FR-006**: A tela MUST mostrar a situação do pedido mais recente (`GET /api/billing/order`): nenhum, pendente (com "Continuar pagamento"), cancelado ou pago com plano ativo (com "Ir para a empresa" e sem "Contratar").
- **FR-007**: Só o administrador da organização MUST ver "Contratar" ativo; os demais veem o aviso de que só o administrador contrata.
- **FR-008**: Qualquer chamada ao Core que receba `subscription_required` MUST levar a pessoa a `/plano`, sem encerrar a sessão (a regra da spec 006 continua: 403 com código é recusa de negócio).
- **FR-009**: A tela MUST dizer que, por enquanto, o pagamento abre o simulador do Asaas e nenhum valor é cobrado.
- **FR-010**: O README do Web MUST descrever o fluxo de contratação no lugar do texto atual de que organização sem Tenant é deslogada.

### Key Entities

- **Plano**: código (`FREE`, `STARTER`, ...), nome e preço mensal em reais, vindos do Core.
- **Pedido**: id, plano, situação (`PENDING`, `PAID`, `CANCELED`), endereço de pagamento e se a empresa já tem plano ativo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Quem pega o repositório do zero contrata um plano e chega à Empresa liberada só com cliques, sem console, em até 2 minutos depois do login.
- **SC-002**: 100% das telas que recebem `subscription_required` levam à tela de planos, e nenhuma delas encerra a sessão.
- **SC-003**: 0 chamadas ao Core com nome de empresa inválido.
- **SC-004**: Um membro que não é administrador não consegue iniciar uma contratação pela tela.

## Assumptions

- O Core da spec 010 (PR #14) está disponível: `/api/billing/plans`, `/checkout`, `/order`, o simulador no perfil local e o `BILLING_RETURN_URL` apontando para `/empresa` do Web.
- A tela é provisória: usa os componentes atuais (Card, Button, Input, PageHeader) e não segue o Figma de "Planos de Assinatura", que fica para a feature definitiva.
- Os textos da tela ficam em português, como as telas de Empresa e Produtos.
- Gerenciar, trocar, cancelar ou reembolsar a assinatura está fora do escopo (LLT-232/233).
- A spec 006 continua valendo: 401 e 403 sem código encerram a sessão; `subscription_required` é recusa de negócio.
