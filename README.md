# LhamaLog Web

Inicialização do frontend para a [LLT-236](https://logviewer2026.atlassian.net/browse/LLT-236), usando TypeScript e React. O Vite inicia o servidor de desenvolvimento e gera o build.

## Executar localmente

Instale o [Node.js](https://nodejs.org/en/download), versão 24.14 ou superior. O npm acompanha a instalação. A versão de referência está em `.node-version`.

Na pasta do projeto:

```powershell
npm ci
npm run dev
```

Abra o endereço informado no terminal, normalmente http://localhost:5173. A página deve mostrar “LhamaLog” e “Aplicação iniciada.”. Para parar o servidor, use `Ctrl+C`.

`npm run build` verifica os tipos e gera os arquivos em `dist`. `npm run preview` permite conferir esse build localmente.

## Entrada da aplicação

- `index.html`: contém o elemento onde o React é montado e carrega `src/main.tsx`.
- `src/main.tsx`: inicia o React e renderiza `App`.
- `src/app/App.tsx`: componente inicial mínimo, sem funcionalidades de negócio.
- `package.json` e `package-lock.json`: dependências, comandos e versões de instalação.
- `tsconfig.json` e `vite.config.ts`: configuração do TypeScript e do Vite.

## Estrutura prevista

```text
src/
  main.tsx
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

Docker, Makefile, Tailwind, páginas de negócio e autenticação não fazem parte desta etapa.
