import { useEffect, useState } from 'react'
import { useOrganization } from '@clerk/react'
import { peopleIndex } from './tokenManagement'
import type { MembershipPerson, PeopleIndex } from './tokenManagement'

const pageSize = 50
const maxPages = 10

// Names of the organization people by userId, for "criada por", "revogada por" and the audit (spec 013, K5).
// Same call as the Equipe page and the "Responsável pelo produto" field; nothing changes in the Clerk setup.
// null while loading, when disabled or when the list cannot be read: the screen then shows "Usuário removido".
export function useOrganizationPeople(enabled: boolean): PeopleIndex | null {
  const { organization, isLoaded } = useOrganization()
  const [people, setPeople] = useState<PeopleIndex | null>(null)

  useEffect(() => {
    if (!enabled || !isLoaded || !organization) return
    const current = organization
    let cancelled = false
    async function load() {
      const found: MembershipPerson[] = []
      for (let page = 1; page <= maxPages; page += 1) {
        const result = await current.getMemberships({ initialPage: page, pageSize })
        found.push(...result.data.map((membership) => membership.publicUserData ?? {}))
        const total = result.total_count ?? result.data.length
        if (page * pageSize >= total || result.data.length === 0) break
      }
      return found
    }
    load()
      .then((found) => { if (!cancelled) setPeople(peopleIndex(found)) })
      .catch(() => { if (!cancelled) setPeople(null) })
    return () => { cancelled = true }
  }, [enabled, isLoaded, organization])

  return people
}
