import { useId, useRef, useState } from 'react'
import type { ComponentProps, ReactNode } from 'react'
import { Navbar } from './Navbar'
import { Header } from './Header'
import { Footer } from './Footer'

type AppLayoutProps = {
  navbar: Omit<ComponentProps<typeof Navbar>, 'collapsed' | 'onToggleCollapse'>
  header: ComponentProps<typeof Header>
  footer?: ComponentProps<typeof Footer>
  contentClassName?: string
  children: ReactNode
}

export function AppLayout({ navbar, header, footer, contentClassName = '', children }: AppLayoutProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const mobileMenuId = useId()
  const menuButton = useRef<HTMLButtonElement>(null)

  function closeMobileMenu() {
    setMobileOpen(false)
    menuButton.current?.focus()
  }

  return (
    <div className="flex min-h-dvh">
      <div className="hidden shrink-0 md:block">
        <Navbar {...navbar} collapsed={collapsed} onToggleCollapse={() => setCollapsed(!collapsed)} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="bg-[#033473] px-4 py-2 md:hidden">
          <button
            ref={menuButton}
            type="button"
            aria-expanded={mobileOpen}
            aria-controls={mobileMenuId}
            onClick={() => setMobileOpen(!mobileOpen)}
            className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg px-3 text-sm text-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d={mobileOpen ? 'm6 6 12 12M6 18 18 6' : 'M4 6h16M4 12h16M4 18h16'} />
            </svg>
            {mobileOpen ? 'Fechar menu' : 'Abrir menu'}
          </button>
        </div>

        <div
          id={mobileMenuId}
          hidden={!mobileOpen}
          className="md:hidden"
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault()
              closeMobileMenu()
            }
          }}
        >
          <Navbar {...navbar} onLogoClick={() => {
            navbar.onLogoClick?.()
            closeMobileMenu()
          }} onItemSelect={(item) => {
            navbar.onItemSelect(item)
            closeMobileMenu()
          }} />
        </div>

        <Header {...header} />
        <main className={`mx-auto min-w-0 w-full max-w-7xl flex-1 space-y-6 p-4 sm:p-6 ${contentClassName}`}>
          {children}
        </main>
        <Footer {...footer} />
      </div>
    </div>
  )
}
