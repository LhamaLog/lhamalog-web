import { createContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useAuth } from '@clerk/react'
import { ApiError } from '../../shared/services/api'
import { useApi } from '../../shared/services/useApi'
import { accessCatalogPath, accessFallback, accessMePath, can, readCatalog, readMe } from './accessContract'
import type { AccessRole, AccessStatus } from './accessContract'

type AccessData = {
  status: AccessStatus
  role: AccessRole | null
  permissions: string[]
  ownerUserId: string | null
  error: string
}

export type AccessState = AccessData & {
  can: (permission: string) => boolean
  reload: () => void
}

export const AccessContext = createContext<AccessState | null>(null)

const loading: AccessData = { status: 'loading', role: null, permissions: [], ownerUserId: null, error: '' }

const invalidResponse = 'O servidor retornou uma resposta inválida.'

// Role and permissions of the person in the selected company, from the Core (spec 005, FR-W01).
// Reloaded at every organization change; the previous company's access is dropped at once.
export function AccessProvider({ children }: { children: ReactNode }) {
  const { orgId, orgRole } = useAuth()
  const request = useApi()
  const requestRef = useRef(request)
  requestRef.current = request
  const [data, setData] = useState<AccessData>(loading)
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    if (!orgId) {
      setData({ ...loading, status: 'error' })
      return
    }
    let active = true
    setData(loading)
    const load = async () => {
      try {
        const me = readMe(await requestRef.current<unknown>(accessMePath))
        if (!me) throw new ApiError(invalidResponse, 200)
        let ownerUserId: string | null = null
        if (can(me.permissions, 'MEMBERS_VIEW')) {
          const catalog = readCatalog(await requestRef.current<unknown>(accessCatalogPath))
          if (!catalog) throw new ApiError(invalidResponse, 200)
          ownerUserId = catalog.ownerUserId
        }
        if (active) setData({ status: 'ready', role: me.role, permissions: me.permissions, ownerUserId, error: '' })
      } catch (reason) {
        if (!active) return
        if (reason instanceof ApiError && reason.status === 404) {
          // Core without LLT-120: keep the screens working with the Clerk role. Remove after the Core merge.
          console.warn('Core sem as rotas de acesso da LLT-120: usando o papel da Clerk.')
          const fallback = accessFallback(orgRole)
          setData({ status: 'legacy', role: fallback.role, permissions: fallback.permissions, ownerUserId: null, error: '' })
          return
        }
        setData({ ...loading, status: 'error', error: reason instanceof Error ? reason.message : 'Não foi possível carregar o seu acesso.' })
      }
    }
    void load()
    return () => { active = false }
  }, [orgId, orgRole, revision])

  const value = useMemo<AccessState>(() => ({
    ...data,
    can: (permission: string) => can(data.permissions, permission),
    reload: () => setRevision((current) => current + 1),
  }), [data])

  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>
}
