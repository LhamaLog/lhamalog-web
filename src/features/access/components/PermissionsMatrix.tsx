import { useApiResource } from '../../../shared/hooks/useApiResource'
import { Card } from '../../../shared/ui/Card'
import { ErrorState } from '../../../shared/ui/ErrorState'
import { LoadingState } from '../../../shared/ui/LoadingState'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { accessCatalogPath, accessRoles, readCatalog } from '../accessContract'
import { matrixNote, permissionLabel, roleLabel } from '../labels'
import { useAccess } from '../useAccess'

// Read-only matrix of what each access role can do (spec 012, US7, W2). ADR_123 has no custom access roles,
// so there is nothing to edit here.
export function PermissionsMatrix() {
  const access = useAccess()
  const allowed = access.can('MEMBERS_VIEW')
  if (access.status === 'loading') return <LoadingState label="Carregando acesso..." />
  if (!allowed) {
    return <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">Somente o Dono ou um Administrador pode ver as permissões.</p>
  }
  return <MatrixTable />
}

function MatrixTable() {
  const { data, error, loading, reload } = useApiResource<unknown>(accessCatalogPath)
  const catalog = data === null ? null : readCatalog(data)
  return (
    <div className="space-y-5">
      <PageHeader title="Permissões" description="O que cada papel de acesso pode fazer. Os papéis não são editáveis." />
      {loading ? <LoadingState label="Carregando permissões..." /> : null}
      {!loading && error ? <ErrorState description={error} onRetry={reload} /> : null}
      {!loading && !error && data !== null && !catalog ? <ErrorState description="O servidor retornou uma resposta inválida." onRetry={reload} /> : null}
      {!loading && !error && catalog ? (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <caption className="sr-only">Permissões de cada papel de acesso</caption>
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th scope="col" className="px-2 py-2 font-semibold">Permissão</th>
                {accessRoles.map((role) => <th key={role} scope="col" className="px-2 py-2 text-center font-semibold">{roleLabel(role)}</th>)}
                <th scope="col" className="px-2 py-2 font-semibold">Observação</th>
              </tr>
            </thead>
            <tbody>
              {catalog.matrix.map((row) => (
                <tr key={row.permission} className="border-t border-slate-200">
                  <th scope="row" className="px-2 py-3 font-normal">{permissionLabel(row.permission)}</th>
                  {accessRoles.map((role) => (
                    <td key={role} className="px-2 py-3 text-center">
                      {row.roles.includes(role) ? <span aria-label="Pode">✓</span> : <span aria-label="Não pode" className="text-slate-400">–</span>}
                    </td>
                  ))}
                  <td className="px-2 py-3 text-slate-600">{matrixNote(row.note)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : null}
    </div>
  )
}
