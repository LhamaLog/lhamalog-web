# Feature Specification: Validação de PRs

**Feature Branch**: `LLT-285-estudar-git-hub-actions-e-montar-um-exemplo-de-workflow-yml-para-os-testes-base-do-repositorio`

**Created**: 2026-11-19

**Status**: Especificado

**Input**: User description: "LLT-285. Workflow GitHub Actions em PRs para Development que NÃO bloqueia merge (job sempre verde). Verifica: nome da branch LLT-XXX-slug; título do PR e cada commit do PR (menos merges) no formato 'LLT-XXX: descricao'; npm ci, npm test e npm run build com Node 26.12.1. Publica um único comentário no PR, atualizado a cada push, com ✅/❌ por verificação, motivo claro (hash e mensagem do commit, teste e trecho do erro) e um bloco 'Para corrigir com IA' pronto para colar. Permissão pull-requests: write no próprio arquivo. Só a especificação, sem implementar o workflow."

## Clarifications

### Session 2026-11-19

- Q: O mesmo número LLT precisa aparecer na branch, no título e em todos os commits? → A: Branch e título usam o mesmo `LLT-XXX`. Cada commit só precisa do formato `LLT-XXX: descricao`, porque a branch pode herdar commits de outra tarefa.
- Q: Pull request em rascunho e pull request vindo de um fork entram nesta validação? → A: Rascunho entra e recebe o mesmo comentário. Fork fica de fora, porque o time não usa fork.
- Q: Uma edição só do título republica o comentário na hora? → A: Sim. A validação roda em `opened`, `synchronize`, `reopened`, `edited` e `ready_for_review`. Editar o título atualiza o comentário na hora.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver o resultado sem travar o merge (Priority: P1)

Quem abre um pull request para Development recebe um único comentário dizendo o que passou e o que falhou. Esse resultado não impede o merge: a verificação associada termina verde mesmo quando alguma checagem falha.

**Why this priority**: Sem o comentário único e sem a garantia de que o merge continua livre, a história não entrega o que foi pedido. O comentário é o que a pessoa lê; o verde é o que evita transformar o exemplo em uma trava.

**Independent Test**: Abrir um pull request para Development com uma falha conhecida. O merge continua disponível, a verificação termina verde e existe um único comentário com ✅ ou ❌ em cada item.

**Acceptance Scenarios**:

1. **Given** um pull request novo cujo destino é Development, **When** a validação termina, **Then** há um comentário no pull request e a verificação associada está verde.
2. **Given** uma ou mais verificações falharam, **When** a validação termina, **Then** o merge não fica bloqueado por esta validação e a verificação continua verde.
3. **Given** um segundo push no mesmo pull request, **When** a validação roda de novo, **Then** o mesmo comentário é atualizado e não surge um segundo comentário.
4. **Given** um pull request cujo destino não é Development, **When** ele é aberto ou recebe push, **Then** esta validação não publica comentário.
5. **Given** um pull request em rascunho para Development, **When** ele é aberto, **Then** recebe as mesmas verificações e o mesmo comentário de um pull request pronto.
6. **Given** um pull request vindo de um fork, **When** ele é aberto contra Development, **Then** esta validação não roda e não publica comentário.
7. **Given** um comentário já publicado, **When** alguém edita só o título, reabre o pull request ou marca como pronto para revisão, **Then** o mesmo comentário é atualizado sem um push novo.

---

### User Story 2 - Conferir branch, título e commits (Priority: P1)

A validação confere o nome da branch, o título do pull request e a primeira linha de cada commit que não é merge. O comentário marca cada um e, quando um commit falha, mostra o hash completo e a mensagem.

**Why this priority**: O formato LLT é a regra que a pessoa erra com mais frequência. Sem o motivo apontando o commit, o comentário não serve para corrigir.

**Independent Test**: Um pull request com branch fora do padrão, título fora do padrão e um commit fora do padrão, mais um commit de merge. O comentário marca os três primeiros como falha, ignora o merge e cita hash e mensagem do commit ruim.

**Acceptance Scenarios**:

