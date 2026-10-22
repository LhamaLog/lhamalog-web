import { Input } from '../shared/ui/Input'
import { PasswordInput } from '../shared/ui/PasswordInput'
import { Button } from '../shared/ui/Button'
import { Checkbox } from '../shared/ui/Checkbox'

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

        <Button onClick={() => alert('Botão funcionando!')}>
          Entrar
        </Button>
        
      </div>
    </main>
  )
}