# Quickstart: Ciclo de vida da ocorrência na tela

## Preparação

Core local da branch `LLT-136-ciclo-de-vida` (spec 014) com a carga de exemplo e o web com `npm run dev`. Conta administradora da empresa de teste e, para S11, um membro com acesso a um só produto.

## Roteiro

| # | Passo | Esperado |
|---|---|---|
| S1 | Abrir o detalhe de uma ocorrência Aberta | cartão "Ações" com o seletor em Aberta e "Alterar status" desabilitado |
| S2 | Escolher Em análise e "Alterar status" | selo Em análise, histórico com "Aberta → Em análise" e o nome do usuário, aviso "Status alterado" |
| S3 | Voltar para a lista com o filtro de status Em análise | a ocorrência aparece |
| S4 | Abrir o mesmo detalhe em duas abas; alterar numa e depois na outra | a segunda mostra "A ocorrência mudou…" e "Recarregar"; recarregar mostra o status novo |
| S5 | Fechada → Aberta | reabre, com a mudança no histórico |
| S6 | "Arquivar" | selo Arquivada, data e autor; botão vira "Desarquivar" |
| S7 | Voltar para a lista | a ocorrência não aparece; o total diminuiu |
| S8 | Situação "Arquivadas" | só arquivadas; o endereço tem `situacao=arquivadas`; F5 mantém |
| S9 | Abrir a arquivada e "Desarquivar" | volta para Ativas |
| S10 | "Arquivadas" sem nenhuma | "Nenhuma ocorrência arquivada" |
| S11 | Membro com acesso a um produto | vê e usa as ações nas ocorrências desse produto |
| S12 | Equipe › Permissões | linha "Alterar status e arquivar ocorrências" para os três papéis |
| S13 | Largura de celular | ações em uma coluna |

## Verificações automáticas

```powershell
npm test
npm run build
```
