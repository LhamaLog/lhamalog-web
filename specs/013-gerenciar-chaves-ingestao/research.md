# Research: Gerenciar chaves de ingestão no Web

Decisões tomadas no plano, a partir do clarify (K1 a K9) e da leitura do código da `origin/Development` (`7a0b243`) e do Core (`specs/010-tokens-ingestao`).

## R1. Onde a seção é montada

- **Decision**: em `ProductForm.tsx`, logo depois do `fieldset` que envolve as abas, quando a aba aberta é a de OpenTelemetry e existe produto salvo.
- **Rationale**: o `fieldset` fica `disabled` com o produto arquivado (FR-W06 da 009). Dentro dele, Revogar ficaria desabilitado, contrariando a K7. Fora dele, a seção controla sozinha o que fica desabilitado. Visualmente continua logo abaixo do cartão (K1).
- **Alternatives considered**: tirar o `disabled` do `fieldset` e desabilitar campo por campo (muda as telas da 009); um `fieldset` aninhado (o HTML não reabilita filhos de um `fieldset` desabilitado).

## R2. Quem gerencia (K6)

- **Decision**: `canManageTokens(access)` em `tokenManagement.ts`: verdadeiro só com o acesso `ready` ou `legacy` e a permissão `INGESTION_TOKENS_MANAGE`. O `ProductForm` lê o `useAccess()` e passa o resultado para o topo e para a seção.
- **Rationale**: a LLT-120 já está na `Development` do Web (`src/features/access`) e do Core (`Permission.INGESTION_TOKENS_MANAGE`, dono e admin). No modo legado, o `accessFallback` da 012 dá a permissão ao admin, como antes. Enquanto carrega, nada aparece, para não mostrar botões que o Core recusaria.
- **Alternatives considered**: manter `canArchive(orgRole)` (deixa a regra da 179 diferente da matriz da LLT-120).
- **Efeito no topo**: o `ApiKeyField` continua com a prop `admin`, mas ela passa a vir da permissão. O nome da prop fica igual, para a mudança ser mínima. Arquivar e desarquivar continuam com o cargo da Clerk, porque isso é da LLT-123 e não entra nesta entrega.

## R3. Sincronia entre topo e seção (K9)

- **Decision**: o `ProductForm` guarda um contador `tokensRevision`. A seção e o `ApiKeyField` recebem o contador e releem a lista quando ele muda. Cada um chama `onTokensChanged()` depois de criar, rotacionar ou revogar.
- **Rationale**: é a mudança mínima no `ApiKeyField`, que já busca a lista sozinho. O valor de uma chave nova continua só no componente que a mostra.
- **Alternatives considered**: subir a lista para o formulário (mexe mais no `ApiKeyField`, que é do Figma).

## R4. Situação e ações

- **Decision**:
  - Selo: `ACTIVE` "Ativa" (verde), `EXPIRING` "Em transição" (amarelo), `EXPIRED` "Expirada" (cinza), `REVOKED` "Revogada" (vermelho).
  - Revogar: só em `ACTIVE` e `EXPIRING`, inclusive no produto arquivado.
  - Rotacionar: só em `ACTIVE` sem `expiresAt`. No arquivado, aparece desabilitado, com a mensagem do Core.
  - Nova chave: desabilitada no arquivado.
- **Rationale**: as regras do contrato do Core (409 para rotacionar revogada, expirada ou em transição; 409 para gerar ou rotacionar no arquivado) e a K7.

## R5. Validação local

- **Decision**: o nome é recortado nas pontas e vai de 1 a 100 caracteres. O período é um inteiro de 1 a 168, e o campo vazio vale 24. Erro no campo, sem chamar o Core.
- **Rationale**: as mesmas regras do Core (400), para o erro aparecer antes da chamada (US3.2, US4.2).

## R6. Corpos das chamadas

- **Decision**: Nova chave `POST .../tokens` com `{ name }`. Rotacionar `POST .../tokens/{id}/rotate` com `{ transitionHours }`, sem `name`, para a chave nova herdar o nome. Revogar `POST .../tokens/{id}/revoke` sem corpo.
- **Rationale**: contrato do Core.

## R7. Nomes das pessoas (K5)

- **Decision**: `peopleIndex(memberships)` monta um mapa `userId → nome` com `memberDisplayName` (nome ou e-mail, como na Equipe). `personLabel(userId, index)` devolve o nome. Sem o id no mapa, ou sem o mapa, devolve "Usuário removido". O e-mail de quem não está na organização nunca aparece, porque não está no mapa.
- **Rationale**: uma só chamada à Clerk, a mesma da Equipe e do "Responsável pelo produto", sem configuração nova.

## R8. Histórico

- **Decision**: lido sob demanda, ao abrir "Histórico" (recolhível), e de novo depois de cada ação enquanto estiver aberto. Ordem do mais recente para o mais antigo, com ordenação estável (a rotação grava "Rotacionada" e "Criada" no mesmo instante, e a ordem do Core é mantida). Rótulos: `CREATED` "Criada", `ROTATED` "Rotacionada", `REVOKED` "Revogada". A chave aparece pelo nome, tirado da lista; sem nome, pelo id curto.
- **Rationale**: evita uma chamada a cada abertura da aba.

## R9. Recusas

- **Decision**: a mensagem do Core aparece na seção, e só o 401 e o 403 sem código encerram a sessão (`endsSession`, spec `006`). No 409 de concorrência, a lista é relida.
- **Rationale**: FR-K08 e o caso das duas abas.
