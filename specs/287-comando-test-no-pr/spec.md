# Feature Specification: Comando test no comentário do PR

**Feature Branch**: `LLT-287-implementar-comando-test-no-comentario-do-pr-para-reexecutar-o-action`

**Created**: 2026-11-19

**Status**: Especificado

**Input**: User description: "LLT-287. Comentário `test` (ou `/test`) num pull request reexecuta a validação da LLT-285, atualiza o mesmo comentário com o marcador e não bloqueia o merge. Só quem tem permissão de escrita. Forks ficam de fora. O comando só vale de verdade depois que o workflow estiver na branch padrão."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Pedir a validação de novo (Priority: P1)

Quem já tem um pull request comenta `test` e a mesma validação roda outra vez no código da ponta da branch. O resultado aparece no comentário que já existia, com ✅ ou ❌ em cada item. O merge continua livre.

**Why this priority**: Sem a reexecução e sem o mesmo comentário, o comando não serve. O verde da verificação é o que impede esta história de virar uma trava de merge.

**Independent Test**: Num pull request do próprio repositório, comentar `test`. A validação roda no commit da ponta da branch, o comentário marcado é atualizado e a verificação associada termina verde, mesmo se algum item falhar.

**Acceptance Scenarios**:

1. **Given** um pull request do próprio repositório com o comentário de validação já publicado, **When** alguém autorizado comenta `test`, **Then** a validação roda de novo no commit da ponta da branch e o mesmo comentário é atualizado.
2. **Given** o mesmo comentário de validação, **When** a reexecução termina, **Then** não surge um segundo comentário de validação.
3. **Given** ainda não existe comentário com o marcador, **When** a reexecução termina, **Then** esse primeiro comentário é publicado, e uma rodada seguinte atualiza o mesmo.
4. **Given** uma ou mais verificações falharam, **When** a reexecução termina, **Then** o merge não fica bloqueado e a verificação termina verde.
5. **Given** um pull request para `main`, **When** a reexecução termina, **Then** o comentário continua só com instalação, testes e compilação.
6. **Given** um pull request para outro destino, **When** a reexecução termina, **Then** o comentário traz as mesmas verificações da validação original para esse destino.

---

### User Story 2 - Só o comando certo, de quem pode (Priority: P1)

O comando é exatamente `test` ou `/test`. Espaços e quebras só nas pontas não atrapalham. Comentário em issue, comentário editado, texto a mais, bot, o próprio publicador da validação e quem não tem permissão de escrita não disparam nada. Pull request de fork também não.

**Why this priority**: Reexecutar instala e roda o código da branch. Sem este filtro, qualquer pessoa dispara essa execução.

**Independent Test**: A detecção do comando e a checagem de permissão podem ser conferidas sem abrir um pull request: `test`, `/test` e os mesmos com espaços nas pontas passam; o resto não. Associação de dono, membro ou colaborador passa; as outras não. Autor bot não passa.

**Acceptance Scenarios**:

1. **Given** o corpo, depois de remover espaços e quebras só das pontas, é `test` ou `/test`, **When** a checagem do comando roda, **Then** o comentário é aceito.
2. **Given** o corpo é `Test`, `testar`, `test por favor`, `t e s t` ou está vazio, **When** a checagem do comando roda, **Then** a validação não reexecuta.
3. **Given** o comentário foi publicado numa issue, e não num pull request, **When** ele chega, **Then** a validação não reexecuta.
4. **Given** um comentário antigo é editado até ficar `test`, **When** a edição é salva, **Then** a validação não reexecuta. Só um comentário novo conta.
5. **Given** o autor é bot, ou é o publicador da própria validação, **When** o corpo é `test`, **Then** a validação não reexecuta.
6. **Given** a associação do autor é dono, membro ou colaborador, **When** o comando é válido, **Then** a reexecução pode seguir.
7. **Given** a associação é contribuinte, primeiro contribuidor ou nenhuma, **When** o comando é válido, **Then** a validação não reexecuta.
8. **Given** o pull request vem de um fork, **When** alguém autorizado comenta `test`, **Then** a validação não reexecuta e o código do fork não é obtido.

---

### User Story 3 - Ver que a reexecução começou e terminou (Priority: P2)

O comentário `test` recebe uma reação de olhos quando a reexecução começa e, ao terminar, uma reação de foguete se tudo passou ou de polegar para baixo se algo falhou ou se o resultado não pôde ser montado.

**Why this priority**: O comentário de validação já diz o detalhe. A reação só confirma, no próprio `test`, que o pedido foi aceito e como terminou.

**Independent Test**: Uma reexecução que passa pede a reação de foguete. Uma que tem item falho, ou que não gera comentário, pede a reação de polegar para baixo. Quem não passou no filtro da história 2 não recebe reação.

**Acceptance Scenarios**:

1. **Given** o comando foi aceito e o pull request não é fork, **When** a reexecução começa, **Then** o comentário `test` recebe a reação de olhos.
2. **Given** o comentário de validação não tem item falho, **When** a reexecução termina, **Then** o comentário `test` recebe a reação de foguete.
3. **Given** o comentário de validação tem algum item falho, ou o resultado não foi montado, **When** a reexecução termina, **Then** o comentário `test` recebe a reação de polegar para baixo.
4. **Given** o comando foi ignorado, **When** a checagem termina, **Then** o comentário não recebe essas reações.

