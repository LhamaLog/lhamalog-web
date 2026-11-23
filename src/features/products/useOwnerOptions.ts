import { useEffect, useState } from 'react'
import { useOrganization } from '@clerk/react'
import { ownerOptions } from './productEdit'

const pageSize = 50
const maxPages = 10

// People of the organization for "Responsável pelo produto" (spec 009, clarify N3). It reads
// organization.getMemberships, the same call the Equipe page already makes; nothing changes in the Clerk setup.
// null while loading or when the list cannot be read: the form then shows a text field.
export function useOwnerOptions(): string[] | null {
  const { organization, isLoaded } = useOrganization()
  const [owners, setOwners] = useState<string[] | null>(null)

  useEffect(() => {
    if (!isLoaded || !organization) return
    const current = organization
    let cancelled = false
    async function load() {
      const people: { firstName?: string | null; lastName?: string | null; identifier?: string | null }[] = []
      for (let page = 1; page <= maxPages; page += 1) {
        const result = await current.getMemberships({ initialPage: page, pageSize })
        people.push(...result.data.map((membership) => membership.publicUserData ?? {}))
        const total = result.total_count ?? result.data.length
        if (page * pageSize >= total || result.data.length === 0) break
      }
      return people
    }
    load()
      .then((people) => { if (!cancelled) setOwners(ownerOptions(people)) })
      .catch(() => { if (!cancelled) setOwners(null) })
    return () => { cancelled = true }
  }, [isLoaded, organization])

  return owners
}
