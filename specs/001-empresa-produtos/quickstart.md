# Execução e testes

Guia único: [quickstart Core](../../../lhamalog-core/specs/001-empresa-produtos/quickstart.md). Contrato: [API](../../../lhamalog-core/specs/001-empresa-produtos/contracts/api.md).

Frontend: Node 26.12.1, npm ci, .env.local com VITE_CLERK_PUBLISHABLE_KEY e VITE_API_URL, npm run dev. Validar npm test e npm run build.

Build e cinco testes aprovados; verificação de interface com identidade local e backend/Mongo reais aprovada. Sessão real Clerk ainda precisa ser conferida.

## P05 — Docker integrado (04/11/2026)

Dockerfile existente reutilizado pelo compose.app.yaml do Core, com API localhost:8080 e chave publicável opcional no ambiente. Imagem construída e 5 testes aprovados dentro do container Node 26.12.1; Vite responde HTTP 200. Usuário pediu para deixar Clerk sem chave: login e páginas autenticadas continuam indisponíveis e o aceite real permanece pendente. Guia compartilhado em ../../../lhamalog_docs/planejamento/ambiente-local.md.


## Atualização: Clerk local configurada

Em 04/11/2026, o usuário autorizou criar LhamaLog Local e configurar a instância de desenvolvimento no .env ignorado. Tela de login real conferida no localhost:5173. As observações anteriores sobre ausência de chave são históricas; login e operações autenticadas ainda precisam de aceite. Consulte o progresso em lhamalog_docs/planejamento/progresso-empresa-produtos.md.
