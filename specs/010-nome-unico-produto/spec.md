# Feature Specification: Nome único de produto (Web)

**Feature Branch**: `LLT-177-nome-unico-produto` (no `lhamalog-web`; sai da `LLT-123-editar-arquivar-produto`, veja o LEIA-ME)

**Created**: 2026-11-19

**Status**: Clarify feito em 2026-11-20

**Input**: lado Web da LLT-177. O erro aparece embaixo do campo "Nome do produto", no estilo de erro de campo da tela do Figma (`C:\Users\Pedro\Desktop\LhamaLog\LLT-produto-telas-web\figma\02-produto-informacoes.png`). O Core está mergeado (PR #7, `specs/006-nome-unico-produto`). O contrato está em `contracts/core-api.md`, que é cópia de leitura.

## Situação atual do Web

Quando o nome já existe, o Core responde 409 com "Já existe um produto com este nome nesta empresa. Ele pode estar arquivado." O Web mostra essa mensagem no topo do formulário e cola a frase genérica de 409 ("Volte à lista e abra o produto novamente."). Isso confunde, porque o problema é só o nome.

Atualização de 2026-11-20 (depois da LLT-123): a frase genérica já não existe no código. Agora o 409 de nome aparece no topo com o botão "Recarregar produto" da spec 009, que também não serve para esse caso.

## Clarifications

### Session 2026-11-20

- Q (W1): O Core não manda `code` nessa recusa, só a mensagem. Como o Web reconhece o 409 de nome? → A: Pela mensagem. Uma função pura compara a mensagem do Core (`serverMessage`) com o texto fixo do contrato, com teste. Fica como pendência para o Core acrescentar `code: "product_name_in_use"` numa tarefa futura. Esta branch não muda o Core.
- Q (N1): Quando o nome é recusado, que texto aparece no topo, além do erro embaixo do campo nome? → A: "Nada foi salvo: confira o nome do produto." Vale para o cadastro e para a edição (US1.6).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Nome repetido aparece no campo nome (Priority: P1)

Como pessoa cadastrando ou editando um produto, quero saber na hora, no próprio campo, que o nome já está em uso, inclusive por um produto arquivado.

**Independent Test**: Cadastre "API Pagamentos". Tente cadastrar "api pagamentos " de novo: o erro aparece embaixo do campo nome, a aba "Informações do produto" fica aberta e os outros dados digitados continuam lá.

**Acceptance Scenarios**:

1. **Given** já existe um produto chamado "API Pagamentos" (ativo ou arquivado), **When** a pessoa cadastra outro com "api pagamentos", **Then** o campo nome mostra "Já existe um produto com este nome nesta empresa. Ele pode estar arquivado.", a aba "Informações do produto" é aberta e nada mais do formulário se perde.
2. **Given** a edição de um produto, **When** a pessoa troca o nome para o de outro produto e salva, **Then** acontece o mesmo, e o produto continua com o nome antigo no Core.
3. **Given** a recusa por nome, **When** a mensagem aparece, **Then** a frase genérica de 409 não aparece e o botão "Recarregar produto" (spec 009) também não.
4. **Given** a pessoa muda o nome depois da recusa, **When** digita, **Then** o erro do campo some.
5. **Given** a edição em que só maiúsculas ou espaços do próprio nome mudaram, **When** salva, **Then** o Core aceita (200) e o Web salva normalmente.
6. **Given** a edição em que o nome e o contexto mudaram e o nome foi recusado, **When** a recusa chega, **Then** o Web não envia o contexto (a ordem é gerais e depois contexto, spec 009) e avisa que nada foi salvo.

### Edge Cases

- **Outros 409:** versão desatualizada e produto arquivado continuam com as mensagens deles (spec 009).
- **Verificação prévia:** não existe consulta de nome disponível no Core. O Web não tenta adivinhar antes de enviar.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-W01**: Uma função pura `isNameInUse(error)` MUST reconhecer o 409 de nome pela mensagem fixa do contrato (W1).
- **FR-W02**: No cadastro e na edição, o 409 de nome MUST virar erro do campo `name`, MUST abrir a aba "Informações do produto" e MUST NOT mostrar a frase genérica nem "Recarregar produto".
- **FR-W03**: Editar o campo nome MUST limpar o erro do campo. O aviso do topo ("Nada foi salvo: confira o nome do produto.") também some (U2, analyze de 2026-11-20).
- **FR-W04**: Na edição com duas partes, a recusa de nome MUST impedir o envio do contexto.

## Success Criteria *(mandatory)*

- **SC-W01**: Em 100% das recusas por nome, o erro aparece no campo nome, sem perder o que foi digitado.
- **SC-W02**: `npm test` e `npm run build` ficam verdes.

## Assumptions

- Esta branch sai da `LLT-123-editar-arquivar-produto`, porque a edição do nome só existe a partir dela.
