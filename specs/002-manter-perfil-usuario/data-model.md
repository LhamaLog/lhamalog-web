# Data Model: Manter perfil do usuário

Modelo do aplicativo web. A persistência e a sincronização com a Clerk pertencem ao Core. Os nomes de campo abaixo são os do contrato HTTP.

## UserProfile

Perfil da pessoa autenticada. Um por pessoa. Não é por empresa e não se mistura com `CompanySettings`.

| Campo | Tipo no cliente | Obrigatório no `PUT` | Regra |
| --- | --- | --- | --- |
| `displayName` | string | sim | Depois de `trim`, de 1 a 200 caracteres inclusive. Não pode conter caractere de controle: rejeitar se casar com `/[\u0000-\u001F\u007F]/`. Acentos, espaço interno, hífen, apóstrofo e ponto são válidos. O `PUT` envia o valor já sem espaços nas pontas. |
| `language` | string | sim | Exatamente `pt-BR` ou `en`. Qualquer outro valor, inclusive vazio, `en-US`, `pt` ou o rótulo `Português (Brasil)`, é inválido para gravar. |
| `timeZone` | string | sim | Identificador presente na lista de `src/features/profile/timeZones.ts` descrita na pesquisa: `Intl.supportedValuesOf('timeZone')` quando existir; senão `UTC`, `America/Sao_Paulo`, `America/Manaus`, `America/Rio_Branco`. Valor fora da lista é inválido, mesmo que o `GET` o tenha mostrado. |

Não há `id` de usuário, e-mail, avatar, versão, idioma da empresa nem fuso da empresa neste objeto.

### Leitura

`readUserProfile` aceita um objeto JSON cujas três propriedades são strings. String vazia é perfil carregado e ainda incompleto: a tela mostra o valor e bloqueia o salvamento até a validação passar. Qualquer outro formato (nulo, array, número, campo ausente ou tipo errado) é falha de carga, não formulário vazio.

### Escrita

`buildProfilePut` devolve somente `{ displayName, language, timeZone }`, com `displayName` já aparado. `serverConfirmedProfile` relê a resposta e exige igualdade do nome aparado, de `language` e de `timeZone`. Se falhar, a tela adota a resposta válida ou, se a resposta nem puder ser lida, mantém o erro de resposta inválida.

### Transições

1. **Sem empresa**: não há pedido. A orientação de selecionar empresa permanece.
2. **Carregando**: rascunho vazio, idioma aplicado `pt-BR`, nome da moldura = nome da sessão.
3. **Carregado**: rascunho e baseline iguais ao perfil. Se `language` é `pt-BR` ou `en`, esse passa a ser o idioma aplicado. Se `displayName` está vazio, a moldura continua com o nome da sessão.
4. **Editando**: só o rascunho muda. Idioma aplicado e nome da moldura não mudam. A pré-visualização de hora usa o `timeZone` do rascunho e o idioma aplicado.
5. **Salvando**: um único `PUT`. Campos bloqueados.
6. **Confirmado**: baseline, rascunho e preferências aplicadas assumem a resposta. A mensagem de sucesso usa o idioma dessa resposta. A moldura usa o `displayName` se ele não estiver vazio.
7. **Recusado ou falho**: rascunho digitado permanece para correção. Baseline e preferências aplicadas não mudam.
8. **Cancelado**: rascunho volta ao baseline.
9. **Troca de empresa ou saída**: pedido em curso é abortado; resposta tardia é ignorada. A troca dispara uma nova carga.

## AppliedPreferences

Estado de apresentação, não é um segundo recurso HTTP.

| Campo | Origem | Padrão antes da carga |
| --- | --- | --- |
| `language` | `UserProfile.language` quando é `pt-BR` ou `en` | `pt-BR` |
| `displayName` | `UserProfile.displayName` quando, depois do trim, não é vazio | nome da sessão Clerk (`fullName`, senão e-mail primário, senão "Usuário") |
| `timeZone` | `UserProfile.timeZone` gravado, só para a pré-visualização depois de confirmado | vazio; a pré-visualização do rascunho usa o valor selecionado no formulário |

Mudar o select de idioma não altera `AppliedPreferences` até o `PUT` ser confirmado.

## O que este modelo não altera

`CompanySettings.data.language` e `CompanySettings.data.timeZone` continuam com os rótulos atuais da empresa (`Português (Brasil)`, `(UTC-03:00) Brasília`, e os demais de `companyFields.tsx`). Nenhum mapeamento converte um no outro.

## Catálogo de frases

Um mapa por idioma, mesmas chaves, em `messages.ts`. Chaves mínimas:

- Moldura: grupos e itens do menu (incluindo o item novo Perfil), recolher/expandir, rótulo Produto, sair, rodapé (direitos, privacidade, termos, suporte, nome acessível dos links), faixa "empresa selecionada", "cadastrar empresa", título e descrição do estado sem empresa, breadcrumb Administração e breadcrumb Perfil.
- Tela: título, descrição, nome, idioma, fuso, os dois nomes de idioma, pré-visualização, "agora neste fuso", salvar, salvando, cancelar, sucesso, erros de nome (vazio ou tamanho, caractere de controle), erro de idioma, erro de fuso, "confira os campos", não confirmado, não foi possível salvar, carregando perfil, falha ao carregar perfil.

Texto de `fieldErrors` vindo do serviço não entra no catálogo: é exibido como recebido.

## Formatadores existentes

Assinaturas novas, com locale padrão `pt-BR`, sem parâmetro de fuso:

- `formatRevisionDate(value, locale = 'pt-BR')`
- `occurrenceText(value, now, locale = 'pt-BR')` — a frase `Sem registro` não muda
- `formatPercent(value, locale = 'pt-BR')`
- `uniqueSorted(values, locale = 'pt-BR')`
- `initials(name, locale = 'pt-BR')`
- `DistributionBars` e `RankingList` aceitam `locale` opcional, padrão `pt-BR`

Quem chama a partir da área autenticada com perfil carregado passa `AppliedPreferences.language`. A galeria e qualquer chamador antigo permanecem em `pt-BR`.
