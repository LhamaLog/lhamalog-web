# LhamaLog Web

Frontend do LhamaLog usando TypeScript, React e Tailwind CSS. A base foi iniciada na [LLT-236](https://logviewer2026.atlassian.net/browse/LLT-236); o desenvolvimento atual inclui componentes reutilizáveis e a composição visual de Produtos, relacionados ao planejamento da LLT-237, e o login e logout com Clerk da [LLT-162](https://logviewer2026.atlassian.net/browse/LLT-162). O Vite inicia o servidor de desenvolvimento, processa os estilos e gera o build.

## Empresa e Produtos integrados

As rotas `/empresa` e `/produtos` usam o Core e persistem dados. Há seleção/cadastro de empresa pela Clerk, formulário cadastral/endereço/contexto, cadastro/lista/busca de produtos e edição de contexto. Contextos são opcionais, produtos não têm cota, e acesso é restrito por empresa e vínculo ao produto. O criador recebe acesso automaticamente. Login/logout existentes foram preservados.

[Spec](specs/001-empresa-produtos/spec.md) · [Plano](specs/001-empresa-produtos/plan.md) · [Tarefas](specs/001-empresa-produtos/tasks.md) · [Execução, configuração e testes](specs/001-empresa-produtos/quickstart.md). A API usada pelo navegador fica em `VITE_API_URL` (padrão `http://localhost:8080`). Validação local do código: `npm test` e `npm run build`. O frontend sobe sozinho com `docker compose up -d --build`. Sessão real da Clerk ainda depende da chave publicável da instância.

## Demonstração preservada

A aplicação exige login. Sem sessão ativa, `/` redireciona para `/sign-in`; depois do login, `/` abre `/empresa`. A demonstração **Componentes LhamaLog**, com exemplos e dados ilustrativos, permanece em `/componentes`. Estão implementados:

- Telas de autenticação com componentes da Clerk (ADR_023) e visual do LhamaLog: login, cadastro, etapas pós-login (escolher ou criar organização, configurar MFA e redefinir senha) e criação de organização. Sessão `pending` conta como deslogada (ADR_024, ADR_032).
- Botão **Sair** no Header, ao lado da identificação do usuário. O nome e a função exibidos continuam fixos.

- Campos, botões, checkbox, badges para status e tags, avatar, busca, cartões, paginação e barra de progresso.
- Navbar com recolhimento no desktop e menu em telas pequenas, Header e Footer compostos pelo AppLayout.
- Cartões e lista de produtos, painéis de resumo, ambientes e logs, indicadores e composição responsiva de Produtos.
- Cartões e lista de ocorrências com severidade, tags, data e projeto; busca local, paginação, métricas, intensidade, ranking e composição responsiva de Ocorrências.
- Cabeçalho de Empresa, resumo cadastral com logo e verificação, conclusão do perfil e cartões de dados, contexto de atuação, endereço e preferências, com dados fictícios e ações de edição demonstrativas. O mapa do endereço é ilustrativo, sem geolocalização; as preferências não aplicam configurações ao sistema.
- Componentes compartilhados de métricas, ranking, minigráficos e barras de distribuição.
- Bloco de governança de Empresa com ações demonstrativas de exportação de PDF e sincronização, sem executar essas operações.
- Composição responsiva de Empresa com navegação por links internos para os cartões e rodapé.
- Estados de carregamento, lista vazia, busca sem resultados e falha com ação de tentar novamente.

Na demonstração `/componentes`, a seleção de itens na Navbar apenas troca o destaque. Nas páginas integradas, Empresa e Produto navegam entre `/empresa` e `/produtos`. As buscas de Produtos recebem texto, mas não filtram os produtos. Na composição de Ocorrências, a busca filtra os exemplos locais por título, descrição, projeto e tags. Filtros, cadastro, detalhes, seletores de produto/período e notificações mostram avisos de demonstração. A paginação troca os itens locais exibidos. A recuperação de falha usa um temporizador local, sem requisição ao backend.

As composições visuais de Ocorrências e Empresa estão implementadas com dados ilustrativos. O gráfico de intensidade usa amostras fictícias; seus intervalos reais e as fórmulas das métricas ainda dependem de definição. Em Empresa, a navegação interna mantém os cartões visíveis e leva ao bloco selecionado, com foco e destaque do destino. Acesso ao backend, formulários e regras de negócio permanecem pendentes de suas respectivas etapas e definições. A implementação visual não representa o aceite das tarefas pela equipe.

O detalhamento das entregas e das definições pendentes está em [docs/planejamento-componentes.md](docs/planejamento-componentes.md). As referências visuais em SVG ficam em [docs/referencias](docs/referencias).

## Pré-requisitos

- Git, para clonar o ramo `dev/developer`.
- Node.js 26.12.1, com npm, somente para `npm run dev`, `npm test` e `npm run build` fora do Docker.
- Docker, para o caminho recomendado abaixo. O comando é `docker compose` (plugin v2).
- GNU Make (opcional), para `make up`, `make down`, `make logs` e `make status`. Os comandos diretos continuam disponíveis sem ele.

Este repositório não altera a configuração global do WSL, não grava `.wslconfig` e não impõe limite de memória ao Docker.

### Windows: Docker Desktop

Instale o [Docker Desktop para Windows](https://docs.docker.com/desktop/setup/install/windows-install/) com contêineres Linux. O Desktop já inclui o Compose v2. Confirme com `docker version`: as seções Client e Server precisam aparecer. Não é necessário mudar a memória do WSL para usar este projeto.

### Ubuntu: Docker Engine e Compose

No Ubuntu, use o [Docker Engine](https://docs.docker.com/engine/install/ubuntu/) e o [plugin Compose](https://docs.docker.com/compose/install/linux/), não o Docker Desktop. Depois da instalação, `docker compose version` deve responder e `docker version` deve mostrar Client e Server. Os comandos deste README são os mesmos nos dois sistemas; o que muda é só o modo de instalar o Docker.

## Obter o código

```bash
git clone --branch dev/developer https://github.com/LhamaLog/lhamalog-web.git
cd lhamalog-web
```

O mesmo comando `git` vale no PowerShell. Não é preciso clonar o Core nem manter os repositórios lado a lado.

## Executar localmente

Instale o [Node.js](https://nodejs.org/en/download), versão 26.12.1. O npm acompanha a instalação. A versão de referência está em `.node-version` e também está declarada em `package.json`.

Na pasta do projeto:

```powershell
npm ci
npm run dev
```

Antes do `npm run dev`, crie o `.env` (veja [Variáveis de ambiente](#variáveis-de-ambiente)).

Abra [http://localhost:5173](http://localhost:5173). Sem sessão, a página leva ao login; depois de entrar, abre Empresa, com seleção de organização e formulário integrado. Para parar o servidor, use `Ctrl+C`. A porta é fixa: se estiver ocupada, o servidor informa o erro em vez de escolher outra porta.

`npm run build` verifica os tipos e gera os arquivos em `dist`. `npm run preview` permite conferir esse build localmente.

## Variáveis de ambiente

A aplicação precisa da chave **publicável** da instância da Clerk (Dashboard > API keys) e da origem da API que o navegador consegue acessar. Na raiz do projeto:

```powershell
Copy-Item .env.example .env
```

```bash
cp .env.example .env
```

Preencha `.env` sem aspas:

```text
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_API_URL=http://localhost:8080
```

O Git ignora `.env` e `.env.local`. Use a chave `pk_test_` ou `pk_live_`. A `CLERK_SECRET_KEY` e qualquer valor `sk_` não entram no frontend (ADR_026): o contêiner recusa a subida e o Vite recusa o comando se a variável publicável receber uma chave secreta.

O Compose lê `.env`. O Vite também lê `.env`. Se existir `.env.local`, ele sobrescreve o `.env` apenas para `npm run dev` e `npm run build`; o Compose não lê `.env.local`. Mantenha os dois iguais ou use só `.env`.

Sem a chave publicável, a página não inicia e o console mostra `Falta VITE_CLERK_PUBLISHABLE_KEY`.

### Build do Vite e execução do contêiner

São dois momentos diferentes:

- **Vite (`npm run dev`, `npm run build` e a alternativa `compose.dev.yaml`)**: o Vite lê `.env` quando o processo inicia e grava `import.meta.env.VITE_*` dentro do JavaScript. Isso é configuração de build, inclusive no servidor de desenvolvimento. Mudou a chave ou a URL da API: pare e inicie de novo o `npm run dev`, ou rode `npm run build` outra vez. O bundle local passa a conter a chave publicável. Isso é esperado para uma chave pública; continua proibido colocar segredo nele.
- **Imagem Nginx (`compose.yaml`, o padrão do Docker)**: a construção da imagem não recebe a chave nem a URL. O `.env` fica de fora do contexto (`.dockerignore`). Na subida, o contêiner grava `/config.js` a partir das variáveis de ambiente e o navegador carrega esse arquivo antes do React. Esse valor de execução prevalece sobre o que o Vite tiver incorporado. Mudou só a chave ou a URL: `docker compose up -d` recria o contêiner, sem reconstruir a imagem. Mudou código ou dependência: `docker compose up -d --build`.

`VITE_API_URL` é a origem vista pelo navegador, com esquema, host e porta, sem caminho. O padrão `http://localhost:8080` aponta para a API do Core publicada na mesma máquina. Não use o nome interno de um contêiner: o browser não resolve a rede do Docker.

## Rotas

| Caminho | Tela |
| --- | --- |
| `/` | Redireciona para `/empresa`. |
| `/empresa` | Dados, endereço e contexto da empresa ativa, com sessão. |
| `/produtos` | Cadastro, lista e contexto de produtos acessíveis, com sessão. |
| `/componentes` | Demonstração visual preservada, com sessão. |
| `/sign-in/*` | Login. `?motivo=deslogado` mostra o aviso "Você foi deslogado" (ADR_032). |
| `/sign-up/*` | Cadastro. |
| `/equipe` | Convite de pessoas para a empresa selecionada, só para o administrador. O envio usa o SDK do navegador na sessão já aberta, sem API de convite no Core e sem segredo. |
| `/organizacoes/nova/*` | Criação de organização, sem a etapa de convite da plataforma. Convidar alguém fica em `/equipe`. |
| `/tarefas/escolher-organizacao/*`, `/tarefas/configurar-mfa/*`, `/tarefas/redefinir-senha/*` | Etapas pós-login da Clerk (session tasks). |

Outros caminhos redirecionam para `/`. O `/*` é necessário porque os componentes da Clerk usam sub-rotas, como `/sign-in/factor-one`.

## Docker na raiz

O caminho padrão compila o React e publica os arquivos com Nginx. Não usa o servidor de desenvolvimento do Vite. Não exige checkout do Core, pasta irmã nem rede Docker compartilhada. A API, o MongoDB, o Redis e o OpenObserve opcional continuam no repositório do Core; este Compose só sobe o site.

Crie o `.env` como na seção anterior. Na raiz:

```bash
docker compose up -d --build
```

Com Make: `make up`. Os dois constroem a imagem e iniciam o serviço `web` em segundo plano.

Abra [http://localhost:5173](http://localhost:5173). A porta 5173 da máquina aponta para a porta 8080 do contêiner, onde o Nginx escuta sem privilégio de root (usuário 101). O padrão prende a publicação em `127.0.0.1`. A conferência de saúde é [http://127.0.0.1:5173/healthz](http://127.0.0.1:5173/healthz) e responde `ok`. Rotas do React, como `/empresa` e `/sign-in`, devolvem `index.html` para o navegador conseguir atualizar a página.

Acompanhe os logs com `docker compose logs -f` ou `make logs`. `Ctrl+C` só encerra a visualização. O status fica em `docker compose ps` ou `make status`.

Para parar:

```bash
docker compose down
```

`make down` executa o mesmo comando, sem `-v`. Contêineres e a rede deste projeto saem; volumes nomeados permanecem. A imagem `lhamalog-web:local` também permanece. O site de produção não guarda banco: parar o web não apaga dados do MongoDB, do Redis nem do OpenObserve do Core, porque esses volumes pertencem ao outro projeto. Não use `docker compose down -v` como parada normal; o `-v` apaga volumes nomeados deste Compose (no modo de desenvolvimento, o volume das dependências).

Para ver o efeito de uma alteração de código ou de dependência:

```bash
docker compose up -d --build
```

Para trocar só `VITE_CLERK_PUBLISHABLE_KEY` ou `VITE_API_URL`, edite o `.env` e execute `docker compose up -d`. O Compose recria o contêiner e o `/config.js` é gerado de novo.

A primeira construção precisa de internet para baixar as imagens e as dependências. A versão do Node fica em `NODE_VERSION` no Dockerfile e em `build.args.NODE_VERSION` nos Compose, alinhada a `.node-version` e a `engines.node` de `package.json`. Não há tag `latest`.

Rode um servidor por vez na porta 5173: `npm run dev`, o preview, o Compose padrão ou a alternativa de desenvolvimento.

### Alternativa de desenvolvimento

`compose.dev.yaml` sobe o Vite dentro do contêiner, com o código da pasta montado e as dependências num volume nomeado `dev_node_modules`. A chave publicável e a URL da API entram no ambiente do processo Vite (momento de início do servidor, não o `/config.js` do Nginx).

```bash
docker compose -f compose.dev.yaml up -d --build
```

Com Make: `make dev`. Para parar, preservando o volume de dependências: `docker compose -f compose.dev.yaml down` ou `make dev-down`. Logs: `make dev-logs`. Status: `make dev-status`.

Salvar um arquivo recarrega a página. Se o `package-lock.json` mudar, a próxima subida executa `npm ci` nesse volume. No Docker Desktop para Windows, se a recarga não notar o arquivo salvo, defina `WATCH_POLLING=true` no `.env` e suba de novo. O padrão é `false`.

Não inicie esta alternativa junto com `docker compose up`: as duas usam a porta 5173.

### Core à parte

Suba o Core no repositório dele. Lá ficam a API e, no ambiente local do Core, MongoDB, Redis e o OpenObserve quando estiver configurado. O navegador deste frontend chama `http://localhost:8080` por padrão. Não há rede Docker obrigatória entre os dois. O Core precisa autorizar a origem do site no CORS (`http://localhost:5173` neste padrão). No painel da Clerk, as origens permitidas e as URLs de redirecionamento de login e cadastro precisam incluir essa mesma origem.

### Fora do localhost

Estas notas descrevem o que configurar num host remoto. Elas não declaram o conjunto pronto para produção: nesta entrega a imagem foi exercitada como contêiner local, sem ensaio de TLS público, carga ou proxy real.

- `VITE_API_URL` precisa ser a origem pública da API, por exemplo `https://api.example.com`, porque quem chama é o navegador do usuário.
- O CORS do Core precisa liberar a origem pública do site, com esquema, host e porta.
- No painel da Clerk, inclua essa origem em allowed origins e nas URLs de sign-in e sign-up. Use `pk_live_` na instância de produção e `pk_test_` na de desenvolvimento. A chave secreta continua fora deste repositório.
- O contêiner fala HTTP na porta interna 8080. Termine TLS num proxy reverso na máquina (Caddy, Nginx ou o proxy da plataforma) e encaminhe para `127.0.0.1:5173`. O padrão de `WEB_BIND_ADDRESS` é `127.0.0.1`, de propósito, para a porta não ficar aberta em todas as interfaces.
- Só altere `WEB_BIND_ADDRESS` se outro processo, em outra interface, precisar alcançar o contêiner. Não deixe HTTP sem TLS exposto na internet como se a publicação estivesse encerrada.
- Não é necessário colocar o site e o Core na mesma rede Docker. Se o proxy estiver em outro host, publique só o que esse proxy precisa e mantenha a URL da API apontando para o endereço público da API.

## Instalando o make

Os atalhos `make` abaixo precisam do GNU Make instalado na máquina. Ele é opcional e não é instalado pelo Docker deste projeto. Se `make --version` já funcionar, não é necessário instalar novamente.

Windows (PowerShell):

```powershell
winget install ezwinports.make
# Alternativa, se já utiliza Chocolatey: choco install make
```

Depois feche e abra o terminal e confira com `make --version`.

Linux:

```bash
# Debian/Ubuntu, inclusive no WSL
sudo apt update && sudo apt install -y make
# Fedora
sudo dnf install -y make
# Arch
sudo pacman -S make
make --version
```

Execute somente o comando correspondente à sua distribuição.

macOS: o Make pode ser instalado com as ferramentas de linha de comando da Apple:

```bash
xcode-select --install
make --version
```

Sem Make, use o comando direto correspondente, na pasta do projeto. Não execute o bloco inteiro em sequência:

```bash
docker compose up -d --build
docker compose logs -f
docker compose ps
docker compose down
npm run build
```

## Comandos

| Ação | Sem make | Makefile |
| --- | --- | --- |
| Rodar o Vite na máquina | `npm run dev` | `make run` |
| Testes | `npm test` | `make test` |
| Gerar o build local | `npm run build` | `make build` |
| Subir o site compilado (Nginx) | `docker compose up -d --build` | `make up` |
| Parar, preservando volumes | `docker compose down` | `make down` |
| Status dos contêineres | `docker compose ps` | `make status` |
| Acompanhar os logs | `docker compose logs -f` | `make logs` |
| Validar o Compose sem imprimir o ambiente | `docker compose config --quiet` | `make config` |
| Subir a alternativa Vite | `docker compose -f compose.dev.yaml up -d --build` | `make dev` |
| Parar a alternativa Vite | `docker compose -f compose.dev.yaml down` | `make dev-down` |

`make run`, `make test` e `make build` executam fora do Docker: pedem Node.js e `npm ci` na máquina. `make up` é o site compilado. Os nomes antigos `infra-up`, `infra-down`, `infra-ps`, `infra-logs` e `infra-config` continuam como atalhos dos mesmos comandos de produção. `make config` só valida; não inicia contêiner. O Makefile escolhe `npm.cmd` no Windows e `npm` no Linux/macOS.

Ao interromper `make logs` com `Ctrl+C`, o Make pode exibir `Error 130`. O frontend continua até `make down`. `docker compose config` sem `--quiet` pode imprimir a chave publicável; use `make config`.

## Entrada da aplicação

- `index.html`: contém o elemento onde o React é montado e carrega `src/main.tsx`.
- `src/main.tsx`: inicia o React com o `BrowserRouter`, o `AuthProvider` e as rotas.
- `src/styles.css`: declara a ordem das camadas CSS (incluindo a `clerk`) e importa o Tailwind; é carregado pelo `main.tsx`.
- `src/shared/config.ts`: escolhe a chave publicável e a URL da API. O `/config.js` gravado na subida do Nginx tem prioridade; se vier vazio, vale o valor que o Vite incorporou.
- `src/app/providers/AuthProvider.tsx`: configura o `ClerkProvider` (chave publicável, aparência, textos em pt-BR, URLs de login e das etapas pós-login).
- `src/app/routes/AppRoutes.tsx`: define as rotas e protege a demonstração.
- `src/app/App.tsx`: compõe a página de demonstração, os dados ilustrativos e os estados locais dos exemplos.
- `src/app/layouts/AppLayout.tsx`: reúne Navbar, Header, área de conteúdo e Footer; controla o recolhimento e a abertura do menu móvel.
- `package.json` e `package-lock.json`: dependências, comandos e versões de instalação.
- `tsconfig.json` e `vite.config.ts`: configuração do TypeScript e do Vite.

O Tailwind está integrado ao Vite pelo plugin `@tailwindcss/vite` e é importado em `src/styles.css`. Os componentes usam classes utilitárias para aparência, estados e responsividade. Na imagem de produção, `npm ci` e `npm run build` rodam durante `docker compose build`. Na alternativa de desenvolvimento, um `package-lock.json` novo dispara `npm ci` na subida seguinte.

## Estrutura atual

```text
docs/
  planejamento-componentes.md
  referencias/
compose.yaml
compose.dev.yaml
Dockerfile
infra/
  dev-entrypoint.sh
  nginx/
    default.conf
    docker-entrypoint.sh
    render-config.sh
src/
  main.tsx
  styles.css
  app/
    App.tsx
    providers/
      AuthProvider.tsx
    routes/
      AppRoutes.tsx
    layouts/
      AppLayout.tsx
      Navbar.tsx
      Header.tsx
      HeaderControls.tsx
      Footer.tsx
  features/
    products/
      components/
    occurrences/
      components/
    company/
      components/
    auth/
      auth.css
      assets/
      components/
      hooks/
      theme/
  shared/
    assets/
    ui/
```

## Responsabilidades

- `app/providers`: provedores globais, como o da Clerk.
- `app/routes`: definição das rotas da aplicação.
- `app/layouts`: estrutura visual compartilhada entre páginas.
- `features/auth`: telas e etapas de autenticação com Clerk, proteção de rota, botão Sair, tratamento de 401/403 (`useSessionErrorHandler`), aparência e textos da Clerk. O `auth.css` não usa Tailwind: as regras ficam sob classes `lh-`, e a fonte Poppins vale apenas nessas telas.
- `app/layouts/HeaderControls.tsx`: controles específicos do Header, reunindo estado do sistema, período, notificações e identificação do usuário.
- `features`: funcionalidades organizadas por domínio; componentes, hooks, serviços e tipos específicos ficam junto da funcionalidade que os utiliza.
- `shared/ui`: componentes visuais reutilizáveis entre funcionalidades.
- `shared/assets`: recursos visuais compartilhados, como o logo.
- `docs/referencias`: referências visuais usadas para implementar as interfaces em React.

`shared/services` guarda o cliente HTTP da API. `shared/config.ts` resolve a URL pública e a chave publicável da Clerk. `shared/hooks` reúne hooks usados por mais de uma funcionalidade. `shared/types` continua previsto para quando houver tipos compartilhados fora desses módulos.

## Organização

A organização é por funcionalidade, separando apresentação, lógica e acesso a dados conforme o código for desenvolvido. `app` compõe as funcionalidades; `shared` não depende de `app` ou de funcionalidades específicas. Uma funcionalidade não importa arquivos de `app`.

As subdivisões de cada funcionalidade serão criadas quando necessárias. Não há exigência de classes ou de um ViewModel para cada componente.

Os componentes usam exportações nomeadas e importações relativas, sem extensão `.tsx`. Exemplo:

```tsx
import { Button } from '../shared/ui/Button'
```

`shared/ui` recebe dados e eventos; regras de negócio e acesso a dados pertencem às funcionalidades. Os dados ilustrativos e as interações locais atuais ficam em `App.tsx`.

## Conferência manual

Depois de iniciar a aplicação:

1. Confira os exemplos de campos, botões e indicadores, incluindo foco pelo teclado e controles desabilitados.
2. No desktop, use o botão de três linhas para recolher e expandir a Navbar. O logo leva ao início da página.
3. Em uma janela menor que 768 px, use **Abrir menu**. Selecionar um item fecha o menu; Escape também fecha quando o foco está dentro dele.
4. Nas composições de Produtos e Ocorrências, troque as páginas e redimensione a janela para conferir o empilhamento dos painéis. Em Ocorrências, busque por `deploy` e depois por um termo inexistente para conferir a busca local e o estado sem resultados.
5. Em **Estados compartilhados**, confira carregamento, lista vazia, busca sem resultados e falha. **Tentar novamente** exibe dados ilustrativos após 1,2 segundo.
6. Execute `npm test` e `npm run build` para os testes e a checagem de tipos.
7. Em **Composição de Empresa**, use os links internos por clique ou teclado. Confira o bloco de destino, o destaque ao voltar pelo navegador e o empilhamento dos cartões no celular. As seis ações dos cartões e da governança mostram apenas avisos.
8. Deslogado, abra `/` e confira o redirecionamento para `/sign-in`. Depois de entrar, use **Sair** no Header, por clique ou teclado, e confira a volta ao login.

O build não substitui a conferência visual e de comportamento. `npm test` executa os testes em `tests/`.
