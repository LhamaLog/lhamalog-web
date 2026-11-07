import { OrganizationSwitcher, useAuth, useOrganization, useUser } from '@clerk/react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { AppLayout } from './AppLayout'
import { CompanyPage } from '../../features/company/components/CompanyPage'
import { companySectionFromParam, companySections } from '../../features/company/model'
import { ProductsPage } from '../../features/products/components/ProductsPage'
import { EmptyState } from '../../shared/ui/EmptyState'
import { LoadingState } from '../../shared/ui/LoadingState'

export function CompanyWorkspace() {
  const { orgId, isLoaded } = useAuth()
  const { organization } = useOrganization()
  const { user } = useUser()
  const navigate = useNavigate()
  const location = useLocation()
  const [params] = useSearchParams()
  const products = location.pathname.startsWith('/produtos')
  const section = companySectionFromParam(params.get('secao'))
  const sectionLabel = companySections.find((item) => item.id === section)?.label ?? 'Empresa'
  const companyCrumbs = section === 'overview'
    ? [{ label: 'Administração' }, { label: 'Configurações da Empresa' }]
    : [{ label: 'Administração' }, { label: 'Configurações da Empresa', href: '/empresa' }, { label: sectionLabel }]
  if (!isLoaded) return <LoadingState />
  return <AppLayout
    contentClassName="max-w-none"
    navbar={{ activeItem: products ? 'products' : 'company', productName: 'Produtos da empresa', homeHref: '/empresa',
      onProductSelect: () => navigate('/produtos'), onItemSelect: item => { if (item === 'products') navigate('/produtos'); if (item === 'company') navigate('/empresa') } }}
    header={{ breadcrumbs: { homeHref: '/empresa', items: products ? [{ label: 'Produtos' }] : companyCrumbs },
      user: { name: user?.fullName ?? user?.primaryEmailAddress?.emailAddress ?? 'Usuário', role: organization?.name ?? '' } }}
    footer={{ links: [{ label: 'Privacidade', href: '#privacidade' }, { label: 'Termos de Uso', href: '#termos' }, { label: 'Suporte', href: '#suporte' }] }}>
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4">
      <div className="space-y-1"><p className="text-sm font-semibold text-[#083B7A]">Empresa selecionada</p>
        <OrganizationSwitcher hidePersonal createOrganizationMode="navigation" createOrganizationUrl="/organizacoes/nova" afterSelectOrganizationUrl={products ? '/produtos' : '/empresa'} /></div>
      <Link to="/organizacoes/nova" className="rounded-lg px-3 py-2 text-sm font-semibold text-[#0C70F2] hover:bg-blue-50">Cadastrar empresa</Link>
    </div>
    {!orgId ? <EmptyState title="Selecione ou cadastre uma empresa" description="Os dados e produtos serão exibidos para a empresa selecionada." />
      : <div key={orgId}>{products ? <ProductsPage /> : <CompanyPage organizationId={organization?.id ?? orgId} />}</div>}
  </AppLayout>
}
