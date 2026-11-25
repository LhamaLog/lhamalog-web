import { footerLinks } from '../../../app/layouts/footerLinks'
import { profileMessage } from '../messages'
import type { AppliedLanguage } from '../types'

export function HelpSection({ language }: { language: AppliedLanguage }) {
  return (
    <ul className="space-y-3">
      {footerLinks.map((link) => (
        <li key={link.href}>
          <a
            href={link.href}
            className="text-sm font-semibold text-[#0C70F2] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0C70F2]"
          >
            {profileMessage(language, link.labelKey)}
          </a>
        </li>
      ))}
    </ul>
  )
}
