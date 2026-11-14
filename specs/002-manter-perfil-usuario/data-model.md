# Data Model: Manter perfil do usuário

Modelo do aplicativo web. A persistência é do Core. Os nomes de campo abaixo são os do JSON. O fuso do perfil chama-se `timezone`. O fuso da empresa continua `timeZone` em outro recurso e não é este campo.

## UserProfile

Perfil da pessoa autenticada. Um por pessoa. Não é por empresa e não se mistura com `CompanySettings`.

| Campo | Tipo no cliente | Obrigatório no `PUT` | Regra |
| --- | --- | --- | --- |
| `displayName` | string | sim | Depois de `trim`, de 1 a 200 caracteres inclusive. Não pode conter caractere de controle: rejeitar se casar com `/[\u0000-\u001F\u007F]/`. Acentos, espaço interno, hífen, apóstrofo e ponto são válidos. O `PUT` envia o valor já sem espaços nas pontas. |
| `language` | string | sim | A tela só grava `pt-BR` ou `en`. Qualquer outro valor, inclusive vazio, `en-US`, `pt` ou o rótulo `Português (Brasil)`, é inválido para gravar neste aplicativo. O Core pode aceitar uma etiqueta mais ampla; o web não a oferece. |
| `timezone` | string | sim | Identificador presente na lista de `src/features/profile/timeZones.ts`: `Intl.supportedValuesOf('timeZone')` quando existir; senão `UTC`, `America/Sao_Paulo`, `America/Manaus`, `America/Rio_Branco`. Valor fora da lista é inválido, mesmo que o `GET` o tenha mostrado. O nome do campo no JSON é `timezone`. |
| `version` | `number \| null` | sim | `null` na primeira gravação e no `GET` sem perfil armazenado. Nas gravações seguintes, o número carregado por último. Não se compara a versão enviada com a devolvida: a resposta substitui a versão local. |

Não há `id` de usuário, e-mail, avatar, idioma da empresa nem fuso da empresa neste objeto. Não há campo `timeZone` neste JSON.

### Leitura

`readUserProfile` aceita um objeto em que `displayName`, `language` e `timezone` são strings e `version` é `null` ou um número finito. String vazia em `displayName` é perfil carregado. Qualquer outro formato, inclusive um corpo que só tenha `timeZone`, é falha de carga.

O `GET` sem perfil armazenado é exatamente `displayName: ""`, `language: "pt-BR"`, `timezone: "America/Sao_Paulo"`, `version: null`.

### Escrita

`buildProfilePut` devolve somente `{ displayName, language, timezone, version }`, com `displayName` já aparado e a `version` do baseline. `serverConfirmedProfile` exige igualdade do nome aparado, de `language` e de `timezone`. Não exige que `version` da resposta seja igual à enviada. Se os três valores falharem, a tela adota a resposta válida ou, se a resposta nem puder ser lida, mantém o erro de resposta inválida. `user.update` só corre depois dessa confirmação.

### Divisão do nome para a sessão

`splitDisplayName` em `src/features/profile/clerkName.ts`, sobre o `displayName` já aparado:

- Divide em palavras por sequências de espaço.
- A primeira palavra é `firstName`.
- As demais, unidas por um espaço, são `lastName`.
- Uma única palavra: `firstName` é essa palavra e `lastName` é `""`.

Exemplos: `Ana Souza` → `Ana` / `Souza`; `Ana Souza Silva` → `Ana` / `Souza Silva`; `Ana` → `Ana` / `""`.

### Transições

