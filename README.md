# LhamaLog Web

Inicialização do frontend para a [LLT-236](https://logviewer2026.atlassian.net/browse/LLT-236), usando TypeScript, React e Tailwind CSS. O Vite inicia o servidor de desenvolvimento, processa os estilos e gera o build.

## Executar localmente

Instale o [Node.js](https://nodejs.org/en/download), versão 24.14 ou superior. O npm acompanha a instalação. A versão de referência está em `.node-version`.

Na pasta do projeto:

```powershell
npm ci
npm run dev
```

Abra http://localhost:5173. A página deve mostrar “LhamaLog” e “Aplicação iniciada.”. Para parar o servidor, use `Ctrl+C`. A porta é fixa: se estiver ocupada, o servidor informa o erro em vez de escolher outra porta.

`npm run build` verifica os tipos e gera os arquivos em `dist`. `npm run preview` permite conferir esse build localmente.

## Executar com Docker

Instale e inicie o [Docker Desktop](https://docs.docker.com/desktop/setup/install/windows-install/), usando contêineres Linux. No Windows, siga os requisitos de WSL 2 da instalação. Confirme com `docker version`: as informações de Client e Server devem aparecer.

Para esta opção, não é necessário instalar Node.js ou executar `npm ci` na máquina: a imagem fornece Node.js 24 e instala as dependências dentro do contêiner.

Na pasta do projeto, construa a imagem:

```powershell
docker build -t lhamalog-web:dev .
```

Inicie o contêiner:

```powershell
docker run --rm --init --name lhamalog-web-dev -p 127.0.0.1:5173:5173 lhamalog-web:dev
```

Abra http://localhost:5173. A página deve mostrar “LhamaLog” e “Aplicação iniciada.”. A porta 5173 da máquina aponta para a porta 5173 do contêiner. Execute localmente, pelo Docker ou pelo preview, um de cada vez, pois todos usam a mesma porta.

Os logs aparecem nesse terminal. Para parar, use `Ctrl+C` ou, em outro terminal:

```powershell
docker stop lhamalog-web-dev
```

O contêiner é removido automaticamente ao encerrar por causa de `--rm`; a imagem permanece. Como o código é copiado para a imagem, depois de alterar arquivos pare o contêiner, execute novamente o build e inicie outro contêiner. A primeira construção precisa de acesso à internet para baixar a imagem e as dependências.

Esta configuração executa o servidor de desenvolvimento do Vite. Não é uma configuração de publicação em produção.

- `Dockerfile`: prepara o ambiente Node.js, instala as dependências como usuário `node` e define a inicialização.
- `.dockerignore`: evita copiar Git, dependências locais, build, configurações privadas e logs para a imagem.

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

Makefile, páginas de negócio e autenticação não fazem parte desta etapa.
