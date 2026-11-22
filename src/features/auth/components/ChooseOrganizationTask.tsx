import { TaskChooseOrganization } from '@clerk/react'
import { AuthBackground } from './AuthBackground'
import { OrganizationPlanNotice } from './OrganizationPlanNotice'

// Etapa pós-login "escolher organização" (session task "choose-organization", ADR_026, ADR_030).
// Esta etapa também cria organização, então mostra o mesmo aviso de "Cadastrar empresa" (spec 006, FR-008).
export function ChooseOrganizationTask() {
  return (
    <AuthBackground>
      <div className="lh-criar-organizacao">
        <OrganizationPlanNotice />
        <TaskChooseOrganization redirectUrlComplete="/" />
      </div>
    </AuthBackground>
  )
}
