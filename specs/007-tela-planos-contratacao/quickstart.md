# Quickstart: Tela de planos e contratação

Contrato em [contracts/core-billing.md](contracts/core-billing.md).

## Verificações automáticas

```powershell
npm test
npm run build
```

## Roteiro manual

Pré-requisitos: o Core da spec 010 no ar (perfil local, `docker compose up -d --build` no lhamalog-core) e o Web com o `.env` preenchido (`npm run dev`). Use uma organização **nova**, que não esteja em `DEV_TENANT_CLERK_ORG_ID`.

| # | Passo | Esperado |
|---|---|---|
| P1 | Entrar com a organização nova | o Web abre `/plano` sozinho, com o aviso de empresa sem plano; sem "Você foi deslogado" |
| P2 | Conferir a tela | planos com preço em reais; nome da empresa preenchido com o da organização; aviso do simulador |
| P3 | Apagar o nome e clicar em "Contratar" | erro no campo; nenhuma chamada ao checkout (aba Network) |
| P4 | Preencher e clicar em "Contratar" no STARTER | o navegador abre a página "Pagamento simulado" |
| P5 | Voltar ao Web sem pagar e abrir "Plano" | "Pagamento pendente" com "Continuar pagamento" |
| P6 | Pagar no simulador e clicar em "Voltar ao LhamaLog" | `/empresa` carrega sem recusa |
| P7 | Abrir "Plano" | "Plano Starter ativo", "Ir para a empresa", sem "Contratar" |
| P8 | Entrar como membro (não admin) de outra organização nova | botões de contratar desativados, com o aviso |
