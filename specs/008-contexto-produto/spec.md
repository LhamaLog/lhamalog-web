# Feature Specification: Contexto do produto para IA (Web)

**Feature Branch**: `LLT-178-contexto-produto` (no `lhamalog-web`, a partir da `Development`)

**Created**: 2026-11-19

**Status**: Draft (pré-preenchida; passa por clarify e analyze no Claude Code)

**Input**: lado Web da LLT-178. Duas fontes:

- **Tela:** o Figma final, recorte `C:\Users\Pedro\Desktop\LhamaLog\LLT-produto-telas-web\figma\03-produto-contexto-ia.png`. A comparação está em `C:\Users\Pedro\Desktop\LhamaLog\LLT-produto-telas-web\figma\FIGMA-x-WEB-x-CORE.md`, seção 3.
- **API:** o Core mergeado (PR #9). O contrato está em `contracts/core-api.md`, que é cópia de leitura.

**A tela do Figma bate com o Core:** os seis campos são os mesmos.

## Por que é urgente

O formulário atual ainda usa os campos antigos (`problemSolved`, `targetAudience`, `differentiators`, `keywords`, `restrictions`). O Core ignora esses campos. Por isso, salvar pela tela atual grava os campos novos vazios, apaga o contexto e cria uma versão vazia no histórico.

## Clarifications

### Session 2026-11-19

- Q: (F2) O Web exige Descrição funcional e Personalidade, como o Figma, se o Core aceita vazio? → A: Seguir o Figma. A Personalidade sempre tem valor (Padrão no início), então na prática a regra recai sobre a Descrição funcional, que o Web exige no cadastro e ao salvar o contexto de um produto existente. O Core continua aceitando vazio.
- Q: (F3) O histórico de versões e o texto para a IA, que existem no Core e não estão no Figma, entram nesta entrega? → A: Não fazer agora. Ficam pendentes até haver tela no Figma; as rotas continuam no Core.
- Q: (W1) Quais idiomas o select "Idioma da resposta" oferece? → A: Português (Brasil) `pt-BR`, English (US) `en-US` e Español `es-ES`, com `pt-BR` como inicial. Se o produto já tiver outro código gravado, ele aparece como opção extra e é mantido.
- Q: (W2) O que a alça de arrastar de Escopo e Dados sensíveis faz? → A: Reordena os itens. Arrastar com o mouse e, pelo teclado, os botões "Mover para cima" e "Mover para baixo". A ordem é gravada (o Core preserva a ordem). Sem dependência nova.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Aba "Contexto para IA" igual ao Figma, gravando no Core (Priority: P1)

Como pessoa com acesso ao produto, quero preencher o contexto para IA na tela do Figma e ter tudo gravado no Core.

**Independent Test**: Compare a aba com `03-produto-contexto-ia.png`: mesmos campos, ordem, textos de ajuda, lateral e rodapé. Preencha, salve, reabra: tudo volta igual.

**Acceptance Scenarios**:

1. **Given** a aba "Contexto para IA", **When** abre, **Then** mostra, como no Figma:
   - o cartão "Contexto para IA", com o subtítulo "Descreva o produto para a IA interpretar melhor os logs e as análises.";
   - **Descrição funcional \*** (textarea), com a ajuda "Explique o que o produto faz e como ele funciona, para a IA entender o contexto dos logs.";
   - **Personalidade \*** (controle segmentado Simples, Padrão, Detalhado, com Padrão inicial), com a ajuda "Define o nível de detalhe das respostas da IA.";
   - **Idioma da resposta** (select, inicial Português (Brasil)), com a ajuda "Idioma usado nas análises da IA.";
   - **Arquitetura** (chips com ×, e o botão + para adicionar), com a ajuda "Linguagem, framework, banco de dados e protocolo usados no produto.";
   - **Escopo / Lista** e **Dados sensíveis** (itens com alça, × e "+ Adicionar item"), com as ajudas "Liste o que está dentro do escopo. A IA usa como referência." e "A IA evita expor esses dados nas análises.";
   - a lateral "Sobre o contexto para IA" (com "O que informar:") e "Boas práticas", com os textos do Figma;
   - o rodapé "Este cadastro do produto ajuda a IA a identificar melhor o projeto." com Cancelar e o botão principal ("Cadastrar produto" no cadastro e "Salvar alterações" na edição, conforme F7 em `FIGMA-x-WEB-x-CORE.md`).
2. **Given** uma lista, **When** a pessoa adiciona um item, **Then** ele entra no fim. Item vazio ou repetido não entra. "Repetido" compara depois do trim, sem diferenciar maiúscula de minúscula ("Java" e "java" são o mesmo item); fica o primeiro digitado. Em Escopo e Dados sensíveis, arrastar pela alça ou usar "Mover para cima"/"Mover para baixo" muda a ordem, e a ordem nova é a que vai para o Core (W2).
3. **Given** o limite (30 itens; 80 caracteres por item em Arquitetura e 200 em Escopo e Dados sensíveis), **When** a pessoa passa do limite, **Then** aparece "Limite de 30 itens." ou "O item excede o limite de N caracteres." e o item não entra.
4. **Given** Descrição funcional vazia (F2), **When** a pessoa salva, **Then** o Web recusa no campo com "Informe a descrição funcional.", sem chamar o Core. Os erros de todas as abas ficam marcados, e abre a primeira aba com erro, na ordem das abas: se o erro for só do contexto, abre a aba de contexto.
5. **Given** um produto novo, **When** a pessoa cadastra, **Then** o `POST /api/products` leva o `context` no formato novo.
6. **Given** um produto existente, **When** a pessoa salva, **Then** o Web envia `PUT /api/products/{id}/context` com `{context, version}`.
7. **Given** um produto antigo cujo contexto veio sem algum campo, **When** a aba abre, **Then** os campos ausentes aparecem com os valores iniciais, sem erro. Um `responseLanguage` gravado fora da lista (W1) aparece como opção extra no select e é reenviado sem mudança.
8. **Given** o Core responde 400 com `fieldErrors` (`context.functionalDescription`, `context.architecture[0]`...), **When** chega, **Then** o erro aparece no campo certo.
9. **Given** o Core responde 409, **When** chega, **Then** só a mensagem do Core aparece (versão desatualizada ou "Produto arquivado não pode ser editado."), sem texto fixo acrescentado pelo Web.

### Edge Cases

- **Produto arquivado:** a gravação é recusada com 409 e a mensagem do Core aparece. O modo só leitura de arquivado é da LLT-123.
- **Recusas de sessão:** 401 e 403 sem código seguem a spec 006 do Web e não mostram erro.
- **Troca de empresa:** descartar a resposta (`AbortController`).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-W01**: O tipo `ProductContext` MUST ter só os campos do Core. Os campos antigos MUST sair de `src/features/products` e dos testes de produto.
- **FR-W02**: Uma função pura `readProductContext` MUST normalizar o `context` lido, com os valores iniciais do Core para o que faltar.
- **FR-W03**: A validação local MUST espelhar os limites do Core e exigir a descrição funcional (F2). Antes de enviar, MUST tirar espaços das pontas e descartar itens vazios e repetidos, mantendo a ordem.
- **FR-W04**: O cadastro MUST enviar o `context` novo no `POST`. A edição MUST usar `PUT .../context` com `version`.
- **FR-W05**: Os `fieldErrors` com prefixo `context.` MUST aparecer no campo correspondente.
- **FR-W06**: Layout, textos, ordem dos campos, lateral e rodapé MUST seguir `03-produto-contexto-ia.png`.
- **FR-W07**: Histórico e texto para a IA MUST NOT entrar nesta entrega (F3). Ficam na lista de pendências de tela no Figma.
- **FR-W08**: O select "Idioma da resposta" MUST oferecer `pt-BR` (inicial), `en-US` e `es-ES`, e MUST manter como opção extra um código já gravado fora dessa lista (W1).
- **FR-W09**: Escopo e Dados sensíveis MUST permitir reordenar por arrastar e pelos botões "Mover para cima"/"Mover para baixo", acessíveis por teclado, sem dependência nova (W2).

## Success Criteria *(mandatory)*

- **SC-W01**: A aba fica visualmente igual ao recorte do Figma (conferência lado a lado no roteiro manual).
- **SC-W02**: Salvar pela tela nunca apaga campos já gravados no Core.
- **SC-W03**: `npm test` e `npm run build` ficam verdes.

## Assumptions

- Esta branch não mexe no **conteúdo** das abas "Informações do produto" (LLT-123) e "Integração OpenTelemetry" (LLT-179), nem na lista.
- A moldura comum às três telas do Figma entra nesta branch, porque a aba de contexto só fica igual ao Figma com ela (SC-W01). A moldura é: o botão "← Voltar para produtos" no canto superior direito, as abas com ícone e sublinhado e o rodapé em cartão (texto "Este cadastro do produto ajuda a IA a identificar melhor o projeto.", Cancelar e o botão principal com ✓). Com isso, a aparência dessas partes muda também nas outras duas abas.
- Os componentes de `shared/ui` só ganham props opcionais (`hint` e `showCount`). Quem não passa essas props não vê mudança nenhuma.
