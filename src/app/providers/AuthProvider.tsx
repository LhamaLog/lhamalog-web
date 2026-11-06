import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClerkProvider } from '@clerk/react'
import { readPublicConfig } from '../../shared/config'
import { baseAppearance } from '../../features/auth/theme/appearance'
import { localization } from '../../features/auth/theme/localization'

// Chave publicável da instância da Clerk (ADR_023). A CLERK_SECRET_KEY nunca entra no front (ADR_026).
// Em Docker/Nginx o valor vem de /config.js na subida do contêiner. No Vite, o fallback é o valor
// incorporado quando o servidor de desenvolvimento inicia ou quando o bundle é gerado.
const publishableKey = readPublicConfig().clerkPublishableKey

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