---

### Edge Cases

- ` test `, `/test` com quebra de linha no fim e o mesmo com tabulação nas pontas contam como comando. `Test` não conta.
- Dois comentários `test` seguidos atualizam o mesmo comentário de validação. O último resultado permanece.
- Se a ponta da branch não puder ser obtida, a verificação termina verde, sem deixar o merge bloqueado, e a reação final é de falha se os olhos já foram publicados.
- Comentário de revisão (na linha do diff) não é comando. Só o comentário da conversa do pull request.
- A validação original, disparada ao abrir ou atualizar o pull request, continua igual: mesmo marcador, mesmo texto, sem exigir o comando `test`.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST reexecutar a validação já existente quando um comentário novo na conversa de um pull request for o comando `test` ou `/test`, ignorando espaços e quebras só nas pontas.
- **FR-002**: O sistema MUST obter o código do commit da ponta da branch do pull request e repetir as mesmas verificações, sem uma segunda implementação dessas regras.
- **FR-003**: O sistema MUST atualizar o comentário identificado pelo marcador da validação. MUST NOT publicar um segundo comentário de validação quando esse já existe. Se o marcador ainda não existe, MUST publicar o primeiro.
- **FR-004**: O sistema MUST terminar a verificação verde mesmo quando uma checagem falha, o comentário não é atualizado ou a reexecução é interrompida. Esta história MUST NOT bloquear o merge.
- **FR-005**: O sistema MUST ignorar issues, comentários editados, corpos que não sejam exatamente o comando, autores bot e o publicador da própria validação.
- **FR-006**: O sistema MUST reexecutar só quando a associação do autor for dono, membro ou colaborador, usadas aqui como a permissão de escrita, manutenção ou administração. As demais associações MUST NOT reexecutar.
- **FR-007**: O sistema MUST NOT obter nem executar código de um pull request cujo head esteja fora deste repositório.
- **FR-008**: O sistema MUST reagir ao comentário do comando com olhos ao começar e, ao terminar, com foguete ou polegar para baixo, conforme o resultado.
- **FR-009**: Em pull request para `main`, a reexecução MUST manter a regra de só mostrar instalação, testes e compilação.
- **FR-010**: A documentação MUST registrar que um comando disparado por comentário usa a definição que está na branch padrão (`main`). O comando só funciona de verdade depois que esta alteração chega nessa branch.

### Key Entities

- **Comando**: Comentário novo na conversa do pull request. Vale se, sem espaços nas pontas, o texto é `test` ou `/test`.
- **Autor autorizado**: Pessoa cuja associação no repositório é dono, membro ou colaborador, e que não é bot nem o publicador da validação.
- **Comentário de validação**: O comentário único já definido na validação de pull requests, reconhecido pelo marcador oculto. A reexecução atualiza esse corpo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Num pull request do próprio repositório, uma pessoa autorizada pede a reexecução com um único comentário `test` ou `/test` e vê o comentário de validação atualizado na mesma rodada, sem um segundo comentário de validação.
- **SC-002**: Cem por cento dos comandos fora do texto exato, dos autores sem a associação aceita, dos bots e dos pull requests de fork terminam sem executar o código da branch.
- **SC-003**: A verificação associada à reexecução termina verde em todas as rodadas, inclusive quando há item ❌, então o merge não depende dela.
- **SC-004**: A limitação da branch padrão está escrita na especificação e no README: antes de chegar em `main`, comentar `test` não reexecuta a validação.

## Assumptions

- A validação da LLT-285 já existe: comentário único, marcador `<!-- llt-285-validacao-prs -->`, verificações de branch, título, commits, instalação, testes e compilação, e o atalho só de instalação, testes e compilação quando o destino é `main`. Esta história reexecuta isso; não redefine as regras.
- Dono, membro e colaborador representam, neste repositório, quem pode escrever. Contribuinte e visitante não disparam o comando, mesmo que já tenham commit no projeto.
- A reação de conclusão usa foguete quando não há ❌ e polegar para baixo quando há ❌ ou quando o comentário de validação não foi montado. Não há reação de ✅ ou ❌.
- Olhos e a reação final ficam os dois no comentário. A de olhos não é removida no fim.
- O comando não substitui a validação automática de abertura, push, edição de título, reabertura ou saída de rascunho.
- Workflow disparado por comentário novo usa o arquivo que está na branch padrão do repositório, hoje `main`. Enquanto esta alteração estiver só na branch do pull request ou só em `Development`, comentar `test` não chama esta reexecução. Isso é limite da plataforma, não uma falha da rodada do pull request.
- A reexecução usa as regras de comentário da revisão em que o workflow está publicado. Instalação, testes e compilação rodam no commit da ponta do pull request.
- Não há segredo novo no repositório. O token da execução continua só com leitura do código e escrita de comentário e reação.
