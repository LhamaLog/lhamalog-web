import { useState } from 'react'
import type { FormEvent } from 'react'
import { alertTypeCodes, alertTypeLabel, severityCodes, severityLabel } from '../../access/labels'
import { Button } from '../../../shared/ui/Button'
import { Checkbox } from '../../../shared/ui/Checkbox'
import { Input } from '../../../shared/ui/Input'
import { alertTypesError, nameError, severitiesError } from '../roleValidation'
import type { AlertType, Severity } from '../roleContract'

export type RoleFormValues = {
  name: string
  severities: Severity[]
  alertTypes: AlertType[]
}

type Props = {
  formId: string
  initial: RoleFormValues
  submitLabel: string
  busy: boolean
  serverErrors?: { name?: string, severities?: string, alertTypes?: string }
  // Editing a default role born with empty lists (Core C4): an empty list that was not touched is not sent,
  // so it is not refused either. A new role always needs both lists.
  keepUntouchedEmptyLists?: boolean
  onSubmit: (values: RoleFormValues) => void
  onCancel?: () => void
}

function toggle<T>(values: T[], value: T): T[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value]
}

// Name, severities and alert types of a notification role (spec 005, US5). Refuses empty lists before the Core.
export function RoleForm({ formId, initial, submitLabel, busy, serverErrors = {}, keepUntouchedEmptyLists = false, onSubmit, onCancel }: Props) {
  const [name, setName] = useState(initial.name)
  const [severities, setSeverities] = useState<Severity[]>(initial.severities)
  const [alertTypes, setAlertTypes] = useState<AlertType[]>(initial.alertTypes)
  const [errors, setErrors] = useState<{ name?: string, severities?: string, alertTypes?: string }>({})

  function submit(event: FormEvent) {
    event.preventDefault()
    const untouchedEmpty = (current: readonly string[], start: readonly string[]) =>
      keepUntouchedEmptyLists && current.length === 0 && start.length === 0
    const next = {
      name: nameError(name),
      severities: untouchedEmpty(severities, initial.severities) ? undefined : severitiesError(severities),
      alertTypes: untouchedEmpty(alertTypes, initial.alertTypes) ? undefined : alertTypesError(alertTypes),
    }
    setErrors(next)
    if (next.name || next.severities || next.alertTypes) return
    onSubmit({ name: name.trim(), severities, alertTypes })
  }

  const shown = { ...errors, ...Object.fromEntries(Object.entries(serverErrors).filter(([, value]) => value)) }
  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <fieldset disabled={busy} className="space-y-4 disabled:opacity-70">
        <Input id={`${formId}-name`} label="Nome do cargo" requiredMark maxLength={60} value={name} error={shown.name} onChange={(event) => setName(event.target.value)} />
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold text-slate-900">Gravidades</legend>
          {severityCodes.map((code) => (
            <Checkbox key={code} id={`${formId}-severity-${code}`} label={severityLabel(code)} checked={severities.includes(code)} onChange={() => setSeverities((current) => toggle(current, code))} />
          ))}
          {shown.severities ? <p role="alert" className="text-sm text-red-700">{shown.severities}</p> : null}
        </fieldset>
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold text-slate-900">Tipos de alerta</legend>
          {alertTypeCodes.map((code) => (
            <Checkbox key={code} id={`${formId}-type-${code}`} label={alertTypeLabel(code)} checked={alertTypes.includes(code)} onChange={() => setAlertTypes((current) => toggle(current, code))} />
          ))}
          {shown.alertTypes ? <p role="alert" className="text-sm text-red-700">{shown.alertTypes}</p> : null}
        </fieldset>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" size="small" fullWidth={false}>{busy ? 'Salvando...' : submitLabel}</Button>
          {onCancel ? <Button type="button" variant="outline" size="small" fullWidth={false} onClick={onCancel}>Cancelar</Button> : null}
        </div>
      </fieldset>
    </form>
  )
}
