import { useState } from 'react'
import type { ReactNode } from 'react'
import { Toggle } from '../../../shared/ui/Toggle'
import type { CompanyTab } from '../types'

export const companyTabs: { id: CompanyTab; label: string }[] = [
  { id: 'overview', label: 'Empresa' },
  { id: 'data', label: 'Dados da Empresa' },
  { id: 'context', label: 'Contexto de Atuação' },
  { id: 'address', label: 'Endereço' },
  { id: 'preferences', label: 'Preferências' },
]

export const branches = ['Tecnologia da Informação', 'Serviços financeiros', 'Saúde', 'Varejo', 'Indústria', 'Educação', 'Outro']
export const companySizes = ['1 - 10 colaboradores', '11 - 50 colaboradores', '51 - 200 colaboradores', '201 - 1.000 colaboradores', 'Mais de 1.000 colaboradores']
export const timeZones = ['(UTC-03:00) Brasília', '(UTC-04:00) Manaus', '(UTC-05:00) Rio Branco', '(UTC+00:00) UTC']
export const languages = ['Português (Brasil)', 'English (US)', 'Español']
export const environmentTypes = ['Produção', 'Homologação', 'Desenvolvimento', 'Produção, Homologação e Desenvolvimento']
export const logVolumes = ['Baixo (até 100 mil por dia)', 'Médio (100 mil a 1 milhão por dia)', 'Alto (mais de 1 milhão por dia)']
export const criticalWindows = ['Horário comercial', 'Horário comercial e deploys', '24 horas', 'Madrugada e fechamento']
export const criticalities = ['Baixa', 'Média', 'Alta', 'Crítica']
export const countries = ['Brasil', 'Portugal', 'Estados Unidos']
export const unitTypes = ['Sede', 'Filial', 'Escritório']
export const currencies = ['Real (BRL)', 'Dólar (USD)', 'Euro (EUR)']
export const dateFormats = ['dd/mm/aaaa', 'mm/dd/aaaa', 'aaaa-mm-dd']
export const detailLevels = ['Baixo', 'Médio', 'Alto']
export const recommendationTones = ['Objetivo e técnico', 'Didático', 'Executivo']
export const analysisPriorities = ['Criticidade', 'Recência', 'Impacto no cliente']
export const monitoredSuggestions = ['API', 'Backend', 'Frontend', 'Banco de Dados', 'Workers', 'Mobile', 'Infraestrutura']
export const documentSlots = [
  { id: 'articles', name: 'Contrato social', description: 'Ato constitutivo ou última alteração contratual.' },
  { id: 'cnpj-card', name: 'Cartão CNPJ', description: 'Comprovante de inscrição e situação cadastral.' },
  { id: 'address-proof', name: 'Comprovante de endereço', description: 'Conta de consumo ou equivalente em nome da empresa.' },
]

export const brazilianStates: [string, string][] = [
  ['AC', 'Acre'], ['AL', 'Alagoas'], ['AP', 'Amapá'], ['AM', 'Amazonas'], ['BA', 'Bahia'], ['CE', 'Ceará'],
  ['DF', 'Distrito Federal'], ['ES', 'Espírito Santo'], ['GO', 'Goiás'], ['MA', 'Maranhão'], ['MT', 'Mato Grosso'],
  ['MS', 'Mato Grosso do Sul'], ['MG', 'Minas Gerais'], ['PA', 'Pará'], ['PB', 'Paraíba'], ['PR', 'Paraná'],
  ['PE', 'Pernambuco'], ['PI', 'Piauí'], ['RJ', 'Rio de Janeiro'], ['RN', 'Rio Grande do Norte'], ['RS', 'Rio Grande do Sul'],
  ['RO', 'Rondônia'], ['RR', 'Roraima'], ['SC', 'Santa Catarina'], ['SP', 'São Paulo'], ['SE', 'Sergipe'], ['TO', 'Tocantins'],
]