1. **Sem empresa**: não há `GET` nem `PUT`, e `useApi` não é chamado. A orientação de selecionar empresa permanece. Idioma aplicado `pt-BR`. Nome do cabeçalho = nome da sessão.
2. **Carregando**: idioma aplicado `pt-BR`, nome do cabeçalho = nome da sessão.
3. **Carregado**: rascunho e baseline iguais ao perfil, inclusive `version`. Se `language` é exatamente `pt-BR` ou `en`, esse passa a ser o idioma aplicado e o setter de `clerkLocale.ts` é chamado. Outra etiqueta não muda o idioma aplicado. Se `displayName` está vazio, o cabeçalho continua com o nome da sessão; senão, o cabeçalho usa o `displayName`.
4. **Editando**: só o rascunho muda. Idioma aplicado, nome do cabeçalho e sessão Clerk não mudam. A pré-visualização de hora usa o `timezone` do rascunho e o idioma aplicado.
5. **Salvando**: um único `PUT` com a `version` do baseline. Campos bloqueados.
6. **Confirmado**: baseline, rascunho e preferências aplicadas assumem a resposta, inclusive a `version` devolvida. O cabeçalho usa o `displayName` se ele não estiver vazio. O setter de locale é chamado com o idioma confirmado. A mensagem de sucesso usa esse idioma. Só então `user.update({ firstName, lastName })`. Se resolver, `user.reload()`. Falha de um ou de outro não volta o `PUT` atrás nem troca o nome do cabeçalho.
7. **409**: não chama `user.update`. Oferece recarregar com um novo `GET`. A edição local não vira baseline.
8. **Recusado ou falho**: rascunho digitado permanece. Baseline, cabeçalho e sessão Clerk não mudam.
9. **Cancelado**: rascunho volta ao baseline, inclusive `version`.
10. **Troca de empresa ou saída**: pedido em curso é abortado; resposta tardia é ignorada. A troca dispara uma nova carga. O sign-out volta o locale da Clerk ao português.

## AppliedPreferences

Estado de apresentação, não é um segundo recurso HTTP.

| Campo | Origem | Padrão antes da carga |
| --- | --- | --- |
| `language` | `UserProfile.language` quando é exatamente `pt-BR` ou `en` | `pt-BR` |
| `displayName` | `UserProfile.displayName` quando, depois do trim, não é vazio | nome da sessão Clerk (`fullName`, senão e-mail primário, senão `Usuário`) |
| `timezone` | `UserProfile.timezone` gravado, para a pré-visualização depois de confirmado | vazio; a pré-visualização do rascunho usa o valor selecionado no formulário |

`CompanyWorkspace` passa `displayName` aplicado ao `user.name` do cabeçalho, ou o nome da sessão quando o aplicado está vazio. Mudar o select de idioma não altera `AppliedPreferences` até o `PUT` ser confirmado.

## O que este modelo não altera

`CompanySettings.data.language` e `CompanySettings.data.timeZone` continuam com os rótulos atuais da empresa (`Português (Brasil)`, `(UTC-03:00) Brasília`, e os demais de `companyFields.tsx`). Nenhum mapeamento converte um no outro. O camelCase `timeZone` da empresa não é o `timezone` deste perfil.

## Catálogo de frases

Um mapa por idioma, mesmas chaves, em `messages.ts`. Chaves mínimas:

- Moldura: grupos e itens do menu (incluindo o item novo Perfil), recolher/expandir, rótulo Produto, sair, rodapé (direitos, privacidade, termos, suporte, nome acessível dos links), faixa "empresa selecionada", "cadastrar empresa", título e descrição do estado sem empresa, breadcrumb Administração e breadcrumb Perfil.
- Tela: título, descrição, nome, idioma, fuso, os dois nomes de idioma, pré-visualização, "agora neste fuso", salvar, salvando, cancelar, sucesso, erros de nome (vazio ou tamanho, caractere de controle), erro de idioma, erro de fuso, "confira os campos", não confirmado, não foi possível salvar, carregando perfil, falha ao carregar perfil.

Texto de `fieldErrors` vindo do serviço não entra no catálogo: é exibido como recebido, nas chaves `displayName`, `language` e `timezone`.

## Formatadores existentes

Assinaturas novas, com locale padrão `pt-BR`, sem parâmetro de fuso:

- `formatRevisionDate(value, locale = 'pt-BR')`
- `occurrenceText(value, now, locale = 'pt-BR')` — a frase `Sem registro` não muda
- `formatPercent(value, locale = 'pt-BR')`
- `uniqueSorted(values, locale = 'pt-BR')`
- `initials(name, locale = 'pt-BR')`
- `DistributionBars` e `RankingList` aceitam `locale` opcional, padrão `pt-BR`

Quem chama a partir da área autenticada com perfil carregado passa `AppliedPreferences.language`. A galeria e qualquer chamador antigo permanecem em `pt-BR`.
