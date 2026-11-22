import { useEffect, useRef, useState } from 'react'
import { useAccess } from '../../access/useAccess'
import { alertTypeLabel, severityLabel } from '../../access/labels'
import { ApiError } from '../../../shared/services/api'
import { useApi } from '../../../shared/services/useApi'
import { Badge } from '../../../shared/ui/Badge'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { ErrorState } from '../../../shared/ui/ErrorState'
import { LoadingState } from '../../../shared/ui/LoadingState'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { notificationRolesPath, readRole, readRoleList, roleBadge, roleErrorMessage, rolePath } from '../roleContract'
import type { NotificationRole } from '../roleContract'
import { RoleForm } from './RoleForm'
import type { RoleFormValues } from './RoleForm'
import { RoleMembersPanel } from './RoleMembersPanel'

type FieldErrors = { name?: string, severities?: string, alertTypes?: string }

const invalidResponse = 'O servidor retornou uma resposta inválida.'
const staleMessage = 'Os dados foram alterados. Recarregue antes de salvar novamente.'
const deleteQuestion = 'A exclusão é definitiva. As pessoas deste cargo deixam de receber os alertas dele.'

function sameList(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((item) => right.includes(item))
}

// Catalog of notification roles (spec 012, US5 and US6; USID_052). Roles only decide who receives alerts.
export function NotificationRolesPage() {
  const access = useAccess()
  const request = useApi()
  const requestRef = useRef(request)
  requestRef.current = request
  const [roles, setRoles] = useState<NotificationRole[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [revision, setRevision] = useState(0)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [membersOf, setMembersOf] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const allowed = access.can('NOTIFICATION_ROLES_MANAGE')

  useEffect(() => {
    if (!allowed) return
    let active = true
    setLoading(true)
    setLoadError('')
    requestRef.current<unknown>(notificationRolesPath)
      .then((body) => {
        if (!active) return
        const list = readRoleList(body)
        if (!list) {
          setLoadError(invalidResponse)
          return
        }
        setRoles(list)
      })
      .catch((reason: unknown) => { if (active) setLoadError(reason instanceof Error ? reason.message : invalidResponse) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [allowed, revision])

  function replace(updated: NotificationRole) {
    setRoles((current) => current.map((role) => role.id === updated.id ? updated : role))
  }

  function fail(reason: unknown) {
    if (reason instanceof ApiError && reason.code === 'role_name_in_use') {
      setFieldErrors({ name: roleErrorMessage(reason.code) ?? reason.message })
      return
    }
    if (reason instanceof ApiError && reason.status === 409 && !reason.code) {
      setError(staleMessage)
      setEditing(null)
      setRevision((current) => current + 1)
      return
    }
    if (reason instanceof ApiError && Object.keys(reason.fieldErrors).length > 0) {
      setFieldErrors(reason.fieldErrors)
      return
    }
    const known = reason instanceof ApiError ? roleErrorMessage(reason.code) : null
    setError(known ?? (reason instanceof Error ? reason.message : invalidResponse))
  }

  function start() {
    setBusy(true)
    setMessage('')
    setError('')
    setFieldErrors({})
  }

  async function create(values: RoleFormValues) {
    if (busy) return
    start()
    try {
      const created = readRole(await requestRef.current<unknown>(notificationRolesPath, { method: 'POST', body: JSON.stringify(values) }))
      if (!created) throw new ApiError(invalidResponse, 200)
      setRoles((current) => [...current, created])
      setCreating(false)
      setMessage('Cargo criado.')
    } catch (reason) {
      fail(reason)
    } finally {
      setBusy(false)
    }
  }

  // Each change goes in its own call with the version the previous answer returned (Core FR-017).
  async function update(role: NotificationRole, values: RoleFormValues) {
    if (busy) return
    start()
    let current = role
    try {
      const steps: { changed: boolean, path: string, method: 'PATCH' | 'PUT', body: () => object }[] = [
        { changed: values.name !== role.name, path: rolePath(role.id), method: 'PATCH', body: () => ({ name: values.name, version: current.version }) },
        { changed: !sameList(values.severities, role.severities), path: `${rolePath(role.id)}/severities`, method: 'PUT', body: () => ({ severities: values.severities, version: current.version }) },
        { changed: !sameList(values.alertTypes, role.alertTypes), path: `${rolePath(role.id)}/alert-types`, method: 'PUT', body: () => ({ alertTypes: values.alertTypes, version: current.version }) },
      ]
      for (const step of steps) {
        if (!step.changed) continue
        const next = readRole(await requestRef.current<unknown>(step.path, { method: step.method, body: JSON.stringify(step.body()) }))
        if (!next) throw new ApiError(invalidResponse, 200)
        current = next
        replace(next)
      }
      setEditing(null)
      setMessage('Cargo atualizado.')
    } catch (reason) {
      fail(reason)
    } finally {
      setBusy(false)
    }
  }

  async function remove(role: NotificationRole) {
    if (busy || !window.confirm(deleteQuestion)) return
    start()
    try {
      await requestRef.current<unknown>(rolePath(role.id), { method: 'DELETE' })
      setRoles((current) => current.filter((item) => item.id !== role.id))
      setMessage('Cargo excluído.')
    } catch (reason) {
      fail(reason)
    } finally {
      setBusy(false)
    }
  }

  if (access.status === 'loading') return <LoadingState label="Carregando acesso..." />
  if (!allowed) {
    return <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">Somente o Dono ou um Administrador pode gerenciar os cargos.</p>
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Cargos de notificação"
        description="Os cargos decidem quem recebe cada alerta. Eles não dão permissão de acesso."
        actions={<Button size="small" fullWidth={false} disabled={busy} onClick={() => { setCreating(true); setFieldErrors({}) }}>Novo cargo</Button>}
      />
      {message ? <p role="status" className="rounded-lg bg-green-50 p-4 text-sm text-green-800">{message}</p> : null}
      {error ? <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</p> : null}
      {creating ? (
        <Card>
          <h2 className="mb-3 text-lg font-semibold text-[#083B7A]">Novo cargo</h2>
          <RoleForm formId="role-new" initial={{ name: '', severities: [], alertTypes: [] }} submitLabel="Criar cargo" busy={busy} serverErrors={fieldErrors} onSubmit={(values) => { void create(values) }} onCancel={() => setCreating(false)} />
        </Card>
      ) : null}
      {loading ? <LoadingState label="Carregando cargos..." /> : null}
      {!loading && loadError ? <ErrorState description={loadError} onRetry={() => setRevision((current) => current + 1)} /> : null}
      {!loading && !loadError ? (
        <ul className="space-y-3">
          {roles.map((role) => {
            const badge = roleBadge(role)
            return (
              <li key={role.id}>
                <Card className="space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-semibold text-[#083B7A]">{role.name}</h2>
                        {badge ? <Badge variant={role.immutable ? 'neutral' : 'info'}>{badge}</Badge> : null}
                      </div>
                      <p className="text-sm text-slate-600">
                        {role.immutable
                          ? 'Recebe todas as gravidades e todos os tipos.'
                          : `Gravidades: ${role.severities.map(severityLabel).join(', ') || 'nenhuma'}. Tipos: ${role.alertTypes.map(alertTypeLabel).join(', ') || 'nenhum'}.`}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="soft" size="small" fullWidth={false} onClick={() => setMembersOf(membersOf === role.id ? null : role.id)}>Pessoas</Button>
                      {role.immutable ? null : (
                        <>
                          <Button variant="outline" size="small" fullWidth={false} disabled={busy} onClick={() => { setEditing(role.id); setFieldErrors({}) }}>Editar</Button>
                          <Button variant="outline" size="small" fullWidth={false} disabled={busy} onClick={() => { void remove(role) }}>Excluir</Button>
                        </>
                      )}
                    </div>
                  </div>
                  {editing === role.id ? (
                    <RoleForm
                      formId={`role-${role.id}`}
                      initial={{ name: role.name, severities: role.severities, alertTypes: role.alertTypes }}
                      submitLabel="Salvar cargo"
                      busy={busy}
                      serverErrors={fieldErrors}
                      keepUntouchedEmptyLists
                      onSubmit={(values) => { void update(role, values) }}
                      onCancel={() => setEditing(null)}
                    />
                  ) : null}
                  {membersOf === role.id ? (
                    <RoleMembersPanel role={role} ownerUserId={access.ownerUserId} onChanged={replace} onClose={() => setMembersOf(null)} />
                  ) : null}
                </Card>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
