# Planejamento de implementação do LhamaLog Web

Checklist de componentes e partes das telas. Cada item representa algo a implementar. Vamos trabalhar em uma entrega por vez e marcar como concluída depois de funcionar e ser revisada.

Referências: login, navbar, header, Produtos, Empresa e Ocorrências fornecidos em SVG. A base abaixo foi concluída conforme confirmação do usuário. Os demais itens são planejamento, não uma ampliação automática do escopo das tarefas da equipe.

## 1 Componentes básicos

- [x] Implementar Input com rótulo, estado desabilitado e mensagem de erro.
- [x] Implementar PasswordInput com mostrar e ocultar senha pelo ícone de olho.
- [x] Implementar Button primário.
- [x] Implementar Checkbox com texto opcional e estilo padronizado.

## 2 Componentes reutilizáveis

- [ ] Implementar variantes do Button: primário, contorno e suave.
- [ ] Implementar tamanhos e opção de largura total no Button.
- [ ] Implementar IconButton para ações que usam somente ícone.
- [ ] Implementar Badge para status e indicadores coloridos.
- [ ] Implementar Tag para categorias e etiquetas, reaproveitando Badge se suficiente.
- [ ] Implementar Avatar com iniciais.
- [ ] Implementar suporte a ícone inicial no Input.
- [ ] Implementar SearchInput com lupa e tamanho compacto.
- [ ] Implementar Card para a estrutura visual dos painéis.
- [ ] Implementar PageHeader com título, descrição opcional e ações.
- [ ] Implementar FilterButton com ícone e contador de filtros.
- [ ] Implementar Pagination com páginas, anterior, próximo e resumo de resultados.
- [ ] Implementar ProgressBar para conclusão de perfil.

## 3 Navbar e header

- [ ] Implementar Navbar lateral com logo e grupos de navegação.
- [ ] Implementar itens de navegação com ícone, texto e indicação de página atual.
- [ ] Implementar a apresentação do seletor de produto na Navbar.
- [ ] Implementar recolher e expandir a Navbar, após definir o estado recolhido.
- [ ] Implementar Breadcrumbs com caminho da página.
- [ ] Implementar indicador do estado do sistema.
- [ ] Implementar a apresentação do seletor de período.
- [ ] Implementar botão de notificações com contador.
- [ ] Implementar identificação do usuário com avatar, nome e função.
- [ ] Implementar Header compondo os elementos compartilhados.
- [ ] Implementar AppLayout com Navbar, Header e área de conteúdo responsiva.
- [ ] Implementar Footer com copyright e links.

## 4 Produtos

- [ ] Implementar cabeçalho da tela de Produtos com busca, filtros e botão Cadastrar produto.
- [ ] Implementar ProductCard com ícone, nome, descrição e status de integração.
- [ ] Implementar categorias, área, último log e ambiente no ProductCard.
- [ ] Implementar lista de produtos reutilizando ProductCard.
- [ ] Implementar paginação da lista de produtos.
- [ ] Implementar painel Resumo dos produtos.
- [ ] Implementar painel Produtos por ambiente.
- [ ] Implementar ranking Logs por produto.
- [ ] Implementar indicadores Integrações ativas e Logs recebidos hoje.
- [ ] Implementar composição responsiva da tela de Produtos.

## 5 Ocorrências

- [ ] Implementar cabeçalho da tela de Ocorrências com busca e filtros.
- [ ] Implementar SeverityIndicator com Erro, Alerta e Info.
- [ ] Implementar OccurrenceCard com severidade, título, descrição e tags.
- [ ] Implementar data, horário e projeto no OccurrenceCard.
- [ ] Implementar lista de ocorrências reutilizando OccurrenceCard.
- [ ] Implementar paginação da lista de ocorrências.
- [ ] Implementar painel Métricas principais.
- [ ] Implementar gráfico de intensidade Ocorrências por dia.
- [ ] Implementar ranking Serviços mais impactados.
- [ ] Implementar indicadores Tempo médio de resolução e Taxa de resolução.
- [ ] Implementar composição responsiva da tela de Ocorrências.

## 6 Empresa

