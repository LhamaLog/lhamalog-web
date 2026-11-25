export type SessionMark = {
  id: string
  current: boolean
  revocable: boolean
}

export function markSessions(sessions: readonly { id: string }[], currentId: string | null | undefined): SessionMark[] {
  const current = typeof currentId === 'string' ? currentId : ''
  return sessions.map((session) => {
    const inUse = current !== '' && session.id === current
    return { id: session.id, current: inUse, revocable: !inUse }
  })
}

export function sessionsAfterRevoke<T extends { id: string }>(sessions: readonly T[], revokedId: string): T[] {
  return sessions.filter((session) => session.id !== revokedId)
}

type SessionTaskCarrier = {
  currentTask?: { key?: string } | null
  tasks?: ReadonlyArray<{ key?: string } | null> | null
}

export function sessionHasTask(session: SessionTaskCarrier | null | undefined, key: string): boolean {
  if (!session || !key) return false
  if (session.currentTask?.key === key) return true
  return (session.tasks ?? []).some((task) => task?.key === key)
}
