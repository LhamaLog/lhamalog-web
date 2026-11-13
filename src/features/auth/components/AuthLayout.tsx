import type { ReactNode } from 'react'
import { BrandPanel } from './BrandPanel'
import '../auth.css'

type AuthLayoutProps = {
  children: ReactNode
  // "inicio": primeira etapa (título grande). "interna": verificações e etapas seguintes.
  step?: 'inicio' | 'interna'
  showTerms?: boolean
}

// Layout dividido do Figma: painel da marca à esquerda, card com o formulário da Clerk à direita.
export function AuthLayout({ children, step = 'inicio', showTerms = false }: AuthLayoutProps) {
  return (
    <div className="lh-auth" data-etapa={step}>
      <BrandPanel />
      <main className="lh-auth-form">
        <div className="lh-auth-coluna">
          {children}
          {showTerms && (
            <p className="lh-termos">
              Ao continuar, você concorda com nossos{' '}
              <a href="https://lhama.log/terms" target="_blank" rel="noopener noreferrer">
                Termos de Uso
              </a>{' '}
              e{' '}
              <a href="https://lhama.log/privacy" target="_blank" rel="noopener noreferrer">
                Política de Privacidade
              </a>
              .
            </p>
          )}
        </div>
      </main>
    </div>
  )
}
