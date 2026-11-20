# Modelo: Validação do pull request

Nada disso é gravado no aplicativo. A rodada lê o pull request, produz seis verificações e publica um comentário.

## Pull request

| Campo | Regra |
| --- | --- |
| Destino | Só `Development`. Outro destino não dispara a validação. |
| Origem | O mesmo repositório. Fork não entra. |
| Rascunho | Entra, com as mesmas verificações. |
| Branch | `LLT-` + um ou mais dígitos + `-` + slug. O slug é `[a-z0-9]+(-[a-z0-9]+)*`. |
| Título | Primeira linha: `LLT-` + um ou mais dígitos + `:` + um espaço + descrição não vazia depois do `trim`. O número é o da branch. |
| Eventos | `opened`, `synchronize`, `reopened`, `edited`, `ready_for_review`. |

## Commit conferido

| Campo | Regra |
| --- | --- |
| Pais | Um pai só. Mais de um pai é merge e não entra. |
| Mensagem | Só a primeira linha, em `LLT-XXX: descricao` ou `LLT-XXX descricao`. O número pode ser de outra tarefa. |
| Falha | Hash completo e a primeira linha. |

## Verificação

Seis itens, nesta ordem: branch, título, commits, `npm ci`, `npm test`, `npm run build`.

| Resultado | Quando |
| --- | --- |
| ✅ | A regra passou, ou não havia commit conferível. |
| ❌ | A regra falhou. O motivo traz o valor encontrado e o esperado. Teste e compilação citam o comando e um trecho de no máximo 30 linhas e 1500 caracteres. Se a instalação falha, teste e compilação ficam ❌ dizendo que não rodaram. |

Node da rodada: 26.12.1.

## Comentário

| Campo | Regra |
| --- | --- |
| Identidade | A primeira linha é o marcador oculto `<!-- llt-285-validacao-prs -->`. A rodada seguinte edita o comentário que já tem esse marcador. |
| Quantidade | Um por pull request. |
| Idioma | Português. |
| Corpo | Uma linha por verificação, com ✅ ou ❌, e o bloco `Para corrigir com IA`. |
| Bloco | Só as falhas da rodada, com encontrado, esperado e trecho quando houver. Se tudo passou, diz que não há nada para corrigir. |

O job que publica esse comentário termina verde também quando uma verificação falha ou quando a publicação falha.
