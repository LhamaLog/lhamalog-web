# Quickstart: Cargos e permissões (Web)

Guia para verificar a feature no navegador. Não traz a implementação.

## Pré-requisitos

1. Dependências instaladas uma vez, por você: `npm ci` (as instruções do repositório não deixam o agente instalar).
2. Core da branch `LLT-120-cargos-permissoes` rodando localmente, apontando para o `mongo-teste` (porta 27019) com um banco só desta feature, e o Web com `npm run dev`. O passo a passo está no `TESTE-MANUAL-120.md` do pacote de fechamento. Não use `docker compose up` nem os bancos `lhamalog_core` e `lhamalog_teste`.
3. Três pessoas, cada uma numa janela anônima: Ana (vira Dono pela compra), Carla (Administrador) e Bruno (Membro).
4. **O Dono nasce pela compra simulada da LLT-289** (22/11): a Ana cria uma organização nova, que **não** esteja em `DEV_TENANT_CLERK_ORG_ID`, escolhe um plano e clica em "Simular pagamento". A organização de desenvolvimento nasce com Tenant e **sem** Dono (vale a W4); para testar o Dono nela, use o `mongosh` do `quickstart.md` do Core (seção "Marcar o Dono à mão").
5. Os webhooks da Clerk não funcionam no Core local: Carla e Bruno só existem para o Core depois do primeiro acesso deles.

## Testes automáticos

```powershell
cd C:\Users\Pedro\Desktop\LhamaLog\lhamalog-web
npm test
npm run build
```

| Arquivo | Prova |
|---|---|
| `tests/access-contract.test.mjs` | leitura de `access/me` e da matriz, modo antigo (Core sem LLT-120), menu Equipe, rótulos |
| `tests/owner-rules.test.mjs` | Dono protegido, convite por papel (inclusive sem Dono, W4), reenvio |
| `tests/product-access.test.mjs` | contrato do acesso por produto, lista de produtos, mensagens |
| `tests/notification-roles.test.mjs` | contrato dos cargos, validação, mensagens, resposta 204 |
| `tests/access-refusals.test.mjs` | as recusas de negócio da 120 mantêm a sessão e mostram a mensagem do Core; `subscription_required` vai para a tela de planos (22/11) |

Linha de base (18/11/2026, antes do código): `npm test` com 38 testes, 37 passando e 1 falhando por falta do `node_modules` (`@clerk/localizations`). `npm run build` não rodou (`tsc` não existe sem dependências).

Ao fim da Fase 5 (18/11/2026): `npm test` com 61 testes, 60 passando e a mesma falha de ambiente. `npm run build` **ainda não rodou**.

Linha de base antes do merge da `Development` (T029): 22/11/2026, branch `LLT-120-cargos-permissoes` em `1c88900`, com o `node_modules` instalado pelo Pedro, Node v26.7.0 (o `package.json` pede 26.12.1, mas funcionou). `npm test`: **61 testes, 61 passando, 0 falhas, 0 ignorados**. `npm run build` (`tsc --noEmit` + Vite): **passou pela primeira vez**, sem erro de tipo. Há só o aviso do Vite de que o pacote JS tem mais de 500 kB (821,59 kB), que não impede o build.

Depois do merge da `Development` (T030 e T031): 22/11/2026. O Pedro mesclou a `origin/Development` pelo GitHub Desktop. Houve conflito em `AppRoutes.tsx` (1) e `CompanyWorkspace.tsx` (2), resolvidos mantendo os dois lados; o `TeamPage.tsx` mesclou sozinho. O `package-lock.json` bate com o `node_modules` instalado, então não precisou de `npm ci`. Uma correção da junção: o `AccessProvider` passou a tratar o `subscription_required` como `unsubscribed`, sem a mensagem de erro de acesso por cima da tela de planos (`accessFailureStatus`, com teste). `npm test`: **94 testes, 94 passando, 0 falhas, 0 ignorados** (61 desta branch + 32 da `Development` + 1 novo). `npm run build`: **passou**.

Spec 012 e contrato (T032 a T036): 22/11/2026. Pasta renomeada de `005` para `012`, com os comentários de `src/` atualizados (15). O `contracts/core-api.md` foi copiado de novo do Core: nenhuma rota nem código de erro mudou, então o `accessContract.ts` continua igual. Testes novos: `tests/access-refusals.test.mjs` (os 9 códigos de recusa desta feature mantêm a sessão e mostram a mensagem do Core; o `subscription_required` vai para a tela de planos) e o `teamPageGate` em `tests/access-contract.test.mjs` (a página Equipe abre pela permissão `MEMBERS_VIEW` do Core, e não mais pelo cargo da Clerk). `npm test`: **99 testes, 99 passando, 0 falhas, 0 ignorados**. `npm run build`: **passou**.

