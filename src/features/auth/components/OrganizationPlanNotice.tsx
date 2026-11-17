// Enquanto o fluxo de compra (LLT-157) não existe, a empresa nova não tem Tenant e o Core recusa o acesso:
// o aviso aparece em toda tela que cria organização, antes da criação (spec 005, FR-008).
export function OrganizationPlanNotice() {
  return (
    <p role="note" className="lh-aviso">
      A empresa nova só dá acesso ao LhamaLog depois da contratação de um plano, que ainda não está disponível.
      Para testar, use uma empresa já liberada.
    </p>
  )
}
