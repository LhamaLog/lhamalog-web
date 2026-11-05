import { OrganizationSwitcher, useAuth, useOrganization, useUser } from '@clerk/react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AppLayout } from './AppLayout'
import { CompanyPage } from '../../features/company/components/CompanyPage'
import { ProductsPage } from '../../features/products/components/ProductsPage'
import { EmptyState } from '../../shared/ui/EmptyState'
import { LoadingState } from '../../shared/ui/LoadingState'

export function CompanyWorkspace() {
  const { orgId, isLoaded } = useAuth()
  const { organization } = useOrganization()
  const { user } = useUser()
  const navigate = useNavigate()
  const location = useLocation()
  const products = location.pathname.startsWith('/produtos')
  if (!isLoaded) return <LoadingState />
  return <AppLayout
    navbar={{ activeItem: products ? 'products' : 'company', productName: 'Produtos da empresa', homeHref: '/empresa', visibleItems: ['company', 'products'],
      onProductSelect: () => navigate('/produtos'), onItemSelect: item => navigate(item === 'products' ? '/produtos' : item === 'company' ? '/empresa' : '/componentes') }}
    header={{ breadcrumbs: { items: products ? [{ label: 'Produtos' }] : [{ label: 'Configurações', href: '/empresa' }, { label: 'Empresa' }] },
      user: { name: user?.fullName ?? user?.primaryEmailAddress?.emailAddress ?? 'Usuário', role: organization?.name ?? '' } }}>
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4">
      <div className="space-y-1"><p className="text-sm font-semibold text-[#083B7A]">Empresa selecionada</p>
        <OrganizationSwitcher hidePersonal createOrganizationMode="navigation" createOrganizationUrl="/organizacoes/nova" afterSelectOrganizationUrl={products ? '/produtos' : '/empresa'} /></div>
      <Link to="/organizacoes/nova" className="rounded-lg px-3 py-2 text-sm font-semibold text-[#0C70F2] hover:bg-blue-50">Cadastrar empresa</Link>
    </div>
    {!orgId ? <EmptyState title="Selecione ou cadastre uma empresa" description="Os dados e produtos serão exibidos para a empresa selecionada." />
      : <div key={orgId}>{products ? <ProductsPage /> : <CompanyPage />}</div>}
  </AppLayout>
}
