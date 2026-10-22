import { Input } from '../shared/ui/Input'
import { PasswordInput } from '../shared/ui/PasswordInput'
import { Checkbox } from '../shared/ui/Checkbox'
import { Button } from '../shared/ui/Button'
import { IconButton } from '../shared/ui/IconButton'
import { Badge } from '../shared/ui/Badge'

export function App() {
  return (
    <main className="mx-auto max-w-3xl space-y-10 p-6">
      <h1 className="text-2xl font-bold text-slate-900">
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


    </main>
  )
}