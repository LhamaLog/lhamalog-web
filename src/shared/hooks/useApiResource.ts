import { useEffect, useState } from 'react'
import { useApi } from '../services/useApi'

export function useApiResource<T>(path: string) {
  const request = useApi()
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')
    request<T>(path, { signal: controller.signal })
      .then(value => { if (!controller.signal.aborted) setData(value) })
      .catch(reason => { if (!controller.signal.aborted) setError(reason.message ?? 'Falha ao carregar os dados.') })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [path, request, revision])
  return { data, error, loading, reload: () => setRevision(value => value + 1) }
}
