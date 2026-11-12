# Research: Manter perfil do usuário

Decisões fechadas para o aplicativo web. O serviço (Core) é dependência externa; o contrato que ele precisa cumprir está em [contracts/user-profile.md](contracts/user-profile.md).

## 1. Caminho HTTP

- **Decision**: `GET` e `PUT` em `/api/user/profile`, com JSON plano `{ displayName, language, timezone, version }`. O campo do fuso é `timezone`, não `timeZone`. `version` é `null` ou número. A primeira gravação envia `version: null`; as seguintes enviam a versão carregada. `409` é versão desatualizada e a tela recarrega. Sem perfil gravado, o `GET` devolve `displayName: ""`, `language: "pt-BR"`, `timezone: "America/Sao_Paulo"`, `version: null`.
- **Rationale**: O Core é a fonte da verdade e já fechou esses nomes. O caminho continua no estilo `/api/company` e `/api/products`. A versão evita a última gravação silenciosa, no mesmo espírito do `409` da empresa.
- **Alternatives considered**: `/api/profile` e `/api/users/me` (não são o contrato do Core). Envelope `{ profile: {...} }` (rejeitado). Campo `timeZone` em camelCase (rejeitado: o Core usa `timezone`). Última gravação sem versão (rejeitada pelo product owner).

## 2. Cliente HTTP existente

- **Decision**: A tela usa `useApi` (`src/shared/services/useApi.ts`) e `apiRequest` (`src/shared/services/api.ts`) somente quando já existe `orgId`. Sem empresa, o provider não chama `useApi`, porque essa função lança erro nesse caso.
- **Rationale**: Esse cliente já envia `Authorization: Bearer`, exige empresa selecionada, confere se o token pertence a essa empresa, trata `401` com saída para `/sign-in` e lê `message` e `fieldErrors`. A spec pede a mesma recuperação das configurações da empresa.
- **Alternatives considered**: Um segundo cliente sem `orgId`, para editar o perfil antes de escolher empresa. Rejeitado nesta história: mudaria o transporte de toda chamada e a spec assume o mesmo portão. O perfil continua sendo da pessoa; a empresa no token só autoriza o acesso, não vira chave do dado.

## 3. Nome e Clerk

- **Decision**: O web envia `displayName` no `PUT`. Só depois de `serverConfirmedProfile`, chama `user.update` da sessão já aberta (`useUser`), com `splitDisplayName` de `src/features/profile/clerkName.ts`: depois do trim, a primeira palavra é `firstName` e o restante, unido por um espaço, é `lastName`; uma palavra só preenche `firstName` e envia `lastName: ""` para limpar o sobrenome. Em seguida, se `user.update` resolver, chama `user.reload()`. O cabeçalho já mostra o `displayName` do Core antes dessas chamadas. Falha de `user.update` ou de `reload` não desfaz o `PUT` nem troca o nome do cabeçalho. Não há SDK Backend nem segredo.
- **Rationale**: O product owner aprovou a sincronização na sessão do navegador, não uma integração de servidor. O contrato continua com um único `displayName`. A divisão só existe nessa chamada. O cabeçalho não depende da Clerk ter aceitado o nome.
- **Alternatives considered**: Deixar o Core gravar na Clerk e o web só dar `reload` (substituído por esta decisão). Formulário com nome e sobrenome separados (rejeitado). Tratar falha de `user.update` como falha do salvamento (rejeitado: o perfil no Core permanece).

## 4. Idioma da moldura sem traduzir a entrada

- **Decision**: Catálogo local em `src/features/profile/messages.ts`, com as mesmas chaves para `pt-BR` e `en`. Sem `i18next` e sem dependência nova. A tela não oferece `en-US` nem outra etiqueta, ainda que o Core aceite. O `<ClerkProvider>` em `AuthProvider` continua com o localization português já customizado nas telas de entrada. `clerkLocale.ts` expõe um setter: o provider de preferências o chama na carga e no salvamento confirmado quando o idioma aplicado é exatamente `en` (usa `enUS`) ou `pt-BR` (volta ao localization português). Qualquer outra etiqueta não muda o idioma aplicado. O sign-out chama o setter de volta ao português.
- **Rationale**: O seletor de empresa é um widget da Clerk dentro da moldura e precisa acompanhar o idioma, mas as telas `/sign-in`, `/sign-up` e `/tarefas/*` precisam continuar em português. O localization é uma prop do provider já existente, não configuração da instância. O pacote `@clerk/localizations` já está instalado. A customização "organização = empresa" do arquivo `src/features/auth/theme/localization.ts` não é reescrita em inglês nesta história: em English o widget usa o texto padrão `enUS`.
- **Alternatives considered**: Trocar o localization global de forma permanente (traduziria a entrada). Deixar o seletor sempre em português (não cumpriria a moldura). Adotar biblioteca de i18n (dependência nova, fora do necessário para dois idiomas e um conjunto fechado de frases).

## 5. Onde o idioma entra e onde não entra

