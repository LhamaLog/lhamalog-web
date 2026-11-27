# Feature Specification: Gerenciar chaves de ingestão no Web (revogar, rotacionar, listar e histórico)

**Feature Branch**: `LLT-179-gerenciar-chaves-ingestao`
**Spec**: `specs/013-gerenciar-chaves-ingestao` (013 conferido livre na `origin/Development` em 27/11/2026; 012 é a LLT-120)
**Feature (Jira)**: LLT-124 "Credenciais de ingestão OpenTelemetry" (Epic LLT-100), card LLT-179
**Status**: Implementada em 27/11/2026 (Fases 0 a 4). Clarify pelas recomendações do pacote, a conferir pelo Pedro; roteiro no navegador pendente (Parte D)

**Input**: complemento Web da LLT-179 ("Gerar, revogar e rotacionar token de ingestão do produto"), parte da Feature "Credenciais de ingestão OpenTelemetry" (E04.F3). Na revisão de 17/11, o Michel não moveu a Feature para Feito porque a LLT-179 não estava concluída. O Core da 179 (spec `010-tokens-ingestao`, PR #8) entrega gerar, listar, revogar, rotacionar e auditoria. O Web da 179 (spec `011-tokens-ingestao`, PR #15) entregou só o que o Figma mostra: uma "Chave de API" com "Gerar nova" e "Copiar" (decisão F5 de 20/11). Listar, revogar e histórico ficaram de fora, com a pendência registrada: "pedir ao Figma uma tela de revogação, importante para chave vazada". Esta spec fecha essa lacuna.

**Fontes:**
- **API:** o contrato do Core em `lhamalog-core/specs/010-tokens-ingestao/contracts/api.md`, copiado para `contracts/core-api.md`. É a fonte da verdade da API.
- **Tela:** o Figma final ("Completo 2 / v02", recorte `figma/04-produto-integracao-otel.png` do pacote). O topo da aba (Endpoint, Chave de API, Gerar nova, Copiar) continua **igual ao Figma**. O Figma não desenha lista, revogação nem histórico: a seção nova segue a linguagem visual dele (cartão branco, título com ícone, botões contornados, selos de situação, confirmação no padrão `window.confirm` já usado no projeto).

## Clarifications

Decisões do `speckit-clarify`. Cada uma traz a recomendação; as respostas estão na sessão de 27/11/2026, abaixo.

- **K1. Onde ficam lista, revogação, rotação e histórico?** → Recomendação: numa seção nova, "Chaves deste produto", **abaixo** do cartão "Conexão com OpenTelemetry" e dentro da mesma aba. O topo do Figma não muda. A seção só aparece para quem pode gerenciar as chaves.
- **K2. "Gerar nova" do Figma continua igual?** → Recomendação: sim, como na F5: sem chave ativa, cria; com chave ativa, rotaciona com 24 h, depois de confirmar. A seção nova dá o controle fino: revogar uma chave específica, rotacionar escolhendo o período e criar uma chave com nome.
- **K3. Nome da chave.** O Core exige nome de 1 a 100 caracteres. → Recomendação: "Gerar nova" do topo continua usando o nome automático que o Web da 179 já usa. Na seção nova, "Nova chave" pede o nome (por exemplo, `cluster-producao`), com a validação do Core.
- **K4. Período da rotação.** → Recomendação: campo numérico em horas, de 1 a 168, com 24 como padrão e a explicação "Durante esse período, a chave antiga e a nova funcionam. Depois, só a nova."
- **K5. Histórico.** → Recomendação: lista simples, do mais recente para o mais antigo: ação (Criada, Rotacionada, Revogada), chave, quem fez e quando; na rotação, também o fim da transição. Quem fez aparece pelo nome da pessoa na organização (`organization.getMemberships`, a mesma chamada da Equipe, sem chamada nova à Clerk). Sem acesso à lista, aparece "Usuário removido" ou o id curto, nunca o e-mail completo de quem não está na organização.
- **K6. Quem vê e usa.** → Recomendação: se a LLT-120 do Web já estiver na `Development` (existe `src/features/access`), usar `can('INGESTION_TOKENS_MANAGE')`. Se não estiver, manter o critério da W1 da spec `011` (cargo admin na Clerk) e registrar a troca como pendência. Quem não pode gerenciar não vê a seção (o Core recusaria a lista com 403).
- **K7. Produto arquivado.** → Recomendação: a seção aparece em modo leitura. Revogar continua **permitido**, porque o Core aceita (FR-007 do Core), e é o que se faz com uma chave vazada de um produto arquivado. Nova chave e Rotacionar ficam desabilitados, com a mensagem do Core.
- **K8. Chave vazada.** → Recomendação: "Revogar" pede confirmação com o texto "A chave deixa de ser aceita em até 30 segundos. As aplicações que usam essa chave param de enviar logs." (os 30 s vêm do cache do Coletor).

### Session 2026-11-27

O Pedro autorizou seguir sem a confirmação dele, pelo celular, com estas regras: adotar as recomendações e reservar só as decisões sensíveis. K1 a K8 ficaram pela recomendação e entram na revisão dele. Nenhuma delas foi reservada.

- Q: K1, onde fica a seção? → A: abaixo do cartão "Conexão com OpenTelemetry", na mesma aba, só para quem gerencia. O topo do Figma não muda.
- Q: K2, "Gerar nova" do topo? → A: igual à F5 (cria ou rotaciona com 24 h).
- Q: K3, nome da chave? → A: o topo usa o nome automático; "Nova chave" da seção pede o nome (1 a 100, sem espaços nas pontas).
- Q: K4, período da rotação? → A: horas inteiras de 1 a 168, padrão 24, com o texto da recomendação.
- Q: K5, histórico e autores? → A: pela recomendação. O mesmo mapeamento de nomes vale para "criada por" e "revogada por" na lista. Para quem está na organização, aparece o nome ou, sem nome, o e-mail, como na Equipe e no "Responsável pelo produto". Se o id não estiver na organização, ou se a lista não puder ser lida, aparece "Usuário removido".
- Q: K6, quem vê? → A: a LLT-120 já está na `Development` (`src/features/access`, `INGESTION_TOKENS_MANAGE`, conferido em 27/11), e o Core já exige essa permissão (`Permission.java`). Então a seção **e** o "Gerar nova" do topo passam a usar `useAccess().can('INGESTION_TOKENS_MANAGE')` no lugar do cargo admin da Clerk (W1 da `011`). Enquanto o acesso carrega, nada aparece. No modo legado (Core sem a LLT-120), vale o `accessFallback` da 012.
- Q: K7, produto arquivado? → A: pela recomendação. Detalhe achado no código: a aba fica dentro de um `fieldset` desabilitado quando o produto está arquivado (`ProductForm.tsx`). Por isso, a seção é montada **fora** desse `fieldset`, logo abaixo do cartão, para Revogar continuar clicável.
- Q: K8, texto da revogação? → A: pela recomendação.
- Q (novo, K9): como o topo e a seção ficam em dia um com o outro? → A: os dois leem a mesma lista do Core. Qualquer ação de um avisa o formulário, que pede uma nova leitura aos dois. O painel "Status da conexão" acompanha. O valor de uma chave nova nunca passa pelo formulário: ele fica só no componente que a mostra.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver as chaves do produto (Priority: P1)

Como dono ou administrador, quero ver todas as chaves do produto e a situação de cada uma, para saber o que está valendo.

**Independent Test**: com duas chaves, uma ativa e uma revogada, a seção lista as duas com nome, situação, criada em, criada por e expira ou revogada em.

**Acceptance Scenarios**:

1. **Given** um produto com chaves, **When** o admin abre a aba Integração OpenTelemetry, **Then** a seção "Chaves deste produto" lista todas, da mais recente para a mais antiga, sem nenhum valor de chave.
2. **Given** uma chave em transição, **Then** o selo mostra "Em transição" e "Expira em dd/mm/aaaa hh:mm".
3. **Given** um produto sem chaves, **Then** a seção mostra "Nenhuma chave gerada ainda." e o botão "Nova chave".
4. **Given** um membro comum, **Then** a seção não aparece e nenhuma chamada de lista é feita.

### User Story 2 - Revogar uma chave (Priority: P1)

Como dono ou administrador, quero revogar uma chave vazada ou sem uso, para que ela pare de funcionar.

**Independent Test**: revogar uma chave ativa muda o selo para "Revogada" e mostra quando e por quem.

**Acceptance Scenarios**:

1. **Given** uma chave ativa ou em transição, **When** o admin clica em Revogar e confirma (K8), **Then** a chave aparece como "Revogada", com data e autor, e continua na lista.
2. **Given** a confirmação cancelada, **Then** nada é enviado ao Core.
3. **Given** uma chave já revogada, **Then** o botão Revogar não aparece.
4. **Given** um produto arquivado, **Then** Revogar continua disponível (K7).
5. **Given** um erro do Core (404, 409), **Then** aparece a mensagem do Core, sem encerrar a sessão.

### User Story 3 - Rotacionar escolhendo o período (Priority: P2)

Como dono ou administrador, quero trocar uma chave com um período em que as duas funcionam, para atualizar as aplicações sem parar a ingestão.

**Independent Test**: rotacionar com 2 horas mostra a chave nova uma vez, com Copiar, e a antiga passa a "Em transição", expirando 2 horas depois.

**Acceptance Scenarios**:

1. **Given** uma chave ativa sem expiração, **When** o admin escolhe Rotacionar, informa 2 horas e confirma, **Then** a chave nova aparece **uma única vez**, com Copiar e o aviso do Core, e a antiga mostra "Em transição" e o fim da transição.
2. **Given** um período fora de 1 a 168, **Then** o Web recusa no campo, sem chamar o Core.
3. **Given** uma chave revogada, expirada ou já em transição, **Then** Rotacionar não aparece; se o Core recusar mesmo assim (409), aparece a mensagem dele.
4. **Given** o produto arquivado, **Then** Rotacionar fica desabilitado (K7).
5. **Given** a chave nova fechada ou a aba trocada, **Then** o valor some da memória e não aparece mais em lugar nenhum.

### User Story 4 - Criar chave com nome (Priority: P2)

**Acceptance Scenarios**:

1. **Given** o admin em "Nova chave", **When** informa `cluster-producao` e confirma, **Then** a chave aparece uma vez, com Copiar, e entra na lista como "Ativa".
2. **Given** nome vazio ou com mais de 100 caracteres, **Then** o erro aparece no campo, sem chamar o Core.

### User Story 5 - Histórico (Priority: P2)

**Acceptance Scenarios**:

1. **Given** uma geração, uma rotação e uma revogação, **When** o admin abre "Histórico", **Then** aparecem "Criada", "Rotacionada" (com o fim da transição), "Criada" (a nova) e "Revogada", da mais recente para a mais antiga, com o nome de quem fez (K5).
2. **Given** um membro comum, **Then** o histórico não aparece.

### Edge Cases

- Duas abas: uma revoga, a outra tenta rotacionar a mesma chave → aparece o 409 do Core e a lista é recarregada.
- Falha de rede ao revogar → a chave continua como estava, com "Não foi possível revogar. Tente de novo."
- A chave nova nunca vai para `sessionStorage`, `localStorage`, `console`, URL, log ou exemplo de configuração (FR-W03 da spec `011` continua valendo).

## Requirements *(mandatory)*

- **FR-K01**: A aba MUST manter o topo igual ao Figma e a regra F5 do "Gerar nova".
- **FR-K02**: A seção "Chaves deste produto" MUST listar `GET /api/products/{id}/tokens` com nome, situação (Ativa, Em transição, Expirada, Revogada, a partir do `state`), criada em e por, e expira em ou revogada em e por.
- **FR-K03**: Revogar MUST chamar `POST .../tokens/{tokenId}/revoke` só depois da confirmação (K8) e MUST continuar disponível no produto arquivado.
- **FR-K04**: Rotacionar MUST chamar `POST .../tokens/{tokenId}/rotate` com `transitionHours` de 1 a 168 (padrão 24) e mostrar o `secret` uma única vez.
- **FR-K05**: Nova chave MUST chamar `POST .../tokens` com nome de 1 a 100 caracteres, sem espaços nas pontas.
- **FR-K06**: O histórico MUST vir de `GET .../tokens/audit` e mostrar o autor pelo nome (K5).
- **FR-K07**: Quem pode gerenciar segue a K6.
- **FR-K08**: Recusas do Core MUST mostrar a mensagem dele e MUST NOT encerrar a sessão, salvo o 403 sem código da camada de segurança (spec `006`).
- **FR-K09**: O valor da chave MUST ficar só em memória, enquanto o aviso estiver aberto.
- **FR-K10**: Toda lógica nova MUST ficar em `.ts` puro, com teste em `tests/*.test.mjs` (o `node --test` não carrega `.tsx`).
- **FR-K11**: Nenhuma mudança no Core nem no Coletor.

## Success Criteria

- **SC-K01**: O Pedro revoga uma chave e, em até 30 segundos, o Coletor recusa essa chave com 401 (teste manual com ingestão real, Etapa D).
- **SC-K02**: Os testes novos cobrem situação, validação de nome e período, e o mapeamento do histórico.

## Assumptions

- O Core da 179 está na `Development` (PR #8) e não muda.
- O Figma não ganha tela nova antes desta entrega; a diferença fica registrada no PR.
