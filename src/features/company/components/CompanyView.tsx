import { useEffect, useState } from 'react'
import type { ComponentProps, ReactNode } from 'react'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { CompanySummary } from './CompanySummary'
import { CompanyDataCard, CompanyContextCard, CompanyPreferencesCard } from './CompanyInfoCards'
import { CompanyAddressCard } from './CompanyAddressCard'
import { CompanyGovernance } from './CompanyGovernance'

type CompanyViewProps = {
  id: string
  headingLevel?: 1 | 2
  summary: ComponentProps<typeof CompanySummary>
  data: ComponentProps<typeof CompanyDataCard>
  context: ComponentProps<typeof CompanyContextCard>
  address: ComponentProps<typeof CompanyAddressCard>
  preferences: ComponentProps<typeof CompanyPreferencesCard>
  governance: ComponentProps<typeof CompanyGovernance>
  footer: ReactNode
}

const sections = [
  { key: 'summary', label: 'Empresa', icon: 'M3 3h7v7H3ZM14 3h7v7h-7ZM3 14h7v7H3ZM14 14h7v7h-7Z' },
  { key: 'data', label: 'Dados da Empresa', icon: 'M4 7h16v14H4ZM8 7V3h8v4M4 12h16M10 12v3h4v-3' },
  { key: 'context', label: 'Contexto de Atuação', icon: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm4 5-2 6-6 2 2-6Z' },
  { key: 'address', label: 'Endereço', icon: 'M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0ZM12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z' },
  { key: 'preferences', label: 'Preferências', icon: 'M3 6h18M3 12h18M3 18h18M7 3v6M16 9v6M9 15v6' },
]

export function CompanyView({ id, headingLevel = 1, summary, data, context, address, preferences, governance, footer }: CompanyViewProps) {
  const [activeSection, setActiveSection] = useState('summary')

  useEffect(() => {
    const updateSection = () => {
      const current = sections.find((section) => window.location.hash === `#${id}-${section.key}`)
      setActiveSection(current?.key ?? 'summary')
    }
    updateSection()
    window.addEventListener('hashchange', updateSection)
    return () => window.removeEventListener('hashchange', updateSection)
  }, [id])

  const targetClass = 'min-w-0 scroll-mt-4 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0C70F2]'

  return (
    <div id={id} className="@container space-y-4 rounded-xl bg-slate-50 p-4">
      <PageHeader title="Configurações da Empresa" headingLevel={headingLevel} />
      <nav aria-label="Seções da empresa" className="rounded-xl border border-slate-200 bg-white p-2">
        <ul className="flex flex-wrap gap-1">
          {sections.map((section) => (
            <li key={section.key}>
              <a
                href={`#${id}-${section.key}`}
                aria-current={activeSection === section.key ? 'location' : undefined}
                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0C70F2] ${activeSection === section.key ? 'border-blue-100 bg-blue-50 font-semibold text-[#0C70F2]' : 'border-transparent text-slate-500 hover:bg-slate-50 hover:text-[#083B7A]'}`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={section.icon} /></svg>
                {section.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div id={`${id}-summary`} tabIndex={-1} className={targetClass}>
        <CompanySummary {...summary} />
      </div>
      <div className="grid min-w-0 gap-4 @min-[56rem]:grid-cols-2">
        <div id={`${id}-data`} tabIndex={-1} className={targetClass}><CompanyDataCard {...data} /></div>
        <div id={`${id}-context`} tabIndex={-1} className={targetClass}><CompanyContextCard {...context} /></div>
        <div id={`${id}-address`} tabIndex={-1} className={targetClass}><CompanyAddressCard {...address} /></div>
        <div id={`${id}-preferences`} tabIndex={-1} className={targetClass}><CompanyPreferencesCard {...preferences} /></div>
      </div>
      <CompanyGovernance {...governance} />
      {footer}
    </div>
  )
}
