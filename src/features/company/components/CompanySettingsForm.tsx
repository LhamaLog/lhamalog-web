import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { Checkbox } from '../../../shared/ui/Checkbox'
import { Input } from '../../../shared/ui/Input'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { Select } from '../../../shared/ui/Select'
import { Textarea } from '../../../shared/ui/Textarea'
import type { ApiError } from '../../../shared/services/api'
import type { Company, CompanyContactDraft, CompanyProfileDraft, CompanyTab } from '../types'
import {
  AddressMap,
  CompanyTabs,
  InfoBanner,
  LineIcon,
  SystemTags,
  ToggleRow,
  analysisPriorities,
  branches,
  brazilianStates,
  companySizes,
  countries,
  criticalWindows,
  criticalities,
  currencies,
  dateFormats,
  dateInputValue,
  detailLevels,
  documentSlots,
  environmentTypes,
  iconPaths,
  languages,
  logVolumes,
  lookupPostalCode,
  recommendationTones,
  stateName,
  timeZones,
  unitTypes,
  withCurrentOption,
} from './companyFields'

const objectives = [
  ['criticalErrors', 'Priorizar detecção de erros críticos'],
  ['corrections', 'Gerar sugestões de correção'],
  ['customerImpact', 'Considerar impacto no cliente'],
  ['groupSimilar', 'Agrupar ocorrências semelhantes'],
  ['recurringAnomalies', 'Destacar anomalias recorrentes'],
] as const

const generalToggles = [
  ['dailySummary', 'Receber resumo diário de ocorrências'],
  ['autoSuggestions', 'Habilitar sugestões automáticas da IA'],
  ['criticalCount', 'Exibir número de ocorrências críticas no topo'],
] as const

const notificationToggles = [
  ['criticalAlerts', 'Alertar ocorrências críticas imediatamente'],
  ['recurringFailures', 'Notificar falhas recorrentes'],
] as const

const analysisToggles = [
  ['probableCause', 'Sugerir causa provável'],
  ['correctiveAction', 'Sugerir ação corretiva'],
  ['relateSimilar', 'Relacionar ocorrências semelhantes'],
] as const

const securityToggles = [
  ['requireMfa', 'Exigir autenticação em dois fatores para gestores'],
  ['approvedIntegrations', 'Permitir acesso via integrações aprovadas'],
  ['maskSensitive', 'Mascarar dados sensíveis em relatórios'],
  ['shareWithAi', 'Compartilhar dados com a IA para contexto interno'],
] as const

type CompanySettingsFormProps = {
  company: Company
  profile: CompanyProfileDraft
  tab: CompanyTab
  saving: boolean
  message: string
  error: ApiError | null
  logoUrl: string
  onTabChange: (tab: CompanyTab) => void
  onCompanyChange: (company: Company) => void
  onProfileChange: (profile: CompanyProfileDraft) => void
  onLogoChange: (file: File | null) => void
  onSubmit: (event: FormEvent) => void
  onCancel: () => void
  onReload: () => void
}

function Options({ options, current, placeholder }: { options: readonly string[]; current: string; placeholder?: string }) {
  return (
    <>
      {placeholder && <option value="">{placeholder}</option>}
      {withCurrentOption(options, current).map((option) => (
        <option key={option} value={option}>{option}</option>
      ))}
    </>
  )
}

