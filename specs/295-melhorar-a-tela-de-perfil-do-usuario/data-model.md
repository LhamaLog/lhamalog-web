# Data model: hub de perfil

O perfil gravado continua o da [especificação anterior](../002-manter-perfil-usuario/data-model.md). Aqui só entra o que esta história acrescenta. Na tela, bio e cargo; no JSON, `bio` e `jobTitle`.

## Perfil da pessoa

| Campo | Onde | Regra |
| --- | --- | --- |
| `displayName` | Core | Igual à spec anterior: 1 a 200 depois do recorte, sem caractere de controle. |
| `language` | Core | `pt-BR` ou `en`. |
| `timezone` | Core | Identificador IANA da lista. Fora da lista, aparece e não pode ser salvo até a pessoa escolher um da lista. |
| `version` | Core | `null` na primeira gravação; depois, a versão carregada. `409` não grava o rascunho. |
| `bio` | Core | Opcional. Depois do recorte, no máximo 160. Vazio é válido. Só espaços vira `""`. Sem caractere de controle e sem quebra de linha, a mesma faixa do nome (`U+0000`–`U+001F` e `U+007F`). |
| `jobTitle` | Core | Opcional. Depois do recorte, no máximo 80. As mesmas regras de texto da bio. |

Leitura sem `bio` ou sem `jobTitle`: o restante vale e os dois aparecem vazios. Gravação da conta envia os dois. Recusa: erro visível, sem sucesso, rascunho mantido.

Salvar a conta reenvia `language` e `timezone` confirmados. Salvar preferências reenvia `displayName`, `bio` e `jobTitle` confirmados. Notificações continuam outra gravação.

## Vínculo com a empresa selecionada

Somente leitura, da sessão, não do `PUT` do perfil.

| Campo | Origem | Regra |
| --- | --- | --- |
| Função | `role` do membership da empresa selecionada | `org:admin` e `org:member` têm frase no catálogo. Outro valor aparece como veio. |
| Empresa | organização selecionada | Nome já mostrado na moldura. |
| Membro desde | `createdAt` desse membership | Data de entrada nesta empresa. Sem data, a tela diz que está indisponível. |

Trocar de empresa atualiza os três e as notificações. Não regrava nome, bio, cargo, idioma nem fuso.

## Aparência e acessibilidade

Só neste navegador. Não entra no perfil nem muda com a empresa.

| Preferência | Valores |
| --- | --- |
| Tema | `light`, `dark`, `system` |
| Reduzir movimento | ligado ou desligado |
| Sublinhar links | ligado ou desligado |
| Contraste maior | ligado ou desligado |

Cada opção de acessibilidade funciona sozinha. `system` acompanha `prefers-color-scheme` enquanto continuar selecionado. Vale na área autenticada. As telas de entrada não mudam.

## Foto

Da sessão. `hasImage` verdadeiro: cartão e cabeçalho mostram a mesma `imageUrl`. Falso: os dois mostram as iniciais do nome. A troca usa a sessão aberta. Não há ação de remover. Falha ou troca interrompida mantém a foto anterior.

## Preferência de notificação

A mesma entidade já aceita, por pessoa e empresa. Esta história não muda canais, filtros, web obrigatório nem a gravação. Muda o lugar (só a seção Notificações) e o idioma das frases fixas.

## Sessão ativa

| | |
| --- | --- |
| Lista | Sessões ainda válidas da conta, lidas pela sessão aberta. |
| Em uso | Marcada. Sem ação de revogar. Termina pelo Sair. |
| Outra | Pode ser revogada. Sai da lista e deixa de poder ser usada. |
| Falha ao revogar | A sessão permanece e a pessoa vê o erro. |

Lista sem outra sessão: a seção diz isso e ainda indica a sessão em uso quando ela for conhecida.

## Ajuda

Três destinos, os mesmos do rodapé: Privacidade `#privacidade`, Termos de Uso `#termos`, Suporte `#suporte`. Placeholder continua placeholder.
