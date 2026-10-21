import { Input } from '../shared/ui/Input'
import { Button } from '../shared/ui/Button'

export function App() {
  return (
    <main className="p-6">
      <div className="flex w-full max-w-96 flex-col gap-6">
        <Input
          id="email"
          label="E-mail"
          type="email"
          placeholder="seu@exemplo.com"
          autoComplete="email"
        />

        <Input
          id="password"
          label="Senha"
          type="password"
          placeholder="Sua senha"
          autoComplete="current-password"
        />

        <Button onClick={() => alert('Botão funcionando!')}>
          Entrar
        </Button>

      </div>
    </main>
  )
}