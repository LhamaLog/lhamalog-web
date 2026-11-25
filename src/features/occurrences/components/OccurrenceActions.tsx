import { useEffect, useId, useState } from 'react'
import { useApi } from '../../../shared/services/useApi'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { Select } from '../../../shared/ui/Select'
import { statusLabel } from '../labels'
import { actionFailure, archiveAction, statusAction, successMessage, unarchiveAction } from '../occurrenceActions'
import type { ActionRequest, OccurrenceAction } from '../occurrenceActions'
import { occurrenceStatuses } from '../types'
import type { OccurrenceDetail, OccurrenceStatus } from '../types'

type OccurrenceActionsProps = {
  occurrence: OccurrenceDetail & { revision: string }
  onChanged: (detail: OccurrenceDetail) => void
  onReload: () => void
  onNotFound: () => void
}

// Status and archive actions of the detail (spec 013, LLT-136). The caller shows it only with OCCURRENCES_MANAGE and a
// revision; the Core answer replaces the detail, so the screen never shows a state that is not stored.
export function OccurrenceActions({ occurrence, onChanged, onReload, onNotFound }: OccurrenceActionsProps) {
  const request = useApi()
  const selectId = useId()
  const [status, setStatus] = useState<OccurrenceStatus>(occurrence.status)
  const [running, setRunning] = useState(false)
  const [notice, setNotice] = useState('')
  const [failure, setFailure] = useState<{ message: string; conflict: boolean } | null>(null)
  const archived = Boolean(occurrence.archivedAt)

  // A new detail (after an action or a reload) resets the choice to what is stored.
  useEffect(() => { setStatus(occurrence.status) }, [occurrence.status, occurrence.revision])

  async function run(action: OccurrenceAction, call: ActionRequest) {
    setRunning(true)
    setNotice('')
    setFailure(null)
    try {
      const detail = await request<OccurrenceDetail>(call.path, { method: call.method, body: JSON.stringify(call.body) })
      onChanged(detail)
      setNotice(successMessage(action))
    }
    catch (reason) {
      const result = actionFailure(reason)
      if (result.kind === 'not-found') onNotFound()
      else setFailure({ message: result.message, conflict: result.kind === 'conflict' })
    }
    finally {
      setRunning(false)
    }
  }

  return (
    <Card className="space-y-3">
      <h2 className="text-sm font-bold text-[#083B7A]">Ações</h2>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="sm:w-56">
          <Select id={selectId} label="Status" value={status} disabled={running} onChange={(event) => setStatus(event.target.value as OccurrenceStatus)}>
            {occurrenceStatuses.map(value => <option key={value} value={value}>{statusLabel(value)}</option>)}
          </Select>
        </div>
        <Button
          size="small"
          fullWidth={false}
          disabled={running || status === occurrence.status}
          onClick={() => run('status', statusAction(occurrence.id, status, occurrence.revision))}
        >
          Alterar status
        </Button>
        <Button
          size="small"
          variant="outline"
          fullWidth={false}
          disabled={running}
          onClick={() => run(archived ? 'unarchive' : 'archive',
            archived ? unarchiveAction(occurrence.id, occurrence.revision) : archiveAction(occurrence.id, occurrence.revision))}
        >
          {archived ? 'Desarquivar' : 'Arquivar'}
        </Button>
      </div>
      <p aria-live="polite" className="text-sm text-green-700">{notice}</p>
      {failure && (
        <div role="alert" className="flex flex-col gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
          <span>{failure.message}</span>
          {failure.conflict && <Button size="small" variant="outline" fullWidth={false} onClick={() => { setFailure(null); onReload() }}>Recarregar</Button>}
        </div>
      )}
    </Card>
  )
}
