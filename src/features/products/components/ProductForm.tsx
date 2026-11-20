import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@clerk/react'
import type { FormEvent, ReactNode } from 'react'
import { ApiError } from '../../../shared/services/api'
import { useApi } from '../../../shared/services/useApi'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { Input } from '../../../shared/ui/Input'
import { Select } from '../../../shared/ui/Select'
import { Textarea } from '../../../shared/ui/Textarea'
import { loadProductDraft, moveProductDraft, saveProductDraft } from '../draft'
import { environmentLabel } from '../productListModel'
import {
  addTag,
  archivedMessage,
  archivedNotice,
  archiveQuestion,
  canArchive,
  environmentOptions,
  formFieldErrors,
  isArchived,
  partialSaveMessage,
  productPath,
  productTypes,
  saveEdits,
  setArchived,
  unarchivedMessage,
  unarchiveQuestion,
} from '../productEdit'
import { emptyProductDraft } from '../types'
import type { Product, ProductContext, ProductUiDraft } from '../types'
import { cleanContext, contextFieldErrors, firstTabWithError, readProductContext } from '../context'
import type { ProductTab } from '../context'
import { isNameInUse, nameInUseErrors, nameInUseNotice } from '../productErrors'
import { useOwnerOptions } from '../useOwnerOptions'
import { activeSignals } from '../otelSnippet'
import { readPublicConfig } from '../../../shared/config'
import { ApiKeyField } from './ApiKeyField'
import { ConnectionStatusPanel } from './ConnectionStatusPanel'
import { OtelConnectionCard } from './OtelConnectionCard'
import { endsSession } from '../../../shared/services/sessionRedirect'
import { NewItemInput } from './NewItemInput'
import { ProductContextFields } from './ProductContextFields'


// Icons of the fields of 02-produto-informacoes.png.
const fieldIcons = {
  type: 'm12 3 8 4.5v9L12 21l-8-4.5v-9L12 3ZM4 7.5l8 4.5 8-4.5M12 12v9',
  environment: 'm12 3 10 5-10 5L2 8ZM2 12l10 5 10-5M2 16l10 5 10-5',
  area: 'M4 21V5l8-2v18M12 7h8v14M7 8h2M7 12h2M7 16h2M15 11h2M15 15h2M2 21h20',
  owner: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0',
  email: 'M3 5h18v14H3ZM3 6l9 7 9-7',
  version: 'M3 12V3h9l9 9-9 9ZM7.5 7.5h.01',
}

function FieldIcon({ path }: { path: string }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={path} /></svg>
}

const tabs: { id: ProductTab; label: string; icon: ReactNode }[] = [
  {
    id: 'info',
    label: 'Informações do produto',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="m4 7.5 8 4.5 8-4.5M12 12v9" /></svg>,
  },
  {
    id: 'context',
    label: 'Contexto para IA',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><path d="M6 3h9l4 4v14H6V3Z" /><path d="M9 11h7M9 15h7M9 7h4" /></svg>,
  },
  {
    id: 'otel',
    label: 'Integração OpenTelemetry',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></svg>,
  },
]

type ProductRequest = <T,>(path: string, options?: RequestInit) => Promise<T>

type FormProps = {
  product?: Product
  // `message` replaces the default "Produto X salvo." of the list.
  onSaved: (product: Product, message?: string) => void
  onCancel: () => void
  // Areas the company already uses, for the "Área" select (clarify N2).
  areas?: string[]
}

export function ProductForm(props: FormProps) {
  const request = useApi()
  const owners = useOwnerOptions()
  // Same rule as the Core for archive and unarchive (W2). Reading orgRole changes nothing in the Clerk setup.
  const { orgRole } = useAuth()
  // Address of the OTLP receiver (spec 011, F4). Empty when VITE_OTLP_ENDPOINT is not set.
  const otlpEndpoint = readPublicConfig().otlpEndpoint
  return <ProductEditor {...props} request={request} owners={owners} admin={canArchive(orgRole)} otlpEndpoint={otlpEndpoint} />
}

