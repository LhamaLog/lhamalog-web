# Research: Nome único de produto (Web)

## R1. Como reconhecer o 409 de nome em uso

- **Decision**: `isNameInUse(error)` é verdadeiro só quando o erro tem `status` 409 e `serverMessage`, sem os espaços das pontas, igual ao texto fixo do contrato: "Já existe um produto com este nome nesta empresa. Ele pode estar arquivado." O erro é lido pela forma (`status`, `serverMessage`), como o `endsSession` da spec 006.
- **Rationale**: o Core não manda `code` nessa recusa (contrato da `specs/006-nome-unico-produto` do Core). As três recusas 409 de produto (nome, versão e arquivado) têm mensagens diferentes e fixas no contrato. O `serverMessage` é a mensagem que veio no corpo do Core; a `message` do `ApiError` pode ser um texto de reserva do Web. Clarify W1 de 2026-11-20.
- **Alternatives considered**: tratar todo 409 do cadastro como nome (erraria se o Core ganhar outro 409 no cadastro, e na edição há três 409); pedir `code` ao Core antes (atrasaria a LLT-177; fica como pendência, `code: "product_name_in_use"`).

## R2. Onde e como a recusa aparece

- **Decision**: a mensagem do Core vai para o erro do campo `name` (pelos `localErrors`, que toda edição limpa) e o topo mostra "Nada foi salvo: confira o nome do produto." como `ApiError` de status 0. O formulário abre a aba "Informações do produto".
- **Rationale**: o problema é só o nome (US1). Status 0 no aviso evita o botão "Recarregar produto", que a spec 009 mostra para qualquer 409 e que não ajuda nesse caso (US1.3). Usar `localErrors` segue o padrão que o formulário já tem: os erros de campo somem quando a pessoa edita. Texto do aviso: clarify N1 de 2026-11-20.
- **Alternatives considered**: deixar o `ApiError` do Core no topo com `fieldErrors` montado (o botão "Recarregar produto" apareceria, porque o status continua 409); usar "Confira os campos destacados." (não diz que nada foi salvo, que a US1.6 pede).

## R3. Edição com duas partes

- **Decision**: nenhuma mudança no `saveEdits` da spec 009. Um teste confere que, com o nome recusado, só a chamada `PUT /api/products/{id}` acontece.
- **Rationale**: o `saveEdits` envia os dados gerais primeiro e só envia o contexto se a primeira chamada der certo. A recusa de nome acontece na primeira chamada e é relançada, então o contexto não sai (FR-W04). Nada é salvo, nem no rascunho local, porque o formulário só grava o rascunho depois de um salvamento bem-sucedido.
- **Alternatives considered**: enviar o contexto mesmo assim (deixaria o produto com contexto novo e nome antigo, o que a US1.6 proíbe).

## R4. Verificação prévia do nome

- **Decision**: o Web não consulta o nome antes de enviar.
- **Rationale**: o Core não tem consulta de nome disponível, e a regra (maiúsculas, espaços, arquivados) é dele. Adivinhar no Web duplicaria a regra e poderia divergir.
- **Alternatives considered**: comparar com a lista carregada na página de produtos (não inclui os arquivados nem os produtos sem acesso).
