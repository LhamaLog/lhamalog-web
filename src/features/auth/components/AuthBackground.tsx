import type { ReactNode } from 'react'
import '../auth.css'

// Card padrão da Clerk (cores e fonte do baseAppearance) centralizado sobre o wallpaper.
export function AuthBackground({ children }: { children: ReactNode }) {
  return <main className="lh-fundo">{children}</main>
}