1. **Given** a branch se chama `LLT-285-validacao-de-prs`, **When** a validação confere o nome, **Then** esse item fica ✅.
2. **Given** a branch se chama `LLT-285`, `feature/LLT-285-validacao` ou `LLT-285-Validacao`, **When** a validação confere o nome, **Then** esse item fica ❌ e o comentário mostra o nome encontrado e o formato esperado `LLT-XXX-slug`.
3. **Given** o título é `LLT-285: especifica validação de PRs`, **When** a validação confere o título, **Then** esse item fica ✅.
4. **Given** o título não tem `LLT-`, não tem dois-pontos seguido de um espaço, ou a descrição fica vazia, **When** a validação confere o título, **Then** esse item fica ❌ e mostra o título encontrado.
5. **Given** um commit que não é merge e cuja primeira linha é `LLT-285: ajusta o texto`, **When** a validação confere os commits, **Then** esse commit não aparece como falha.
6. **Given** um commit que não é merge e cuja primeira linha foge do formato, **When** a validação confere os commits, **Then** esse item fica ❌ e o motivo traz o hash completo e a primeira linha da mensagem.
7. **Given** um commit de merge, com mais de um pai, **When** a validação confere os commits, **Then** esse commit não entra na conta, seja qual for a mensagem.
8. **Given** a branch `LLT-285-validacao-de-prs` e o título `LLT-286: outro número`, **When** a validação confere o título, **Then** esse item fica ❌ e mostra os dois números.
9. **Given** a branch `LLT-285-validacao-de-prs` e um commit herdado `LLT-167: convida usuário`, **When** a validação confere os commits, **Then** esse commit passa, porque o formato basta e o número não precisa repetir o da branch.

---

### User Story 3 - Instalar, testar e compilar (Priority: P1)

A validação instala as dependências, roda os testes e compila o aplicativo com Node 26.12.1. Cada um dos três aparece no comentário. Se o teste ou a compilação falha, o motivo traz o comando e um trecho do erro, não o log inteiro.

**Why this priority**: O exemplo existe para mostrar se a base do repositório continua instalando, testando e compilando. Os três resultados precisam aparecer juntos.

**Independent Test**: Uma alteração que faz `npm test` falhar. O comentário marca instalação, teste e compilação em separado; o teste ❌ inclui o comando e um trecho do erro; a verificação do pull request continua verde.

**Acceptance Scenarios**:

1. **Given** dependências, testes e compilação concluem, **When** a validação termina, **Then** `npm ci`, `npm test` e `npm run build` ficam ✅ e a versão de Node usada é 26.12.1.
2. **Given** `npm test` falha, **When** a validação termina, **Then** o item do teste fica ❌, o motivo cita o comando `npm test` e um trecho do erro, e `npm run build` também aparece com o resultado dele.
3. **Given** `npm ci` falha, **When** a validação termina, **Then** o item da instalação fica ❌ com um trecho do erro, e teste e compilação ficam ❌ explicando que não rodaram porque a instalação falhou.
4. **Given** o log de erro é longo, **When** o comentário é publicado, **Then** o trecho cabe no comentário e não cola o log completo.

---

### User Story 4 - Levar a correção para uma IA (Priority: P2)

O comentário termina com um bloco chamado "Para corrigir com IA". A pessoa copia esse bloco e cola numa conversa com uma IA. O bloco já descreve só o que falhou, o que foi encontrado e o que se esperava.

**Why this priority**: O comentário já informa a falha. O bloco evita que a pessoa reescreva o pedido de correção. Sem as checagens, o bloco não tem o que dizer.

**Independent Test**: Um pull request com título inválido e teste falho. O bloco cita esses dois itens, o título encontrado, o formato esperado, o comando `npm test` e o trecho do erro. Não cita as verificações que passaram.

**Acceptance Scenarios**:

1. **Given** alguma verificação falhou, **When** a pessoa abre o comentário, **Then** existe um bloco "Para corrigir com IA" pronto para copiar, com cada falha, o valor encontrado, o valor esperado e, quando houver, o trecho do erro.
2. **Given** todas as verificações passaram, **When** a pessoa abre o comentário, **Then** o bloco diz que não há nada para corrigir.
3. **Given** um novo push muda as falhas, **When** o comentário é atualizado, **Then** o bloco passa a listar só as falhas dessa rodada.

---

### Edge Cases

