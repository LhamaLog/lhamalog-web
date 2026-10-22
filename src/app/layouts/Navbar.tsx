import logo from '../../shared/assets/lhamalog-logo.svg'

type NavbarProps = {
  activeItem: string
  onItemSelect: (item: string) => void
  productName: string
  onProductSelect?: () => void
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
}: {
  item: NavigationItem
  active: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      aria-current={active ? 'page' : undefined}
      onClick={onSelect}
      className={`relative flex min-h-9 w-full cursor-pointer items-center gap-6 rounded-lg px-5 py-2 text-left text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
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
      {item.label}
    </button>
  )
}

export function Navbar({ activeItem, onItemSelect, productName, onProductSelect }: NavbarProps) {
  return (
    <aside className="sticky top-0 h-dvh w-60 shrink-0 overflow-y-auto bg-[#033473] px-3 py-6">
      <img src={logo} alt="LhamaLog" width={164} height={44} className="mx-auto" />

      <button
        type="button"
        onClick={onProductSelect}
        disabled={!onProductSelect}
        aria-label={`Selecionar produto. Produto atual: ${productName}`}
        className="mt-4 w-full cursor-pointer rounded-xl border border-white/5 bg-white/10 px-3 py-2 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-50 enabled:hover:bg-white/15"
      >
        <span className="block text-[11px] text-[#9DBDF0]">Produto</span>
        <span className="mt-1 flex items-center gap-3 text-sm font-bold text-white">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden="true">
              <path d="m12 3 9 5v8l-9 5-9-5V8ZM3 8l9 5 9-5M12 13v8" />
            </svg>
          </span>
          <span className="min-w-0 flex-1 truncate" title={productName}>{productName}</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className="shrink-0 text-[#9DBDF0]">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </button>

      <nav aria-label="Navegação principal" className="mt-8 space-y-6">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="mb-2 flex items-center gap-4 px-2 text-[11px] font-bold uppercase text-[#9DBDF0]">
              {group.label}
              <span aria-hidden="true" className="h-px flex-1 bg-white/10" />
            </p>
            <ul className="space-y-1">
              {group.items.map((item) => (
                <li key={item.id}>
                  <NavbarItem
                    item={item}
                    active={item.id === activeItem}
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
