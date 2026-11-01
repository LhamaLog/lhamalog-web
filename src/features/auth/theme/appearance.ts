import type { ComponentProps } from 'react'
import type { ClerkProvider } from '@clerk/react'

// Tipo da prop "appearance" do ClerkProvider (os componentes da Clerk aceitam o mesmo formato).
export type Appearance = NonNullable<ComponentProps<typeof ClerkProvider>['appearance']>

// Tokens extraídos do Figma "LhamaLog" (página Login, frame Login 41:3).
const font = "'Poppins', system-ui, -apple-system, 'Segoe UI', sans-serif"

// Vale para TODOS os componentes da Clerk (login, cadastro, etapas pós-login, organização).
export const baseAppearance: Appearance = {
  // Coloca o CSS da Clerk na camada "clerk", declarada em src/styles.css entre base e components
  // do Tailwind. O CSS de auth.css, fora de camada, passa a ter prioridade.
  cssLayerName: 'clerk',
  variables: {
    colorPrimary: '#0C70F2',
    colorPrimaryForeground: '#FFFFFF',
    colorBackground: '#FFFFFF',
    colorForeground: '#0F172A',
    colorMutedForeground: '#475569',
    colorMuted: '#F1F5F9',
    colorInput: '#F8FAFC',
    colorInputForeground: '#0F172A',
    colorBorder: '#E2E8F0',
    borderRadius: '0.75rem',
    fontFamily: font,
    fontFamilyButtons: font,
  },
  options: {
    // A logo fica no painel da esquerda (BrandPanel), não dentro do card da Clerk.
    logoPlacement: 'none',
    socialButtonsVariant: 'blockButton',
    socialButtonsPlacement: 'bottom',
  },
}

// Telas de autenticação (login, cadastro e etapas pós-login).
// As classes ficam definidas em src/features/auth/auth.css.
export const authAppearance: Appearance = {
  elements: {
    rootBox: 'lh-root',
    cardBox: 'lh-cardbox',
    card: 'lh-card',
    headerTitle: 'lh-titulo',
    headerSubtitle: 'lh-subtitulo',
    formFieldLabel: 'lh-label',
    formFieldInput: 'lh-input',
    formFieldAction: 'lh-link',
    footerActionLink: 'lh-link',
    formResendCodeLink: 'lh-link',
    formButtonPrimary: 'lh-btn',
    formButtonReset: 'lh-btn-secundario',
    socialButtonsBlockButton: 'lh-btn-social',
    otpCodeFieldInput: 'lh-otp',
    identityPreview: 'lh-info',
    alert: 'lh-alerta',
    dividerLine: 'lh-divisor',
    dividerText: 'lh-divisor-texto',
    footer: 'lh-clerk-rodape',
    organizationListPreviewButton: 'lh-lista-item',
    organizationListCreateOrganizationActionButton: 'lh-lista-item',
  },
}
