# LhamaLog Web

Estrutura inicial de pastas do frontend para a [LLT-236](https://logviewer2026.atlassian.net/browse/LLT-236).

```text
src/
  app/
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

Esta entrega contém somente a estrutura: sem páginas, componentes implementados, autenticação, rotas funcionais, dependências ou comandos de execução. Os arquivos `.gitkeep` estão vazios e servem apenas para o Git registrar as pastas.
