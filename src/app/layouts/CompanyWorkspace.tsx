import { OrganizationSwitcher, useAuth, useOrganization, useUser } from '@clerk/react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { AppLayout } from './AppLayout'
import { CompanyPage } from '../../features/company/components/CompanyPage'
import { companySectionFromParam, companySections } from '../../features/company/model'
import { ProductsPage } from '../../features/products/components/ProductsPage'
import { ProfilePage } from '../../features/profile/components/ProfilePage'
import { TeamPage } from '../../features/team/components/TeamPage'
import { teamMenuHiddenItems } from '../../features/team/invitations'
import { setAppliedClerkLocale } from '../../features/profile/clerkLocale'
import { profileMessage } from '../../features/profile/messages'
import { UserPreferencesProvider, useAppliedPreferences } from '../../features/profile/preferences'
import { EmptyState } from '../../shared/ui/EmptyState'
import { LoadingState } from '../../shared/ui/LoadingState'

export function CompanyWorkspace() {
  const { isLoaded } = useAuth()
  if (!isLoaded) return <LoadingState />
  return (
    <UserPreferencesProvider>
      <WorkspaceShell />
    </UserPreferencesProvider>
  )
}

function WorkspaceShell() {
  const { orgId, orgRole } = useAuth()
  const { organization } = useOrganization()
  const { user } = useUser()
  const { language, headerName } = useAppliedPreferences()
  const navigate = useNavigate()
  const location = useLocation()
  const [params] = useSearchParams()
  const text = (key: Parameters<typeof profileMessage>[1], values?: Record<string, string>) => profileMessage(language, key, values)
  const products = location.pathname.startsWith('/produtos')
  const profile = location.pathname.startsWith('/perfil')
  const team = location.pathname.startsWith('/equipe')
  const section = companySectionFromParam(params.get('secao'))
  const sectionLabel = companySections.find((item) => item.id === section)?.label ?? 'Empresa'
  const companyCrumbs = section === 'overview'
    ? [{ label: text('shell.breadcrumbAdministration') }, { label: 'Configurações da Empresa' }]
    : [{ label: text('shell.breadcrumbAdministration') }, { label: 'Configurações da Empresa', href: '/empresa' }, { label: sectionLabel }]
  const sessionName = user?.fullName || user?.primaryEmailAddress?.emailAddress || text('shell.userFallback')
  const here = team ? '/equipe' : profile ? '/perfil' : products ? '/produtos' : '/empresa'
  return <AppLayout
    contentClassName="max-w-none"
    navbar={{
      activeItem: team ? 'team' : profile ? 'profile' : products ? 'products' : 'company',
      productName: 'Produtos da empresa',
      homeHref: '/empresa',
      hiddenItems: teamMenuHiddenItems(orgRole),
      onProductSelect: () => navigate('/produtos'),
      onItemSelect: item => {
        if (item === 'products') navigate('/produtos')
        if (item === 'company') navigate('/empresa')
        if (item === 'profile') navigate('/perfil')
        if (item === 'team') navigate('/equipe')
      },
    }}
    header={{
      breadcrumbs: {
        homeHref: '/empresa',
        items: team
          ? [{ label: text('shell.breadcrumbAdministration') }, { label: text('nav.team') }]
          : profile
          ? [{ label: text('shell.breadcrumbAdministration') }, { label: text('shell.breadcrumbProfile') }]
          : products ? [{ label: text('shell.breadcrumbProducts') }] : companyCrumbs,
      },
      user: { name: headerName || sessionName, role: organization?.name ?? '', href: '/perfil' },
      signOutLabel: text('shell.signOut'),
      onSignOut: () => setAppliedClerkLocale('pt-BR'),
    }}
    footer={{
      notice: text('shell.footerNotice', { year: String(new Date().getFullYear()) }),
      navLabel: text('shell.footerNav'),
      links: [
        { label: text('shell.privacy'), href: '#privacidade' },
        { label: text('shell.terms'), href: '#termos' },
        { label: text('shell.support'), href: '#suporte' },
      ],
    }}>
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4">
      <div className="space-y-1"><p className="text-sm font-semibold text-[#083B7A]">{text('shell.companySelected')}</p>
        <OrganizationSwitcher hidePersonal createOrganizationMode="navigation" createOrganizationUrl="/organizacoes/nova" afterSelectOrganizationUrl={here} /></div>
      <Link to="/organizacoes/nova" className="rounded-lg px-3 py-2 text-sm font-semibold text-[#0C70F2] hover:bg-blue-50">{text('shell.registerCompany')}</Link>
    </div>
    {!orgId ? <EmptyState title={text('shell.emptyCompanyTitle')} description={text('shell.emptyCompanyDescription')} />
      : <div key={orgId}>{team ? <TeamPage /> : profile ? <ProfilePage /> : products ? <ProductsPage /> : <CompanyPage organizationId={organization?.id ?? orgId} />}</div>}
  </AppLayout>
}
