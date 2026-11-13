import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useApi } from '../../../shared/services/useApi'
import { ApiError } from '../../../shared/services/api'
import { useApiResource } from '../../../shared/hooks/useApiResource'
import { Input } from '../../../shared/ui/Input'
import { Textarea } from '../../../shared/ui/Textarea'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { LoadingState } from '../../../shared/ui/LoadingState'
import { ErrorState } from '../../../shared/ui/ErrorState'
import type { Company } from '../types'

const dataFields = { legalName: 'Razão social', tradeName: 'Nome fantasia', document: 'Documento (CNPJ ou VAT)', registrationDate: 'Data de inscrição', size: 'Porte' }
const contextFields = { sector: 'Setor de atuação', mission: 'Missão', targetAudience: 'Público-alvo', differentiators: 'Diferenciais', language: 'Idioma' }
const addressFields = { street: 'Logradouro', number: 'Número', complement: 'Complemento', district: 'Bairro', city: 'Cidade', state: 'Estado', country: 'País', postalCode: 'CEP' }

export function CompanyPage() {
  const resource = useApiResource<Company>('/api/company')
  if (resource.loading) return <LoadingState label="Carregando empresa..." />
  if (resource.error || !resource.data) return <ErrorState description={resource.error} onRetry={resource.reload} />
  return <CompanyForm initial={resource.data} reload={resource.reload} />
}

function CompanyForm({ initial, reload }: { initial: Company; reload: () => void }) {
  const [company, setCompany] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState<ApiError | null>(null)
  const pending = useRef(false)
  const controller = useRef<AbortController | null>(null)
  const request = useApi()
  useEffect(() => () => controller.current?.abort(), [])

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (pending.current) return
    pending.current = true
    controller.current = new AbortController()
    setSaving(true); setError(null); setMessage('')
    try {
      const saved = await request<Company>('/api/company', {
        method: 'PUT', signal: controller.current.signal,
        body: JSON.stringify({ data: company.data, context: company.context, address: company.address, version: company.version }),
      })
      if (!controller.current.signal.aborted) { setCompany(saved); setMessage('Dados da empresa salvos.') }
    } catch (reason) {
      if (!controller.current.signal.aborted) setError(reason instanceof ApiError ? reason : new ApiError('Não foi possível salvar.', 0))
    } finally {
      pending.current = false
      if (!controller.current.signal.aborted) setSaving(false)
    }
  }

  return <form onSubmit={submit} className="space-y-5">
    <PageHeader title="Configurações da Empresa" description="Mantenha os dados e o contexto da empresa selecionada." />
    <nav aria-label="Seções da empresa" className="flex flex-wrap gap-4 rounded-xl bg-white p-4 text-sm text-[#0C70F2]">
      <a href="#company-data">Dados da Empresa</a><a href="#company-context">Contexto de Atuação</a><a href="#company-address">Endereço</a>
    </nav>
    {error && <div role="alert" className="rounded-lg bg-red-50 p-4 text-red-700">{error.message}
      {error.status === 409 && <Button onClick={reload} variant="outline" fullWidth={false}>Recarregar dados</Button>}
    </div>}
    {message && <p role="status" className="rounded-lg bg-green-50 p-4 text-green-800">{message}</p>}
    <fieldset disabled={saving} className="space-y-5">
      <Card id="company-data" className="space-y-4 scroll-mt-4">
        <h2 className="font-bold text-[#083B7A]">Dados da Empresa</h2>
        <p className="text-sm text-slate-500">Os campos cadastrais são opcionais. Complete-os para enriquecer as informações da empresa.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {Object.entries(dataFields).map(([key, label]) => <Input key={key} id={`company-${key}`} label={label} compact
            type={key === 'registrationDate' ? 'date' : 'text'} maxLength={200}
            value={company.data[key as keyof Company['data']] ?? ''} error={error?.fieldErrors[`data.${key}`]}
            onChange={event => { setMessage(''); setCompany({ ...company, data: { ...company.data, [key]: key === 'registrationDate' ? event.target.value || null : event.target.value } }) }} />)}
        </div>
      </Card>
      <Card id="company-context" className="space-y-4 scroll-mt-4">
        <h2 className="font-bold text-[#083B7A]">Contexto de Atuação</h2>
        {Object.values(company.context).some(value => !value?.trim()) && <p className="text-sm text-amber-800">Há campos de contexto vazios. Você pode salvar e completá-los depois.</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          {Object.entries(contextFields).map(([key, label]) => <Textarea key={key} id={`company-${key}`} label={label}
            maxLength={key === 'sector' || key === 'language' ? 200 : 10000}
            value={company.context[key as keyof Company['context']] ?? ''} error={error?.fieldErrors[`context.${key}`]}
            onChange={event => { setMessage(''); setCompany({ ...company, context: { ...company.context, [key]: event.target.value } }) }} />)}
        </div>
      </Card>
      <Card id="company-address" className="space-y-4 scroll-mt-4">
        <h2 className="font-bold text-[#083B7A]">Endereço</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {Object.entries(addressFields).map(([key, label]) => <Input key={key} id={`company-${key}`} label={label} compact maxLength={200}
            value={company.address[key as keyof Company['address']] ?? ''} error={error?.fieldErrors[`address.${key}`]}
            onChange={event => { setMessage(''); setCompany({ ...company, address: { ...company.address, [key]: event.target.value } }) }} />)}
        </div>
      </Card>
      <Button type="submit" fullWidth={false}>{saving ? 'Salvando...' : 'Salvar alterações'}</Button>
    </fieldset>
  </form>
}
