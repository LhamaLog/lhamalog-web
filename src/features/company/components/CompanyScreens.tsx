import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { Input } from '../../../shared/ui/Input'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { Select } from '../../../shared/ui/Select'
import { Textarea } from '../../../shared/ui/Textarea'
import { Toggle } from '../../../shared/ui/Toggle'
import {
  AddressMap,
  InfoBanner,
  LineIcon,
  branches,
  countries,
  analysisPriorities,
  currencies,
  dateFormats,
  detailLevels,
  iconPaths,
  languages,
  lookupPostalCode,
  recommendationTones,
  stateName,
  timeZones,
  withCurrentOption,
} from './companyFields'
import type { CompanyFacts } from '../contract'
import { downloadCompanyDossier } from '../dossier'
import { logoRejection } from '../logo'
import {
  companyDescriptionLimit,
  companySections,
  contextDescriptionLimit,
  displayOrEmpty,
  environmentChoices,
  logOrders,
  monitoredSystemTiles,
  telemetryEnvironments,
  telemetryIntervals,
  timeFormats,
  type CompanySection,
  type CompanySettings,
} from '../model'

const sectionIcons: Record<CompanySection, string> = {
  overview: 'M3 3h7v7H3ZM14 3h7v7h-7ZM3 14h7v7H3ZM14 14h7v7h-7Z',
  data: 'M4 7h16v14H4ZM8 7V3h8v4M4 12h16M10 12v3h4v-3',
  context: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm4 5-2 6-6 2 2-6Z',
  address: 'M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0ZM12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z',
  preferences: 'M3 6h18M3 12h18M3 18h18M7 3v6M16 9v6M9 15v6',
}

function Options({ options, current, placeholder }: { options: readonly string[]; current: string; placeholder?: string }) {
  return (
    <>
      {placeholder && <option value="">{placeholder}</option>}
      {withCurrentOption(options, current).map((option) => <option key={option} value={option}>{option}</option>)}
    </>
  )
}

