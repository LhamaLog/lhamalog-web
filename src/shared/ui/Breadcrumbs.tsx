type BreadcrumbsProps = {
  items: { label: string; href?: string }[]
  homeHref?: string
}

export function Breadcrumbs({ items, homeHref }: BreadcrumbsProps) {
  if (items.length === 0) return null

  return (
    <nav aria-label="Caminho da página">
      <ol className="flex flex-wrap items-center gap-2 text-xs text-[#083B7A]">
        {homeHref && (
          <li>
            <a
              href={homeHref}
              aria-label="Início"
              className="inline-flex rounded p-1 text-[#0C70F2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0C70F2]"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m3 10 9-7 9 7M6 8v13h12V8M10 21v-7h4v7" />
              </svg>
            </a>
          </li>
        )}

        {items.map((item, index) => {
          const current = index === items.length - 1

          return (
            <li key={`${index}-${item.label}`} className="flex min-w-0 items-center gap-2">
              {(homeHref || index > 0) && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className="shrink-0 text-slate-500">
                  <path d="m9 5 7 7-7 7" />
                </svg>
              )}

              {!current && item.href ? (
                <a
                  href={item.href}
                  className="break-words rounded hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0C70F2]"
                >
                  {item.label}
                </a>
              ) : (
                <span aria-current={current ? 'page' : undefined} className={`break-words ${current ? 'font-bold' : ''}`}>
                  {item.label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
