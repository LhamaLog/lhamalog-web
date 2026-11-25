import type { MessageKey } from '../../features/profile/messages'

export const footerLinks: readonly { labelKey: MessageKey, href: string }[] = [
  { labelKey: 'shell.privacy', href: '#privacidade' },
  { labelKey: 'shell.terms', href: '#termos' },
  { labelKey: 'shell.support', href: '#suporte' },
]