function CardTitle({ title, description }: { title: string; description?: string }) {
  return (
    <div>
      <h2 className="font-bold text-[#083B7A]">{title}</h2>
      {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
    </div>
  )
}

function newId() {
  return globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function CompanySettingsForm({
  company,
  profile,
  tab,
  saving,
  message,
  error,
  logoUrl,
  onTabChange,
  onCompanyChange,
  onProfileChange,
  onLogoChange,
  onSubmit,
  onCancel,
  onReload,
}: CompanySettingsFormProps) {
  const errors = error?.fieldErrors ?? {}
  const patchData = (partial: Partial<Company['data']>) => onCompanyChange({ ...company, data: { ...company.data, ...partial } })
  const patchContext = (partial: Partial<Company['context']>) => onCompanyChange({ ...company, context: { ...company.context, ...partial } })
  const patchAddress = (partial: Partial<Company['address']>) => onCompanyChange({ ...company, address: { ...company.address, ...partial } })
  const patchProfile = (partial: Partial<CompanyProfileDraft>) => onProfileChange({ ...profile, ...partial })
  const stateOptions = withCurrentOption(brazilianStates.map(([, name]) => name), stateName(company.address.state))
  const mapLabel = [company.address.street, company.address.number].filter(Boolean).join(', ') || 'Endereço não informado'

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <PageHeader
        title="Configurações da Empresa"
        description="Mantenha as informações da sua empresa sempre atualizadas. Esses dados são utilizados para personalizar as sugestões da IA e em comunicações do sistema."
        icon={
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
            <LineIcon d={iconPaths.building} size={22} />
          </span>
        }
      />
      <CompanyTabs tab={tab} onChange={onTabChange} />
      {message && <p role="status" className="rounded-lg bg-green-50 p-4 text-sm text-green-800">{message}</p>}
      {error && (
        <div role="alert" className="flex flex-wrap items-center gap-3 rounded-lg bg-red-50 p-4 text-sm text-red-700">
          <span>{error.message}</span>
          {error.status === 409 && <Button onClick={onReload} variant="outline" size="small" fullWidth={false}>Recarregar dados</Button>}
        </div>
      )}

      <fieldset disabled={saving} className="m-0 min-w-0 space-y-5 border-0 p-0">
        <div hidden={tab !== 'data'} role="tabpanel" id="company-panel-data" aria-labelledby="company-tab-data" className="grid items-start gap-4 lg:grid-cols-2">
          <Card className="space-y-4">
            <CardTitle title="Dados Básicos" description="Informações principais da sua empresa." />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input id="company-legal-name" label="Razão Social" requiredMark compact maxLength={200} value={company.data.legalName} error={errors['data.legalName']} onChange={(event) => patchData({ legalName: event.target.value })} />
              <Input id="company-trade-name" label="Nome Fantasia" compact maxLength={200} value={company.data.tradeName} error={errors['data.tradeName']} onChange={(event) => patchData({ tradeName: event.target.value })} />
              <Input id="company-document" label="CNPJ" requiredMark compact maxLength={200} placeholder="00.000.000/0000-00" value={company.data.document} error={errors['data.document']} onChange={(event) => patchData({ document: event.target.value })} />
              <Input id="company-state-registration" label="Inscrição Estadual" compact maxLength={200} value={profile.stateRegistration} onChange={(event) => patchProfile({ stateRegistration: event.target.value })} />
              <div className="sm:col-span-2">
                <Select id="company-sector" label="Ramo de Atuação" requiredMark value={company.context.sector} error={errors['context.sector']} onChange={(event) => patchContext({ sector: event.target.value })}>
                  <Options options={branches} current={company.context.sector} placeholder="Selecione o ramo de atuação" />
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Textarea id="company-mission" label="Descrição da Empresa" maxLength={10000} value={company.context.mission} error={errors['context.mission']} onChange={(event) => patchContext({ mission: event.target.value })} />
              </div>
            </div>
          </Card>
          <div className="space-y-4">
            <LogoCard fileName={profile.logoFileName} logoUrl={logoUrl} onChange={onLogoChange} />
            <Card className="space-y-4">
              <CardTitle title="Informações Adicionais" description="Outras informações relevantes para o sistema." />
              <Input id="company-website" label="Site" compact maxLength={200} placeholder="https://www.exemplo.com" value={profile.website} startIcon={<LineIcon d={iconPaths.link} size={16} />} onChange={(event) => patchProfile({ website: event.target.value })} />
              <Select id="company-size" label="Tamanho da Empresa" value={company.data.size} error={errors['data.size']} startIcon={<LineIcon d={iconPaths.users} size={16} />} onChange={(event) => patchData({ size: event.target.value })}>
                <Options options={companySizes} current={company.data.size} placeholder="Selecione o tamanho" />
              </Select>
              <div className="grid gap-4 sm:grid-cols-2">
                <Select id="company-timezone" label="Fuso Horário" value={profile.timeZone} startIcon={<LineIcon d={iconPaths.clock} size={16} />} onChange={(event) => patchProfile({ timeZone: event.target.value })}>
                  <Options options={timeZones} current={profile.timeZone} />
                </Select>
                <Select id="company-language" label="Idioma Padrão" value={company.context.language} error={errors['context.language']} startIcon={<LineIcon d={iconPaths.globe} size={16} />} onChange={(event) => patchContext({ language: event.target.value })}>
                  <Options options={languages} current={company.context.language} placeholder="Selecione" />
                </Select>
              </div>
            </Card>
          </div>
        </div>

        <div hidden={tab !== 'context'} role="tabpanel" id="company-panel-context" aria-labelledby="company-tab-context" className="grid items-start gap-4 lg:grid-cols-2">
          <Card className="space-y-4">
            <CardTitle title="Contexto Operacional" description="Informações sobre o ambiente e a operação da empresa." />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input id="company-segment" label="Segmento" compact maxLength={200} value={company.context.sector} error={errors['context.sector']} onChange={(event) => patchContext({ sector: event.target.value })} />
              <Select id="company-environment-type" label="Tipo de Ambiente" value={profile.environmentType} onChange={(event) => patchProfile({ environmentType: event.target.value })}>
                <Options options={environmentTypes} current={profile.environmentType} placeholder="Selecione" />
              </Select>
              <SystemTags values={profile.monitoredSystems} onChange={(monitoredSystems) => patchProfile({ monitoredSystems })} />
              <Select id="company-log-volume" label="Volume Médio de Logs" value={profile.logVolume} onChange={(event) => patchProfile({ logVolume: event.target.value })}>
                <Options options={logVolumes} current={profile.logVolume} placeholder="Selecione" />
              </Select>
              <Select id="company-critical-windows" label="Janelas Críticas" value={profile.criticalWindows} onChange={(event) => patchProfile({ criticalWindows: event.target.value })}>
                <Options options={criticalWindows} current={profile.criticalWindows} placeholder="Selecione" />
              </Select>
              <div className="sm:col-span-2">
                <Textarea id="company-differentiators" label="Descrição do Contexto" maxLength={10000} value={company.context.differentiators} error={errors['context.differentiators']} onChange={(event) => patchContext({ differentiators: event.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <Textarea id="company-audience" label="Público-alvo" maxLength={10000} value={company.context.targetAudience} error={errors['context.targetAudience']} onChange={(event) => patchContext({ targetAudience: event.target.value })} />
              </div>
            </div>
          </Card>
          <div className="space-y-4">
            <Card className="space-y-3">
              <CardTitle title="Objetivos da IA" description="Defina como a IA deve contextualizar as análises." />
              {objectives.map(([key, label]) => (
                <Checkbox
                  key={key}
                  id={`company-objective-${key}`}
                  label={label}
                  checked={profile.aiObjectives[key]}
                  onChange={(event) => onProfileChange({ ...profile, aiObjectives: { ...profile.aiObjectives, [key]: event.target.checked } })}
                />
              ))}
            </Card>
            <Card className="space-y-4">
              <CardTitle title="Preferências de Análise" description="Parâmetros adicionais para interpretação dos logs." />
              <div className="grid gap-4 sm:grid-cols-2">
                <Select id="company-criticality" label="Criticidade padrão" value={profile.defaultCriticality} onChange={(event) => patchProfile({ defaultCriticality: event.target.value })}>
                  <Options options={criticalities} current={profile.defaultCriticality} />
                </Select>
                <Select id="company-analysis-language" label="Idioma das análises" value={profile.analysisLanguage} startIcon={<LineIcon d={iconPaths.globe} size={16} />} onChange={(event) => patchProfile({ analysisLanguage: event.target.value })}>
                  <Options options={languages} current={profile.analysisLanguage} />
                </Select>
              </div>
              <Input id="company-team" label="Equipe Responsável" compact maxLength={200} value={profile.responsibleTeam} startIcon={<LineIcon d={iconPaths.users} size={16} />} onChange={(event) => patchProfile({ responsibleTeam: event.target.value })} />
              <div className="rounded-lg border border-slate-200 px-3">
                <ToggleRow label="Notificar Gestores" showStatus checked={profile.notifyManagers} onChange={(notifyManagers) => patchProfile({ notifyManagers })} />
              </div>
            </Card>
          </div>
        </div>

        <div hidden={tab !== 'contacts'} role="tabpanel" id="company-panel-contacts" aria-labelledby="company-tab-contacts">
          <ContactsCard contacts={profile.contacts} onChange={(contacts) => patchProfile({ contacts })} />
        </div>

        <div hidden={tab !== 'address'} role="tabpanel" id="company-panel-address" aria-labelledby="company-tab-address" className="grid items-start gap-4 lg:grid-cols-2">
          <AddressCard company={company} profile={profile} errors={errors} onAddress={patchAddress} onProfile={patchProfile} stateOptions={stateOptions} />
          <div className="space-y-4">
            <Card className="space-y-3">
              <CardTitle title="Localização" description="Visualização do endereço informado." />
              <AddressMap label={mapLabel} />
            </Card>
            <Card className="space-y-4">
              <CardTitle title="Detalhes Adicionais" description="Configurações complementares do endereço." />
              <div className="grid gap-4 sm:grid-cols-2">
                <Select id="company-address-timezone" label="Fuso Horário" value={profile.timeZone} startIcon={<LineIcon d={iconPaths.clock} size={16} />} onChange={(event) => patchProfile({ timeZone: event.target.value })}>
                  <Options options={timeZones} current={profile.timeZone} />
                </Select>
                <Select id="company-regional-language" label="Idioma Regional" value={profile.regionalLanguage} startIcon={<LineIcon d={iconPaths.globe} size={16} />} onChange={(event) => patchProfile({ regionalLanguage: event.target.value })}>
                  <Options options={languages} current={profile.regionalLanguage} />
                </Select>
                <Select id="company-unit-type" label="Tipo de Unidade" value={profile.unitType} onChange={(event) => patchProfile({ unitType: event.target.value })}>
                  <Options options={unitTypes} current={profile.unitType} />
                </Select>
              </div>
              <ToggleRow
                label="Receber correspondências neste endereço"
                description="Ative para receber cartas, documentos e comunicações físicas."
                checked={profile.receiveMail}
                onChange={(receiveMail) => patchProfile({ receiveMail })}
              />
            </Card>
          </div>
        </div>

        <div hidden={tab !== 'documents'} role="tabpanel" id="company-panel-documents" aria-labelledby="company-tab-documents">
          <Card className="space-y-4">
            <CardTitle title="Documentos da Empresa" description="Anexe os comprovantes cadastrais. A data de inscrição já faz parte do cadastro integrado." />
            <div className="max-w-sm">
              <Input id="company-registration-date" label="Data de inscrição" type="date" compact value={dateInputValue(company.data.registrationDate)} error={errors['data.registrationDate']} onChange={(event) => patchData({ registrationDate: event.target.value || null })} />
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              {documentSlots.map((slot) => {
                const current = profile.documents.find((document) => document.id === slot.id)
                return (
                  <label key={slot.id} className="flex cursor-pointer flex-col gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm hover:border-[#0C70F2]">
                    <span className="font-semibold text-[#083B7A]">{slot.name}</span>
                    <span className="text-xs text-slate-500">{slot.description}</span>
                    <span className="text-xs font-medium text-[#0C70F2]">{current?.fileName || 'Selecionar arquivo'}</span>
                    <input
                      type="file"
                      className="sr-only"
                      accept="application/pdf,image/png,image/jpeg"
                      onChange={(event) => {
                        const file = event.target.files?.[0]
                        if (!file) return
                        patchProfile({
                          documents: [...profile.documents.filter((document) => document.id !== slot.id), { id: slot.id, name: slot.name, fileName: file.name }],
                        })
                      }}
                    />
                  </label>
                )
              })}
            </div>
          </Card>
        </div>

        <div hidden={tab !== 'preferences'} role="tabpanel" id="company-panel-preferences" aria-labelledby="company-tab-preferences" className="grid items-start gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <Card className="space-y-4">
              <CardTitle title="Preferências Gerais" description="Defina padrões de funcionamento da sua empresa no sistema." />
              <div className="grid gap-4 sm:grid-cols-2">
                <Select id="company-currency" label="Moeda Padrão" value={profile.currency} onChange={(event) => patchProfile({ currency: event.target.value })}>
                  <Options options={currencies} current={profile.currency} />
                </Select>
                <Select id="company-date-format" label="Formato de Data" value={profile.dateFormat} onChange={(event) => patchProfile({ dateFormat: event.target.value })}>
                  <Options options={dateFormats} current={profile.dateFormat} />
                </Select>
                <Select id="company-preference-language" label="Idioma Padrão" value={company.context.language} error={errors['context.language']} onChange={(event) => patchContext({ language: event.target.value })}>
                  <Options options={languages} current={company.context.language} placeholder="Selecione" />
                </Select>
                <Select id="company-preference-timezone" label="Fuso Horário Padrão" value={profile.timeZone} onChange={(event) => patchProfile({ timeZone: event.target.value })}>
                  <Options options={timeZones} current={profile.timeZone} />
                </Select>
              </div>
              {generalToggles.map(([key, label]) => (
                <ToggleRow key={key} label={label} checked={profile.preferences[key]} onChange={(checked) => onProfileChange({ ...profile, preferences: { ...profile.preferences, [key]: checked } })} />
              ))}
            </Card>
            <Card className="space-y-2">
              <CardTitle title="Política de Notificações" description="Escolha quando o sistema deve comunicar eventos relevantes." />
              {notificationToggles.map(([key, label]) => (
                <ToggleRow key={key} label={label} checked={profile.preferences[key]} onChange={(checked) => onProfileChange({ ...profile, preferences: { ...profile.preferences, [key]: checked } })} />
              ))}
            </Card>
          </div>
          <div className="space-y-4">
            <Card className="space-y-4">
              <CardTitle title="Preferências de IA" description="Ajustes para personalizar análises e recomendações." />
              <div className="grid gap-4 sm:grid-cols-2">
                <Select id="company-detail-level" label="Nível de detalhamento das análises" value={profile.detailLevel} onChange={(event) => patchProfile({ detailLevel: event.target.value })}>
                  <Options options={detailLevels} current={profile.detailLevel} />
                </Select>
                <Select id="company-tone" label="Tom das recomendações" value={profile.recommendationTone} onChange={(event) => patchProfile({ recommendationTone: event.target.value })}>
                  <Options options={recommendationTones} current={profile.recommendationTone} />
                </Select>
                <div className="sm:col-span-2">
                  <Select id="company-priority" label="Prioridade padrão das análises" value={profile.analysisPriority} onChange={(event) => patchProfile({ analysisPriority: event.target.value })}>
                    <Options options={analysisPriorities} current={profile.analysisPriority} />
                  </Select>
                </div>
              </div>
              {analysisToggles.map(([key, label]) => (
                <ToggleRow key={key} label={label} checked={profile.preferences[key]} onChange={(checked) => onProfileChange({ ...profile, preferences: { ...profile.preferences, [key]: checked } })} />
              ))}
            </Card>
            <Card className="space-y-2">
              <CardTitle title="Segurança e Privacidade" description="Controles adicionais da conta da empresa." />
              {securityToggles.map(([key, label]) => (
                <ToggleRow key={key} label={label} checked={profile.preferences[key]} onChange={(checked) => onProfileChange({ ...profile, preferences: { ...profile.preferences, [key]: checked } })} />
              ))}
            </Card>
          </div>
        </div>

        <InfoBanner title={banners[tab].title}>{banners[tab].body}</InfoBanner>
        <div className="flex flex-wrap justify-end gap-3">
          <Button type="button" variant="outline" fullWidth={false} onClick={onCancel}>Cancelar</Button>
          <Button type="submit" fullWidth={false}>
            <LineIcon d={iconPaths.save} size={16} />
            {saving ? 'Salvando...' : 'Salvar alterações'}
          </Button>
        </div>
      </fieldset>
    </form>
  )
}

const banners: Record<CompanyTab, { title: string; body: string }> = {
  data: {
    title: 'Por que essas informações são importantes?',
    body: 'Os dados da sua empresa são utilizados pela nossa IA para gerar sugestões mais precisas e contextualizadas, além de serem exibidos em relatórios e comunicações do sistema.',
  },
  context: {
    title: 'Como esse contexto ajuda a IA?',
    body: 'Essas informações ajudam a IA a interpretar os logs com mais precisão, priorizar riscos relevantes e gerar sugestões alinhadas ao ambiente operacional da empresa.',
  },
  contacts: {
    title: 'Para que servem os contatos?',
    body: 'Os contatos facilitam o encaminhamento de alertas e comunicações operacionais para as pessoas responsáveis por cada assunto da empresa.',
  },
  address: {
    title: 'Como o endereço é utilizado?',
    body: 'O endereço da sua empresa nos ajuda a organizar relatórios, notificações, documentos e informações contextuais, garantindo uma melhor experiência no sistema.',
  },
  documents: {
    title: 'Como os documentos são usados?',
    body: 'Os documentos comprovam os dados cadastrais e podem ser solicitados em processos de faturamento e conformidade da empresa.',
  },
  preferences: {
    title: 'Como as preferências impactam o sistema?',
    body: 'Essas configurações ajudam a personalizar seus dashboards, alertas, relatórios e sugestões da IA de acordo com a rotina e as necessidades da sua empresa.',
  },
}

function LogoCard({ fileName, logoUrl, onChange }: { fileName: string; logoUrl: string; onChange: (file: File | null) => void }) {
  const [logoError, setLogoError] = useState('')

  function take(file: File | null) {
    if (!file) return
    const allowed = ['image/png', 'image/jpeg', 'image/svg+xml']
    if (!allowed.includes(file.type)) {
      setLogoError('Use uma imagem PNG, JPG ou SVG.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setLogoError('A imagem deve ter no máximo 2MB.')
      return
    }
    setLogoError('')
    onChange(file)
  }

  return (
    <Card className="space-y-3">
      <CardTitle title="Logo da Empresa" description="Adicione a identidade visual da sua empresa." />
      <label
        className="flex min-h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault()
          take(event.dataTransfer.files?.[0] ?? null)
        }}
      >
        {logoUrl ? (
          <img src={logoUrl} alt="Pré-visualização da logo" className="max-h-16 max-w-full object-contain" />
        ) : (
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm">
            <LineIcon d={iconPaths.image} />
          </span>
        )}
        <span className="text-sm font-semibold text-[#0C70F2]">Clique para enviar ou arraste uma imagem</span>
        <span className="text-xs text-slate-500">PNG, JPG ou SVG (máx. 2MB){fileName ? ` · ${fileName}` : ''}</span>
        <input type="file" accept="image/png,image/jpeg,image/svg+xml" className="sr-only" onChange={(event) => take(event.target.files?.[0] ?? null)} />
      </label>
      {logoError && <p className="text-sm text-red-600">{logoError}</p>}
    </Card>
  )
}

function ContactsCard({ contacts, onChange }: { contacts: CompanyContactDraft[]; onChange: (contacts: CompanyContactDraft[]) => void }) {
  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <CardTitle title="Contatos da Empresa" description="Pessoas que recebem comunicações operacionais e avisos do sistema." />
        <Button
          type="button"
          variant="soft"
          size="small"
          fullWidth={false}
          onClick={() => onChange([...contacts, { id: newId(), name: '', email: '', phone: '', role: '' }])}
        >
          Adicionar contato
        </Button>
      </div>
      {contacts.length === 0 && <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">Nenhum contato adicionado.</p>}
      <div className="space-y-4">
        {contacts.map((contact, index) => (
          <div key={contact.id} className="space-y-3 rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-[#083B7A]">Contato {index + 1}</h3>
              <Button type="button" variant="outline" size="small" fullWidth={false} onClick={() => onChange(contacts.filter((item) => item.id !== contact.id))}>
                Remover
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input id={`contact-name-${contact.id}`} label="Nome" compact maxLength={200} value={contact.name} onChange={(event) => onChange(contacts.map((item) => item.id === contact.id ? { ...item, name: event.target.value } : item))} />
              <Input id={`contact-role-${contact.id}`} label="Cargo" compact maxLength={200} value={contact.role} onChange={(event) => onChange(contacts.map((item) => item.id === contact.id ? { ...item, role: event.target.value } : item))} />
              <Input id={`contact-email-${contact.id}`} label="E-mail" type="email" compact maxLength={200} value={contact.email} onChange={(event) => onChange(contacts.map((item) => item.id === contact.id ? { ...item, email: event.target.value } : item))} />
              <Input id={`contact-phone-${contact.id}`} label="Telefone" compact maxLength={40} value={contact.phone} onChange={(event) => onChange(contacts.map((item) => item.id === contact.id ? { ...item, phone: event.target.value } : item))} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function AddressCard({
  company,
  profile,
  errors,
  onAddress,
  onProfile,
  stateOptions,
}: {
  company: Company
  profile: CompanyProfileDraft
  errors: Record<string, string>
  onAddress: (partial: Partial<Company['address']>) => void
  onProfile: (partial: Partial<CompanyProfileDraft>) => void
  stateOptions: string[]
}) {
  const [lookupError, setLookupError] = useState('')
  const [lookingUp, setLookingUp] = useState(false)
  const address = company.address

  async function searchCep() {
    setLookingUp(true)
    setLookupError('')
    try {
      const found = await lookupPostalCode(address.postalCode)
      onAddress({
        street: found.street || address.street,
        district: found.district || address.district,
        city: found.city || address.city,
        state: found.state || address.state,
        country: found.country,
      })
    } catch (reason) {
      setLookupError(reason instanceof Error ? reason.message : 'Não foi possível consultar o CEP.')
    } finally {
      setLookingUp(false)
    }
  }

  return (
    <Card className="space-y-4">
      <CardTitle title="Endereço da Empresa" description="Informe a localização principal da empresa." />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <Input id="company-postal-code" label="CEP" requiredMark compact maxLength={16} value={address.postalCode} error={errors['address.postalCode']} onChange={(event) => onAddress({ postalCode: event.target.value })} />
          </div>
          <Button type="button" variant="outline" size="small" fullWidth={false} className="mt-7" onClick={searchCep} disabled={lookingUp}>
            <LineIcon d={iconPaths.search} size={14} />
            {lookingUp ? 'Buscando...' : 'Buscar CEP'}
          </Button>
        </div>
        <Select id="company-country" label="País" requiredMark value={address.country} error={errors['address.country']} onChange={(event) => onAddress({ country: event.target.value })}>
          <Options options={countries} current={address.country} placeholder="Selecione" />
        </Select>
        <Select id="company-state" label="Estado" requiredMark value={stateName(address.state)} error={errors['address.state']} onChange={(event) => onAddress({ state: event.target.value })}>
          <option value="">Selecione</option>
          {stateOptions.map((option) => <option key={option} value={option}>{option}</option>)}
        </Select>
        <Input id="company-city" label="Cidade" requiredMark compact maxLength={200} value={address.city} error={errors['address.city']} onChange={(event) => onAddress({ city: event.target.value })} />
        <Input id="company-district" label="Bairro" requiredMark compact maxLength={200} value={address.district} error={errors['address.district']} onChange={(event) => onAddress({ district: event.target.value })} />
        <Input id="company-street" label="Rua / Avenida" requiredMark compact maxLength={200} value={address.street} error={errors['address.street']} onChange={(event) => onAddress({ street: event.target.value })} />
        <Input id="company-number" label="Número" requiredMark compact maxLength={200} value={address.number} error={errors['address.number']} onChange={(event) => onAddress({ number: event.target.value })} />
        <Input id="company-complement" label="Complemento" compact maxLength={200} value={address.complement} error={errors['address.complement']} onChange={(event) => onAddress({ complement: event.target.value })} />
        <div className="sm:col-span-2">
          <Textarea id="company-reference" label="Referência" maxLength={300} value={profile.reference} onChange={(event) => onProfile({ reference: event.target.value })} />
        </div>
      </div>
      {lookupError && <p className="text-sm text-red-600">{lookupError}</p>}
      <ToggleRow
        label="Usar este endereço como endereço fiscal e de correspondência"
        description="Este endereço será utilizado em documentos, notas fiscais e correspondências oficiais."
        checked={profile.fiscalAddress}
        onChange={(fiscalAddress) => onProfile({ fiscalAddress })}
      />
    </Card>
  )
}
