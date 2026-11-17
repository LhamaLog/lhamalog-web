type FooterProps = {
  links?: { label: string; href: string }[]
  year?: number
  notice?: string
  navLabel?: string
}

export function Footer({ links = [], year = new Date().getFullYear(), notice, navLabel = 'Links do rodapé' }: FooterProps) {
  return (
    <footer className="mx-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 py-5 text-[11px] text-slate-500">
      <p>{notice ?? `© ${year} LhamaLog Observabilidade. Todos os direitos reservados.`}</p>

      {links.length > 0 && (
        <nav aria-label={navLabel}>
          <ul className="flex flex-wrap items-center gap-6">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="rounded hover:text-[#0C70F2] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0C70F2]"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </footer>
  )
}