- Pull request sem commit que não seja merge: a verificação de commits fica ✅, porque não há mensagem a recusar.
- Primeira linha válida e corpo do commit com outro texto: só a primeira linha é conferida.
- `LLT-285:descricao` sem espaço depois dos dois-pontos, ou com mais de um espaço: título ou commit fica ❌.
- Descrição só com espaços: fica ❌.
- Branch `LLT-285-` ou `LLT-285--slug`: fica ❌.
- Dois pushes seguidos: continua existindo um único comentário.
- Falha ao publicar ou atualizar o comentário: a verificação do pull request continua verde.
- Pull request para outro destino: esta validação não comenta.
- Log enorme de teste ou compilação: o comentário guarda um trecho limitado e informa que o trecho foi cortado.
- Branch `LLT-285-validacao-de-prs` com título `LLT-286: ...`: o título fica ❌. Um commit `LLT-167: ...` na mesma branch continua ✅ se o formato estiver certo.
- Pull request em rascunho: entra na validação.
- Pull request de fork: não entra e não recebe comentário.
- Edição só do título, reabertura ou marcação como pronto para revisão: o comentário é atualizado sem push.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A validação MUST rodar em pull requests do próprio repositório cujo destino é Development, nos eventos `opened`, `synchronize`, `reopened`, `edited` e `ready_for_review`. Pull request em rascunho MUST entrar. MUST NOT rodar quando o destino é outro nem quando a origem é um fork.
- **FR-002**: A validação MUST NOT bloquear o merge. A verificação associada MUST terminar verde quando as checagens passam, quando alguma falha e quando o comentário não pôde ser publicado.
- **FR-003**: O nome da branch MUST ser conferido contra `LLT-XXX-slug`: o prefixo `LLT-`, um ou mais dígitos, um hífen e um slug. O slug usa letras minúsculas, dígitos e hífens, não começa nem termina com hífen e não tem hífen duplicado. Fora disso, o item MUST ficar ❌ e MUST mostrar o nome encontrado e o formato esperado.
- **FR-004**: O título do pull request MUST ser conferido contra `LLT-XXX: descricao`: o prefixo `LLT-`, um ou mais dígitos, dois-pontos, um único espaço e uma descrição que, sem espaços nas pontas, não fica vazia. Só a primeira linha do título entra. Fora disso, o item MUST ficar ❌ e MUST mostrar o título encontrado.
- **FR-005**: Cada commit do pull request que não é merge MUST ter a primeira linha no formato `LLT-XXX: descricao`, o mesmo formato do título, sem exigir o mesmo número. Commit de merge é o que tem mais de um pai e MUST ser ignorado. Falha MUST incluir o hash completo e a primeira linha da mensagem.
- **FR-006**: O número `XXX` da branch e o do título MUST ser o mesmo. Título `LLT-286: ...` numa branch `LLT-285-...` MUST ficar ❌ e MUST mostrar os dois números. Os commits MUST NOT precisar repetir esse número: cada um MUST cumprir `LLT-XXX: descricao`, mesmo quando o número veio de outra tarefa.
- **FR-007**: A validação MUST executar `npm ci`, `npm test` e `npm run build` com Node 26.12.1. Cada comando MUST aparecer como item próprio. Se a instalação falha, teste e compilação MUST ficar ❌ dizendo que não rodaram. Se a instalação passa, teste e compilação MUST rodar mesmo quando o outro falha.
- **FR-008**: Falha de `npm test` ou de `npm run build` MUST citar o comando e um trecho do erro. O trecho MUST ser no máximo 30 linhas e no máximo 1500 caracteres. Se o erro for maior, o comentário MUST dizer que o trecho foi cortado.
- **FR-009**: A validação MUST publicar um único comentário no pull request e MUST atualizar esse mesmo comentário em `opened`, `synchronize`, `reopened`, `edited` e `ready_for_review`. MUST NOT criar um comentário novo a cada rodada. O comentário MUST estar em português e MUST marcar cada verificação com ✅ ou ❌.
- **FR-010**: O comentário MUST conter um bloco intitulado `Para corrigir com IA`, em texto que a pessoa copia inteiro. Se houver falha, o bloco MUST listar só as falhas, com o valor encontrado, o valor esperado e o trecho de erro quando existir. Se não houver falha, o bloco MUST dizer que não há nada para corrigir.
- **FR-011**: O arquivo da validação MUST declarar a permissão `pull-requests: write`. MUST NOT declarar permissão mais ampla do que leitura do conteúdo do repositório e escrita de comentário no pull request.
- **FR-012**: Pull request em rascunho MUST receber as mesmas verificações e o mesmo comentário. Pull request de fork MUST ficar de fora e MUST NOT receber comentário desta validação.
- **FR-013**: Editar o título, reabrir o pull request ou marcá-lo como pronto para revisão MUST atualizar o comentário na hora, sem exigir um push. Os eventos cobertos são `opened`, `synchronize`, `reopened`, `edited` e `ready_for_review`.