Completar (T037 a T039): 22/11/2026. Só documentação: pré-requisitos e roteiro deste guia passaram a criar o Dono pela compra simulada (LLT-289), e os riscos do `plan.md` foram atualizados. A LLT-123 (Arquivar) e a LLT-179 (chave de API) ainda não estão na `Development` do Web; ficaram como pendência na `spec.md`. `npm test`: **99 testes, 99 passando, 0 falhas, 0 ignorados**. `npm run build`: **passou**.

Fechamento (T041 e T042): 22/11/2026. Analyze sem achado crítico; os achados de documentação foram corrigidos (relatório no pacote de fechamento, `relatorios/analyze-120-web-2026-11-22.md`). Nenhum segredo em `src/`, `tests/` ou na spec. `npm test`: **99 testes, 99 passando, 0 falhas, 0 ignorados**. `npm run build`: **passou** (só o aviso de pacote JS acima de 500 kB). **O roteiro manual abaixo ainda não rodou:** o Pedro não pôde testar em 22/11.

Roteiro manual (T040): 24 e 25/11/2026, contra o Core da LLT-120 local (banco `lhamalog_llt120_local`). **18 linhas OK e 1 que não se aplica (15)**, nenhuma falha. Nenhum código mudou por causa do roteiro.

## Roteiro manual (preencha o resultado)

Linhas 1 a 16: as do `TESTE-MANUAL-120.md` do pacote de fechamento. Linhas 17 a 19: do roteiro de 18/11 que não estão nele.

