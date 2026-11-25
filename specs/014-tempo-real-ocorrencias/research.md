# Research: Aviso de ocorrências novas na tela

**Feature**: `014-tempo-real-ocorrencias` | **Data**: 25/11/2026

## R1. Endereço

- **Decisão**: `wsUrl(apiUrl)`: troca `http`→`ws` e `https`→`wss` no `apiUrl` da configuração pública e acrescenta `/ws/occurrences`.
- **Motivo**: o Core é o mesmo da API; nada de configuração nova.

## R2. Autenticação e renovação

- **Decisão**: ao abrir, `getToken()` e `{"type":"auth","token":…}`; a cada 50 s, de novo. Sem token (sessão acabou) → fecha e para. Fechamento 4403 → para de tentar; 4401 → tenta de novo (token pode ter vencido por aba em segundo plano).
- **Motivo**: contrato da spec 015 do core; token Clerk dura ~60 s.

## R3. Contagem

- **Decisão**: `countsFor(query, aviso)`: só na situação Ativas; `productIds` vazio ou com o produto; `types` vazio ou com o tipo; `statuses` vazio ou com `ABERTA` (novas e reabertas são ABERTA). As ocorrências pendentes ficam num `Set` de ids; o texto usa o tamanho dele.
- **Motivo**: FR-003; busca e período ficam de fora porque o aviso não traz texto nem datas (premissa da spec).

## R4. Reconexão e sincronização

- **Decisão**: espera `min(30, 2^(tentativa-1))` s; zera ao `ready`. Depois de um `ready` que não é o primeiro, consulta a primeira página com os filtros atuais e compara com a lista mostrada: algum id novo no topo ou `totalItems` maior → "Há ocorrências novas · Atualizar".
- **Motivo**: FR-005 e FR-006; o pub/sub do Core não guarda avisos.

## R5. Onde a conexão vive

- **Decisão**: no `OccurrencesPage` (só a lista). O `key={orgId}` do workspace já remonta a tela ao trocar de empresa, o que fecha e reabre a conexão.
- **Motivo**: FR-008 e premissa "o detalhe não recebe avisos".
