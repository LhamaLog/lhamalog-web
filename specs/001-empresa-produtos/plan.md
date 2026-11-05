# Plano frontend Empresa e Produtos

**Branch**: dev/empresa-produtos | 04/11/2026 | [Spec](spec.md)

## Contexto

React 19, TypeScript, Vite, Tailwind e Clerk existentes. Layout AppLayout, Navbar, Input, Button, Card e estados compartilhados. Não adicionar dependências de produção.

## Estrutura

- `src/features/company/`: página, formulário, tipos e acesso à API.
- `src/features/products/`: lista, cadastro, contexto, tipos e acesso à API.
- `src/shared/services/`: transporte Bearer com tratamento de erro.
- `src/app/routes/AppRoutes.tsx`: rotas protegidas /empresa e /produtos.
- `src/app/layouts/`: composição da navegação e seleção de empresa.

## Governança

Spec Kit instalado, constituição ainda template. Instrução atual autoriza implementação integral e Git local, prevalecendo sobre pausas antigas do planejamento. Regras de negócio e contratos ficam no Core. Não alterar componentes de autenticação.

## Validação

Build e testes de transporte, isolamento de respostas após troca de organização e bloqueio de envio duplicado. Verificação visual das páginas, teclado e responsividade. E2E real depende de chave publicável/sessão Clerk e backend configurado. Não criar bypass de autenticação em produção.
