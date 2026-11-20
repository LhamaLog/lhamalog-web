# Research: Contexto do produto para IA (Web)

## R1. Leitura do contexto gravado

- **Decision**: `readProductContext(value)` normaliza o `context` vindo do Core: campo ausente ou com tipo errado recebe o valor inicial do Core (descrição vazia, `STANDARD`, `pt-BR`, listas vazias). Os campos antigos (`problemSolved`, `targetAudience`, `differentiators`, `keywords`, `restrictions`) são ignorados.
- **Rationale**: produtos antigos podem ter o contexto incompleto ou no formato antigo. Abrir a aba sem erro e sem perder o que existe é a condição para salvar não apagar nada (SC-W02, US1.7).
- **Alternatives considered**: migrar os campos antigos para os novos (não há correspondência entre eles, e o Core já os ignora); mostrar erro na abertura (bloquearia a edição de produtos antigos).

## R2. Limpeza antes de enviar

- **Decision**: `cleanContext(context)` tira os espaços das pontas, descarta itens vazios e repetidos e mantém a ordem. "Repetido" compara depois do trim, sem diferenciar maiúscula de minúscula, e fica o primeiro digitado.
- **Rationale**: é a mesma regra do Core para as listas, aplicada antes de enviar, para o que a pessoa vê ser o que fica gravado (FR-W03, analyze A1).
- **Alternatives considered**: deixar a limpeza só para o Core (a tela mostraria itens que o Core descarta); diferenciar maiúsculas ("Java" e "java" virariam dois itens de arquitetura).

## R3. Validação local e aba aberta no erro

- **Decision**: `contextFieldErrors(context)` espelha os limites do Core (30 itens; 80 caracteres por item em Arquitetura e 200 em Escopo e Dados sensíveis; 2000 na descrição; idioma válido) e exige a descrição funcional. `firstTabWithError(errors)` abre a primeira aba com erro, na ordem `info`, `context`, `otel`.
- **Rationale**: o Figma marca a descrição funcional como obrigatória, e o Core aceita vazio; o clarify F2 decidiu seguir o Figma. A Personalidade sempre tem valor (Padrão no início), então a regra recai na descrição. Abrir a primeira aba com erro (analyze A2) evita a pessoa salvar sem ver o que falta.
- **Alternatives considered**: deixar o Core recusar (ele não recusa a descrição vazia); abrir sempre a aba de contexto (esconderia erros da aba Informações).

## R4. Erros do Core

- **Decision**: os `fieldErrors` com prefixo `context.` (`context.functionalDescription`, `context.scope[1]`...) vão para o campo certo por `contextErrorFor`. No 409, a tela mostra só a mensagem do Core.
- **Rationale**: o contrato do Core já indica o campo e o item; mapear evita um erro genérico no topo (FR-W05). A frase fixa que o Web acrescentava no 409 confundia a recusa de produto arquivado com a de versão (analyze I1).
- **Alternatives considered**: mostrar todos os erros no topo (a pessoa não saberia qual item corrigir).

## R5. Idiomas da resposta

- **Decision**: o select oferece `pt-BR` (inicial), `en-US` e `es-ES`. Um código já gravado fora dessa lista entra como opção extra e é reenviado sem mudança.
- **Rationale**: clarify W1. O Core aceita outros códigos; descartar um valor gravado por outro cliente seria perda de dado.
- **Alternatives considered**: campo de texto livre (o Figma mostra um select); lista longa de idiomas (sem pedido do produto).

## R6. Reordenar Escopo e Dados sensíveis

- **Decision**: a alça permite arrastar com o mouse (API nativa de arrastar do navegador), e os botões "Mover para cima" e "Mover para baixo" fazem o mesmo pelo teclado. A regra está em `moveListItem`. A ordem é gravada, porque o Core preserva a ordem.
- **Rationale**: clarify W2. Sem dependência nova, e acessível por teclado.
- **Alternatives considered**: biblioteca de arrastar (dependência nova, fora das regras); só os botões (a alça do Figma ficaria sem função).

## R7. Histórico e texto para a IA

- **Decision**: não entram nesta entrega. As rotas continuam no Core.
- **Rationale**: clarify F3. Não há tela no Figma para eles.
- **Alternatives considered**: criar uma tela própria sem Figma (fora da regra "tela igual ao Figma").

## R8. Moldura comum e props de `shared/ui`

- **Decision**: o botão "← Voltar para produtos" no canto direito, as abas com ícone e sublinhado e o rodapé em cartão entram nesta branch. `Input`, `Textarea` e `Select` ganham a prop opcional `hint`; `Textarea` ganha `showCount`; `Button` ganha a variante `secondary`.
- **Rationale**: a aba de contexto só fica igual ao Figma com a moldura (analyze I2, SC-W01). As ajudas cinzas embaixo dos campos e o textarea sem contador são do Figma (analyze U1 e U2). Props opcionais não mudam quem já usa os componentes.
- **Alternatives considered**: deixar a moldura para a LLT-123 (a comparação desta aba com o Figma falharia); criar componentes próprios de produto (duplicaria `shared/ui`).
