import { useClerk } from '@clerk/react'
import { IconButton } from '../../../shared/ui/IconButton'

// Encerra a sessão na Clerk; o afterSignOutUrl do provider leva para /sign-in.
export function SignOutButton() {
  const { signOut } = useClerk()

  return (
    <IconButton variant="outline" aria-label="Sair" title="Sair" onClick={() => void signOut()}>
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
      </svg>
    </IconButton>
  )
}
