import { CreateOrganization } from '@clerk/react'
import { AuthBackground } from './AuthBackground'

// Tela "Criar organização" (organização = empresa cliente, ADR_121/ADR_158).
// skipInvitationScreen: convite de membros é feito pelo backend (ADR_114), não pela UI da Clerk.
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