export function withCurrentOption(options: readonly string[], current: string) {
  if (current && !options.includes(current)) return [current, ...options]
  return [...options]
}

export function stateName(value: string) {
  return brazilianStates.find(([code, name]) => code === value || name === value)?.[1] ?? value
}

export function dateInputValue(value: string | null) {
  if (!value) return ''
  return /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : value
}

export function LineIcon({ d, size = 18 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  )
}

export const iconPaths = {
  building: 'M4 21V7h10v14M14 11h6v10M8 7V3h8v8M7 11h4M7 15h4M7 18h4M17 15h1M17 18h1M2 21h20',
  link: 'M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.2 1.2M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.2-1.2',
  users: 'M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M16 3.1a4 4 0 0 1 0 7.8M9.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
  clock: 'M12 7v5l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18',
  globe: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M3 12h18M12 3c2.8 2.6 2.8 15.4 0 18M12 3c-2.8 2.6-2.8 15.4 0 18',
  image: 'M4 5h16v14H4zM8 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4M4 16l5-4 4 3 3-2 4 3',
  info: 'M12 16v-4M12 8h.01M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18',
  save: 'M5 3h11l3 3v15H5zM8 3v6h8M8 21v-6h8',
  search: 'M10.5 18a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15ZM16 16l5 5',
}

export function InfoBanner({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
      <span className="mt-0.5 text-[#0C70F2]">
        <LineIcon d={iconPaths.info} />
      </span>
      <div>
        <p className="text-sm font-semibold text-[#0C70F2]">{title}</p>
        <p className="mt-1 text-sm text-[#3B6FB6]">{children}</p>
      </div>
    </div>
  )
}

