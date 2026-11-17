# Research: Sessão encerrada pelo Core

## R1. Como classificar uma recusa

- **Decision**: `classifyRejection(status, code, message)` devolve `session` (encerra a sessão) ou `keep` (mantém). `401` → `session`. `403` com `code` ou `message` não vazios vindos do Core → `keep`. `403` sem os dois (o `{"error":"forbidden"}` da segurança, ou sem corpo legível) → `session`. Qualquer outro status → `keep`.
- **Rationale**: o Core da LLT-163 responde 403 de segurança com `{"error":"forbidden"}`, sem `code`. Os 403 de negócio da LLT-168 sempre trazem `code`. Tratar "qualquer `code`" como negócio cobre códigos futuros sem mudar o Web (FR-003), e um 403 sem corpo legível cai em `session` (edge case da spec). A `message` entra por defesa: em 17/11, o cadastro da empresa (LLT-175) e o arquivamento de produto (LLT-123) ainda respondiam 403 só com `message`. A spec 007 do Core (FR-010) acrescenta `not_admin` a esses dois.
- **Alternatives considered**: lista fechada de códigos de negócio (um código novo deslogaria a pessoa por engano); ler `error === "forbidden"` (depende de um texto que o Core não promete estável, e um 403 sem corpo ficaria sem classificação).

- **Detalhe de implementação**: o `ApiError` sempre tem `message`, porque o `apiRequest` usa um texto padrão quando o Core não manda um. Por isso o `ApiError` ganha o campo `serverMessage` (a `message` do corpo do Core, ou vazio), e a classificação usa `serverMessage`, não `message`.

## R2. Saída única com várias recusas ao mesmo tempo

- **Decision**: o módulo guarda a promessa do `signOut` em andamento. Enquanto ela existe, novas recusas de sessão reutilizam a mesma promessa. Ela é limpa quando termina, para uma sessão futura no mesmo SPA poder sair de novo.
- **Rationale**: as telas disparam chamadas em paralelo (Empresa, Equipe). Sem a trava, cada uma chamaria `signOut` e redirecionaria, com avisos repetidos (FR-005, SC-004).
- **Alternatives considered**: controlar por estado React (cada hook teria o seu, e a trava não seria global); `debounce` por tempo (frágil e atrasa a saída).

## R3. Destino de volta seguro

- **Decision**: `safeReturnPath(value)` aceita só um caminho interno: começa com `/`; não começa com `//` nem `/\`; não contém `\`, caractere de controle ou esquema (`:` antes da primeira `/`); tem até 2048 caracteres; não é rota de autenticação (`/sign-in`, `/sign-up`, `/tarefas`, `/organizacoes/nova`). Fora disso, o destino é `/`. O destino gravado é `pathname + search + hash` da tela atual.
- **Rationale**: evita redirecionamento aberto (FR-007, SC-003) e o laço de login para login, que já gerou o cartão vazio corrigido no `ProtectedRoute`.
- **Alternatives considered**: lista de rotas permitidas (quebraria a cada rota nova); `new URL(value, origin)` e comparar a origem (aceita `/\host` em alguns navegadores e é menos previsível).

## R4. Volta pelo `<SignIn>` da Clerk

- **Decision**: a saída vai para `/sign-in?motivo=deslogado&redirect_url=<destino codificado>`. A `SignInPage` lê `redirect_url`, valida com `safeReturnPath` e passa o resultado em `forceRedirectUrl` do `<SignIn>`. Com a sessão já ativa, faz `<Navigate to={destino} replace />` (estende o PR #7). Sem `redirect_url`, o destino é `/`, como hoje.
- **Rationale**: `redirect_url` é o parâmetro que a própria Clerk usa. O `forceRedirectUrl` impede que um valor não validado da URL seja usado pela Clerk. O `fallbackRedirectUrl="/"` atual não volta à rota.
- **Alternatives considered**: guardar o destino no `sessionStorage` (some com outra aba e é mais um estado para limpar); deixar a Clerk ler o `redirect_url` sozinha (ela aceita URLs absolutas da mesma origem, mas não conhece as rotas de autenticação do LhamaLog).

## R5. Onde fica a regra

- **Decision**: o módulo puro `src/shared/services/sessionRedirect.ts` guarda `classifyRejection`, `safeReturnPath`, `signInUrl` e `signOutOnce`. O `useApi` (em `shared`) o usa direto. O `useSessionErrorHandler` (em `features/auth`) passa a ser um wrapper dele para o `TeamPage`.
- **Rationale**: o README proíbe `shared` de depender de `features`. A classificação é a leitura do contrato HTTP do Core, que é assunto de `shared/services`.
- **Alternatives considered**: módulo em `features/auth` injetado no `useApi` (mais indireção, sem ganho); duplicar a regra (a divergência que a spec quer eliminar).

## R6. 403 local sem empresa

- **Decision**: o `ApiError` lançado pelo `useApi` quando não há `orgId` passa a ter `code` `no_organization`. Pela R1, ele é `keep` e nunca encerra a sessão. A tela continua mostrando "Selecione uma empresa para continuar." e o seletor de organização.
- **Rationale**: FR-004. Hoje esse erro tem status 403 sem código e, com a regra nova, deslogaria a pessoa sem motivo.
- **Alternatives considered**: usar outro status (por exemplo, 0) para o erro local (outras telas já comparam `status === 403` para mostrar a mensagem).

## R7. Aviso na criação de organização (FR-008)

- **Decision**: a `CreateOrganizationPage` mostra, acima do `<CreateOrganization>`, um parágrafo `role="note"`: "A empresa nova só dá acesso ao LhamaLog depois da contratação de um plano, que ainda não está disponível. Para testar, use uma empresa já liberada." A criação continua igual.
- **Rationale**: decisão do `/speckit-clarify` de 2026-11-16 (manter com aviso). O texto não promete prazo e explica o 403 que vem depois.
- **Alternatives considered**: esconder a criação (rejeitada no clarify); aviso só no seletor de organização (a pessoa chega à tela de criar por mais de um caminho).

## R8. Testes sem dependências novas

- **Decision**: `tests/session-redirect.test.mjs` cobre `classifyRejection`, `safeReturnPath`, `signInUrl` e `signOutOnce` (com um `signOut` falso que conta chamadas). `tests/api.test.mjs` ganha os casos de 403 com e sem `code` e o `no_organization`. Os componentes são conferidos pelo quickstart.
- **Rationale**: regra da memória do projeto e das instruções do agente: sem @testing-library e jsdom sem aprovação. O `node --test` já importa `.ts`.
- **Alternatives considered**: testes de componente (exigem dependências novas).

## R9. README

- **Decision**: atualizar a seção de autenticação (401 e 403 de segurança saem, 403 de negócio fica, volta à rota) e corrigir o trecho "O nome e a função exibidos continuam fixos", conferindo o Header atual. O item de `features/auth` passa a citar `shared/services/sessionRedirect.ts`.
- **Rationale**: itens da revisão do PR #4 que ficaram para depois da LLT-176.
- **Alternatives considered**: deixar para outra feature (o README continuaria descrevendo o comportamento antigo).