- **Decision**: Traduzir as frases da tela de perfil e as da moldura escritas por `Navbar`, `Header`/`SignOutButton`, `Footer` e a faixa de `CompanyWorkspace` (empresa selecionada, cadastrar empresa, estado vazio de seleção, miolo de navegação). O cabeçalho recebe o `displayName` aplicado. Formatadores que hoje fixam `pt-BR` passam a receber o idioma aplicado, com padrão `pt-BR` quando o chamador não tem perfil: `formatRevisionDate`, `occurrenceText`, `formatPercent`, `uniqueSorted`, `initials`, `DistributionBars` e `RankingList` nas telas de produto que já os usam. A literal `Sem registro` em `occurrenceText` permanece em português. Não passar o `timezone` do perfil para esses formatadores. Não alterar os textos de `CompanyPage`, `ProductsPage` nem da galeria `/componentes`. A troca dessas frases da moldura em `CompanyWorkspace.tsx` espera a rota de `/perfil` no mesmo arquivo e só corre em paralelo com os formatadores.
- **Rationale**: A spec separa formato (acompanha o idioma) de frase de empresa/produto/ocorrência/entrada (permanece). Os formatadores são funções puras; um argumento com padrão preserva a galeria e os testes atuais. Componentes em `src/shared/ui` não devem importar `src/features/profile`.
- **Alternatives considered**: Traduzir também o botão "Tentar novamente" dentro de `ErrorState` em toda tela de empresa (efeito colateral sobre telas fora do escopo). Aplicar o fuso do perfil no histórico de contexto e no tempo relativo de produto (a spec reserva o fuso à pré-visualização desta tela, porque painel, varredura e e-mail não existem).

## 6. Fuso horário na interface

- **Decision**: `<select>` nativo com `Intl.supportedValuesOf('timeZone')` quando existir. Sem a API, a lista mínima é `UTC`, `America/Sao_Paulo`, `America/Manaus`, `America/Rio_Branco`. Esses quatro, quando presentes, aparecem no topo; o restante em ordem alfabética. O rótulo da opção é o próprio identificador. A pré-visualização usa `Intl.DateTimeFormat` com `dateStyle: 'short'`, `timeStyle: 'short'`, o fuso selecionado no rascunho e o idioma já aplicado (não o idioma ainda não salvo). Atualiza na hora ao trocar o fuso e pelo menos a cada minuto.
- **Rationale**: O perfil não pode reutilizar os rótulos `(UTC-03:00) Brasília` de `companyFields.tsx`: o contrato pede IANA. Não há combobox no projeto e não vale dependência nova para uma lista nativa. A pré-visualização deixa o fuso compreensível sem criar painel.
- **Alternatives considered**: Campo de texto livre (erro fácil e validação pior). Reutilizar o select da empresa (formato incompatível). Aplicar o fuso em todo `Intl.DateTimeFormat` existente (contraria a spec).

## 7. Validação e estados da tela

- **Decision**: Espelhar `CompanyPage`: carga com `AbortController`, erro com nova tentativa, validação local antes do `PUT`, `fieldset` desabilitado e botão em "Salvando..." durante o envio, sucesso em `role="status"`, erro em `role="alert"`, cancelar restaura o baseline, `409` oferece recarregar via novo `GET` e não chama `user.update`, resposta que não ecoa `displayName`, `language` e `timezone` substitui a tela pelo que o serviço devolveu e mostra o aviso de não confirmação. A `version` da resposta substitui a versão local e não precisa ser igual à enviada. `401` e `403` ficam com o cliente existente. Sem `orgId`, o provider não chama `useApi`.
- **Rationale**: A spec pede a mesma recuperação e o mesmo tipo de checagem da empresa. `serverConfirmedSettings` já estabelece o padrão de não confiar num `200` que não devolve o que foi enviado.
- **Alternatives considered**: `PATCH` parcial (o acordo é `PUT` dos três campos). Aplicar o idioma do rascunho antes de salvar (a spec só aplica depois da confirmação).

## 8. Testes automatizados

- **Decision**: `tests/profile.test.mjs` cobre leitura e escrita do contrato (`timezone`, `version`), a confirmação do eco dos três valores sem exigir a mesma `version`, os limites de validação, `splitDisplayName` e a paridade de chaves dos dois catálogos. Um caso de `formatPercent` mostra que `en` e `pt-BR` diferem e que o formatador não exige fuso. Envio único, `user.update`, teclado e troca de empresa ficam no quickstart manual.
- **Rationale**: O script de teste não sobe jsdom nem Testing Library. Inventar renderizador seria dependência e escopo novos.
- **Alternatives considered**: Teste de componente com dependência nova. Deixar o contrato sem teste automático.

## 9. O que não existe neste repositório

- **Decision**: Não há tela de painel (o item do menu não navega), não há agendamento de varredura e não há composição ou envio de e-mail. Esta história não cria nenhum dos três. O fuso fica gravado no Core para quando essas superfícies existirem, em qualquer repositório.
- **Rationale**: Busca no `src/` atual: datas formatadas estão no histórico de contexto da empresa e nos produtos; e-mail aparece só como dado cadastral da empresa e como campo de demonstração. A instrução de produto manda usar o fuso só onde aquelas três superfícies já existirem.
- **Alternatives considered**: Formatar o histórico de contexto no fuso do perfil "para já cumprir o aceite". Rejeitado: aquele histórico não é painel, varredura nem e-mail.

## 10. Rota e entrada

- **Decision**: Rota protegida `/perfil`, no mesmo `CompanyWorkspace` de `/empresa` e `/produtos`. Entradas: item Perfil no grupo Configuração do menu, e o nome da pessoa no cabeçalho vira link para `/perfil`. Breadcrumb da rota: Administração / Perfil, traduzido. Breadcrumbs de seções da empresa continuam com os rótulos portugueses que a tela de empresa já usa.
- **Rationale**: O padrão de rota é português e protegido por `ProtectedRoute`. Duas entradas cobrem "a partir do nome" e "a partir de Configuração" sem inventar outra área de configuração.
- **Alternatives considered**: Query `?secao=perfil` dentro de `/empresa` (mistura perfil da pessoa com configuração da organização). Só o link do cabeçalho (não cumpre o menu de Configuração).