| # | Quem | O que fazer | O que tem que acontecer | Resultado |
|---|---|---|---|---|
| 1 | Ana | Criar a conta, criar a "Empresa Teste 120" e entrar nela | Aparece a tela de planos, **sem** deslogar (LLT-289), e sem a mensagem de erro de acesso por cima | **OK (24/11)**: Pedro (conta já existente, no papel da Ana) criou a empresa "LOGVIEWER"; tela de planos sem deslogar e sem erro por cima. Core: `access.denied.subscription_required`, "session kept" |
| 2 | Ana | Escolher um plano e clicar em "Simular pagamento" | Entra na empresa. No Core, ela é o Membro DONO | **OK (24/11)**: pedido `STARTER` PAID, Tenant ativado pelo pagamento simulado; no banco, `member.role = DONO` para o Pedro |
| 3 | Ana | Abrir Equipe | Ana aparece como **Dono**, sem o botão Desativar. A aba Permissões mostra Dono, Administrador e Membro | **OK (24/11)**: Dono sem Desativar; a aba Permissões lista Dono, Administrador e Membro |
| 4 | Ana | Convidar a Carla como Administrador e o Bruno como Membro. Os dois aceitam pelo e-mail e entram uma vez | Na Equipe, Carla aparece como Administrador e Bruno como Membro | **OK (24/11)**: Carla (`+carla` no Gmail do Pedro) aparece como Administrador; o Bruno é a conta de um amigo do Pedro, como Membro |
| 5 | Carla | Abrir Equipe e procurar como desativar a Ana | Não há opção de desativar a Dono. A Carla consegue desativar e reativar o Bruno | **OK (24/11)**: a Carla não tem Desativar na linha do Dono; desativou o Bruno (com confirmação) e o reativou |
| 6 | Ana | Criar os produtos "Produto A" e "Produto B". Na Equipe, abrir o acesso por produto do Bruno e liberar só o A | "Acessos atualizados."; reabrindo, só o A está marcado | **OK (25/11, Claude pelo Chrome)**: Produto A e Produto B criados ("Produto ... salvo."). O Bruno já tinha o produto antigo `x\ax` marcado; ficou só o A. "Acessos atualizados."; depois de recarregar a página, só o A marcado |
| 7 | Ana | Tentar abrir o acesso por produto da Carla | Mostra "Acessa todos os Produtos." (`full_access`) | **OK (25/11, Claude)**: na linha da Administradora (`+odiabo` em 25/11) não há o botão Produtos; aparece "Acessa todos os Produtos." |
| 8 | Bruno | Abrir Produtos e tentar abrir o B pelo endereço | Vê só o A. O B aparece como não encontrado, sem deslogar | **OK (25/11, Pedro)**: feito com a conta do Bruno |
| 9 | Bruno | Procurar Equipe, Permissões e Cargos; depois forçar `/equipe` pelo endereço | O menu não mostra Equipe. Pelo endereço, aparece a negação simples, sem deslogar | **OK (25/11, Pedro)**: feito com a conta do Bruno |
| 10 | Ana | Abrir a aba Cargos | Os 5 padrão (Dono, Administrador, Gestor, Supervisor e Membro). Dono e Administrador com "Padrão, não editável" | **OK (25/11, Claude)**: os 5 padrão; Dono e Administrador com "Padrão, não editável" e só o botão Pessoas; os outros com Pessoas, Editar e Excluir |
| 11 | Ana | Criar o cargo "Plantão" com Erro e Ocorrência. Depois, tentar criar "plantão" de novo | O primeiro é criado ("Cargo criado."). O segundo mostra o erro de nome repetido no campo | **OK (25/11, Claude)**: "Cargo criado."; o segundo mostra no campo "Já existe um cargo com este nome nesta empresa." (antes, sem tipo marcado, o formulário pede "Escolha pelo menos um tipo.") |
| 12 | Ana | Atribuir o Bruno ao Plantão e ao Gestor e abrir os cargos dele na Equipe | Aparecem 2 cargos | **OK (25/11, Claude)**: a atribuição é pelo botão Pessoas de cada cargo, na aba Cargos ("Cargo atualizado." a cada marcação). Na Equipe: "Cargos: Gestor, Membro, Plantão". São 3 porque o Bruno já estava no Membro; os 2 novos entraram |
| 13 | Ana | Excluir o Plantão | Diálogo de exclusão definitiva; ele some, e o Bruno fica com 1 cargo | **OK (25/11, Claude)**: o diálogo é o `confirm()` do navegador, com "A exclusão é definitiva. As pessoas deste cargo deixam de receber os alertas dele." (aceito por script, porque a caixa trava a extensão). "Cargo excluído."; o Bruno ficou com "Gestor, Membro" |
| 14 | Pedro | Entrar na organização de desenvolvimento como admin e abrir Equipe | Pedro aparece como Administrador; ninguém é Dono; o convite oferece Administrador e Membro (W4) | **OK (25/11, Claude)**: na "Peters Crew" (Tenant de desenvolvimento no banco local), o Pedro aparece como Administrador, único usuário, ninguém Dono; o convite oferece Membro e Administrador |
| 15 | Bruno e Carla | Abrir um produto (Arquivar) | **Não se aplica em 22/11:** a LLT-123 ainda não está na `Development` do Web (pendência) | **Não se aplica (25/11)**: segundo o Pedro, a LLT-123 já foi mesclada na `Development`, mas esta branch mesclou a `Development` antes disso e não tem a tela de Arquivar (em `src/` só existem a permissão `PRODUCTS_ARCHIVE` e a marca "(arquivado)" no acesso por produto). Quem verifica o Arquivar é a própria LLT-123 |
| 16 | Ana | DevTools > Application > Local Storage e Session Storage | Nenhum token salvo | **OK (25/11, Pedro, prints do DevTools)**: no Local Storage, só as chaves da biblioteca da Clerk (`__clerk_environment`, `__clerk_protect_pid`, `__clerk_protect_st:...` e `clerk_telemetry_throttler`). O `__clerk_protect_st` guarda o token antirrobô da Clerk, não o token de sessão. No Session Storage, só os 2 rascunhos `lhamalog.productDraft.v1:<id>` (Produto A e B). Nenhum token de sessão nem Bearer. O código do Web não grava nada no `localStorage` |
| 17 | Carla | Abrir o convite da Equipe (a empresa tem Dono) | Só oferece "Membro", com o texto de ajuda. Reenviar um convite de Administrador mostra "Só o Dono reenvia convite de Administrador." | **OK (25/11, Pedro)**: feito com a conta da Administradora |
| 18 | Ana | Renomear o Gestor sem escolher gravidades | Salva; o Gestor continua sem gravidades (C4) | **OK (25/11, Claude)**: renomeado para "Gestor de Turno": "Cargo atualizado.", com "Gravidades: nenhuma. Tipos: nenhum."; depois voltou para "Gestor" |
| 19 | Ana | Trocar de empresa no seletor | As telas recarregam o papel; nada da empresa anterior aparece | **OK (25/11, Claude)**: LOGVIEWER → "oH CEUS" (sem plano): `/produtos` e `/equipe` levam para a tela de Plano, nada da LOGVIEWER. LOGVIEWER → "Peters Crew": o papel passa de Dono para Administrador e a Equipe só lista o Pedro. A volta para a LOGVIEWER traz de novo os 3 produtos |

## Fora desta verificação

- entrega de alertas (módulo Notificação);
- o fluxo de compra em si (LLT-289, verificado na spec 007 do Web e na 010 do Core); aqui ele só cria o Dono;
- transferência do Dono.
