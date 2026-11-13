import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClerkProvider } from '@clerk/react'
import { baseAppearance } from '../../features/auth/theme/appearance'
import { localization } from '../../features/auth/theme/localization'

// Chave publicável da instância da Clerk (ADR_023). A CLERK_SECRET_KEY nunca entra no front (ADR_026).
const publishableKey: string = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
if (!publishableKey) {
  throw new Error(
    'Falta VITE_CLERK_PUBLISHABLE_KEY. Crie o arquivo .env.local a partir do .env.example.',
  )
}

// O ClerkProvider precisa ficar dentro do BrowserRouter para navegar sem recarregar a página.
export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  return (
    <ClerkProvider
      publishableKey={publishableKey}
      appearance={baseAppearance}
      localization={localization}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignOutUrl="/sign-in"
      // Etapas pós-login (session tasks) renderizadas em telas próprias, com o visual do LhamaLog.
      taskUrls={{
        'choose-organization': '/tarefas/escolher-organizacao',
        'setup-mfa': '/tarefas/configurar-mfa',
        'reset-password': '/tarefas/redefinir-senha',
      }}
      routerPush={(to) => navigate(to)}
      routerReplace={(to) => navigate(to, { replace: true })}
    >
      {children}
    </ClerkProvider>
  )
}