- [ ] Implementar cabeçalho da tela de Configurações da Empresa.
- [ ] Implementar navegação entre Empresa, Dados da Empresa, Contexto de Atuação, Endereço e Preferências, conforme o comportamento definido.
- [ ] Implementar CompanySummary com logo, nome, verificação, CNPJ e inscrição estadual.
- [ ] Implementar indicador de conclusão do perfil.
- [ ] Implementar CompanyDataCard com resumo cadastral e ação Gerenciar Dados.
- [ ] Implementar CompanyContextCard com resumo operacional e ação Editar Contexto.
- [ ] Implementar CompanyAddressCard com mapa ilustrado, endereço e ação Atualizar Endereço.
- [ ] Implementar CompanyPreferencesCard com resumo das preferências e ação Ajustar Preferências.
- [ ] Implementar bloco de governança com apresentação das ações de exportação e sincronização.
- [ ] Implementar composição responsiva da tela de Empresa com rodapé.

## 7 Indicadores e estados compartilhados

Criar os componentes desta seção quando forem necessários para os painéis das telas acima, sem duplicar a implementação.

- [ ] Implementar MetricCard com título, valor, unidade, ícone e variação opcional.
- [ ] Implementar RankingList com posições, barras e valores.
- [ ] Implementar Sparkline para os minigráficos dos indicadores.
- [ ] Implementar barras de distribuição com rótulos e valores.
- [ ] Implementar estado de carregamento de listas e painéis.
- [ ] Implementar estado vazio e sem resultados.
- [ ] Implementar mensagem de falha com ação de tentar novamente, quando houver operação de dados.

## Organização dos arquivos

| Local | Conteúdo |
| --- | --- |
| `src/shared/ui` | Componentes genéricos reutilizáveis. |
| `src/app/layouts` | Navbar, Header, AppLayout e Footer. |
| `src/features/products/components` | Cartões, lista e painéis de produtos. |
| `src/features/occurrences/components` | Cartões, lista, severidade e painéis de ocorrências. |
| `src/features/company/components` | Resumo e cartões da empresa. |

Partes pequenas podem permanecer no componente que as utiliza. Não é necessário criar um arquivo para cada ícone, texto ou trecho de HTML.

## Ordem de trabalho

A base da seção 1 está concluída. A próxima entrega é **implementar as variantes do Button**. Depois seguimos pelos componentes reutilizáveis necessários para Navbar e Header. As telas serão compostas com esses componentes, uma parte por vez. Indicadores comuns devem ser criados antes dos painéis que os utilizam.

## Regras de implementação

- Manter o código simples e seguir os estilos das referências.
- Incluir teclado, nomes acessíveis e estados aplicáveis como parte da implementação de cada componente.
- Conferir o resultado no navegador e executar `npm run build` antes de concluir a entrega.
- Deixar regras de negócio e consultas à API nas funcionalidades; `shared/ui` recebe dados e eventos.
- Usar demonstrações identificadas quando os dados reais ainda não existirem.
- Não executar comandos Git nem alterar serviços externos sem autorização explícita.
- Não avançar para outra entrega sem o retorno do usuário.

## Funcionalidades que precisam de definição antes de implementar

Os SVGs mostram o estado fechado ou o resumo dessas áreas. Implementar sua apresentação não significa concluir seus fluxos.

- Opções e funcionamento dos filtros, períodos e seleção global de produto.
- Destinos dos links, detalhes de produtos e detalhes de ocorrências.
- Formulários de cadastro de produto e edição dos dados da empresa.
- Conteúdo dos menus do usuário e das notificações.
- Comportamento da Navbar recolhida e navegação em telas pequenas.
- Fórmulas das métricas, tendências e significado das células do gráfico de intensidade.
- Relação entre projeto e produto, contratos de API e permissões.
- Exportação real de PDF, sincronização, upload e integrações.
- Autenticação e sessão, respeitando a responsabilidade da pessoa designada para o Clerk.

Select, Textarea, Modal e outros controles entram no plano quando houver um uso confirmado. As listas atuais usam cartões horizontais; não precisamos criar uma tabela para reproduzi-las.

## Instrução para usar com a IA

> Leia este planejamento e os arquivos atuais do projeto. Trabalhe somente no item que eu indicar, explicando os arquivos envolvidos. Se eu pedir orientação, forneça o caminho e o conteúdo completo dos arquivos para eu implementar. Faça uma pequena entrega por vez, preserve o que já funciona e explique como testar. Marque apenas o item concluído depois da revisão. Não execute comandos Git nem avance para outra entrega sem meu retorno.
