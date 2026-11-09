import { useId } from 'react'
import logo from '../../shared/assets/lhamalog-logo.svg'

type NavbarProps = {
  activeItem: string
  onItemSelect: (item: string) => void
  productName: string
  onProductSelect?: () => void
  collapsed?: boolean
  onToggleCollapse?: () => void
  homeHref?: string
  onLogoClick?: () => void
}

type NavigationItem = {
  id: string
  label: string
  iconPath: string
}

const groups: { label: string; items: NavigationItem[] }[] = [
  {
    label: 'Monitoramento',
    items: [
      { id: 'dashboard', label: 'Dashboard', iconPath: 'M3 3h7v7H3ZM14 3h7v7h-7ZM3 14h7v7H3ZM14 14h7v7h-7Z' },
      { id: 'occurrences', label: 'Ocorrências', iconPath: 'M5 3h14v18H5ZM8 7h8M8 11h8M8 15h5' },
    ],
  },
  {
    label: 'Ingestão',
    items: [
      { id: 'uploads', label: 'Uploads', iconPath: 'M12 16V3M7 8l5-5 5 5M4 14v7h16v-7' },
      { id: 'files', label: 'Arquivos', iconPath: 'M5 3h9l5 5v13H5ZM14 3v6h5' },
      { id: 'batches', label: 'Lotes', iconPath: 'M3 6c0-4 18-4 18 0s-18 4-18 0ZM3 6v12c0 4 18 4 18 0V6M3 12c0 4 18 4 18 0' },
    ],
  },
  {
    label: 'Administração',
    items: [
      { id: 'team', label: 'Equipe', iconPath: 'M16 21v-3a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v3M16 4a4 4 0 0 1 0 8M20 21v-3a4 4 0 0 0-3-4M10 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z' },
      { id: 'plan', label: 'Plano', iconPath: 'M3 5h18v14H3ZM3 10h18' },
    ],
  },
  {
    label: 'Configuração',
    items: [
      { id: 'company', label: 'Empresa', iconPath: 'M4 21V7h10v14M14 11h6v10M8 7V3h8v8M7 11h4M7 15h4M7 18h4M17 15h1M17 18h1M2 21h20' },
      { id: 'products', label: 'Produto', iconPath: 'm12 3 9 5v8l-9 5-9-5V8ZM3 8l9 5 9-5M12 13v8' },
    ],
  },
]

function NavbarItem({
  item,
  active,
  onSelect,
  collapsed,
}: {
  item: NavigationItem
  active: boolean
  onSelect: () => void
  collapsed: boolean
}) {
  return (
    <button
      type="button"
      aria-current={active ? 'page' : undefined}
      aria-label={item.label}
      title={collapsed ? item.label : undefined}
      onClick={onSelect}
      className={`relative flex min-h-9 w-full cursor-pointer items-center rounded-lg py-2 text-left text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${collapsed ? 'justify-center px-2' : 'gap-6 px-5'} ${
        active
          ? 'bg-white/10 font-semibold text-white'
          : 'text-[#ADC6E8] hover:bg-white/5 hover:text-white'
      }`}
    >
      {active && (
        <span aria-hidden="true" className="absolute -left-3 inset-y-0 w-0.5 bg-white" />
      )}
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="shrink-0"
      >
        <path d={item.iconPath} />
      </svg>
      <span className={collapsed ? 'sr-only' : ''}>{item.label}</span>
    </button>
  )
}

export function Navbar({ activeItem, onItemSelect, productName, onProductSelect, collapsed = false, onToggleCollapse, homeHref = '#components-top', onLogoClick }: NavbarProps) {
  const navigationId = useId()

  return (
    <aside className={`flex w-full shrink-0 flex-col bg-[#033473] px-3 py-6 md:sticky md:top-0 md:h-dvh md:overflow-y-auto ${collapsed ? 'md:w-20' : 'md:w-60'}`}>
      <div className={`flex shrink-0 gap-2 ${collapsed ? 'flex-col items-center' : 'items-start justify-between'}`}>
      {onToggleCollapse && (
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expandir navegação' : 'Recolher navegação'}
          aria-expanded={!collapsed}
          aria-controls={navigationId}
          title={collapsed ? 'Expandir navegação' : 'Recolher navegação'}
          className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg text-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}
      <a
        href={homeHref}
        onClick={onLogoClick}
        aria-label="LhamaLog — voltar ao início"
        className={`mx-auto block shrink-0 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${collapsed ? 'order-first w-11 overflow-hidden' : ''}`}
      >
        <img src={logo} alt="LhamaLog" width={164} height={44} className="max-w-none" />
      </a>
      </div>

      <button
        type="button"
        onClick={onProductSelect}
        disabled={!onProductSelect}
        aria-label={`Selecionar produto. Produto atual: ${productName}`}
        title={collapsed ? productName : undefined}
        className={`mt-4 min-h-[68px] w-full shrink-0 cursor-pointer rounded-xl border border-white/5 bg-white/10 py-2 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-50 enabled:hover:bg-white/15 ${collapsed ? 'px-2' : 'px-3'}`}
      >
        <span className={collapsed ? 'sr-only' : 'block text-[11px] text-[#9DBDF0]'}>Produto</span>
        <span className={`flex items-center text-sm font-bold text-white ${collapsed ? 'justify-center' : 'mt-1 gap-3'}`}>
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden="true">
              <path d="m12 3 9 5v8l-9 5-9-5V8ZM3 8l9 5 9-5M12 13v8" />
            </svg>
          </span>
          <span className={collapsed ? 'sr-only' : 'min-w-0 flex-1 truncate'} title={productName}>{productName}</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className={collapsed ? 'hidden' : 'shrink-0 text-[#9DBDF0]'}>
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </button>

      <nav id={navigationId} aria-label="Navegação principal" className="mt-8 shrink-0 space-y-6">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="mb-2 flex h-4 items-center gap-4 px-2 text-[11px] font-bold uppercase text-[#9DBDF0]">
              <span className={collapsed ? 'sr-only' : ''}>{group.label}</span>
              <span aria-hidden="true" className="h-px flex-1 bg-white/10" />
            </p>
            <ul className="space-y-1">
              {group.items.map((item) => (
                <li key={item.id}>
                  <NavbarItem
                    item={item}
                    active={item.id === activeItem}
                    collapsed={collapsed}
                    onSelect={() => onItemSelect(item.id)}
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  )
}
