import { useEffect, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { ApiError } from '../../../shared/services/api'
import { useApi } from '../../../shared/services/useApi'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { Input } from '../../../shared/ui/Input'
import { Select } from '../../../shared/ui/Select'
import { Textarea } from '../../../shared/ui/Textarea'
import { Toggle } from '../../../shared/ui/Toggle'
import { loadProductDraft, moveProductDraft, saveProductDraft } from '../draft'
import { environmentLabel, productFieldErrors } from '../productListModel'
import { emptyProductContext, emptyProductDraft } from '../types'
import type { Product, ProductContext, ProductUiDraft } from '../types'

const contextLabels: Record<keyof ProductContext, string> = {
  problemSolved: 'Problema resolvido',
  targetAudience: 'Público-alvo',
  differentiators: 'Diferenciais',
  keywords: 'Palavras-chave',
  restrictions: 'Restrições',
}

const productTypes = ['Aplicação Web', 'API', 'Aplicativo mobile', 'Job em batch', 'Infraestrutura']
const environments = ['Produção', 'Homologação', 'Desenvolvimento']
const domains = ['Financeiro', 'E-commerce', 'Plataforma', 'Dados', 'Comunicação', 'Aplicação', 'Infraestrutura']
const teams = ['Equipe Plataforma', 'Squad Pagamentos', 'Squad Dados', 'Squad Mobile', 'Operações / SRE']
const criticalities = ['Baixa', 'Média', 'Alta', 'Crítica']
const projects = ['Plataforma Web', 'Aplicativo Mobile', 'Dados e Analytics', 'Infraestrutura']
const services = ['Gateway de Pagamentos', 'API Pública', 'Frontend Web', 'Worker de Processamento']
const logLevels = ['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR']
const protocols = ['OTLP/HTTP', 'OTLP/gRPC']

const tabs = [
  { id: 'info', label: 'Informações do produto' },
  { id: 'context', label: 'Contexto para IA' },
  { id: 'otel', label: 'Integração OpenTelemetry' },
] as const

type ProductTab = (typeof tabs)[number]['id']

type ProductRequest = <T,>(path: string, options?: RequestInit) => Promise<T>

export function ProductForm({ product, onSaved, onCancel }: { product?: Product; onSaved: (product: Product) => void; onCancel: () => void }) {
  return <ProductEditor product={product} onSaved={onSaved} onCancel={onCancel} request={useApi()} />
}

export function ProductEditor({ product, onSaved, onCancel, request }: { product?: Product; onSaved: (product: Product) => void; onCancel: () => void; request: ProductRequest }) {
  const [tab, setTab] = useState<ProductTab>('info')
  const [name, setName] = useState(product?.name ?? '')
  const [description, setDescription] = useState(product?.description ?? '')
  const [category, setCategory] = useState(product?.category ?? '')
  const [productVersion, setProductVersion] = useState(product?.productVersion ?? '')
  const [context, setContext] = useState<ProductContext>(product?.context ?? emptyProductContext)
  const [draft, setDraft] = useState<ProductUiDraft>(() => initialDraft(product))
  const [error, setError] = useState<ApiError | null>(null)
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const pending = useRef(false)
  const controller = useRef<AbortController | null>(null)
  const editing = Boolean(product)
  const errors = { ...localErrors, ...(error?.fieldErrors ?? {}) }

  useEffect(() => () => controller.current?.abort(), [])

  function patchDraft(partial: Partial<ProductUiDraft>) {
    setDraft((current) => ({ ...current, ...partial }))
    setLocalErrors({})
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    const found = productFieldErrors({ editing, name, category, draft })
    if (Object.keys(found).length > 0) {
      setLocalErrors(found)
      setError(new ApiError('Confira os campos destacados.', 400, found))
      setTab('info')
      return
    }
    if (!product && !name.trim()) {
      setError(new ApiError('Informe o nome do produto.', 400, { name: 'Informe o nome do produto.' }))
      return
    }
    if (pending.current) return
    pending.current = true
    setSaving(true)
    setError(null)
    controller.current = new AbortController()
    try {
      const result = await request<Product>(product ? `/api/products/${encodeURIComponent(product.id)}/context` : '/api/products', {
        method: product ? 'PUT' : 'POST',
        signal: controller.current.signal,
        body: JSON.stringify(product ? { context, version: product.version } : { name, description, category, productVersion, context }),
      })
      if (!controller.current.signal.aborted) {
        if (product) saveProductDraft(product.id, draft)
        else moveProductDraft('new', result.id, draft)
        onSaved(result)
      }
    } catch (reason) {
      if (!controller.current.signal.aborted) setError(reason instanceof ApiError ? reason : new ApiError('Não foi possível salvar.', 0))
    } finally {
      pending.current = false
      if (!controller.current.signal.aborted) setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <div className="space-y-2">
        <button type="button" onClick={onCancel} className="inline-flex cursor-pointer items-center rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-[#083B7A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0C70F2]" aria-label="Voltar para a lista de produtos">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 18 9 12l6-6" /></svg>
        </button>
        <h2 className="text-3xl font-bold text-[#083B7A]">{editing ? 'Editar produto' : 'Cadastrar produto'}</h2>
        <p className="max-w-3xl text-sm text-[#0C70F2]">Cadastre o software, serviço ou aplicação da empresa que será monitorado e terá seus logs analisados pelo LhamaLog.</p>
      </div>
      <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-2" role="tablist" aria-label="Etapas do produto">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={`cursor-pointer rounded-lg px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0C70F2] ${tab === item.id ? 'bg-blue-50 font-semibold text-[#0C70F2]' : 'text-slate-500 hover:bg-slate-50 hover:text-[#083B7A]'}`}
          >
            {item.label}
          </button>
        ))}
      </div>
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error.message}{error.status === 409 ? ' Volte à lista e abra o produto novamente.' : ''}</p>}
      {editing && tab === 'info' && <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">Nome, descrição, domínio e versão fazem parte do cadastro. A edição envia o contexto do produto para a API.</p>}

      <fieldset disabled={saving} className="m-0 min-w-0 border-0 p-0">
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-4">
          {tab === 'info' && (
            <>
              <Section number="1" title="Informações básicas" description="Defina as informações principais do produto.">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input id="product-name" label="Nome do produto" requiredMark compact maxLength={200} disabled={editing} value={name} error={errors.name} onChange={(event) => { setName(event.target.value); setLocalErrors({}) }} />
                  <Textarea id="product-description" label="Descrição" maxLength={10000} disabled={editing} value={description} error={errors.description} onChange={(event) => setDescription(event.target.value)} />
                  <ChoiceField id="product-type" label="Tipo de produto" requiredMark value={draft.productType} options={productTypes} error={errors.productType} onChange={(productType) => patchDraft({ productType })} />
                  <ChoiceField id="product-environment" label="Ambiente" requiredMark value={draft.environment} options={environments} error={errors.environment} onChange={(value) => patchDraft({ environment: value })} />
                </div>
              </Section>
              <Section number="2" title="Identificação do sistema" description="Informe a área, equipe e detalhes de identificação do sistema.">
                <div className="grid gap-4 sm:grid-cols-2">
                  <ChoiceField id="product-domain" label="Domínio / Área" requiredMark value={category} options={domains} error={errors.category} disabled={editing} onChange={(value) => { setCategory(value); setLocalErrors({}) }} />
                  <ChoiceField id="product-team" label="Equipe responsável" requiredMark value={draft.team} options={teams} error={errors.team} onChange={(team) => patchDraft({ team })} />
                  <Input id="product-version" label="Versão (opcional)" compact maxLength={200} disabled={editing} placeholder="v2.4.0" value={productVersion} error={errors.productVersion} onChange={(event) => setProductVersion(event.target.value)} />
                  <ChoiceField id="product-criticality" label="Criticidade" requiredMark value={draft.criticality} options={criticalities} error={errors.criticality} onChange={(criticality) => patchDraft({ criticality })} />
                </div>
              </Section>
              <Section number="3" title="Vinculação e monitoramento" description="Associe o produto ao projeto, defina a aplicação principal e o nível de log padrão.">
                <div className="grid gap-4 sm:grid-cols-2">
                  <ChoiceField id="product-project" label="Projeto" requiredMark value={draft.project} options={projects} error={errors.project} onChange={(project) => patchDraft({ project })} />
                  <ChoiceField id="product-service" label="Aplicação principal / Serviço" requiredMark value={draft.service} options={services} error={errors.service} onChange={(service) => patchDraft({ service })} />
                  <Select id="product-log-level" label="Nível de log padrão" requiredMark value={draft.logLevel} error={errors.logLevel} onChange={(event) => patchDraft({ logLevel: event.target.value })}>
                    {logLevels.map((level) => <option key={level} value={level}>{level}</option>)}
                  </Select>
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2">
                    <span>
                      <span className="block text-sm font-semibold text-slate-900">Produto ativo</span>
                      <span className="block text-xs text-slate-500">Habilita a coleta e análise de logs deste produto.</span>
                    </span>
                    <Toggle label="Produto ativo" checked={draft.active} onChange={(active) => patchDraft({ active })} />
                  </div>
                </div>
              </Section>
            </>
          )}
          {tab === 'context' && (
            <Section number="1" title="Contexto para IA" description="Estas informações são enviadas no contexto do produto e ajudam a IA a interpretar os logs.">
              {Object.values(context).some((value) => !value.trim()) && <p className="text-sm text-amber-800">Há campos de contexto vazios. Você pode salvar e completá-los depois.</p>}
              <div className="grid gap-4 sm:grid-cols-2">
                {(Object.keys(contextLabels) as (keyof ProductContext)[]).map((key) => (
                  <Textarea
                    key={key}
                    id={`product-${key}`}
                    label={contextLabels[key]}
                    maxLength={10000}
                    value={context[key] ?? ''}
                    error={errors[`context.${key}`]}
                    onChange={(event) => setContext({ ...context, [key]: event.target.value })}
                  />
                ))}
              </div>
            </Section>
          )}
          {tab === 'otel' && (
            <Section number="1" title="Integração OpenTelemetry" description="Prepare o envio de sinais do serviço. Estes dados ainda não são enviados ao salvar.">
              <div className="rounded-lg bg-blue-50 p-3 text-sm text-[#083B7A]">A coleta só passa a valer quando a API de integração existir. Até lá, os valores ficam guardados neste navegador.</div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input id="product-otel-endpoint" label="Endpoint do coletor" compact maxLength={300} placeholder="https://otel.exemplo.com/v1/logs" value={draft.otelEndpoint} onChange={(event) => patchDraft({ otelEndpoint: event.target.value })} />
                <Select id="product-otel-protocol" label="Protocolo" value={draft.otelProtocol} onChange={(event) => patchDraft({ otelProtocol: event.target.value })}>
                  {protocols.map((protocol) => <option key={protocol} value={protocol}>{protocol}</option>)}
                </Select>
                <Input id="product-otel-service" label="Nome do serviço" compact maxLength={200} value={draft.otelService} onChange={(event) => patchDraft({ otelService: event.target.value })} />
                <div className="sm:col-span-2">
                  <Textarea id="product-otel-headers" label="Cabeçalhos" maxLength={2000} placeholder="Authorization=Bearer ..." value={draft.otelHeaders} onChange={(event) => patchDraft({ otelHeaders: event.target.value })} />
                </div>
                <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 sm:col-span-2">
                  <span className="text-sm font-semibold text-slate-900">Coleta ativa</span>
                  <Toggle label="Coleta ativa" checked={draft.otelEnabled} onChange={(otelEnabled) => patchDraft({ otelEnabled })} />
                </div>
              </div>
            </Section>
          )}
        </div>
        <aside className="space-y-4 lg:sticky lg:top-4">
          {tab === 'info' && <InfoHelp />}
          {tab === 'context' && <ContextHelp />}
          {tab === 'otel' && <OtelHelp />}
        </aside>
        </div>
      </fieldset>
      <div className="flex flex-wrap justify-end gap-3">
        <Button type="button" variant="outline" fullWidth={false} onClick={onCancel}>Cancelar</Button>
        <Button type="submit" fullWidth={false} disabled={saving}>{saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Cadastrar produto'}</Button>
      </div>
    </form>
  )
}

