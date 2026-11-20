# Research: Lista, cadastro e edição de produto, arquivar (Web)

## R1. Dados do Figma que o Core não tem

- **Decision**: a tela fica igual ao Figma. Tipo, ambiente, responsável, e-mail da equipe e tags vão para o rascunho local (`sessionStorage`), com a nota "Tipo, ambiente, responsável, e-mail e tags ainda não são salvos no servidor: ficam guardados só neste navegador." Os indicadores sem API mostram estado neutro: status "Sem integração", "Nenhum log recebido", painéis com "—", sem setas de variação. Só o Total do resumo é real.
- **Rationale**: clarify F1. Inventar números enganaria quem usa a tela; esconder os campos deixaria a tela diferente do Figma. A nota evita que alguém ache que o dado está no servidor. O que falta vira a lista de pendências para o Core (T019).
- **Alternatives considered**: esconder o que não tem API (tela diferente do Figma); números de exemplo (engano); esperar o Core (atrasaria a LLT-123).

## R2. Lista com os componentes do Vinicius

- **Decision**: a página monta o `ProductsView` com dados do Core por `toCardProps` e `sidePanelsFrom`. O painel de filtros e os estados de carregando, vazio e erro entram pelas props opcionais `filters` e `listState`. O `ProductCard` ganha `onOpen` (o cartão inteiro abre a edição, com a seta do Figma) e `archivedLabel`. A `ProductTable` é apagada.
- **Rationale**: os componentes da demonstração já batem com o Figma (`FIGMA-x-WEB-x-CORE.md`, seção 1). Props opcionais mantêm a `/componentes` funcionando. O clique usa um botão no nome com a área estendida ao cartão, para não colocar conteúdo de bloco dentro de um `<button>`.
- **Alternatives considered**: refazer a lista do zero (duplicaria o trabalho do Vinicius); mexer na branch do Vinicius (fora das regras).

## R3. Paginação e Total

- **Decision**: 6 produtos por página. A lista ativa é sempre carregada, e a situação Arquivados monta um componente que busca `GET /api/products?archived=true`. O Total do resumo é sempre o número de produtos ativos.
- **Rationale**: o Figma mostra "Mostrando 1 - 6 de 24" (analyze A1). A US1.3 pede o Total de ativos mesmo vendo os arquivados. Montar a busca de arquivados só quando é pedida evita uma chamada a mais no caso comum.
- **Alternatives considered**: trocar o caminho da mesma busca (o Total piscaria com o número dos arquivados enquanto a lista recarrega).

## R4. Opções das caixas de seleção

- **Decision**: Tipo usa as opções dos cartões do Figma ("Aplicação web", "API / Serviço", "Aplicativo", "Microsserviço", "Job / Batch") mais "Outro". Área usa as áreas que a empresa já usa nos produtos ativos, mais "Outro"; sem nenhuma, vira campo de texto. Responsável usa as pessoas da organização (`organization.getMemberships`, a mesma chamada da Equipe); sem acesso à lista, vira campo de texto. Ambiente oferece Produção, Homologação e Desenvolvimento.
- **Rationale**: clarify N1, N2 e N3. Seguir o Figma; não criar chamada nova à Clerk; o Core aceita qualquer texto de até 200 caracteres na área.
- **Alternatives considered**: manter as opções antigas do formulário (não batem com o Figma); lista fixa de áreas (cada empresa tem as suas).

## R5. Validação do cadastro e da edição

- **Decision**: `formFieldErrors` exige, no cadastro, nome, tipo, ambiente, área e responsável, e confere os limites do Core e o formato do e-mail. Na edição, tipo, ambiente e responsável não bloqueiam.
- **Rationale**: um produto salvo em outro navegador não tem rascunho local; bloquear a edição obrigaria a pessoa a preencher campos locais só para salvar o contexto (U3).
- **Alternatives considered**: exigir sempre (bloquearia a edição de produtos antigos); não exigir nunca (o Figma marca como obrigatórios no cadastro).

## R6. Tags

- **Decision**: até 10 tags, cada uma com até 30 caracteres; espaços das pontas saem; repetidas (sem diferenciar maiúsculas) são ignoradas. Pílulas azuis e "+ Adicionar" tracejado, como no Figma.
- **Rationale**: nem a spec nem o Figma definiam limites; os números evitam um rascunho sem tamanho (U4). A regra de repetidas é a mesma das listas do contexto (spec 008).
- **Alternatives considered**: reaproveitar o `ChipListField` da 178 (visual diferente do Figma das tags e limites próprios do contexto).

## R7. Salvar a edição por partes

- **Decision**: `saveEdits` compara com o produto como o Core o devolveu por último (`changedParts`) e envia só o que mudou: `PUT /api/products/{id}` para os dados gerais e `PUT .../context` para o contexto, nessa ordem, com a `version` que a primeira chamada devolveu. Sem mudança no servidor, não chama o Core. Se os gerais salvam e o contexto é recusado, o resultado é parcial: a tela mostra "Os dados gerais foram salvos, mas o contexto não. Confira e salve de novo." e guarda a `version` nova.
- **Rationale**: FR-W04 e clarify W1. Enviar só o que mudou evita recusas de versão desnecessárias; a ordem fixa torna o salvamento parcial previsível.
- **Alternatives considered**: enviar sempre as duas partes (409 desnecessário e histórico de contexto sem mudança); contexto primeiro (a recusa de nome da LLT-177 viria depois do contexto já salvo).

## R8. 409 de versão

- **Decision**: a tela mostra a mensagem do Core e o botão "Recarregar produto", que busca o produto de novo e põe os dados atuais do servidor no formulário, mantendo o rascunho local.
- **Rationale**: US3.6. É o mesmo padrão "Recarregar dados" de Empresa e Perfil. O rascunho local não está no servidor, então não há o que recarregar dele.
- **Alternatives considered**: voltar para a lista (perderia o que foi digitado nas outras abas).

## R9. Arquivar e só leitura

- **Decision**: "Arquivar" e "Desarquivar" ficam no rodapé da edição, só para quem tem `orgRole` admin. A confirmação usa `window.confirm`. Depois de confirmar, `setArchived` envia `POST .../archive` ou `.../unarchive` com a `version`, e a tela volta para a lista com a mensagem. O produto arquivado abre com o aviso "Este produto está arquivado. Desarquive para editar.", os campos desabilitados nas três abas e sem Salvar.
- **Rationale**: clarify F6 e W2 (mesmo critério do Core; com a LLT-120 vira `can('PRODUCTS_ARCHIVE')`). Não há diálogo em `shared/ui`, e a Equipe já usa `window.confirm` (analyze A2). Arquivar o que já está arquivado responde 200 e é tratado como sucesso.
- **Alternatives considered**: criar um componente de diálogo (fora do escopo e sem Figma); mostrar os botões para todos e deixar o Core recusar (a pessoa veria um botão que não pode usar).

## R10. Campos antigos do rascunho

- **Decision**: Criticidade, Projeto, Aplicação principal, Nível de log e Produto ativo saem da tela, do tipo e do rascunho. `normalizeProductDraft` ignora essas chaves; o `team` antigo não é migrado para o `owner`. A chave do armazenamento continua `v1`.
- **Rationale**: não estão no Figma (US2.2). `team` (equipe) e `owner` (pessoa) são coisas diferentes no Figma (analyze A3). Manter a chave preserva o resto do rascunho (tipo, ambiente, OpenTelemetry).
- **Alternatives considered**: chave `v2` (perderia o OpenTelemetry e o tipo já salvos); migrar `team` para `owner` (dado errado no campo).
