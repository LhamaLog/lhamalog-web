import type { ComponentProps } from 'react'
import type { ClerkProvider } from '@clerk/react'
import { ptBR } from '@clerk/localizations'
import { invitationOutcomeCopy } from '../../team/invitations'

type Localization = NonNullable<ComponentProps<typeof ClerkProvider>['localization']>

// pt-BR da Clerk (experimental, ADR_023) + textos do LhamaLog tirados do Figma.
// Atenção: chaves de nível raiz (formFieldLabel__*, socialButtonsBlockButton...) valem para TODAS as telas.
export const localization: Localization = {
  ...ptBR,

  // Campos (Figma: "E-mail" / "Senha" e placeholders)
  formFieldLabel__emailAddress: 'E-mail',
  formFieldLabel__password: 'Senha',
  formFieldInputPlaceholder__emailAddress: 'seu@exemplo.com',
  formFieldInputPlaceholder__password: 'Sua senha',
  formFieldAction__forgotPassword: 'Esqueci minha senha?',
  socialButtonsBlockButton: 'Entrar com {{provider|titleize}}',
  dividerText: 'ou',

  // Organização = empresa cliente (ADR_121, ADR_158)
  formFieldLabel__organizationName: 'Nome da empresa',
  formFieldInputPlaceholder__organizationName: 'Nome da sua empresa',

  signIn: {
    ...ptBR.signIn,
    start: {
      ...ptBR.signIn?.start,
      title: 'Entrar',
      subtitle: 'Acesse seus produtos, ocorrências e relatórios de forma simples e segura.',
      actionText: 'Não tem uma conta?',
      actionLink: 'Criar conta',
    },
    // Verificação por código de e-mail (Figma: "Verificação de segurança")
    emailCode: {
      ...ptBR.signIn?.emailCode,
      title: 'Verificação de segurança',
      subtitle: 'Enviamos um código de 6 dígitos para o seu e-mail. Digite o código abaixo para continuar.',
      formTitle: 'Código de verificação',
      resendButton: 'Reenviar código',
    },
    // Verificação por aplicativo autenticador (TOTP, ADR_024)
    totpMfa: {
      ...ptBR.signIn?.totpMfa,
      title: 'Verificação de segurança',
      subtitle: 'Digite o código gerado pelo seu aplicativo autenticador.',
      formTitle: 'Código de verificação',
    },
  },

  // Cadastro: o Figma não define esta tela. Textos abaixo são PROPOSTA, para validar com o time.
  signUp: {
    ...ptBR.signUp,
    start: {
      ...ptBR.signUp?.start,
      title: 'Criar conta',
      subtitle: 'Informe seus dados para acessar seus produtos, ocorrências e relatórios.',
      titleCombined: 'Criar conta',
      subtitleCombined: 'Informe seus dados para acessar seus produtos, ocorrências e relatórios.',
      actionText: 'Já tem uma conta?',
      actionLink: 'Entrar',
    },
    emailCode: {
      ...ptBR.signUp?.emailCode,
      title: 'Verificação de segurança',
      subtitle: 'Enviamos um código de 6 dígitos para o seu e-mail. Digite o código abaixo para continuar.',
      formTitle: 'Código de verificação',
    },
  },

  // Criar e escolher organização (proposta de textos)
  createOrganization: {
    ...ptBR.createOrganization,
    title: 'Criar organização',
    formButtonSubmit: 'Criar organização',
  },
  organizationList: {
    ...ptBR.organizationList,
    titleWithoutPersonal: 'Escolha uma organização',
    subtitle: 'Selecione a empresa que você quer acessar no LhamaLog.',
  },

  // Convite de organização aceito em /sign-in e /sign-up. As chaves já existem em ptBR.
  unstable__errors: {
    ...ptBR.unstable__errors,
    ticket_expired_code: invitationOutcomeCopy('expired'),
    ticket_invalid_code: invitationOutcomeCopy('revoked'),
  },

  // Etapas pós-login (session tasks): escolher organização, configurar MFA e redefinir senha
  taskChooseOrganization: {
    ...ptBR.taskChooseOrganization,
    chooseOrganization: {
      ...ptBR.taskChooseOrganization?.chooseOrganization,
      title: 'Escolha uma organização',
      subtitle: 'Entre em uma organização existente ou crie a da sua empresa.',
    },
    createOrganization: {
      ...ptBR.taskChooseOrganization?.createOrganization,
      title: 'Criar organização',
      subtitle: 'Informe os dados da sua empresa para continuar.',
      formFieldLabel__name: 'Nome da empresa',
      formFieldInputPlaceholder__name: 'Nome da sua empresa',
      formButtonSubmit: 'Criar organização',
    },
  },
}
