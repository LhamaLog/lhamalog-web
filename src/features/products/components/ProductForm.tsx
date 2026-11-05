import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useApi } from '../../../shared/services/useApi'
import { ApiError } from '../../../shared/services/api'
import { Button } from '../../../shared/ui/Button'
import { Input } from '../../../shared/ui/Input'
import { Textarea } from '../../../shared/ui/Textarea'
import { Card } from '../../../shared/ui/Card'
import { emptyProductContext } from '../types'
import type { Product, ProductContext } from '../types'

const contextLabels = { problemSolved: 'Problema resolvido', targetAudience: 'Público-alvo', differentiators: 'Diferenciais', keywords: 'Palavras-chave', restrictions: 'Restrições' }

export function ProductForm({ product, onSaved, onCancel }: { product?: Product; onSaved: (product: Product) => void; onCancel: () => void }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [productVersion, setProductVersion] = useState('')
  const [context, setContext] = useState<ProductContext>(product?.context ?? emptyProductContext)
  const [error, setError] = useState<ApiError | null>(null)
  const [saving, setSaving] = useState(false)
  const pending = useRef(false)
  const controller = useRef<AbortController | null>(null)
  const request = useApi()
  useEffect(() => () => controller.current?.abort(), [])

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (pending.current) return
    if (!product && !name.trim()) { setError(new ApiError('Informe o nome do produto.', 400, { name: 'Informe o nome do produto.' })); return }
    pending.current = true; setSaving(true); setError(null)
    controller.current = new AbortController()
    try {
      const result = await request<Product>(product ? `/api/products/${encodeURIComponent(product.id)}/context` : '/api/products', {
        method: product ? 'PUT' : 'POST', signal: controller.current.signal,
        body: JSON.stringify(product ? { context, version: product.version } : { name, description, category, productVersion, context }),
      })
      if (!controller.current.signal.aborted) onSaved(result)
    } catch (reason) {
      if (!controller.current.signal.aborted) setError(reason instanceof ApiError ? reason : new ApiError('Não foi possível salvar.', 0))
    } finally {
      pending.current = false
      if (!controller.current.signal.aborted) setSaving(false)
    }
  }

  return <Card className="space-y-5">
    <h2 className="text-xl font-bold text-[#083B7A]">{product ? `Contexto de ${product.name}` : 'Cadastrar produto'}</h2>
    <form onSubmit={submit} className="space-y-4">
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">{error.message}{error.status === 409 ? ' Volte à lista e abra o produto novamente.' : ''}</p>}
      <fieldset disabled={saving} className="space-y-4">
        {!product && <div className="grid gap-4 sm:grid-cols-2">
          <Input id="product-name" label="Nome do produto" required maxLength={200} compact value={name} onChange={event => setName(event.target.value)} error={error?.fieldErrors.name} />
          <Input id="product-category" label="Categoria" maxLength={200} compact value={category} onChange={event => setCategory(event.target.value)} error={error?.fieldErrors.category} />
          <Input id="product-version" label="Versão" maxLength={200} compact value={productVersion} onChange={event => setProductVersion(event.target.value)} error={error?.fieldErrors.productVersion} />
          <Textarea id="product-description" label="Descrição" maxLength={10000} value={description} onChange={event => setDescription(event.target.value)} error={error?.fieldErrors.description} />
        </div>}
        <h3 className="font-bold text-[#083B7A]">Contexto do produto</h3>
        {Object.values(context).some(value => !value?.trim()) && <p className="text-sm text-amber-800">Há campos de contexto vazios. Você pode salvar e completá-los depois.</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          {Object.entries(contextLabels).map(([key, label]) => <Textarea key={key} id={`product-${key}`} label={label} maxLength={10000}
            value={context[key as keyof ProductContext] ?? ''} error={error?.fieldErrors[`context.${key}`]}
            onChange={event => setContext({ ...context, [key]: event.target.value })} />)}
        </div>
        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="outline" fullWidth={false} onClick={onCancel}>Cancelar</Button>
          <Button type="submit" fullWidth={false}>{saving ? 'Salvando...' : product ? 'Salvar contexto' : 'Cadastrar produto'}</Button>
        </div>
      </fieldset>
    </form>
  </Card>
}