### Key Entities

- **Pull request**: Destino, branch de origem, título e a lista de commits que o compõem. É onde o comentário aparece.
- **Verificação**: Um item conferido: branch, título, commits, instalação, testes ou compilação. Tem resultado ✅ ou ❌ e, na falha, um motivo.
- **Comentário**: O único texto publicado no pull request. Reúne as verificações e o bloco `Para corrigir com IA`. É substituído no lugar a cada rodada.
- **Commit conferido**: Commit do pull request com um só pai. A primeira linha da mensagem e o hash completo identificam a falha. Commit com mais de um pai não entra.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em 100% dos pull requests para Development cobertos por esta história, a pessoa vê um único comentário com um resultado para cada verificação.
- **SC-002**: Em 100% das rodadas em que alguma verificação falha, o merge continua disponível e a verificação associada termina verde.
- **SC-003**: Em 100% dos commits recusados, o comentário mostra o hash completo e a primeira linha da mensagem.
- **SC-004**: Em 100% das falhas de teste ou de compilação, o comentário mostra o comando e um trecho do erro, nunca o log completo quando ele passa do limite.
- **SC-005**: Em 100% dos pushes, edições de título, reaberturas e marcações como pronto para revisão no mesmo pull request, o comentário existente é atualizado e a contagem de comentários desta validação permanece 1.
- **SC-006**: Em 100% dos comentários, o bloco `Para corrigir com IA` lista exatamente as falhas daquela rodada, ou diz que não há nada para corrigir quando todas passam.

## Assumptions

- O público é quem abre e quem revisa pull requests deste repositório. O comentário é escrito em português.
- `XXX` é uma sequência de um ou mais dígitos, sem exigir tamanho fixo. `LLT-285` cumpre a parte numérica. Zero à esquerda é aceito como dígito.
- O slug da branch é a parte depois de `LLT-XXX-`. Vale o exemplo `validacao-de-prs`. Maiúsculas, espaço, underline e barra não entram.
- A descrição depois de `LLT-XXX: ` pode ter acentos, pontuação e mais de uma palavra. Não há tamanho mínimo além de sobrar texto depois de tirar os espaços das pontas.
- Só a primeira linha do título e só a primeira linha da mensagem de commit são conferidas. O corpo do commit fica livre.
- Commit de merge é definido pelo número de pais, não pelo texto `Merge`.
- Node 26.12.1 é a versão já declarada em `engines` do repositório. A validação usa essa versão exata.
- Os três comandos são os da raiz do repositório, com o lockfile já existente. Não há comando extra de lint nem de publicação.
- O trecho de erro prefere o final da saída, onde a falha costuma aparecer, até 30 linhas ou 1500 caracteres.
- O comentário é reconhecido por um marcador estável e invisível ao leitor, para que a rodada seguinte edite o mesmo comentário em vez de procurar pelo texto visível.
- A permissão de escrever no pull request fica declarada no arquivo da validação. Leitura do código é a única outra permissão necessária para obter a branch e os commits.
- Esta história não cria trava de branch protection, não altera testes, não altera o aplicativo e não publica o site.
- Pull request cujo destino não é Development fica fora. A história não comenta issues soltas nem pushes diretos em Development.
- O número da branch e o do título são o mesmo. O número de um commit herdado pode ser outro, desde que a primeira linha tenha o formato `LLT-XXX: descricao`.
- Rascunho entra. Fork fica de fora, porque o time não abre pull request a partir de fork.
- Além do push, editar o título, reabrir e marcar como pronto para revisão também atualizam o mesmo comentário.