export function CompanySectionNav({ section, onChange }: { section: CompanySection; onChange: (section: CompanySection) => void }) {
  return (
    <nav aria-label="Seções da empresa" className="rounded-xl border border-slate-200 bg-white p-2">
      <ul className="flex flex-wrap gap-1">
        {companySections.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              aria-current={section === item.id ? 'page' : undefined}
              onClick={() => onChange(item.id)}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0C70F2] ${section === item.id ? 'border-blue-100 bg-blue-50 font-semibold text-[#0C70F2]' : 'border-transparent text-slate-500 hover:bg-slate-50 hover:text-[#083B7A]'}`}
            >
              <LineIcon d={sectionIcons[item.id]} />
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}

function CardHeading({ title, description, icon, aside }: { title: string; description?: string; icon: string; aside?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#0C70F2]">
          <LineIcon d={icon} size={20} />
        </span>
        <div className="min-w-0">
          <h2 className="font-bold text-[#083B7A]">{title}</h2>
          {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
        </div>
      </div>
      {aside}
    </div>
  )
}

function LimitationList({ limitations }: { limitations: CompanyFacts['limitations'] }) {
  const visible = limitations.filter((item) => item.stored && item.enforced === false)
  if (visible.length === 0) return null
  return (
    <ul className="space-y-1 text-xs text-slate-500">
      {visible.map((item) => <li key={item.code}>{item.message} Preferência salva, política não aplicada.</li>)}
    </ul>
  )
}

function Status({ children }: { children: string }) {
  return <span className="inline-flex items-center gap-2 text-xs font-semibold text-[#0C70F2]"><span className="h-2 w-2 rounded-full bg-[#0C70F2]" aria-hidden="true" />{children}</span>
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
      <dt className="text-slate-500">{label}</dt>
      <dd className="min-w-0 font-semibold break-words text-[#083B7A] sm:text-right">{value}</dd>
    </div>
  )
}

export function CompanyOverview({ settings, facts, onOpen }: { settings: CompanySettings; facts: CompanyFacts; onOpen: (section: CompanySection) => void }) {
  const completion = facts.completion
  const dataReady = settings.data.legalName.trim() && settings.data.document.trim() && settings.data.email.trim() && settings.data.sector.trim()
  const addressReady = [settings.address.postalCode, settings.address.country, settings.address.street, settings.address.number, settings.address.district, settings.address.city, settings.address.state].every((field) => field.trim())
  const logoLabel = settings.data.logo ? settings.data.logo.fileName : 'Sem logo'
  const addressLine = [settings.address.street, settings.address.number, settings.address.complement].filter((part) => part.trim()).join(', ')
  return (
    <div className="space-y-4">
      <PageHeader title="Configurações da Empresa" />
      <CompanySectionNav section="overview" onChange={onOpen} />
      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <span className="flex h-14 min-w-14 items-center justify-center rounded-xl bg-blue-50 p-2">
              {settings.data.logo
                ? <img src={`data:${settings.data.logo.mediaType};base64,${settings.data.logo.dataBase64}`} alt="" className="max-h-10 w-auto max-w-24 object-contain" />
                : <LineIcon d={iconPaths.building} size={26} />}
            </span>
            <div className="min-w-0 space-y-1">
              <h2 className="text-lg font-bold break-words text-[#083B7A]">{displayOrEmpty(settings.data.legalName, 'Empresa sem razão social')}</h2>
              <p className="text-xs text-slate-500">CNPJ: {displayOrEmpty(settings.data.document)} · Inscrição estadual: {displayOrEmpty(settings.data.stateRegistration)}</p>
            </div>
          </div>
          <div className="w-full rounded-xl bg-slate-50 p-4 lg:w-80">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-semibold text-[#083B7A]">Conclusão do perfil</span>
              <span className="font-bold text-[#0C70F2]">{completion.percent}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-200" aria-hidden="true">
              <div className="h-full rounded-full bg-[#0C70F2]" style={{ width: `${completion.percent}%` }} />
            </div>
            <p className="mt-2 text-xs text-slate-500">{completion.message}</p>
            {facts.verified ? null : <p className="mt-1 text-xs text-slate-500">Verificação da empresa indisponível.</p>}
          </div>
        </div>
      </Card>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="flex flex-col gap-4">
          <CardHeading title="Dados da Empresa" description="Identificação cadastral e tributária" icon={iconPaths.building} aside={<Status>{dataReady ? 'Preenchido' : 'Incompleto'}</Status>} />
          <dl className="space-y-2 rounded-xl bg-slate-50 p-4 text-sm">
            <SummaryRow label="Razão social:" value={displayOrEmpty(settings.data.legalName)} />
            <SummaryRow label="Nome fantasia:" value={displayOrEmpty(settings.data.tradeName)} />
            <SummaryRow label="CNPJ:" value={displayOrEmpty(settings.data.document)} />
            <SummaryRow label="Identidade visual:" value={logoLabel} />
          </dl>
          <Button variant="soft" onClick={() => onOpen('data')}>Gerenciar Dados <span aria-hidden="true">→</span></Button>
        </Card>
        <Card className="flex flex-col gap-4">
          <CardHeading title="Contexto de Atuação" description="Parâmetros operacionais e mercado" icon={sectionIcons.context} aside={<Status>{settings.data.sector.trim() ? 'Preenchido' : 'Incompleto'}</Status>} />
          <dl className="space-y-2 rounded-xl bg-slate-50 p-4 text-sm">
            <SummaryRow label="Segmento:" value={displayOrEmpty(settings.data.sector)} />
            <SummaryRow label="Ambientes monitorados:" value={settings.context.environmentTypes.join(' • ') || 'Nenhum ambiente selecionado'} />
            <SummaryRow label="Janelas críticas:" value={displayOrEmpty(settings.context.criticalWindows)} />
            <SummaryRow label="Sistemas monitorados:" value={settings.context.monitoredSystems.length ? `${settings.context.monitoredSystems.length} sistemas selecionados` : 'Nenhum sistema selecionado'} />
          </dl>
          <Button variant="soft" onClick={() => onOpen('context')}>Editar Contexto <span aria-hidden="true">→</span></Button>
        </Card>
        <Card className="flex flex-col gap-4">
          <CardHeading title="Endereço Principal" description="Sede e faturamento" icon={sectionIcons.address} aside={<Status>{addressReady ? 'Preenchido' : 'Incompleto'}</Status>} />
          <AddressMap label={addressLine || 'Endereço não informado'} />
          <p className="text-xs text-slate-500">Ilustração do texto informado. Esta tela não consulta coordenadas.</p>
          <address className="rounded-xl bg-slate-50 p-4 text-sm not-italic break-words">
            <p className="font-semibold text-[#083B7A]">{addressLine || 'Endereço não informado'}</p>
            <p className="text-slate-500">{[settings.address.district, settings.address.postalCode, settings.address.city, settings.address.state].filter(Boolean).join(' · ') || 'Cidade e CEP não informados'}</p>
            {settings.address.reference && <p className="text-xs text-slate-500">Ponto de referência: {settings.address.reference}</p>}
          </address>
          <Button variant="soft" onClick={() => onOpen('address')}>Atualizar Endereço <span aria-hidden="true">→</span></Button>
        </Card>
        <Card className="flex flex-col gap-4">
          <CardHeading title="Preferências e IA" description="Automação e comportamento do sistema" icon={sectionIcons.preferences} aside={<Status>{settings.preferences.currency || settings.preferences.telemetry.interval || settings.data.timeZone ? 'Informado' : 'Não definido'}</Status>} />
          <dl className="space-y-2 rounded-xl bg-slate-50 p-4 text-sm">
            <SummaryRow label="Moeda padrão:" value={displayOrEmpty(settings.preferences.currency, 'Não definida')} />
            <SummaryRow label="Fuso horário:" value={displayOrEmpty(settings.data.timeZone, 'Não definido')} />
            <SummaryRow label="Idioma:" value={displayOrEmpty(settings.data.language, 'Não definido')} />
            <SummaryRow label="Intervalo de dados:" value={displayOrEmpty(settings.preferences.telemetry.interval, 'Não definido')} />
            <SummaryRow label="Análises da IA:" value={[settings.preferences.ai.detailLevel, settings.preferences.ai.priority].filter(Boolean).join(' • ') || 'Não definido'} />
            <SummaryRow label="Notificações:" value={notificationSummary(settings)} />
            <SummaryRow label="Segurança:" value={securitySummary(settings)} />
          </dl>
          <Button variant="soft" onClick={() => onOpen('preferences')}>Ajustar Preferências <span aria-hidden="true">→</span></Button>
        </Card>
      </div>
      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-bold text-[#083B7A]">Governança da empresa</h2>
            <p className="mt-1 text-sm text-slate-500">O PDF é gerado neste navegador. O servidor não exporta PDF, não consulta CEP e não sincroniza áreas. Métricas e ingestão não vêm nesta resposta.</p>
            <LimitationList limitations={facts.limitations} />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button variant="outline" fullWidth={false} onClick={() => downloadCompanyDossier(settings)}>Exportar dossiê da empresa (PDF)</Button>
            <Button fullWidth={false} disabled title="O servidor ainda não oferece sincronização entre áreas.">Sincronizar áreas</Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

function notificationSummary(settings: CompanySettings) {
  const items = [
    settings.preferences.notifications.criticalImmediate ? 'Críticas imediatas' : '',
    settings.preferences.notifications.recurringFailures ? 'Falhas recorrentes' : '',
  ].filter(Boolean)
  return items.join(' • ') || 'Nenhuma notificação marcada'
}

function securitySummary(settings: CompanySettings) {
  const items = [
    settings.preferences.security.requireMfa ? '2FA preferido para gestores' : '',
    settings.preferences.security.approvedIntegrations ? 'Integrações aprovadas' : '',
    settings.preferences.security.maskSensitive ? 'Mascarar dados' : '',
  ].filter(Boolean)
  return items.join(' • ') || 'Nenhuma política marcada'
}

function FormActions({ saving, onCancel }: { saving: boolean; onCancel: () => void }) {
  return (
    <div className="flex flex-wrap justify-end gap-3">
      <Button type="button" variant="outline" fullWidth={false} onClick={onCancel} disabled={saving}>Cancelar</Button>
      <Button type="submit" fullWidth={false} disabled={saving}>{saving ? 'Salvando...' : 'Salvar alterações'}</Button>
    </div>
  )
}

type FormProps = {
  settings: CompanySettings
  errors: Record<string, string>
  saving: boolean
  onChange: (settings: CompanySettings) => void
  onSubmit: (event: FormEvent) => void
  onCancel: () => void
  onOpen: (section: CompanySection) => void
}

function patchData(settings: CompanySettings, partial: Partial<CompanySettings['data']>, onChange: FormProps['onChange']) {
  onChange({ ...settings, data: { ...settings.data, ...partial } })
}

export function CompanyDataScreen(props: FormProps) {
  const { settings, errors, saving, onChange, onSubmit, onCancel, onOpen } = props
  const [logoError, setLogoError] = useState('')
  function takeLogo(file: File | null) {
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setLogoError('Envie um arquivo PNG, JPG ou SVG de até 2 MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const buffer = reader.result instanceof ArrayBuffer ? new Uint8Array(reader.result) : new Uint8Array()
      const rejection = logoRejection(file.type, buffer)
      if (rejection) {
        setLogoError(rejection)
        return
      }
      let binary = ''
      buffer.forEach((byte) => { binary += String.fromCharCode(byte) })
      setLogoError('')
      patchData(settings, { logo: { fileName: file.name, mediaType: file.type === 'image/jpg' ? 'image/jpeg' : file.type, dataBase64: btoa(binary) } }, onChange)
    }
    reader.readAsArrayBuffer(file)
  }
  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <PageHeader title="Dados da Empresa" description="Informações principais da organização cadastrada." />
      <CompanySectionNav section="data" onChange={onOpen} />
      <fieldset disabled={saving} className="m-0 grid gap-4 border-0 p-0 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.8fr)]">
        <Card className="space-y-4">
          <CardHeading title="Dados básicos" description="Identificação cadastral e tributária." icon={iconPaths.building} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input id="company-legal-name" label="Razão Social" requiredMark compact maxLength={200} value={settings.data.legalName} error={errors['data.legalName']} onChange={(event) => patchData(settings, { legalName: event.target.value }, onChange)} />
            <Input id="company-trade-name" label="Nome Fantasia" compact maxLength={200} value={settings.data.tradeName} onChange={(event) => patchData(settings, { tradeName: event.target.value }, onChange)} />
            <Input id="company-document" label="CNPJ" requiredMark compact maxLength={200} value={settings.data.document} error={errors['data.document']} onChange={(event) => patchData(settings, { document: event.target.value }, onChange)} />
            <Input id="company-state-registration" label="Inscrição Estadual" compact maxLength={200} value={settings.data.stateRegistration} onChange={(event) => patchData(settings, { stateRegistration: event.target.value }, onChange)} />
            <Input id="company-email" label="Contato principal / e-mail" requiredMark compact maxLength={200} type="email" value={settings.data.email} error={errors.email} onChange={(event) => patchData(settings, { email: event.target.value }, onChange)} />
            <Input id="company-organization" label="ID da organização" compact readOnly value={settings.organizationId || 'Indisponível'} />
            <div className="sm:col-span-2">
              <Select id="company-sector" label="Ramo de Atuação" requiredMark value={settings.data.sector} error={errors.sector} onChange={(event) => patchData(settings, { sector: event.target.value }, onChange)}>
                <Options options={branches} current={settings.data.sector} placeholder="Selecione o ramo de atuação" />
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Textarea id="company-description" label="Descrição da Empresa" maxLength={companyDescriptionLimit} value={settings.data.description} error={errors['data.description']} onChange={(event) => patchData(settings, { description: event.target.value }, onChange)} />
            </div>
          </div>
        </Card>
        <div className="space-y-4">
          <Card className="space-y-3">
            <CardHeading title="Logo da Empresa" description="PNG, JPG ou SVG, até 2 MB." icon={iconPaths.image} />
            <label
              className="flex min-h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => { event.preventDefault(); takeLogo(event.dataTransfer.files?.[0] ?? null) }}
            >
              {settings.data.logo
                ? <img src={`data:${settings.data.logo.mediaType};base64,${settings.data.logo.dataBase64}`} alt="Pré-visualização da logo" className="max-h-20 w-auto max-w-full object-contain" />
                : <span className="text-sm font-semibold text-[#0C70F2]">Clique para enviar ou arraste o arquivo</span>}
              <input type="file" accept="image/png,image/jpeg,image/svg+xml" className="sr-only" onChange={(event) => takeLogo(event.target.files?.[0] ?? null)} />
            </label>
            {settings.data.logo && (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <span className="min-w-0 truncate">{settings.data.logo.fileName}</span>
                <Button type="button" variant="outline" size="small" fullWidth={false} onClick={() => patchData(settings, { logo: null }, onChange)}>Remover</Button>
              </div>
            )}
            {(logoError || errors.logo) && <p className="text-sm text-red-600">{logoError || errors.logo}</p>}
          </Card>
          <Card className="space-y-4">
            <CardHeading title="Informações adicionais" icon={iconPaths.info} />
            <Input id="company-website" label="Site institucional" compact maxLength={300} value={settings.data.website} error={errors['data.website']} onChange={(event) => patchData(settings, { website: event.target.value }, onChange)} />
            <Select id="company-size" label="Tamanho da Empresa" value={settings.data.size} onChange={(event) => patchData(settings, { size: event.target.value }, onChange)}>
              <Options options={['1 - 10 colaboradores', '11 - 50 colaboradores', '51 - 200 colaboradores', '201 - 1.000 colaboradores', 'Mais de 1.000 colaboradores']} current={settings.data.size} placeholder="Selecione" />
            </Select>
            <div className="grid gap-4 sm:grid-cols-2">
              <Select id="company-timezone" label="Fuso Horário" value={settings.data.timeZone} onChange={(event) => patchData(settings, { timeZone: event.target.value }, onChange)}>
                <Options options={timeZones} current={settings.data.timeZone} placeholder="Selecione" />
              </Select>
              <Select id="company-language" label="Idioma Padrão" value={settings.data.language} onChange={(event) => patchData(settings, { language: event.target.value }, onChange)}>
                <Options options={languages} current={settings.data.language} placeholder="Selecione" />
              </Select>
            </div>
          </Card>
        </div>
      </fieldset>
      <InfoBanner title="Por que estas informações são importantes?">O asterisco indica o que falta para o cadastro completo. Dá para salvar antes disso. CNPJ, e-mail e site são conferidos quando estão preenchidos.</InfoBanner>
      <FormActions saving={saving} onCancel={onCancel} />
    </form>
  )
}

export function CompanyContextScreen({ settings, errors, saving, onChange, onSubmit, onCancel, onOpen }: FormProps) {
  const [draftEnvironment, setDraftEnvironment] = useState('')
  function setEnvironments(environmentTypes: string[]) {
    onChange({ ...settings, context: { ...settings.context, environmentTypes } })
  }
  function addEnvironment(value: string) {
    const next = value.trim()
    if (!next || settings.context.environmentTypes.some((item) => item.toLocaleLowerCase() === next.toLocaleLowerCase())) return
    setEnvironments([...settings.context.environmentTypes, next])
  }
  function toggleSystem(id: string) {
    const selected = settings.context.monitoredSystems.includes(id)
    const monitoredSystems = selected
      ? settings.context.monitoredSystems.filter((item) => item !== id)
      : [...settings.context.monitoredSystems, id]
    onChange({ ...settings, context: { ...settings.context, monitoredSystems } })
  }
  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <PageHeader title="Contexto de Atuação" description="Ambiente e operação usados para contextualizar a empresa." />
      <CompanySectionNav section="context" onChange={onOpen} />
      <fieldset disabled={saving} className="m-0 space-y-4 border-0 p-0">
        <Card className="space-y-4">
          <CardHeading title="Contexto operacional" icon={sectionIcons.context} aside={<span className="text-sm font-semibold text-red-500">Obrigatório</span>} />
          <Input id="company-context-sector" label="Segmento de Mercado" requiredMark value={settings.data.sector} error={errors.sector} onChange={(event) => patchData(settings, { sector: event.target.value }, onChange)} />
          <div>
            <label htmlFor="company-environment" className="text-sm font-semibold text-slate-900">Tipo de Ambiente Monitorado</label>
            <div className="mt-2 flex min-h-11 flex-wrap items-center gap-2 rounded-lg border border-slate-200 px-2 py-2">
              {settings.context.environmentTypes.map((environment) => (
                <span key={environment} className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-[#0C70F2]">
                  {environment}
                  <button type="button" aria-label={`Remover ${environment}`} className="cursor-pointer rounded px-1" onClick={() => setEnvironments(settings.context.environmentTypes.filter((item) => item !== environment))}>×</button>
                </span>
              ))}
              <input id="company-environment" list="company-environment-choices" value={draftEnvironment} placeholder="Adicionar ambiente..." onChange={(event) => setDraftEnvironment(event.target.value)} onKeyDown={(event) => { if (event.key !== 'Enter') return; event.preventDefault(); addEnvironment(draftEnvironment); setDraftEnvironment('') }} className="min-w-40 flex-1 bg-transparent text-sm outline-none" />
            </div>
            <datalist id="company-environment-choices">{environmentChoices.map((choice) => <option key={choice} value={choice} />)}</datalist>
          </div>
          <Input id="company-critical-window" label="Janelas Críticas de Monitoramento" compact maxLength={200} value={settings.context.criticalWindows} onChange={(event) => onChange({ ...settings, context: { ...settings.context, criticalWindows: event.target.value } })} />
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">Sistemas Monitorados</p>
              <p className="text-xs text-slate-500">{settings.context.monitoredSystems.length} sistemas selecionados</p>
            </div>
            {errors['context.monitoredSystems'] && <p className="mb-2 text-sm text-red-600">{errors['context.monitoredSystems']}</p>}
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {monitoredSystemTiles.map((tile) => {
                const selected = settings.context.monitoredSystems.includes(tile.id)
                return (
                  <li key={tile.id}>
                    <button type="button" aria-pressed={selected} onClick={() => toggleSystem(tile.id)} className={`h-full w-full cursor-pointer rounded-xl border p-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0C70F2] ${selected ? 'border-[#0C70F2] bg-blue-50' : 'border-slate-200 bg-white'}`}>
                      <span className="block text-sm font-bold text-[#083B7A]">{tile.title}</span>
                      <span className="mt-1 block text-xs text-slate-500">{tile.detail}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
          <Textarea id="company-context-description" label="Descrição do Contexto" maxLength={contextDescriptionLimit} value={settings.context.description} error={errors['context.description']} onChange={(event) => onChange({ ...settings, context: { ...settings.context, description: event.target.value } })} />
        </Card>
      </fieldset>
      <InfoBanner title="Como este contexto é usado?">O segmento é o mesmo ramo da tela de dados. A quantidade de sistemas é a seleção desta tela, não uma medição de nós conectados.</InfoBanner>
      <FormActions saving={saving} onCancel={onCancel} />
    </form>
  )
}

export function CompanyAddressScreen({ settings, errors, saving, onChange, onSubmit, onCancel, onOpen }: FormProps) {
  const [lookupError, setLookupError] = useState('')
  const [lookingUp, setLookingUp] = useState(false)
  const address = settings.address
  function setAddress(partial: Partial<CompanySettings['address']>) {
    onChange({ ...settings, address: { ...address, ...partial } })
  }
  async function searchCep() {
    setLookingUp(true)
    setLookupError('')
    try {
      const found = await lookupPostalCode(address.postalCode)
      setAddress({ street: found.street || address.street, district: found.district || address.district, city: found.city || address.city, state: found.state || address.state, country: found.country })
    } catch (reason) {
      setLookupError(reason instanceof Error ? reason.message : 'Não foi possível consultar o CEP.')
    } finally {
      setLookingUp(false)
    }
  }
  const formatted = [address.street, address.number, address.complement, address.district, address.city, address.state].filter((part) => part.trim()).join(', ')
  const states = withCurrentOption(['Acre', 'Alagoas', 'Amapá', 'Amazonas', 'Bahia', 'Ceará', 'Distrito Federal', 'Espírito Santo', 'Goiás', 'Maranhão', 'Mato Grosso', 'Mato Grosso do Sul', 'Minas Gerais', 'Pará', 'Paraíba', 'Paraná', 'Pernambuco', 'Piauí', 'Rio de Janeiro', 'Rio Grande do Norte', 'Rio Grande do Sul', 'Rondônia', 'Roraima', 'Santa Catarina', 'São Paulo', 'Sergipe', 'Tocantins'], stateName(address.state))
  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <PageHeader title="Endereço da Empresa" description="Localização principal informada pela organização." />
      <CompanySectionNav section="address" onChange={onOpen} />
      <fieldset disabled={saving} className="m-0 grid gap-4 border-0 p-0 lg:grid-cols-2">
        <Card className="space-y-4">
          <CardHeading title="Sede institucional" description="Campos com asterisco entram na validação ao salvar." icon={sectionIcons.address} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-end gap-2">
              <div className="min-w-0 flex-1"><Input id="company-postal-code" label="CEP" requiredMark compact maxLength={16} value={address.postalCode} error={errors['address.postalCode']} onChange={(event) => setAddress({ postalCode: event.target.value })} /></div>
              <Button type="button" variant="outline" size="small" fullWidth={false} className="mb-0.5" onClick={searchCep} disabled={lookingUp}>{lookingUp ? 'Buscando...' : 'Buscar CEP'}</Button>
            </div>
            <Select id="company-country" label="País" requiredMark value={address.country} error={errors['address.country']} onChange={(event) => setAddress({ country: event.target.value })}>
              <Options options={countries} current={address.country} placeholder="Selecione" />
            </Select>
            <Input id="company-street" label="Logradouro" requiredMark compact maxLength={200} value={address.street} error={errors['address.street']} onChange={(event) => setAddress({ street: event.target.value })} />
            <Input id="company-number" label="Número" requiredMark compact maxLength={40} value={address.number} error={errors['address.number']} onChange={(event) => setAddress({ number: event.target.value })} />
            <Input id="company-complement" label="Complemento" compact maxLength={200} value={address.complement} onChange={(event) => setAddress({ complement: event.target.value })} />
            <Input id="company-district" label="Bairro" requiredMark compact maxLength={200} value={address.district} error={errors['address.district']} onChange={(event) => setAddress({ district: event.target.value })} />
            <Input id="company-city" label="Cidade" requiredMark compact maxLength={200} value={address.city} error={errors['address.city']} onChange={(event) => setAddress({ city: event.target.value })} />
            <Select id="company-state" label="Estado" requiredMark value={stateName(address.state)} error={errors['address.state']} onChange={(event) => setAddress({ state: event.target.value })}>
              <option value="">Selecione</option>
              {states.map((state) => <option key={state} value={state}>{state}</option>)}
            </Select>
            <div className="sm:col-span-2">
              <Textarea id="company-reference" label="Ponto de Referência" maxLength={300} value={address.reference} onChange={(event) => setAddress({ reference: event.target.value })} />
            </div>
          </div>
          {lookupError && <p className="text-sm text-red-600">{lookupError}</p>}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate-700">Usar este endereço como fiscal e de correspondência</p>
              <p className="text-xs text-slate-500">Preferência do cadastro. Não confirma sozinha o domicílio tributário.</p>
            </div>
            <Toggle label="Usar este endereço como fiscal e de correspondência" checked={address.fiscalAddress} onChange={(fiscalAddress) => setAddress({ fiscalAddress })} />
          </div>
        </Card>
        <Card className="space-y-3">
          <CardHeading title="Localização e pré-visualização" description="Sem coordenadas e sem sincronização geográfica." icon={iconPaths.globe} />
          <AddressMap label={formatted || 'Endereço não informado'} />
          <div className="rounded-xl bg-slate-50 p-4 text-sm">
            <p className="text-xs font-semibold tracking-wide text-slate-500">Resumo do endereço informado</p>
            <p className="mt-2 font-semibold text-[#083B7A]">{formatted || 'Nenhum endereço informado'}</p>
            <p className="mt-1 text-slate-500">CEP: {address.postalCode || 'não informado'} · {address.country || 'país não informado'}</p>
          </div>
        </Card>
      </fieldset>
      <InfoBanner title="Como o endereço é utilizado?">A busca de CEP preenche logradouro, bairro, cidade e estado quando o serviço público responde. O mapa é ilustrativo.</InfoBanner>
      <FormActions saving={saving} onCancel={onCancel} />
    </form>
  )
}

function SwitchRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <p className="text-sm text-slate-700">{label}</p>
      <Toggle label={label} checked={checked} onChange={onChange} />
    </div>
  )
}

export function CompanyPreferencesScreen({ settings, facts, saving, onChange, onSubmit, onCancel, onOpen }: FormProps & { facts: CompanyFacts }) {
  const preferences = settings.preferences
  function setPreferences(partial: Partial<CompanySettings['preferences']>) {
    onChange({ ...settings, preferences: { ...preferences, ...partial } })
  }
  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <PageHeader title="Preferências da Empresa" description="Convenções de exibição, telemetria, análises e políticas que serão enviadas ao servidor." />
      <CompanySectionNav section="preferences" onChange={onOpen} />
      <fieldset disabled={saving} className="m-0 grid gap-4 border-0 p-0 xl:grid-cols-2">
        <div className="space-y-4">
          <Card className="space-y-4">
            <CardHeading title="Regionalização" description="Os mesmos fuso e idioma da tela de dados." icon={iconPaths.globe} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Select id="preference-timezone" label="Fuso Horário Padrão" value={settings.data.timeZone} onChange={(event) => patchData(settings, { timeZone: event.target.value }, onChange)}>
                <Options options={timeZones} current={settings.data.timeZone} placeholder="Selecione" />
              </Select>
              <Select id="preference-language" label="Idioma do Sistema" value={settings.data.language} onChange={(event) => patchData(settings, { language: event.target.value }, onChange)}>
                <Options options={languages} current={settings.data.language} placeholder="Selecione" />
              </Select>
              <Select id="preference-date" label="Formato de Data" value={preferences.dateFormat} onChange={(event) => setPreferences({ dateFormat: event.target.value })}>
                <Options options={dateFormats} current={preferences.dateFormat} placeholder="Selecione" />
              </Select>
              <Select id="preference-time" label="Formato de Hora" value={preferences.timeFormat} onChange={(event) => setPreferences({ timeFormat: event.target.value })}>
                <Options options={timeFormats} current={preferences.timeFormat} placeholder="Selecione" />
              </Select>
              <div className="sm:col-span-2">
                <Select id="preference-currency" label="Moeda Padrão" value={preferences.currency} onChange={(event) => setPreferences({ currency: event.target.value })}>
                  <Options options={currencies} current={preferences.currency} placeholder="Selecione" />
                </Select>
              </div>
            </div>
            <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">Exportações e campos de data desta empresa devem seguir estas convenções quando o servidor as aplicar.</p>
            <SwitchRow label="Receber resumo diário de ocorrências" checked={preferences.dailySummary} onChange={(dailySummary) => setPreferences({ dailySummary })} />
            <SwitchRow label="Habilitar sugestões automáticas da IA" checked={preferences.autoSuggestions} onChange={(autoSuggestions) => setPreferences({ autoSuggestions })} />
          </Card>
          <Card className="space-y-4">
            <CardHeading title="Preferências de IA" icon={iconPaths.info} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Select id="preference-detail" label="Nível de detalhamento das análises" value={preferences.ai.detailLevel} onChange={(event) => setPreferences({ ai: { ...preferences.ai, detailLevel: event.target.value } })}>
                <Options options={detailLevels} current={preferences.ai.detailLevel} placeholder="Selecione" />
              </Select>
              <Select id="preference-tone" label="Tom das recomendações" value={preferences.ai.tone} onChange={(event) => setPreferences({ ai: { ...preferences.ai, tone: event.target.value } })}>
                <Options options={recommendationTones} current={preferences.ai.tone} placeholder="Selecione" />
              </Select>
              <div className="sm:col-span-2">
                <Select id="preference-priority" label="Prioridade padrão das análises" value={preferences.ai.priority} onChange={(event) => setPreferences({ ai: { ...preferences.ai, priority: event.target.value } })}>
                  <Options options={analysisPriorities} current={preferences.ai.priority} placeholder="Selecione" />
                </Select>
              </div>
            </div>
            <SwitchRow label="Sugerir causa provável" checked={preferences.ai.probableCause} onChange={(probableCause) => setPreferences({ ai: { ...preferences.ai, probableCause } })} />
            <SwitchRow label="Sugerir ação corretiva" checked={preferences.ai.correctiveAction} onChange={(correctiveAction) => setPreferences({ ai: { ...preferences.ai, correctiveAction } })} />
            <SwitchRow label="Relacionar ocorrências semelhantes" checked={preferences.ai.relateSimilar} onChange={(relateSimilar) => setPreferences({ ai: { ...preferences.ai, relateSimilar } })} />
          </Card>
        </div>
        <div className="space-y-4">
          <Card className="space-y-4">
            <CardHeading title="Preferências de Telemetria" description="Parâmetros pedidos ao servidor. Não há medição de latência nesta tela." icon={iconPaths.clock} />
            <Select id="preference-interval" label="Intervalo de Dados Padrão" value={preferences.telemetry.interval} onChange={(event) => setPreferences({ telemetry: { ...preferences.telemetry, interval: event.target.value } })}>
              <Options options={telemetryIntervals} current={preferences.telemetry.interval} placeholder="Selecione" />
            </Select>
            <Select id="preference-initial-environment" label="Ambiente de Execução Inicial" value={preferences.telemetry.initialEnvironment} onChange={(event) => setPreferences({ telemetry: { ...preferences.telemetry, initialEnvironment: event.target.value } })}>
              <Options options={telemetryEnvironments} current={preferences.telemetry.initialEnvironment} placeholder="Selecione" />
            </Select>
            <Select id="preference-log-order" label="Critério de Ordenação de Logs" value={preferences.telemetry.logOrder} onChange={(event) => setPreferences({ telemetry: { ...preferences.telemetry, logOrder: event.target.value } })}>
              <Options options={logOrders} current={preferences.telemetry.logOrder} placeholder="Selecione" />
            </Select>
            <SwitchRow label="Itens e produtos ativos" checked={preferences.telemetry.activeProductsOnly} onChange={(activeProductsOnly) => setPreferences({ telemetry: { ...preferences.telemetry, activeProductsOnly } })} />
          </Card>
          <Card className="space-y-2">
            <CardHeading title="Política de Notificações" icon={iconPaths.info} />
            <SwitchRow label="Alertar ocorrências críticas imediatamente" checked={preferences.notifications.criticalImmediate} onChange={(criticalImmediate) => setPreferences({ notifications: { ...preferences.notifications, criticalImmediate } })} />
            <SwitchRow label="Notificar falhas recorrentes" checked={preferences.notifications.recurringFailures} onChange={(recurringFailures) => setPreferences({ notifications: { ...preferences.notifications, recurringFailures } })} />
          </Card>
          <Card className="space-y-2">
            <CardHeading title="Segurança e Privacidade" description="A preferência fica gravada. O servidor informa que ela não está em vigor." icon={iconPaths.save} />
            <LimitationList limitations={facts.limitations} />
            <SwitchRow label="Exigir autenticação em dois fatores para gestores" checked={preferences.security.requireMfa} onChange={(requireMfa) => setPreferences({ security: { ...preferences.security, requireMfa } })} />
            <SwitchRow label="Permitir acesso via integrações aprovadas" checked={preferences.security.approvedIntegrations} onChange={(approvedIntegrations) => setPreferences({ security: { ...preferences.security, approvedIntegrations } })} />
            <SwitchRow label="Mascarar dados sensíveis em relatórios" checked={preferences.security.maskSensitive} onChange={(maskSensitive) => setPreferences({ security: { ...preferences.security, maskSensitive } })} />
          </Card>
        </div>
      </fieldset>
      <InfoBanner title="Como as preferências impactam o sistema?">O salvamento só é confirmado quando o servidor devolve estas mesmas preferências. Enquanto isso, a tela não declara o cadastro como salvo.</InfoBanner>
      <FormActions saving={saving} onCancel={onCancel} />
    </form>
  )
}
