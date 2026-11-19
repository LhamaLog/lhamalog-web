import { useEffect, useRef, useState } from 'react'
import { ApiError } from '../../../shared/services/api'
import { useApi } from '../../../shared/services/useApi'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { Checkbox } from '../../../shared/ui/Checkbox'
import { ErrorState } from '../../../shared/ui/ErrorState'
import { LoadingState } from '../../../shared/ui/LoadingState'
import {
  archivedProductsPath,
  fullAccessMessage,
  productAccessErrorMessage,
  productAccessPath,
  productOptions,
  productsPath,
  readProductAccess,
  toggleProduct,
} from '../productAccess'
import type { ProductOption } from '../productAccess'

type Props = {
  userId: string
  personLabel: string
  onClose: () => void
}

const invalidResponse = 'O servidor retornou uma resposta inválida.'

// Products a member can access (spec 005, US4, USID_030.1). Owner and administrators see everything.
export function MemberProductsPanel({ userId, personLabel, onClose }: Props) {
  const request = useApi()
  const requestRef = useRef(request)
  requestRef.current = request
  const [products, setProducts] = useState<ProductOption[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [allProducts, setAllProducts] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)
  const path = productAccessPath(userId)

  useEffect(() => {
    if (!path) {
      setLoading(false)
      setLoadError('Informe o usuário.')
      return
    }
    let active = true
    setLoading(true)
    setLoadError('')
    Promise.all([
      requestRef.current<unknown>(productsPath),
      requestRef.current<unknown>(archivedProductsPath),
      requestRef.current<unknown>(path),
    ])
      .then(([activeProducts, archivedProducts, accessBody]) => {
        if (!active) return
        const options = productOptions(activeProducts, archivedProducts)
        const access = readProductAccess(accessBody)
        if (!options || !access) {
          setLoadError(invalidResponse)
          return
        }
        setProducts(options)
        setAllProducts(access.allProducts)
        setSelected(access.productIds)
      })
      .catch((reason: unknown) => {
        if (active) setLoadError(reason instanceof Error ? reason.message : invalidResponse)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [path, revision])

  async function save() {
    if (!path || saving) return
    setSaving(true)
    setMessage('')
    setError('')
    try {
      const body = readProductAccess(await requestRef.current<unknown>(path, {
        method: 'PUT',
        body: JSON.stringify({ productIds: selected }),
      }))
      if (!body) throw new ApiError(invalidResponse, 200)
      setSelected(body.productIds)
      setMessage('Acessos atualizados.')
    } catch (reason) {
      const known = reason instanceof ApiError ? productAccessErrorMessage(reason.code) : null
      if (reason instanceof ApiError && reason.code === 'full_access') {
        setAllProducts(true)
      }
      if (reason instanceof ApiError && reason.code === 'product_not_found') {
        setRevision((current) => current + 1)
      }
      setError(known ?? (reason instanceof Error ? reason.message : invalidResponse))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="mt-4 space-y-3" aria-label={`Produtos de ${personLabel}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-[#083B7A]">Produtos de {personLabel}</h3>
        <Button variant="outline" size="small" fullWidth={false} onClick={onClose}>Fechar</Button>
      </div>
      {message ? <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-800">{message}</p> : null}
      {error ? <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      {loading ? <LoadingState label="Carregando produtos..." /> : null}
      {!loading && loadError ? <ErrorState description={loadError} onRetry={() => setRevision((current) => current + 1)} /> : null}
      {!loading && !loadError && allProducts ? <p role="status" className="text-sm text-slate-700">{fullAccessMessage}</p> : null}
      {!loading && !loadError && !allProducts && products.length === 0 ? <p role="status" className="text-sm text-slate-600">Nenhum produto cadastrado.</p> : null}
      {!loading && !loadError && !allProducts && products.length > 0 ? (
        <fieldset disabled={saving} className="space-y-2">
          <legend className="sr-only">Produtos que esta pessoa pode acessar</legend>
          {products.map((product) => (
            <Checkbox
              key={product.id}
              id={`product-access-${userId}-${product.id}`}
              label={product.archived ? `${product.name} (arquivado)` : product.name}
              checked={selected.includes(product.id)}
              onChange={() => setSelected((current) => toggleProduct(current, product.id))}
            />
          ))}
          <Button size="small" fullWidth={false} onClick={() => { void save() }}>{saving ? 'Salvando...' : 'Salvar acessos'}</Button>
        </fieldset>
      ) : null}
    </Card>
  )
}