export function ProductEditor({ product, onSaved, onCancel, request, areas = [], owners = null, admin = false, otlpEndpoint = '' }: FormProps & { request: ProductRequest; owners?: string[] | null; admin?: boolean; otlpEndpoint?: string }) {
  const [tab, setTab] = useState<ProductTab>('info')
  const [name, setName] = useState(product?.name ?? '')
  const [description, setDescription] = useState(product?.description ?? '')
  const [category, setCategory] = useState(product?.category ?? '')
  const [productVersion, setProductVersion] = useState(product?.productVersion ?? '')
  const [context, setContext] = useState<ProductContext>(() => readProductContext(product?.context))
  const [draft, setDraft] = useState<ProductUiDraft>(() => initialDraft(product))
  const [error, setError] = useState<ApiError | null>(null)
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  // The product as the Core last returned it: the version and the baseline of changedParts (W1 and reload).
  const [base, setBase] = useState(product)
  const [notice, setNotice] = useState('')
  // Badge of the "Status da conexão" panel, reported by the API key field (spec 011, F1).
  const [connection, setConnection] = useState<'waiting' | 'none' | 'unknown'>('unknown')
  const pending = useRef(false)
  const controller = useRef<AbortController | null>(null)
  const editing = Boolean(product)
  // An archived product opens only for reading (FR-W06).
  const archived = isArchived(base)
  const errors = { ...localErrors, ...(error?.fieldErrors ?? {}) }

  useEffect(() => () => controller.current?.abort(), [])

  function patchDraft(partial: Partial<ProductUiDraft>) {
    setDraft((current) => ({ ...current, ...partial }))
    setLocalErrors({})
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    const cleaned = cleanContext(context)
    const found = { ...formFieldErrors({ name, description, category, productVersion }, draft, editing), ...contextFieldErrors(cleaned) }
    const errorTab = firstTabWithError(found)
    if (errorTab) {
      // Local errors live only in localErrors, which every edit clears; the banner carries no field errors.
      setLocalErrors(found)
      setError(new ApiError('Confira os campos destacados.', 400))
      setTab(errorTab)
      return
    }
    if (pending.current || archived) return
    pending.current = true
    setSaving(true)
    setError(null)
    setNotice('')
    controller.current = new AbortController()
    const signal = controller.current.signal
    try {
      if (base) {
        const localChanged = JSON.stringify(draft) !== JSON.stringify(loadProductDraft(base.id))
        const result = await saveEdits(request, base, { name, description, category, productVersion }, cleaned, signal)
        if (signal.aborted) return
        saveProductDraft(base.id, draft)
        if (result.kind === 'saved') onSaved(result.product)
        else if (result.kind === 'partial') {
          // W1: the general data is in the Core; the form stays open with the new version to save the context again.
          setBase(result.product)
          const fieldErrors = result.error instanceof ApiError ? result.error.fieldErrors : {}
          if (!endsSession(result.error)) setError(new ApiError(partialSaveMessage, 0, fieldErrors))
        } else if (localChanged) onSaved(base, `Produto ${base.name} salvo neste navegador.`)
        else setNotice('Nenhuma alteração para salvar no servidor.')
      } else {
        const result = await request<Product>('/api/products', {
          method: 'POST',
          signal,
          body: JSON.stringify({ name, description, category, productVersion, context: cleaned }),
        })
        if (!signal.aborted) {
          moveProductDraft('new', result.id, draft)
          onSaved(result)
        }
      }
    } catch (reason) {
      if (signal.aborted || endsSession(reason)) return
      if (isNameInUse(reason)) {
        // Spec 010: the name refusal goes to the name field, on the info tab, without "Recarregar produto" (status 0).
        // In the edition the general data goes first, so the context was not sent (US1.6).
        setLocalErrors(nameInUseErrors(reason))
        setError(new ApiError(nameInUseNotice, 0))
        setTab('info')
        return
      }
      setError(reason instanceof ApiError ? reason : new ApiError('Não foi possível salvar.', 0))
    } finally {
      pending.current = false
      if (!signal.aborted) setSaving(false)
    }
  }

  // Archive or unarchive after the confirmation (US4, analyze A2), then back to the list with the message.
  async function changeArchive(next: boolean) {
    if (!base || pending.current) return
    if (!window.confirm(next ? archiveQuestion(base.name) : unarchiveQuestion(base.name))) return
    pending.current = true
    setSaving(true)
    setError(null)
    setNotice('')
    controller.current = new AbortController()
    const signal = controller.current.signal
    try {
      const result = await setArchived(request, base, next, signal)
      if (!signal.aborted) onSaved(result, next ? archivedMessage(result.name) : unarchivedMessage(result.name))
    } catch (reason) {
      if (!signal.aborted && !endsSession(reason)) setError(reason instanceof ApiError ? reason : new ApiError(next ? 'Não foi possível arquivar.' : 'Não foi possível desarquivar.', 0))
    } finally {
      pending.current = false
      if (!signal.aborted) setSaving(false)
    }
  }

  // After a 409, reads the product again and puts the current server data in the form. The local draft is kept.
  async function reloadProduct() {
    if (!base || pending.current) return
    pending.current = true
    setSaving(true)
    setError(null)
    setNotice('')
    controller.current = new AbortController()
    const signal = controller.current.signal
    try {
      const fresh = await request<Product>(productPath(base.id), { signal })
      if (signal.aborted) return
      setBase(fresh)
      setName(fresh.name)
      setDescription(fresh.description)
      setCategory(fresh.category)
      setProductVersion(fresh.productVersion)
      setContext(readProductContext(fresh.context))
      setLocalErrors({})
      setNotice('Produto recarregado com os dados atuais do servidor.')
    } catch (reason) {
      if (!signal.aborted && !endsSession(reason)) setError(reason instanceof ApiError ? reason : new ApiError('Não foi possível recarregar o produto.', 0))
    } finally {
      pending.current = false
      if (!signal.aborted) setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold text-[#083B7A]">{editing ? 'Editar produto' : 'Cadastrar produto'}</h2>
          <p className="max-w-3xl text-sm text-[#0C70F2]">Cadastre o software, serviço ou aplicação da empresa que será monitorado e terá seus logs analisados pelo LhamaLog.</p>
        </div>
        <button type="button" onClick={onCancel} className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm text-[#083B7A] hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0C70F2]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          Voltar para produtos
        </button>
      </div>
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-4">
        <div className="flex flex-wrap gap-x-6 rounded-xl border border-slate-200 bg-white px-4" role="tablist" aria-label="Etapas do produto">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              onClick={() => setTab(item.id)}
              className={`-mb-px inline-flex cursor-pointer items-center gap-2 border-b-2 px-2 py-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0C70F2] ${tab === item.id ? 'border-[#0C70F2] font-semibold text-[#0C70F2]' : 'border-transparent text-[#083B7A] hover:text-[#0C70F2]'}`}
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
        {error && (
          <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            <span>{error.message}</span>
            {error.status === 409 && base && <Button type="button" variant="outline" size="small" fullWidth={false} disabled={saving} onClick={reloadProduct}>Recarregar produto</Button>}
          </div>
        )}
        {notice && <p role="status" className="rounded-lg bg-blue-50 p-3 text-sm text-[#083B7A]">{notice}</p>}
        {archived && <p role="status" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{archivedNotice}</p>}
        <fieldset disabled={saving || archived} className="m-0 min-w-0 space-y-4 border-0 p-0">
          {tab === 'info' && (
            <Section icon title="Informações básicas" description="Defina as informações principais do produto.">
              <p className="flex items-start gap-2 rounded-lg bg-blue-50 p-3 text-xs text-[#083B7A]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="mt-px shrink-0 text-[#0C70F2]" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></svg>
                Tipo, ambiente, responsável, e-mail e tags ainda não são salvos no servidor: ficam guardados só neste navegador.
              </p>
              <div className="grid gap-x-6 gap-y-5 md:grid-cols-2">
                <Input id="product-name" label="Nome do produto" requiredMark compact maxLength={200} value={name} error={errors.name} hint="Nome que identifica o sistema, serviço ou aplicação na sua empresa." onChange={(event) => { setName(event.target.value); setLocalErrors({}); setError((current) => (current?.message === nameInUseNotice ? null : current)) }} />
                <Textarea id="product-description" label="Descrição" maxLength={10000} value={description} error={errors.description} hint="Descreva a finalidade e o contexto do produto." onChange={(event) => setDescription(event.target.value)} />
                <ChoiceField id="product-type" label="Tipo de produto" requiredMark value={draft.productType} options={productTypes} error={errors.productType} hint="Selecione o tipo que melhor representa o produto." startIcon={<FieldIcon path={fieldIcons.type} />} onChange={(productType) => patchDraft({ productType })} />
                <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
                  <Select id="product-environment" label="Ambiente" requiredMark value={draft.environment} error={errors.environment} hint="Onde o produto está em execução." startIcon={<FieldIcon path={fieldIcons.environment} />} onChange={(event) => patchDraft({ environment: event.target.value })}>
                    <option value="">Selecione</option>
                    {draft.environment && !environmentOptions.includes(draft.environment) && <option value={draft.environment}>{draft.environment}</option>}
                    {environmentOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </Select>
                  <ChoiceField id="product-area" label="Área" requiredMark value={category} options={areas} error={errors.category} hint="Área de negócio ou domínio." startIcon={<FieldIcon path={fieldIcons.area} />} onChange={(value) => { setCategory(value); setLocalErrors({}) }} />
                </div>
                <ChoiceField id="product-owner" label="Responsável pelo produto" requiredMark value={draft.owner} options={owners ?? []} error={errors.owner} hint="Pessoa da empresa responsável por este produto." startIcon={<FieldIcon path={fieldIcons.owner} />} onChange={(owner) => patchDraft({ owner })} />
                <Input id="product-team-email" type="email" label="E-mail da equipe" compact maxLength={320} value={draft.teamEmail} error={errors.teamEmail} hint="Contato que receberá alertas e comunicados do produto." startIcon={<FieldIcon path={fieldIcons.email} />} onChange={(event) => patchDraft({ teamEmail: event.target.value })} />
                <div className="md:w-1/2">
                  <Input id="product-version" label="Versão atual" compact maxLength={200} value={productVersion} error={errors.productVersion} hint="Versão em execução no ambiente." startIcon={<FieldIcon path={fieldIcons.version} />} onChange={(event) => setProductVersion(event.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <TagsField id="product-tags" tags={draft.tags} onChange={(tags) => patchDraft({ tags })} />
                </div>
              </div>
            </Section>
          )}
          {tab === 'context' && <ProductContextFields context={context} errors={errors} onChange={(next) => { setContext(next); setLocalErrors({}) }} />}
          {tab === 'otel' && (
            <OtelConnectionCard
              endpoint={otlpEndpoint}
              productName={name}
              traces={draft.otelTraces}
              logLevel={draft.otelLogLevel}
              onTracesChange={(otelTraces) => patchDraft({ otelTraces })}
              onLogLevelChange={(otelLogLevel) => patchDraft({ otelLogLevel })}
              apiKey={<ApiKeyField productId={base?.id} productName={base?.name ?? name} archived={archived} admin={admin} request={request} onConnectionChange={setConnection} />}
            />
          )}
        </fieldset>
        </div>
        <aside className="space-y-4 lg:sticky lg:top-4">
          {tab === 'info' && <InfoHelp />}
          {tab === 'context' && <ContextHelp />}
          {tab === 'otel' && (
            <>
              <ConnectionStatusPanel state={connection} signals={activeSignals(draft.otelTraces)} />
              <OtelHelp />
            </>
          )}
        </aside>
      </div>
      <Card className="flex flex-wrap items-center justify-between gap-4 px-6">
        <p className="flex items-center gap-2 text-sm text-slate-500">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="shrink-0 text-[#0C70F2]" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></svg>
          Este cadastro do produto ajuda a IA a identificar melhor o projeto.
        </p>
        <div className="flex flex-wrap gap-3">
          {base && admin && (
            <Button type="button" variant="outline" size="small" fullWidth={false} disabled={saving} onClick={() => changeArchive(!archived)} className="px-5">
              {archived ? 'Desarquivar' : 'Arquivar'}
            </Button>
          )}
          <Button type="button" variant="secondary" size="small" fullWidth={false} onClick={onCancel} className="px-5">Cancelar</Button>
          {!archived && (
            <Button type="submit" size="small" fullWidth={false} disabled={saving} className="px-5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
              {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Salvar'}
            </Button>
          )}
        </div>
      </Card>
    </form>
  )
}

function initialDraft(product?: Product) {
  if (!product) return emptyProductDraft()
  const stored = loadProductDraft(product.id)
  return { ...stored, environment: stored.environment || environmentLabel(product.environment) }
}

// With `icon`, the header of the Figma (blue document square, no number, line below); otherwise the numbered header.
function Section({ number, icon = false, title, description, children }: { number?: string; icon?: boolean; title: string; description: string; children: ReactNode }) {
  return (
    <Card className="space-y-5 sm:p-6">
      <div className={`flex items-start gap-3 ${icon ? 'border-b border-slate-200 pb-4' : ''}`}>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-sm font-bold text-[#0C70F2]">
          {icon ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true"><path d="M6 3h9l4 4v14H6V3Z" /><path d="M9 11h7M9 15h7" /></svg> : number}
        </span>
        <span>
          <h3 className="font-bold text-[#083B7A]">{number ? `${number}. ` : ''}{title}</h3>
          <p className="text-xs text-slate-500">{description}</p>
        </span>
      </div>
      {children}
    </Card>
  )
}

// Tags of the Figma: blue pills and a dashed "+ Adicionar" (local draft, F1).
function TagsField({ id, tags, onChange }: { id: string; tags: string[]; onChange: (tags: string[]) => void }) {
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string>()
  const describedBy = [`${id}-hint`, error ? `${id}-error` : undefined].filter(Boolean).join(' ')

  function add(value: string) {
    const result = addTag(tags, value)
    setError(result.error)
    if (result.error) return false
    if (result.tags !== tags) onChange(result.tags)
    return true
  }

  return (
    <div className="flex flex-col gap-2">
      <span id={`${id}-label`} className="text-sm font-semibold text-slate-900">Tags</span>
      <div role="group" aria-labelledby={`${id}-label`} aria-describedby={describedBy} className="flex flex-wrap items-center gap-2">
        {tags.map((tag, index) => (
          <span key={`${index}-${tag}`} className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-sm text-[#0C70F2]">
            {tag}
            <button type="button" aria-label={`Remover a tag ${tag}`} onClick={() => { setError(undefined); onChange(tags.filter((_, position) => position !== index)) }} className="cursor-pointer rounded px-0.5 font-bold hover:text-[#083B7A] focus-visible:outline-2 focus-visible:outline-[#0C70F2]">×</button>
          </span>
        ))}
        {adding ? (
          <NewItemInput id={`${id}-new`} label="Nova tag" className="h-8 w-40" onAdd={add} onClose={() => { setAdding(false); setError(undefined) }} />
        ) : (
          <button type="button" onClick={() => setAdding(true)} className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-dashed border-[#0C70F2] px-3 py-1 text-sm text-[#0C70F2] hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0C70F2]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
            Adicionar
          </button>
        )}
      </div>
      <p id={`${id}-hint`} className="text-xs text-slate-500">Use tags para facilitar a busca e o agrupamento dos produtos.</p>
      {error && <p id={`${id}-error`} className="text-sm text-red-600">{error}</p>}
    </div>
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
  hint,
  startIcon,
}: {
  id: string
  label: string
  value: string
  options: string[]
  onChange: (value: string) => void
  error?: string
  requiredMark?: boolean
  disabled?: boolean
  hint?: string
  startIcon?: ReactNode
}) {
  const custom = value !== '' && !options.includes(value)
  const [other, setOther] = useState(custom)
  const selectValue = other || custom ? '__custom__' : value
  // Without options (no area used yet, or the people list could not be read), a plain text field (clarify N2 and N3).
  if (options.length === 0) {
    return <Input id={id} label={label} requiredMark={requiredMark} compact maxLength={200} disabled={disabled} value={value} error={error} hint={hint} startIcon={startIcon} onChange={(event) => onChange(event.target.value)} />
  }
  return (
    <div className="space-y-2">
      <Select
        id={id}
        label={label}
        requiredMark={requiredMark}
        disabled={disabled}
        hint={hint}
        startIcon={startIcon}
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

// Side cards as in the Figma frames: a blue book for "Sobre ..." and a yellow bulb for "Boas práticas".
function HelpCard({ title, tone, children }: { title: string; tone: 'blue' | 'amber'; children: ReactNode }) {
  return (
    <Card className="space-y-3">
      <h3 className="flex items-center gap-2 text-base font-bold text-[#083B7A]">
        {tone === 'blue' ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" className="shrink-0 text-[#0C70F2]" aria-hidden="true"><path d="M3 5h6a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H3V5ZM21 5h-6a3 3 0 0 0-3 3v12a2 2 0 0 1 2-2h7V5Z" /></svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="shrink-0 text-amber-400" aria-hidden="true"><path d="M12 2a7 7 0 0 0-4 12.7V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.3A7 7 0 0 0 12 2Z" /><path d="M9 20h6v1a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-1Z" /></svg>
        )}
        {title}
      </h3>
      {children}
    </Card>
  )
}

function CheckList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 text-sm text-slate-700">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-[#0C70F2]" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
          {item}
        </li>
      ))}
    </ul>
  )
}

function InfoHelp() {
  return (
    <>
      <HelpCard title="Sobre o cadastro" tone="blue">
        <p className="border-b border-slate-200 pb-3 text-sm text-slate-700">Um produto representa um software, serviço, API, website, aplicativo mobile, job em batch ou sistema interno da empresa, a partir do qual você deseja centralizar os logs e ter observabilidade no LhamaLog.</p>
        <p className="text-sm font-semibold text-slate-900">Exemplos:</p>
        <ul className="list-disc space-y-1 pl-4 text-sm text-[#0C70F2] marker:text-[#0C70F2]">
          {['APIs e serviços de backend', 'Aplicações web ou mobile', 'Sistemas internos da empresa', 'Jobs e processos em batch', 'Ferramentas e serviços de terceiros', 'Qualquer sistema que gere logs relevantes'].map((item) => <li key={item}>{item}</li>)}
        </ul>
      </HelpCard>
      <HelpCard title="Boas práticas" tone="amber">
        <p className="text-sm text-[#0C70F2]">Siga estas recomendações para um cadastro mais eficiente e organizado.</p>
        <CheckList items={['Utilize nomes claros e descritivos.', 'Mantenha um cadastro por sistema, serviço ou aplicação.', 'Associe o produto ao projeto correto.', 'Descreva a finalidade e o contexto do sistema.']} />
      </HelpCard>
    </>
  )
}

function ContextHelp() {
  return (
    <>
      <HelpCard title="Sobre o contexto para IA" tone="blue">
        <p className="border-b border-slate-200 pb-3 text-sm text-slate-700">O contexto ajuda a IA a entender o que o produto faz e como ele é construído, para interpretar melhor os logs, apontar causas com mais precisão e responder no nível de detalhe escolhido.</p>
        <p className="text-sm font-semibold text-slate-900">O que informar:</p>
        <ul className="list-disc space-y-1 pl-4 text-sm text-[#0C70F2] marker:text-[#0C70F2]">
          {['O que o produto faz e para quem', 'Principais fluxos e regras de negócio', 'Integrações com outros sistemas', 'Linguagem, framework e banco de dados', 'O que está dentro e fora do escopo', 'Termos e siglas específicos do domínio'].map((item) => <li key={item}>{item}</li>)}
        </ul>
      </HelpCard>
      <HelpCard title="Boas práticas" tone="amber">
        <p className="text-sm text-[#0C70F2]">Siga estas recomendações para um contexto mais útil para a IA.</p>
        <CheckList items={['Seja objetivo ao descrever o produto.', 'Cite os principais componentes e integrações do sistema.', 'Liste apenas o que está no escopo.', 'Escolha o nível de detalhe adequado.']} />
      </HelpCard>
    </>
  )
}

function OtelHelp() {
  return (
    <HelpCard title="Boas práticas" tone="amber">
      <p className="text-sm text-[#0C70F2]">Siga estas recomendações para uma integração segura e estável.</p>
      <CheckList items={['Guarde a chave de API em local seguro.', 'Prefira variáveis de ambiente a valores fixos no código.', 'Teste a conexão depois de configurar.', 'Mascare dados sensíveis dos logs.']} />
    </HelpCard>
  )
}
