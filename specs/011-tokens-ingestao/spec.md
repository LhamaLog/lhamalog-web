# Feature Specification: Aba de integração e Chave de API (Web)

**Feature Branch**: `LLT-179-tokens-ingestao` (no `lhamalog-web`; sai da `LLT-177-nome-unico-produto`, veja o LEIA-ME)

**Created**: 2026-11-19

**Status**: Draft (pré-preenchida; passa por clarify e analyze no Claude Code)

**Input**: lado Web da LLT-179. Duas fontes:

- **Tela:** o Figma final, recorte `C:\Users\Pedro\Desktop\LhamaLog\LLT-produto-telas-web\figma\04-produto-integracao-otel.png`. A comparação está em `C:\Users\Pedro\Desktop\LhamaLog\LLT-produto-telas-web\figma\FIGMA-x-WEB-x-CORE.md`, seção 4.
- **API:** o Core mergeado (PR #8). O contrato está em `contracts/core-api.md`.

## Situação atual do Web

- **Aba "Integração OpenTelemetry":** tem campos que não estão no Figma (endpoint editável, protocolo, nome do serviço, cabeçalhos e coleta ativa), guardados no navegador. O campo "Cabeçalhos" sugere colar `Bearer ...`.
- **Chave de API:** não existe.

## Clarifications

- **F5** [NEEDS CLARIFICATION]: O Figma tem uma única "Chave de API" com "Gerar nova" e "Copiar". O Core tem vários tokens, revogar, rotacionar com transição e histórico.
  - **Recomendação:** seguir o Figma.
    - Sem chave ativa, "Gerar nova" cria uma (`POST`).
    - Com chave ativa, "Gerar nova" rotaciona com transição de 24 h (`rotate`), depois da confirmação.
    - A chave aparece uma vez, com Copiar.
  - Listar, revogar e histórico não entram, porque não estão no Figma. Fica a pendência de pedir ao Figma uma tela de revogação, importante para chave vazada.
- **F4** [NEEDS CLARIFICATION]: De onde vem o "Endpoint de recebimento"?
  - **Recomendação:** da configuração pública do Web, numa variável nova `VITE_OTLP_ENDPOINT`, sem segredo.
  - Sem valor, mostra "Endereço ainda não configurado.".
- **F1** [NEEDS CLARIFICATION]: O que fazer com os elementos do Figma sem Core?
  - **Recomendação para Sinais a enviar e Nível mínimo de log:** ficam iguais ao Figma, no rascunho local, com a nota "Ainda não é salvo no servidor".
  - **Recomendação para o painel "Status da conexão":** mostra o estado neutro: "Aguardando primeiro log" se há chave ativa, "Sem integração" se não há, e "—" nos números. "Testar conexão" fica desabilitado, com a dica "Disponível quando a verificação existir no servidor".
- **W1** [NEEDS CLARIFICATION]: Quem vê "Gerar nova"?
  - **Recomendação:** quem tem o cargo admin na Clerk. Quando a LLT-120 do Web entrar, troca por `can('INGESTION_TOKENS_MANAGE')`.
  - Quem não é admin vê a chave mascarada sem os botões e a dica "Somente donos e administradores podem gerar a chave.".

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Aba de integração igual ao Figma (Priority: P1)

**Independent Test**: Compare a aba com `04-produto-integracao-otel.png`.

**Acceptance Scenarios**:

1. **Given** a aba "Integração OpenTelemetry", **When** abre, **Then** mostra, como no Figma:
   - o cartão "Conexão com OpenTelemetry" e o subtítulo;
   - **Endpoint de recebimento**: só leitura, com Copiar (F4);
   - **Chave de API**: mascarada, com "Gerar nova" e "Copiar", e a ajuda "Envie no header de autorização. Ela aparece só uma vez.";
   - **Sinais a enviar \***: Logs (obrigatório, sempre marcado), Traces e Métricas;
   - **Nível mínimo de log**: DEBUG, INFO, WARN e ERROR, com INFO inicial;
   - **Configuração da aplicação**: abas "Variáveis de ambiente" e "Java (agente)", com Copiar;
   - a lateral "Status da conexão" e "Boas práticas";
   - o rodapé do Figma.
2. **Given** os campos antigos fora do Figma (protocolo, nome do serviço, cabeçalhos e coleta ativa), **When** a aba abre, **Then** eles não aparecem.
3. **Given** a "Configuração da aplicação", **When** aparece, **Then** usa o endpoint (F4) e o marcador `<sua-chave>`, **nunca** o valor real da chave, mesmo logo depois de gerar.
4. **Given** um produto novo, ainda não salvo, **When** a aba abre, **Then** a Chave de API mostra "Salve o produto para gerar a chave." e "Gerar nova" fica desabilitado.

---

### User Story 2 - Gerar a chave e copiar uma única vez (Priority: P1)

**Acceptance Scenarios**:

1. **Given** um admin num produto salvo sem chave ativa, **When** clica em "Gerar nova", **Then** o Web envia `POST /api/products/{id}/tokens` com um nome padrão (o nome do produto, cortado em 100 caracteres) e mostra a chave no campo, já visível, com "Copiar" e o aviso do Core ("Copie o token agora: ele não será exibido de novo.").
2. **Given** um produto com chave ativa (`GET .../tokens` traz um token ACTIVE), **When** o admin clica em "Gerar nova", **Then** aparece a confirmação: "Gerar uma nova chave? A chave atual continua funcionando por 24 horas e depois para. Atualize suas aplicações nesse prazo."
3. **Given** a confirmação, **When** confirma, **Then** o Web envia `POST .../tokens/{tokenId}/rotate` com `{transitionHours: 24}` e mostra a chave nova do mesmo jeito.
4. **Given** a chave mostrada, **When** a pessoa sai da aba, troca de produto ou recarrega a página, **Then** a chave volta a ficar mascarada e não pode ser vista de novo.
5. **Given** um produto arquivado, **When** a aba abre, **Then** "Gerar nova" fica desabilitado com "Produto arquivado não pode receber tokens novos.". Um 409 do Core mostra a mesma mensagem.
6. **Given** a chave atual em transição (EXPIRING), **When** a aba abre, **Then** a ajuda mostra "A chave anterior para de funcionar em {expiresAt}.".

### Edge Cases

- **O valor da chave:** MUST NOT ir para `sessionStorage`, `localStorage`, console, URL, estado global nem para a "Configuração da aplicação". Vive só no estado do campo e é apagado ao sair.
- **Copiar sem permissão:** se o navegador não deixar copiar, o campo fica selecionado e aparece "Copie manualmente com Ctrl+C.".
- **403 `not_admin`:** a mensagem do Core aparece e a sessão continua.
- **Mais de um token ativo** (criados por outro meio): o Web usa o mais recente para "Gerar nova".

## Requirements *(mandatory)*

### Functional Requirements

- **FR-W01**: A aba MUST seguir `04-produto-integracao-otel.png`. Os campos fora do Figma MUST sair.
- **FR-W02**: A Chave de API MUST seguir F5. A leitura MUST usar funções puras com teste (`readTokenList`, `activeToken`, `readCreatedToken`, `readRotation`).
- **FR-W03**: O valor da chave MUST aparecer só logo depois de gerar e MUST NOT ser guardado.
- **FR-W04**: O endpoint MUST vir de `VITE_OTLP_ENDPOINT` (F4), documentado no README do Web e no `.env.example`, se existir.
- **FR-W05**: Sinais, nível mínimo e o painel de status MUST seguir F1, sem número inventado.

## Success Criteria *(mandatory)*

- **SC-W01**: A aba fica visualmente igual ao recorte do Figma.
- **SC-W02**: Depois de sair da aba, o valor da chave não existe em nenhum armazenamento do navegador (conferir no DevTools > Application).
- **SC-W03**: `npm test` e `npm run build` ficam verdes.

## Assumptions

- Esta branch sai da `LLT-177-nome-unico-produto`. O merge segue a ordem 178, 123, 177 e 179.
