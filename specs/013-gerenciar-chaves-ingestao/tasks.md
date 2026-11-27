# Tasks: Gerenciar chaves de ingestão no Web

Regras: não rodar Git (exceção da sessão de 27/11/2026: Git pelo agente só nesta branch, ver `quickstart.md`); não instalar dependência; uma fase por vez, parando para revisão; `npm test` e `npm run build` ao fim de cada fase, com o resultado no `quickstart.md`. Gabarito visual: `C:\Users\Pedro\Desktop\LhamaLog\LLT-179-180-credenciais-otel\figma\04-produto-integracao-otel.png`.

## Fase 0: preparação

- [X] T001 Ler esta spec, a spec `011-tokens-ingestao` (inteira, inclusive a seção de decisões), `contracts/core-api.md`, `src/features/products/components/OtelConnectionCard.tsx`, `tokenContract.ts` e `tests/ingestion-tokens.test.mjs`. Abrir o recorte do Figma. Linha de base: `npm test` e `npm run build`, anotados no `quickstart.md` (criar).
- [X] T002 Copiar `lhamalog-core/specs/010-tokens-ingestao/contracts/api.md` para `contracts/core-api.md`.
- [X] T003 `speckit-clarify` com K1 a K8, mostrando a recomendação de cada uma. Registrar as respostas.
- [X] T004 `speckit-plan`: gerar `plan.md`, `research.md`, `data-model.md` e `quickstart.md` (completar), seguindo a constituição do Web. `speckit-analyze` antes de implementar.

## Fase 1: funções puras (testes antes)

- [X] T005 [P] Criar `tests/ingestion-token-management.test.mjs`, cobrindo:
  - selo e texto de cada `state` (ACTIVE, EXPIRING, EXPIRED, REVOKED) e as datas formatadas em pt-BR;
  - quais ações aparecem em cada situação (revogar: ativa e em transição; rotacionar: só ativa sem expiração), inclusive no produto arquivado (K7);
  - validação do nome (vazio, espaços, 100 e 101 caracteres) e do período (0, 1, 24, 168, 169, texto);
  - montagem do corpo do `rotate` (sem nome, herda; período padrão 24);
  - histórico: rótulo de cada ação, ordem, fim da transição, autor pelo nome e o caso sem pessoa na organização (K5);
  - permissão: com e sem a LLT-120 (K6).

  Ver os testes falharem antes do código.
- [X] T006 Implementar em `src/features/products/tokenManagement.ts` (e ampliar `tokenContract.ts` com `revoke`, `rotate`, `audit` e `list`, se ainda não houver). `npm test` e `npm run build`. Parar para revisão.

## Fase 2: seção "Chaves deste produto"

- [X] T007 Criar `src/features/products/components/IngestionTokensSection.tsx`: lista com selos, Revogar (confirmação K8), Rotacionar (campo de horas K4), Nova chave (nome K3), estados de carregando, vazio e erro. Usar os componentes de `src/shared/ui` e a linguagem visual do Figma.
- [X] T008 Aviso de chave nova (uma vez, com Copiar e o `notice` do Core), reaproveitando o que o `OtelConnectionCard` já usa no "Gerar nova". O valor some ao fechar o aviso ou trocar de aba (FR-K09).
- [X] T009 Ligar a seção abaixo do `OtelConnectionCard`, no modo cadastro e edição. Depois de qualquer ação, recarregar a lista e o selo do painel "Status da conexão".
- [X] T010 `npm test` e `npm run build`. Parar para revisão.

## Fase 3: histórico e permissões

- [X] T011 "Histórico" (recolhível, dentro da seção), com o autor pelo nome (K5).
- [X] T012 Permissão (K6): se existir `src/features/access`, usar `can('INGESTION_TOKENS_MANAGE')` na seção **e** no "Gerar nova" do topo; se não existir, manter o cargo admin e registrar a pendência na spec.
- [X] T013 Produto arquivado (K7): seção em modo leitura, Revogar disponível.
- [X] T014 `npm test` e `npm run build`. Parar para revisão.

## Fase 4: fechamento

- [X] T015 Procurar `llt_` (só o falso dos testes pode aparecer), `sk_` e `eyJ` em `src/` e `tests/`.
- [X] T016 Anotar no `quickstart.md` as diferenças em relação ao Figma (a seção nova não tem desenho) e o roteiro manual desta parte (as linhas do `TESTE-MANUAL.md` do pacote).
- [X] T017 `speckit-analyze`. `npm test` e `npm run build` finais.
- [X] T018 Entregar ao Pedro a mensagem de commit `LLT-179: permite revogar, rotacionar e ver o historico das chaves de ingestao` e o rascunho do PR.
