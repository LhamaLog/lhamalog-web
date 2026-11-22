# Quickstart: Lista e detalhe de ocorrências

## Preparação

1. Core local com a carga de exemplo (quickstart da spec 012 do core: `OCCURRENCE_SAMPLE_DATA=true`, perfil `local`), com pelo menos dois produtos na empresa de teste.
2. Web: `npm run dev` com o `.env.local` do README (chave pública da Clerk; a API usa `http://localhost:8080` por padrão).
3. Entrar com uma conta administradora da empresa de teste. Para O13, ter também um membro com acesso a um só produto.

## Roteiro

| # | Passo | Esperado |
|---|---|---|
| O1 | Clicar em "Ocorrências" no menu | `/ocorrencias`, item marcado, caminho "Ocorrências", primeira página com 20 itens em até 2 s (SC-004) |
| O2 | Conferir um item | tipo com cor, título, produto, contagem, status, "Recorrente" quando houver, última vez no fuso do perfil |
| O3 | Ir para a página 2; mudar o tamanho para 10 | itens seguintes; depois página 1 com 10 itens; "Mostrando" acompanha |
| O4 | Digitar "timeout" na busca | uma consulta depois da pausa, página 1, só itens com o texto |
| O5 | Filtros: tipo Erro, status Aberta, um produto, "Últimos 7 dias"; aplicar | lista filtrada; botão mostra 4 |
| O6 | Ir para a página 2 com os filtros | filtros mantidos nos itens e no total |
| O7 | Recarregar a página (F5) | mesmos filtros, busca e página |
| O8 | Abrir o painel, mudar algo e fechar sem aplicar | lista igual à de antes |
| O9 | Filtros que nada satisfaz | "Nenhuma ocorrência encontrada para os filtros aplicados", sem paginação |
| O10 | "Limpar filtros" | lista padrão na página 1, busca vazia, botão sem número |
| O11 | Abrir um item | detalhe com cabeçalho, dados, dados sensíveis, atributos (Host, Serviço...), resumo, exemplos e histórico; uma ocorrência sem título mostra a mensagem da assinatura |
| O12 | Copiar o id e os exemplos | "Copiado" e o texto na área de transferência |
| O13 | "Voltar para ocorrências" depois de O5 | lista com os mesmos filtros e página |
| O14 | Abrir `/ocorrencias/nao-existe` | "Ocorrência não encontrada ou sem acesso", sessão ativa |
| O15 | Abrir o link de um detalhe com a conta de outra empresa | a mesma mensagem de O14 |
| O16 | Membro com acesso a um produto | lista e filtro de produto só com esse produto |
| O17 | Parar o Core e recarregar a lista | estado de erro; subir o Core e "Tentar de novo" volta a lista |
| O18 | Trocar de empresa no seletor | lista da outra empresa, sem os filtros de produto anteriores |
| O19 | Endereço `/ocorrencias?type=XYZ&page=abc&size=7` | lista padrão, sem erro |
| O20 | Largura de celular (DevTools) | lista e detalhe em uma coluna, painel em tela cheia |

## Verificações automáticas

```powershell
npm test
npm run build
```
