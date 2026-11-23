# Research: Aba de integração e Chave de API (Web)

## R1. Uma única "Chave de API" sobre vários tokens

- **Decision**: a aba mostra uma chave, como o Figma. "A chave atual" é o token `ACTIVE` mais recente de `GET /api/products/{id}/tokens`. Sem nenhum, "Gerar nova" envia `POST .../tokens` com o nome do produto (cortado em 100 caracteres). Com um, "Gerar nova" pede confirmação e envia `POST .../tokens/{tokenId}/rotate` com `{transitionHours: 24}`. Listar, revogar e histórico não entram.
- **Rationale**: clarify F5. O Figma não tem tela de vários tokens; a rotação com transição evita derrubar as aplicações que já usam a chave. O token `EXPIRING` mais recente é a chave anterior em transição, e a ajuda mostra quando ela para (US2.6). Se houver mais de um `ACTIVE` (criados por outro meio), usar o mais recente é previsível.
- **Alternatives considered**: tela com a lista de tokens (sem Figma); "Gerar nova" sempre criando um token novo sem rotacionar (deixaria tokens antigos ativos para sempre).

## R2. O valor da chave só em memória

- **Decision**: o valor (`secret`) vive só no estado do `ApiKeyField`. Ele é apagado quando o componente sai da tela (troca de aba, de produto ou recarga). Nunca vai para `sessionStorage`, `localStorage`, console, URL, estado global nem para o exemplo da configuração, que usa `<sua-chave>`.
- **Rationale**: o Core mostra o valor uma única vez e guarda só o hash; qualquer cópia no navegador seria um vazamento possível (FR-W03, SC-W02). Montar o exemplo numa função pura que não recebe a chave torna a regra testável.
- **Alternatives considered**: guardar no rascunho local para a pessoa ver de novo (contraria o Core e a segurança); colocar a chave real no exemplo para facilitar (o exemplo é copiado para outros lugares e fica na tela).

## R3. Endpoint de recebimento

- **Decision**: `VITE_OTLP_ENDPOINT`, opcional, lido como o `VITE_API_URL`: no `npm run dev` e no build pelo Vite, e no Docker pelo `/config.js` gerado por `infra/nginx/render-config.sh`. Precisa ser `http` ou `https`, sem usuário, senha, espaço ou aspas; a barra final sai. Vazio, a aba mostra "Endereço ainda não configurado.".
- **Rationale**: clarify F4 e N4. O endereço é do Coletor, não do Core, e não é segredo. Valer nos dois modos evita que o Docker mostre "não configurado" com o valor no `.env`.
- **Alternatives considered**: pedir ao Core uma rota com o endereço (rota nova no Core, fora do escopo); fixar o endereço no código (muda por ambiente).

## R4. Cabeçalho do exemplo

- **Decision**: `OTEL_EXPORTER_OTLP_HEADERS=Authorization=Bearer%20<sua-chave>` nas variáveis de ambiente, e o mesmo valor em `-Dotel.exporter.otlp.headers` no Java.
- **Rationale**: clarify N1. O Coletor lê o token do cabeçalho `Authorization` com o prefixo `Bearer` (`BearerToken.java`) e da metadata `authorization` no gRPC (`BearerTokenInterceptor.java`). O Figma mostra `x-api-key`, que seria recusado. A especificação do OpenTelemetry pede os valores dessa variável codificados como URL, por isso o espaço vira `%20`.
- **Alternatives considered**: seguir o Figma (`x-api-key`), que não funciona sem mudar o Coletor.

## R5. Sinais a enviar

- **Decision**: Logs aparece sempre marcado e desabilitado ("Obrigatório"). Traces é opcional e vai para o rascunho local; marcado, o exemplo leva `OTEL_TRACES_EXPORTER=otlp`, desmarcado, `none`. Métricas aparece desabilitado, com "O LhamaLog ainda não recebe métricas.", e o exemplo sempre leva `OTEL_METRICS_EXPORTER=none`.
- **Rationale**: clarify F1 e N2. O Coletor só recebe `/v1/logs` e `/v1/traces`; com métricas ligadas, a aplicação teria erros 404. O Java agent manda métricas por padrão, então o `none` explícito é necessário.
- **Alternatives considered**: esconder Métricas (tela diferente do Figma); deixar habilitado (erros na aplicação de quem marcar).

## R6. Nível mínimo de log

- **Decision**: o controle DEBUG, INFO, WARN e ERROR (INFO inicial) vai para o rascunho local, com a nota de F1. O exemplo não leva o nível.
- **Rationale**: o Coletor e o Core não usam esse valor, e o OpenTelemetry não tem uma variável padrão de nível mínimo que valha para todas as linguagens. Colocar uma variável específica no exemplo prometeria um filtro que não existe.
- **Alternatives considered**: variável própria do LhamaLog no exemplo (ninguém a lê hoje).

## R7. Nome do serviço

- **Decision**: `serviceName(nome)` passa o nome do produto para minúsculas, tira os acentos e troca o que não for letra ou número por hífen, sem hífens repetidos nem nas pontas, com até 63 caracteres. Sem nome, `meu-servico`.
- **Rationale**: clarify N3. É o que o Figma mostra ("gateway-de-pagamentos"), e o formato é seguro em variáveis de ambiente e no Kubernetes.
- **Alternatives considered**: usar o id do produto (ilegível nos painéis de observabilidade).

## R8. Painel "Status da conexão" e quem vê o quê

- **Decision**: com chave ativa, o selo é "Aguardando primeiro log"; sem chave, "Sem integração". "Último log recebido" e "Logs nas últimas 24h" mostram "—". "Sinais ativos" mostra os sinais marcados (Logs, e Traces se marcado). "Testar conexão" fica desabilitado, com "Disponível quando a verificação existir no servidor". Quem não é admin não lista os tokens, porque o Core exige admin; para essa pessoa, o selo mostra "—" e a chave aparece mascarada, sem botões, com "Somente donos e administradores podem gerar a chave.".
- **Rationale**: clarify F1 e W1. Não há API de status nem de último log. Chamar a lista de tokens sem ser admin daria 403 `not_admin` em toda abertura da aba.
- **Alternatives considered**: mostrar "Sem integração" para quem não é admin (seria falso quando há chave).

## R9. Copiar

- **Decision**: `navigator.clipboard.writeText`. Se o navegador recusar, o campo fica selecionado e aparece "Copie manualmente com Ctrl+C.".
- **Rationale**: edge case da spec. A API funciona em `localhost` e em `https`, que são os ambientes do Web.
- **Alternatives considered**: `document.execCommand('copy')` (obsoleto).
