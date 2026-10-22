import { useState } from 'react'
import { Input } from '../shared/ui/Input'
import { PasswordInput } from '../shared/ui/PasswordInput'
import { Checkbox } from '../shared/ui/Checkbox'
import { Button } from '../shared/ui/Button'
import { IconButton } from '../shared/ui/IconButton'
import { Badge } from '../shared/ui/Badge'
import { Avatar } from '../shared/ui/Avatar'
import { SearchInput } from '../shared/ui/SearchInput'
import { Card } from '../shared/ui/Card'
import { PageHeader } from '../shared/ui/PageHeader'
import { FilterButton } from '../shared/ui/FilterButton'
import { Pagination } from '../shared/ui/Pagination'
import { ProgressBar } from '../shared/ui/ProgressBar'
import { Navbar } from './layouts/Navbar'
import { Breadcrumbs } from '../shared/ui/Breadcrumbs'
import { SystemStatus } from '../shared/ui/SystemStatus'
import { PeriodSelector } from '../shared/ui/PeriodSelector'
import { NotificationButton } from '../shared/ui/NotificationButton'
import { UserIdentity } from '../shared/ui/UserIdentity'

export function App() {
  const [demoPage, setDemoPage] = useState(1)
  const [demoProgress, setDemoProgress] = useState(85)
  const [demoNavigation, setDemoNavigation] = useState('occurrences')

  return (
    <div className="flex min-h-screen">
      <Navbar
        activeItem={demoNavigation}
        onItemSelect={setDemoNavigation}
        productName="API Gateway"
        onProductSelect={() => alert('Demonstração do seletor. A lista de produtos ainda será definida.')}
      />
      <main className="mx-auto min-w-0 w-full max-w-3xl space-y-10 p-6">
      <h1 id="components-top" className="text-2xl font-bold text-slate-900">
        Componentes LhamaLog
      </h1>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">
          Componentes básicos
        </h2>

        <div className="flex max-w-96 flex-col gap-6">
          <Input
            id="email"
            label="E-mail"
            type="email"
            placeholder="seu@exemplo.com"
            autoComplete="email"
          />

          <PasswordInput
            id="password"
            label="Senha"
            placeholder="Sua senha"
            autoComplete="current-password"
          />

          <Checkbox
            id="remember"
            label="Lembrar de mim"
          />

          <Button onClick={() => alert('Entrar clicado!')}>
            Entrar
          </Button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">
          Variantes
        </h2>

        <div className="flex flex-wrap gap-3">
          <Button
            fullWidth={false}
            onClick={() => alert('Primário clicado!')}
          >
            Primário
          </Button>

          <Button
            variant="outline"
            fullWidth={false}
            onClick={() => alert('Contorno clicado!')}
          >
            Contorno
          </Button>

          <Button
            variant="soft"
            fullWidth={false}
            onClick={() => alert('Suave clicado!')}
          >
            Suave
          </Button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">
          Tamanhos
        </h2>

        <div className="flex flex-wrap items-center gap-3">
          <Button size="small" fullWidth={false}>
            Pequeno
          </Button>

          <Button size="normal" fullWidth={false}>
            Normal
          </Button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">
          Largura total
        </h2>

        <Button>Ocupa toda a largura disponível</Button>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">
          Desabilitados
        </h2>

        <div className="flex flex-wrap gap-3">
          <Button
            disabled
            fullWidth={false}
            onClick={() => alert('Este alerta não deve aparecer')}
          >
            Primário
          </Button>

          <Button
            variant="outline"
            disabled
            fullWidth={false}
          >
            Contorno
          </Button>

          <Button
            variant="soft"
            disabled
            fullWidth={false}
          >
            Suave
          </Button>
        </div>
      </section>
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">
          Botões com ícone
        </h2>

        <div className="flex flex-wrap gap-3">
          <IconButton
            aria-label="Adicionar produto"
            onClick={() => alert('Adicionar produto')}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </IconButton>

          <IconButton
            variant="outline"
            aria-label="Próxima página"
            onClick={() => alert('Próxima página')}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m9 5 7 7-7 7" />
            </svg>
          </IconButton>

          <IconButton
            variant="soft"
            aria-label="Adicionar produto indisponível"
            disabled
            onClick={() => alert('Este alerta não deve aparecer')}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </IconButton>
        </div>
      </section>


      <section className="space-y-4">
        <h2 className="text-lg font-semibold">
          Indicadores de status
        </h2>

        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="success" dot>
            Conectado
          </Badge>

          <Badge variant="warning" dot>
            Aguardando primeiro log
          </Badge>

          <Badge variant="danger" dot>
            Falha na conexão
          </Badge>

          <Badge variant="neutral" dot>
            Sem integração
          </Badge>

          <Badge variant="info" dot>
            Empresa verificada
          </Badge>
        </div>

        <h3 className="font-medium">
          Sem bolinha
        </h3>

        <div className="flex flex-wrap items-center gap-3">
          <Badge>Aplicação web</Badge>

          <Badge variant="neutral">
            Dados
          </Badge>
        </div>
      </section>


      <section className="space-y-4">
        <h2 className="text-lg font-semibold">
          Tags de categorias e etiquetas
        </h2>

        <p className="text-sm text-slate-600">
          Exemplos de etiquetas reutilizando o Badge.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <Badge>Aplicação web</Badge>
          <Badge>API / Serviço</Badge>
          <Badge>Microsserviço</Badge>
          <Badge variant="neutral" dot>Dados</Badge>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">
          Avatar com iniciais
        </h2>

        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <Avatar name="João Silva" />
            <span className="text-sm text-slate-700">João Silva</span>
          </div>

          <div className="flex items-center gap-2">
            <Avatar name="Ana" />
            <span className="text-sm text-slate-700">Ana</span>
          </div>

          <div className="flex items-center gap-2">
            <Avatar name="" />
            <span className="text-sm text-slate-700">Sem nome</span>
          </div>
        </div>
      </section>
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">
          Input com ícone inicial
        </h2>

        <div className="max-w-96">
          <Input
            id="email-with-icon"
            label="E-mail com ícone"
            type="email"
            placeholder="seu@exemplo.com"
            autoComplete="email"
            startIcon={
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m3 7 9 6 9-6" />
              </svg>
            }
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">
          Busca compacta
        </h2>

        <p className="text-sm text-slate-600">
          Demonstração visual dos campos, sem filtrar produtos nesta etapa.
        </p>

        <SearchInput
          id="product-search"
          label="Buscar produtos"
          placeholder="Buscar produtos..."
        />

        <SearchInput
          id="disabled-search"
          label="Busca indisponível"
          placeholder="Busca indisponível"
          disabled
        />

        <SearchInput
          id="search-with-error"
          label="Busca com erro de exemplo"
          placeholder="Buscar produtos..."
          error="Mensagem de erro apenas para demonstração."
        />
      </section>
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">
          Card para painéis
        </h2>

        <div className="grid gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
          <Card>
            <h3 className="font-semibold text-[#083B7A]">
              Resumo dos produtos
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Conteúdo ilustrativo do painel, sem dados reais.
            </p>
            <div className="mt-4">
              <Badge variant="success" dot>Conectado</Badge>
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold text-[#083B7A]">
              Produtos por ambiente
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              O mesmo Card pode receber conteúdos diferentes.
            </p>
          </Card>
        </div>
      </section>

      <section className="space-y-6">
        <PageHeader
          title="Produtos — exemplo de PageHeader"
          headingLevel={2}
          description="Acompanhe os produtos cadastrados e o status da integração."
          actions={
            <Button
              size="small"
              fullWidth={false}
              onClick={() => alert('Demonstração: cadastrar produto')}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              Cadastrar produto
            </Button>
          }
        />

        <PageHeader
          title="Cabeçalho somente com título"
          headingLevel={2}
        />
      </section>
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Botão de filtros</h2>
        <p className="text-sm text-slate-600">
          Demonstração do botão; o painel de filtros será definido depois.
        </p>
        <div className="flex flex-wrap items-center gap-6 pt-2">
          <FilterButton onClick={() => alert('Demonstração: filtros sem seleção')} />
          <FilterButton count={3} onClick={() => alert('Demonstração: três filtros ativos')} />
          <FilterButton count={2} disabled />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Paginação</h2>
        <p className="text-sm text-slate-600">
          Dados ilustrativos: 24 produtos, seis por página.
        </p>
        <Pagination
          page={demoPage}
          pageSize={6}
          totalItems={24}
          itemLabel="produtos"
          onPageChange={setDemoPage}
        />
        <h3 className="font-medium">Sem resultados</h3>
        <Pagination page={1} pageSize={6} totalItems={0} onPageChange={() => {}} />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Barra de progresso</h2>
        <Card className="max-w-md">
          <ProgressBar value={demoProgress} label="Conclusão do perfil" />
          <label htmlFor="demo-progress" className="mt-4 block text-sm text-slate-600">
            Ajustar percentual de demonstração
          </label>
          <input
            id="demo-progress"
            type="range"
            min={0}
            max={100}
            value={demoProgress}
            onChange={(event) => setDemoProgress(Number(event.target.value))}
            className="mt-2 w-full accent-[#0C70F2]"
          />
        </Card>
      </section>
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Caminho da página</h2>
        <p className="text-sm text-slate-600">
          Exemplo: o ícone de início e o link Componentes levam ao topo desta demonstração.
        </p>
        <Breadcrumbs
          homeHref="#components-top"
          items={[
            { label: 'Componentes', href: '#components-top' },
            { label: 'Navegação' },
            { label: 'Breadcrumbs' },
          ]}
        />
      </section>
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Estado do sistema</h2>
        <p className="text-sm text-slate-600">
          Estados ilustrativos, sem consultar o backend.
        </p>
        <div className="flex flex-wrap items-center gap-6">
          <SystemStatus label="Sistema operacional" />
          <SystemStatus label="Exemplo de aviso" tone="warning" />
          <SystemStatus label="Exemplo de indisponibilidade" tone="danger" />
          <SystemStatus label="Estado desconhecido" tone="neutral" />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Seletor de período</h2>
        <p className="text-sm text-slate-600">
          Apresentação do seletor; as opções e o funcionamento serão definidos depois.
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <PeriodSelector
            label="Últimas 24 horas"
            onClick={() => alert('Demonstração do seletor. As opções de período ainda serão definidas.')}
          />
          <PeriodSelector label="Últimas 24 horas" disabled />
        </div>
      </section>
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Notificações</h2>
        <p className="text-sm text-slate-600">
          Exemplos sem notificações, com uma, com mais de 99 e desabilitado.
          O conteúdo das notificações ainda será definido.
        </p>
        <div className="flex flex-wrap items-center gap-6">
          <NotificationButton onClick={() => alert('Demonstração: nenhuma notificação não lida.')} />
          <NotificationButton count={1} onClick={() => alert('Demonstração: uma notificação não lida.')} />
          <NotificationButton count={120} onClick={() => alert('Demonstração: 120 notificações não lidas.')} />
          <NotificationButton count={2} disabled />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Identificação do usuário</h2>
        <p className="text-sm text-slate-600">
          Dados ilustrativos, sem autenticação ou menu de usuário.
        </p>
        <div className="flex flex-wrap items-center gap-6">
          <UserIdentity name="João Silva" role="Administrador" />
          <UserIdentity name="Ana" role="Desenvolvedora" />
        </div>
      </section>
      </main>
    </div>
  )
}
