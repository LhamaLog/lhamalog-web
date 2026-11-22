import { useEffect, useState } from 'react'
import { useOrganization } from '@clerk/react'
import type { OrganizationMembershipResource, OrganizationResource } from '@clerk/shared/types'
import { ApiError } from '../../../shared/services/api'
import { useApi } from '../../../shared/services/useApi'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { Checkbox } from '../../../shared/ui/Checkbox'
import { LoadingState } from '../../../shared/ui/LoadingState'
import { membersFromAccessRole, readRole, roleErrorMessage, roleMemberPath, rolePath } from '../roleContract'
import type { NotificationRole } from '../roleContract'

type Person = { userId: string, name: string, admin: boolean }

type Props = {
  role: NotificationRole
  ownerUserId: string | null
  onChanged: (role: NotificationRole) => void
  onClose: () => void
}

const pageSize = 10
const maxPages = 100

// Same paginated read of the organization members as the Team screen (only calls that already exist; no new Clerk call).
async function everyPerson(organization: OrganizationResource): Promise<Person[]> {
  const people: Person[] = []
  let page = 1
  let total = 0
  do {
    const result = await organization.getMemberships({ initialPage: page, pageSize })
    total = result.total_count ?? result.data.length
    for (const member of result.data as OrganizationMembershipResource[]) {
      const data = member.publicUserData
      if (!data?.userId) continue
      const name = [data.firstName, data.lastName].filter(Boolean).join(' ').trim() || data.identifier || data.userId
      people.push({ userId: data.userId, name, admin: member.role.replace(/^org:/, '') === 'admin' })
    }
    page += 1
  } while ((page - 1) * pageSize < total && page <= maxPages)
  return people
}

// People of a notification role (spec 012, US6). Owner and administrator roles are read only (ADR_140).
export function RoleMembersPanel({ role, ownerUserId, onChanged, onClose }: Props) {
  const { organization } = useOrganization()
  const request = useApi()
  const [people, setPeople] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!organization) return
    let active = true
    setLoading(true)
    everyPerson(organization)
      .then((found) => { if (active) setPeople(found) })
      .catch(() => { if (active) setError('Não foi possível carregar as pessoas da empresa.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [organization])

  async function toggle(person: Person) {
    const path = roleMemberPath(role.id, person.userId)
    if (!path || busy) return
    const inRole = role.memberUserIds.includes(person.userId)
    setBusy(true)
    setMessage('')
    setError('')
    try {
      let body: unknown
      if (inRole) {
        // DELETE answers 204 without body: read the role again to get the new list and version.
        await request<unknown>(path, { method: 'DELETE' })
        body = await request<unknown>(rolePath(role.id))
      } else {
        body = await request<unknown>(path, { method: 'POST' })
      }
      const updated = readRole(body)
      if (!updated) throw new ApiError('O servidor retornou uma resposta inválida.', 200)
      onChanged(updated)
      setMessage('Cargo atualizado.')
    } catch (reason) {
      const known = reason instanceof ApiError ? roleErrorMessage(reason.code) : null
      setError(known ?? (reason instanceof Error ? reason.message : 'Não foi possível atualizar o cargo.'))
    } finally {
      setBusy(false)
    }
  }

  const fromAccess = membersFromAccessRole(role)
  const accessPeople = people.filter((person) => role.defaultKey === 'OWNER'
    ? person.userId === ownerUserId
    : person.admin && person.userId !== ownerUserId)

  return (
    <Card className="mt-3 space-y-3" aria-label={`Pessoas do cargo ${role.name}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-[#083B7A]">Pessoas do cargo {role.name}</h3>
        <Button variant="outline" size="small" fullWidth={false} onClick={onClose}>Fechar</Button>
      </div>
      {message ? <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-800">{message}</p> : null}
      {error ? <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      {loading ? <LoadingState label="Carregando pessoas..." /> : null}
      {!loading && fromAccess ? (
        <div className="space-y-2">
          <p className="text-sm text-slate-700">As pessoas deste cargo vêm do papel de acesso.</p>
          {accessPeople.length === 0
            ? <p role="status" className="text-sm text-slate-600">{role.defaultKey === 'OWNER' ? 'A empresa ainda não tem Dono.' : 'Nenhum Administrador.'}</p>
            : <ul className="list-disc pl-5 text-sm text-slate-800">{accessPeople.map((person) => <li key={person.userId}>{person.name}</li>)}</ul>}
        </div>
      ) : null}
      {!loading && !fromAccess ? (
        <fieldset disabled={busy} className="space-y-2">
          <legend className="sr-only">Pessoas que recebem os alertas deste cargo</legend>
          {people.length === 0 ? <p role="status" className="text-sm text-slate-600">Nenhuma pessoa na empresa.</p> : null}
          {people.map((person) => (
            <Checkbox
              key={person.userId}
              id={`role-${role.id}-member-${person.userId}`}
              label={person.name}
              checked={role.memberUserIds.includes(person.userId)}
              onChange={() => { void toggle(person) }}
            />
          ))}
        </fieldset>
      ) : null}
    </Card>
  )
}
