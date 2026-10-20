# LhamaLog Web

Inicialização do frontend para a [LLT-236](https://logviewer2026.atlassian.net/browse/LLT-236), usando TypeScript, React e Tailwind CSS. O Vite inicia o servidor de desenvolvimento, processa os estilos e gera o build.

## Pré-requisitos

- Node.js 24.14 ou superior, com npm, para execução e build locais.
- Docker Desktop com contêineres Linux, para execução pelo Docker.
- GNU Make (opcional), para utilizar os atalhos do Makefile. Os comandos diretos continuam disponíveis sem ele.

## Executar localmente

Instale o [Node.js](https://nodejs.org/en/download), versão 24.14 ou superior. O npm acompanha a instalação. A versão de referência está em `.node-version`.

Na pasta do projeto:

```powershell
npm ci
npm run dev
```

Abra http://localhost:5173. A página deve mostrar “LhamaLog” e “Aplicação iniciada.”. Para parar o servidor, use `Ctrl+C`. A porta é fixa: se estiver ocupada, o servidor informa o erro em vez de escolher outra porta.

`npm run build` verifica os tipos e gera os arquivos em `dist`. `npm run preview` permite conferir esse build localmente.

## Ambiente local (infra/local)

A configuração Docker do frontend fica em `infra/local/`, seguindo a organização do coletor:

```text
infra/local/
  Dockerfile
  compose.yaml
```

Execute os comandos na raiz do repositório. Com GNU Make instalado, use `make infra-up`, `make infra-ps`, `make infra-logs` e `make infra-down`; os equivalentes diretos estão abaixo e na tabela de comandos.

Instale e inicie o [Docker Desktop](https://docs.docker.com/desktop/setup/install/windows-install/), usando contêineres Linux. No Windows, siga os requisitos de WSL 2 da instalação. Confirme com `docker version`: as informações de Client e Server devem aparecer.

Para esta opção, não é necessário instalar Node.js ou executar `npm ci` na máquina: a imagem fornece Node.js 24 e instala as dependências dentro do contêiner.

Na pasta do projeto, construa a imagem e inicie o ambiente em segundo plano:

```powershell
docker compose -f infra/local/compose.yaml up -d --build
```

Para acompanhar os logs:

```powershell
docker compose -f infra/local/compose.yaml logs -f
```

Abra http://localhost:5173. A página deve mostrar “LhamaLog” e “Aplicação iniciada.”. A porta 5173 da máquina aponta para a porta 5173 do contêiner. Execute localmente, pelo Docker ou pelo preview, um de cada vez, pois todos usam a mesma porta.

Use `Ctrl+C` para sair da visualização dos logs; o ambiente continua funcionando. Para parar e remover os contêineres e a rede deste projeto:

```powershell
docker compose -f infra/local/compose.yaml down
```

A imagem permanece disponível depois de encerrar o ambiente. Como o código é copiado para a imagem, depois de alterar arquivos execute novamente `docker compose -f infra/local/compose.yaml up -d --build`; o Compose reconstrói a imagem e atualiza o contêiner quando necessário. A primeira construção precisa de acesso à internet para baixar a imagem e as dependências.

Esta configuração executa o servidor de desenvolvimento do Vite. Não é uma configuração de publicação em produção.

- `infra/local/Dockerfile`: prepara o ambiente Node.js, instala as dependências como usuário `node` e define a inicialização.
- `.dockerignore` (na raiz): evita copiar Git, dependências locais, build, configurações privadas e logs para a imagem. Permanece na raiz porque ela é o contexto do build.
- `infra/local/compose.yaml`: define o serviço frontend, o build e o mapeamento da porta 5173, evitando repetir essas opções no terminal.

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

Sem Make no Windows, use os equivalentes diretos, na pasta do projeto:

```powershell
docker compose -f infra/local/compose.yaml up -d --build
docker compose -f infra/local/compose.yaml logs -f
docker compose -f infra/local/compose.yaml down
npm run build
```

Esses comandos são alternativas independentes: execute a ação desejada, não o bloco inteiro em sequência.

## Comandos

| Ação | Sem make | Makefile |
| --- | --- | --- |
| Rodar localmente | `npm run dev` | `make run` |
| Gerar o build local | `npm run build` | `make build` |
| Subir o frontend pelo Docker | `docker compose -f infra/local/compose.yaml up -d --build` | `make infra-up` |
| Parar o ambiente Docker | `docker compose -f infra/local/compose.yaml down` | `make infra-down` |
| Status dos contêineres | `docker compose -f infra/local/compose.yaml ps` | `make infra-ps` |
| Acompanhar os logs | `docker compose -f infra/local/compose.yaml logs -f` | `make infra-logs` |
| Validar o Compose | `docker compose -f infra/local/compose.yaml config -q` | `make infra-config` |

`make run` e `make build` executam fora do Docker: requerem Node.js e a instalação local das dependências com `npm ci`. Os comandos `infra-*` operam o ambiente Docker; `infra-config` apenas valida a configuração e não inicia contêineres. O Makefile escolhe `npm.cmd` no Windows e `npm` no Linux/macOS automaticamente.

Ao interromper `make infra-logs` com `Ctrl+C`, o Make pode exibir `Error 130`, indicando a interrupção da visualização. O frontend continua rodando até executar `make infra-down`.

## Entrada da aplicação

- `index.html`: contém o elemento onde o React é montado e carrega `src/main.tsx`.
- `src/main.tsx`: inicia o React e renderiza `App`.
- `src/styles.css`: importa o Tailwind; é carregado pelo `main.tsx`.
- `src/app/App.tsx`: componente inicial mínimo, sem funcionalidades de negócio.
- `package.json` e `package-lock.json`: dependências, comandos e versões de instalação.
- `tsconfig.json` e `vite.config.ts`: configuração do TypeScript e do Vite.

O Tailwind está integrado ao Vite pelo plugin `@tailwindcss/vite`, conforme a [documentação oficial](https://tailwindcss.com/docs/installation/using-vite). As classes `p-6`, `text-2xl` e `font-bold` no componente inicial permitem conferir a configuração sem criar telas. No Docker, as dependências são instaladas pelo mesmo `npm ci`; depois de mudanças nas dependências, reconstrua a imagem antes de iniciar o contêiner.

## Estrutura prevista

```text
src/
  main.tsx
  styles.css
  app/
    App.tsx
    layouts/
    providers/
    routes/
  features/
  shared/
    ui/
    hooks/
    services/
    types/
```

## Responsabilidades

- `app/layouts`: estrutura visual compartilhada entre páginas.
- `app/providers`: composição dos provedores da aplicação.
- `app/routes`: configuração da navegação.
- `features`: funcionalidades organizadas por domínio; componentes, hooks, serviços e tipos específicos ficam junto da funcionalidade que os utiliza.
- `shared/ui`: componentes visuais reutilizáveis entre funcionalidades.
- `shared/hooks`: hooks genéricos compartilhados.
- `shared/services`: serviços e integrações de uso comum.
- `shared/types`: tipos compartilhados.

## Organização

A organização é por funcionalidade, separando apresentação, lógica e acesso a dados conforme o código for desenvolvido. `app` compõe as funcionalidades; `shared` não depende de `app` ou de funcionalidades específicas. Uma funcionalidade não importa arquivos de `app`.

As subdivisões de cada funcionalidade serão criadas quando necessárias. Não há exigência de classes ou de um ViewModel para cada componente.

Somente a inicialização mínima está implementada. As pastas vazias da estrutura prevista podem existir localmente, mas não são registradas pelo Git; elas aparecerão no repositório quando receberem arquivos necessários. Os `.gitkeep` foram removidos conforme a revisão.

Páginas de negócio e autenticação não fazem parte desta etapa.

