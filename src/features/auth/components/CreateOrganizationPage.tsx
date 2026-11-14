import { CreateOrganization } from '@clerk/react'
import { AuthBackground } from './AuthBackground'

// Tela "Criar organização" (organização = empresa cliente, ADR_121/ADR_158).
// skipInvitationScreen permanece: criar empresa não mostra a etapa de convite da plataforma.
// Convidar alguém é a tela /equipe, pelo SDK do navegador na sessão do administrador,
// sem API de convite no Core e sem segredo.
export function CreateOrganizationPage() {
  return (
    <AuthBackground>
      <CreateOrganization
        routing="path"
        path="/organizacoes/nova"
        afterCreateOrganizationUrl="/"
        skipInvitationScreen
      />
    </AuthBackground>
  )
}
