# Quickstart: Cargos e permissões (Web)

Guia para verificar a feature no navegador. Não traz a implementação.

## Pré-requisitos

1. Dependências instaladas uma vez, por você: `npm ci` (as instruções do repositório não deixam o agente instalar).
2. Core da branch `LLT-120-cargos-permissoes` rodando localmente (README do Core) e o Web com `npm run dev`.
3. Três pessoas na mesma empresa de teste, cada uma numa janela anônima: um Administrador (A), outro Administrador (B) e um Membro (M).
4. Para testar o Dono: marque o A como Dono no banco local do Core, como manda o `quickstart.md` do Core (seção "Marcar o Dono à mão"). Sem isso, a empresa não tem Dono, e os cenários com Dono não aparecem (C1 do Core).

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

Linha de base (18/11/2026, antes do código): `npm test` com 38 testes, 37 passando e 1 falhando por falta do `node_modules` (`@clerk/localizations`). `npm run build` não rodou (`tsc` não existe sem dependências).

Ao fim da Fase 5 (18/11/2026): `npm test` com 61 testes, 60 passando e a mesma falha de ambiente. `npm run build` **ainda não rodou**.

## Roteiro manual (preencha o resultado)

| # | Passos | Esperado | Resultado |
|---|---|---|---|
| 1 | M entra na empresa | O menu não mostra "Equipe". Abrir `/equipe` direto mostra a negação simples e M continua logado | _preencher_ |
| 2 | A entra, sem Dono marcado | "Equipe" aparece; na lista, ninguém tem "Dono"; o convite oferece Administrador e Membro (W4) | _preencher_ |
| 3 | Marque A como Dono e recarregue | A linha de A mostra "Dono", sem seletor de cargo e sem "Desativar" | _preencher_ |
| 4 | B abre a Equipe (A é Dono) | O convite de B só oferece "Membro", com o texto de ajuda. Reenviar um convite de Administrador mostra "Só o Dono reenvia convite de Administrador." | _preencher_ |
| 5 | B tenta desativar A pela API (a tela esconde o botão) | O Core responde 403 `owner_protected` | _preencher_ |
| 6 | A clica "Produtos" na linha de M, marca um produto e salva | "Acessos atualizados."; M passa a ver só esse produto em `/produtos` | _preencher_ |
| 7 | Na linha de B (admin), olhar a ação de produtos | Mostra "Acessa todos os Produtos." | _preencher_ |
| 8 | A abre a aba "Cargos" | Cinco cargos padrão; Dono e Administrador com "Padrão, não editável" | _preencher_ |
| 9 | A cria "Plantão" com Erro e Ocorrência | "Cargo criado."; criar "plantão" de novo mostra o erro no campo nome | _preencher_ |
| 10 | A renomeia o Gestor sem escolher gravidades | Salva; o Gestor continua sem gravidades | _preencher_ |
| 11 | A abre "Pessoas" do Gestor e marca M | "Cargo atualizado."; na Equipe, "Cargos" na linha de M mostra "Gestor" | _preencher_ |
| 12 | A exclui "Plantão" | Diálogo de exclusão definitiva; o cargo some da lista | _preencher_ |
| 13 | A abre a aba "Permissões" | Tabela só de leitura com Dono, Administrador e Membro e a observação "Só nos produtos liberados" | _preencher_ |
| 14 | A troca de empresa no seletor | As telas recarregam o papel; nada da empresa anterior aparece | _preencher_ |

## Fora desta verificação

- entrega de alertas (módulo Notificação);
- fluxo de compra que cria o Dono;
- transferência do Dono.
