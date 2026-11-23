# Tasks: Aba de integração e Chave de API (Web)

Regras para o agente: não rodar Git; não instalar dependência; uma fase por vez, parando para revisão; `npm test` e `npm run build` ao fim de cada fase. Nunca escreva valor real de token em arquivo, teste ou log; use `llt_teste`. Abra `C:\Users\Pedro\Desktop\LhamaLog\LLT-produto-telas-web\figma\04-produto-integracao-otel.png` como gabarito.

## Fase 0

- [ ] T001 Ler esta spec, `contracts/core-api.md` e `C:\Users\Pedro\Desktop\LhamaLog\LLT-produto-telas-web\figma\FIGMA-x-WEB-x-CORE.md`. Abrir a imagem. Rodar `npm test` e `npm run build` como linha de base e anotar no `quickstart.md` (criar).
- [ ] T002 Rodar `speckit-clarify` para F1, F4, F5 e W1 e registrar as respostas.

## Fase 1: funções puras

- [ ] T003 [P] Criar `tests/ingestion-tokens.test.mjs`, cobrindo:
  - `readTokenList`, com item inválido descartado;
  - `activeToken` (o ACTIVE mais recente, ou nenhum);
  - `readCreatedToken` e `readRotation`.
- [ ] T004 [P] Criar `tests/otel-snippet.test.mjs`:
  - variáveis de ambiente e o comando Java com o endpoint;
  - o snippet contém `<sua-chave>` e **não** contém o valor passado como chave;
  - endpoint vazio vira o texto de não configurado.
- [ ] T005 Criar `tokenContract.ts` e `otelSnippet.ts`. Ler `VITE_OTLP_ENDPOINT` em `src/shared/config.ts`.
- [ ] T006 Rodar `npm test` e `npm run build`. Parar para revisão.

## Fase 2: layout igual ao Figma (US1)

- [ ] T007 Criar `OtelConnectionCard`, `LogLevelSlider` e `ConnectionStatusPanel` conforme o Figma e F1. Montar na aba e remover os campos antigos (protocolo, nome do serviço, cabeçalhos e coleta ativa) e a ajuda antiga.
- [ ] T008 Rodar `npm test` e `npm run build`. Parar para revisão.

## Fase 3: Chave de API (US2)

- [ ] T009 Criar `ApiKeyField`:
  - mascarado por padrão;
  - "Gerar nova": sem chave ativa faz `POST`; com chave ativa, confirma e faz `rotate` com 24 h;
  - mostra o valor uma vez, com Copiar e o aviso do Core;
  - apaga o valor ao sair da aba, trocar de produto ou desmontar;
  - estados de produto novo, arquivado, sem permissão (W1) e em transição.
- [ ] T010 Rodar `npm test` e `npm run build`. Parar para revisão.

## Fase 4: fechamento

- [ ] T011 Roteiro manual no `quickstart.md`, contra o Core local:
  - aba lado a lado com o Figma;
  - gerar a chave e copiar;
  - sair e voltar (mascarado);
  - gerar nova (rotação; a anterior fica em transição);
  - DevTools > Application sem o valor no `sessionStorage` nem no `localStorage`;
  - entrar como membro;
  - produto arquivado.
- [ ] T012 Procurar `llt_` em `src/` e `tests/`: só o valor falso dos testes pode aparecer.
- [ ] T013 Rodar `speckit-analyze`.
- [ ] T014 Entregar ao Pedro a mensagem de commit `LLT-179: refaz a aba de integracao conforme o figma com a chave de api`.