function initialDraft(product?: Product) {
  if (!product) return emptyProductDraft()
  const stored = loadProductDraft(product.id)
  return { ...stored, environment: stored.environment || environmentLabel(product.environment) }
}

function Section({ number, title, description, children }: { number: string; title: string; description: string; children: ReactNode }) {
  return (
    <Card className="space-y-4">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-sm font-bold text-[#0C70F2]">{number}</span>
        <span>
          <h3 className="font-bold text-[#083B7A]">{number}. {title}</h3>
          <p className="text-xs text-slate-500">{description}</p>
        </span>
      </div>
      {children}
    </Card>
  )
}

function ChoiceField({
  id,
  label,
  value,
  options,
  onChange,
  error,
  requiredMark = false,
  disabled = false,
}: {
  id: string
  label: string
  value: string
  options: string[]
  onChange: (value: string) => void
  error?: string
  requiredMark?: boolean
  disabled?: boolean
}) {
  const custom = value !== '' && !options.includes(value)
  const [other, setOther] = useState(custom)
  const selectValue = other || custom ? '__custom__' : value
  return (
    <div className="space-y-2">
      <Select
        id={id}
        label={label}
        requiredMark={requiredMark}
        disabled={disabled}
        value={selectValue}
        error={other || custom ? undefined : error}
        onChange={(event) => {
          if (event.target.value === '__custom__') {
            setOther(true)
            onChange('')
            return
          }
          setOther(false)
          onChange(event.target.value)
        }}
      >
        <option value="">Selecione</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
        <option value="__custom__">Outro</option>
      </Select>
      {(other || custom) && (
        <Input id={`${id}-custom`} label={`Informe ${label.toLocaleLowerCase('pt-BR')}`} compact maxLength={200} disabled={disabled} value={value} error={error} onChange={(event) => onChange(event.target.value)} />
      )}
    </div>
  )
}

function HelpCard({ title, tone, children }: { title: string; tone: 'blue' | 'amber'; children: ReactNode }) {
  return (
    <Card className="space-y-3">
      <h3 className={`flex items-center gap-2 text-sm font-bold ${tone === 'blue' ? 'text-[#0C70F2]' : 'text-amber-700'}`}>
        <span aria-hidden="true" className={`flex h-7 w-7 items-center justify-center rounded-lg ${tone === 'blue' ? 'bg-blue-50' : 'bg-amber-50'}`}>{tone === 'blue' ? 'i' : '!'}</span>
        {title}
      </h3>
      {children}
    </Card>
  )
}

function InfoHelp() {
  return (
    <>
      <HelpCard title="Sobre o cadastro" tone="blue">
        <p className="text-sm text-slate-600">Um produto representa um software, serviço, API, website, aplicativo mobile, job em batch ou sistema interno da empresa, a partir do qual você deseja centralizar os logs e ter observabilidade no LhamaLog.</p>
        <p className="text-sm font-semibold text-[#083B7A]">Exemplos:</p>
        <ul className="list-disc space-y-1 pl-4 text-sm text-slate-600">
          <li>APIs e serviços de backend</li>
          <li>Aplicações web ou mobile</li>
          <li>Sistemas internos da empresa</li>
          <li>Jobs e processos em batch</li>
          <li>Ferramentas e serviços de terceiros</li>
          <li>Qualquer sistema que gere logs relevantes</li>
        </ul>
      </HelpCard>
      <HelpCard title="Boas práticas" tone="amber">
        <ul className="space-y-2 text-sm text-slate-600">
          {['Utilize nomes claros e descritivos.', 'Mantenha um cadastro por sistema, serviço ou aplicação.', 'Associe o produto ao projeto correto.', 'Informe a equipe responsável.', 'Descreva a finalidade e o contexto do sistema.'].map((item) => (
            <li key={item} className="flex gap-2"><span aria-hidden="true" className="text-green-600">✓</span>{item}</li>
          ))}
        </ul>
      </HelpCard>
    </>
  )
}

function ContextHelp() {
  return (
    <HelpCard title="Como o contexto ajuda a IA" tone="blue">
      <p className="text-sm text-slate-600">Descreva o problema que o produto resolve, quem ele atende e o que a análise deve evitar. Esses cinco campos já são gravados no contexto do produto.</p>
    </HelpCard>
  )
}

function OtelHelp() {
  return (
    <HelpCard title="OpenTelemetry" tone="blue">
      <p className="text-sm text-slate-600">Use o endpoint OTLP do coletor e o nome do serviço como ele aparece nos sinais. A tela guarda a configuração localmente até a API de integração ficar disponível.</p>
    </HelpCard>
  )
}