export function CompanyTabs({ tab, onChange }: { tab: CompanyTab; onChange: (tab: CompanyTab) => void }) {
  return (
    <div className="overflow-x-auto border-b border-slate-200">
      <div role="tablist" aria-label="Seções da empresa" className="flex min-w-max gap-6">
        {companyTabs.map((item, index) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`company-tab-${item.id}`}
            aria-selected={tab === item.id}
            aria-controls={`company-panel-${item.id}`}
            tabIndex={tab === item.id ? 0 : -1}
            onClick={() => onChange(item.id)}
            onKeyDown={(event) => {
              if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
              event.preventDefault()
              const direction = event.key === 'ArrowRight' ? 1 : -1
              const next = companyTabs[(index + direction + companyTabs.length) % companyTabs.length]
              onChange(next.id)
              document.getElementById(`company-tab-${next.id}`)?.focus()
            }}
            className={`-mb-px cursor-pointer border-b-2 px-1 py-3 text-sm whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0C70F2] ${
              tab === item.id ? 'border-[#0C70F2] font-semibold text-[#0C70F2]' : 'border-transparent text-slate-500 hover:text-[#083B7A]'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function SystemTags({
  values,
  onChange,
  disabled,
}: {
  values: string[]
  onChange: (values: string[]) => void
  disabled?: boolean
}) {
  const [draft, setDraft] = useState('')

  function add(value: string) {
    const next = value.trim()
    if (!next || values.some((item) => item.toLocaleLowerCase() === next.toLocaleLowerCase())) return
    onChange([...values, next].slice(0, 30))
  }

  return (
    <div className="flex flex-col gap-2 sm:col-span-2">
      <label htmlFor="company-systems" className="text-sm font-semibold text-slate-900">Sistemas Monitorados</label>
      <div className="flex min-h-10 flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1.5 focus-within:border-[#0C70F2] focus-within:ring-2 focus-within:ring-[#0C70F2]/20">
        {values.map((value) => (
          <span key={value} className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
            {value}
            <button
              type="button"
              disabled={disabled}
              aria-label={`Remover ${value}`}
              onClick={() => onChange(values.filter((item) => item !== value))}
              className="cursor-pointer rounded text-slate-500 hover:text-slate-800 disabled:cursor-not-allowed"
            >
              ×
            </button>
          </span>
        ))}
        <input
          id="company-systems"
          value={draft}
          disabled={disabled}
          list="company-system-suggestions"
          placeholder={values.length === 0 ? 'Adicione um sistema e pressione Enter' : 'Adicionar'}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== 'Enter' && event.key !== ',') return
            event.preventDefault()
            add(draft)
            setDraft('')
          }}
          onBlur={() => {
            if (!draft.trim()) return
            add(draft)
            setDraft('')
          }}
          className="min-w-40 flex-1 bg-transparent px-1 py-1 text-sm outline-none placeholder:text-slate-500 disabled:cursor-not-allowed"
        />
      </div>
      <datalist id="company-system-suggestions">
        {monitoredSuggestions.map((suggestion) => <option key={suggestion} value={suggestion} />)}
      </datalist>
    </div>
  )
}

export async function lookupPostalCode(postalCode: string) {
  const digits = postalCode.replace(/\D/g, '')
  if (digits.length !== 8) throw new Error('Informe um CEP com 8 dígitos.')
  let response: Response
  try {
    response = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
  } catch {
    throw new Error('Não foi possível consultar o CEP.')
  }
  if (!response.ok) throw new Error('Não foi possível consultar o CEP.')
  const body = await response.json().catch(() => null) as { erro?: boolean; logradouro?: string; bairro?: string; localidade?: string; uf?: string } | null
  if (!body || body.erro) throw new Error('CEP não encontrado.')
  return {
    street: body.logradouro ?? '',
    district: body.bairro ?? '',
    city: body.localidade ?? '',
    state: stateName(body.uf ?? ''),
    country: 'Brasil',
  }
}

export function AddressMap({ label }: { label: string }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
      <svg className="h-52 w-full" viewBox="0 0 640 220" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Ilustração do endereço informado">
        <rect width="640" height="220" fill="#E7EEF4" />
        <g fill="#D5E8D8">
          <rect x="28" y="18" width="120" height="46" rx="10" />
          <rect x="470" y="16" width="130" height="40" rx="10" />
          <rect x="500" y="150" width="110" height="48" rx="10" />
          <rect x="36" y="150" width="140" height="48" rx="10" />
        </g>
        <g fill="none" stroke="#F7F9FB" strokeWidth="16" strokeLinecap="round">
          <path d="M-10 70h280l80 40h300" />
          <path d="M80 -10v240" />
          <path d="M360 -10v240" />
          <path d="M-10 150h660" />
        </g>
        <g fill="none" stroke="#D5DDE6" strokeWidth="8">
          <path d="M-10 70h280l80 40h300" />
          <path d="M80 -10v240" />
          <path d="M360 -10v240" />
          <path d="M-10 150h660" />
        </g>
        <circle cx="330" cy="104" r="22" fill="#0C70F2" opacity=".18" />
        <path d="M330 92c6 0 10 4 10 10 0 8-10 18-10 18s-10-10-10-18c0-6 4-10 10-10Z" fill="#0C70F2" />
        <circle cx="330" cy="102" r="3.5" fill="white" />
      </svg>
      <span className="absolute bottom-3 left-3 max-w-[calc(100%-1.5rem)] rounded-md bg-white px-2 py-1 text-xs font-semibold break-words text-[#083B7A] shadow-sm">
        {label}
      </span>
    </div>
  )
}

export function ToggleRow({
  label,
  description,
  checked,
  onChange,
  showStatus = false,
}: {
  label: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
  showStatus?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5">
      <div className="min-w-0">
        <p className="text-sm text-slate-700">{label}</p>
        {description && <p className="text-xs text-slate-500">{description}</p>}
      </div>
      <span className="inline-flex shrink-0 items-center gap-2">
        <Toggle label={label} checked={checked} onChange={onChange} />
        {showStatus && <span className="w-16 text-xs text-slate-500">{checked ? 'Ativado' : 'Desativado'}</span>}
      </span>
    </div>
  )
}
