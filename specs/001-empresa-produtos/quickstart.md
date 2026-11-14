# Execução e testes

Guia único: [quickstart Core](../../../lhamalog-core/specs/001-empresa-produtos/quickstart.md). Contrato: [API](../../../lhamalog-core/specs/001-empresa-produtos/contracts/api.md).

Frontend: Node 26.12.1, `npm ci`, `.env` com `VITE_CLERK_PUBLISHABLE_KEY` e `VITE_API_URL=http://localhost:8080`, `npm run dev`. Docker deste repositório, sem pasta do Core: `docker compose up -d --build` na raiz (React compilado no Nginx). Validar `npm test` e `npm run build`. O guia operacional está no README.

Build e cinco testes aprovados; verificação de interface com identidade local e backend/Mongo reais aprovada. Sessão real Clerk ainda precisa ser conferida.

## P05 — Docker integrado (04/11/2026) — registro histórico

O parágrafo seguinte registra a tentativa daquela data. Não é o procedimento atual. O site sobe pelo `compose.yaml` da raiz deste repositório; não depende de `compose.app.yaml` no Core nem de repositórios lado a lado.

Naquela data, o Dockerfile foi reutilizado pelo compose.app.yaml do Core, com API localhost:8080 e chave publicável opcional no ambiente. Imagem construída e 5 testes aprovados dentro do container Node 26.12.1; Vite respondeu HTTP 200. O usuário pediu para deixar a Clerk sem chave: login e páginas autenticadas continuaram indisponíveis e o aceite real permaneceu pendente.


## Atualização: Clerk local configurada

Em 04/11/2026, o usuário autorizou criar LhamaLog Local e configurar a instância de desenvolvimento no .env ignorado. Tela de login real conferida no localhost:5173. As observações anteriores sobre ausência de chave são históricas; login e operações autenticadas ainda precisam de aceite. Consulte o progresso em lhamalog_docs/planejamento/progresso-empresa-produtos.md.
