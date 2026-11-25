import { useContext } from 'react'
import { AccessContext } from './AccessProvider'
import type { AccessState } from './AccessProvider'

export function useAccess(): AccessState {
  const access = useContext(AccessContext)
  if (!access) throw new Error('useAccess precisa estar dentro do AccessProvider.')
  return access
}
