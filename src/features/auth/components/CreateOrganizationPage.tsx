import { CreateOrganization } from '@clerk/react'
import { AuthBackground } from './AuthBackground'
import { OrganizationPlanNotice } from './OrganizationPlanNotice'

// Tela "Criar organização" (organização = empresa cliente, ADR_121/ADR_158).
// skipInvitationScreen permanece: criar empresa não mostra a etapa de convite da plataforma.
// Convidar alguém é a tela /equipe, pelo SDK do navegador na sessão do administrador,
// sem API de convite no Core e sem segredo.
// Enquanto o fluxo de compra (LLT-157) não existe, a empresa nova não tem Tenant e o Core recusa o acesso:
// o aviso explica isso antes da criação (spec 006, FR-008).
export function CreateOrganizationPage() {
  return (
    <AuthBackground>
      <div className="lh-criar-organizacao">
        <OrganizationPlanNotice />
        <CreateOrganization
          routing="path"
          path="/organizacoes/nova"
          afterCreateOrganizationUrl="/"
          skipInvitationScreen
        />
      </div>
    </AuthBackground>
  )
}
