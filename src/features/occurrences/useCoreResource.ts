import { useEffect, useState } from 'react'
import { ApiError } from '../../shared/services/api'
import { endsSession } from '../../shared/services/sessionRedirect'
import { useApi } from '../../shared/services/useApi'

// Like useApiResource, but keeps the HTTP status of the failure: the occurrence screens show the 404 of the Core
// in their own words (spec 008, FR-012 and the product filter). Older requests are aborted (FR-014).
export function useCoreResource<T>(path: string | null) {
  const request = useApi()
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<{ message: string; status: number } | null>(null)
  const [loading, setLoading] = useState(path !== null)
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    if (path === null) return
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    request<T>(path, { signal: controller.signal })
      .then(value => { if (!controller.signal.aborted) setData(value) })
      .catch(reason => {
        if (controller.signal.aborted || endsSession(reason)) return
        setData(null)
        setError({
          message: reason?.message || 'Não foi possível carregar os dados.',
          status: reason instanceof ApiError ? reason.status : 0,
        })
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [path, request, revision])
  return { data, error, loading, reload: () => setRevision(value => value + 1) }
}
