import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth, useOrganization, useUser } from '@clerk/react'
import type { OrganizationInvitationResource, OrganizationMembershipResource, OrganizationResource } from '@clerk/shared/types'
import { SIGNED_OUT_REASON } from '../../auth/hooks/useSessionErrorHandler'
import { ApiError } from '../../../shared/services/api'
import { useApi } from '../../../shared/services/useApi'
import {
  clerkErrorMessage,
  hasUsablePending,
  invitationExpiry,
  isClerkSessionExpired,
  membershipBlocksInvite,
  resendPlan,
  roleLabel,
  teamAccessDeniedMessage,
  teamPageDenied,
} from '../invitations'
import { companyMembersPath, deactivationPath, readMemberList } from '../memberContract'
import { activeAdminCount, isActiveAdmin, lastAdminBlocked, lastAdminMessage, mergeMember, roleToUpdate } from '../members'
import type { InviteRole, MemberRow } from '../types'
import { emailFieldError, roleFieldError } from '../validation'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { ErrorState } from '../../../shared/ui/ErrorState'
import { Input } from '../../../shared/ui/Input'
import { LoadingState } from '../../../shared/ui/LoadingState'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { Pagination } from '../../../shared/ui/Pagination'
import { Select } from '../../../shared/ui/Select'

const pageSize = 10

function pageTotal(page: { data: unknown[], total_count: number, totalCount?: number }): number {
  return page.total_count ?? page.totalCount ?? page.data.length
}

function formatValidity(invitation: OrganizationInvitationResource): string {
  const explicit = 'expiresAt' in invitation ? (invitation as { expiresAt?: Date | null }).expiresAt : null
  const expiry = invitationExpiry({ createdAt: invitation.createdAt, expiresAt: explicit })
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(expiry)
}

function situation(invitation: OrganizationInvitationResource, now = new Date()): 'Pendente' | 'Expirado' {
  const explicit = 'expiresAt' in invitation ? (invitation as { expiresAt?: Date | null }).expiresAt : null
  return invitationExpiry({ createdAt: invitation.createdAt, expiresAt: explicit }).getTime() <= now.getTime() ? 'Expirado' : 'Pendente'
}

async function allPending(organization: OrganizationResource): Promise<OrganizationInvitationResource[]> {
  const items: OrganizationInvitationResource[] = []
  let page = 1
  let total = 0
  do {
    const result = await organization.getInvitations({ status: ['pending'], initialPage: page, pageSize })
    total = pageTotal(result)
    items.push(...result.data)
    page += 1
  } while ((page - 1) * pageSize < total && page <= 100)
  return items
}

function formatLastAccess(value: Date | null): string {
  if (!value) return 'Sem acesso registrado'
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(value)
}

async function everyMembership(organization: OrganizationResource): Promise<OrganizationMembershipResource[]> {
  const items: OrganizationMembershipResource[] = []
  let page = 1
  let total = 0
  do {
    const result = await organization.getMemberships({ initialPage: page, pageSize })
    total = pageTotal(result)
    items.push(...result.data)
    page += 1
  } while ((page - 1) * pageSize < total && page <= 100)
  return items
}

async function memberEmails(organization: OrganizationResource): Promise<string[]> {
  const emails: string[] = []
  let page = 1
  let total = 0
  do {
    const result = await organization.getMemberships({ initialPage: page, pageSize })
    total = pageTotal(result)
    for (const member of result.data) {
      const identifier = member.publicUserData?.identifier
      if (identifier) emails.push(identifier)
    }
    page += 1
  } while ((page - 1) * pageSize < total && page <= 100)
  return emails
}

export function TeamPage() {
  const { orgId, orgRole, signOut } = useAuth()
  const { user } = useUser()
  const { organization, isLoaded } = useOrganization()
  const request = useApi()
  const orgIdRef = useRef(orgId)
  orgIdRef.current = orgId
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<InviteRole>('org:member')
  const [fieldErrors, setFieldErrors] = useState<{ emailAddress?: string, role?: string }>({})
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState<'send' | 'revoke' | 'resend' | 'role' | 'deactivate' | 'reactivate' | null>(null)
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState<OrganizationInvitationResource[]>([])
  const [total, setTotal] = useState(0)
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [memberPage, setMemberPage] = useState(1)
  const [memberRows, setMemberRows] = useState<MemberRow[]>([])
  const [memberTotal, setMemberTotal] = useState(0)
  const [memberLoading, setMemberLoading] = useState(true)
  const [memberError, setMemberError] = useState('')
  const [memberReloadKey, setMemberReloadKey] = useState(0)
  const [roleDraft, setRoleDraft] = useState<Record<string, 'admin' | 'member'>>({})
  const [blocked, setBlocked] = useState('')

  const sameOrganization = useCallback((started: string | null | undefined) => orgIdRef.current === started, [])

  const fail = useCallback(async (reason: unknown, started: string | null | undefined) => {
    if (isClerkSessionExpired(reason)) {
      await signOut({ redirectUrl: `/sign-in?motivo=${SIGNED_OUT_REASON}` })
      return
    }
    if (!sameOrganization(started)) return
    setError(clerkErrorMessage(reason))
  }, [sameOrganization, signOut])

  useEffect(() => {
    if (!organization || teamPageDenied(orgRole)) return
    let active = true
    const started = organization.id
    setListLoading(true)
    setListError('')
    organization.getInvitations({ status: ['pending'], initialPage: page, pageSize })
      .then((result) => {
        if (!active || orgIdRef.current !== started) return
        setRows(result.data)
        setTotal(pageTotal(result))
      })
      .catch((reason: unknown) => {
        if (!active || orgIdRef.current !== started) return
        if (isClerkSessionExpired(reason)) {
          void signOut({ redirectUrl: `/sign-in?motivo=${SIGNED_OUT_REASON}` })
          return
        }
        setListError(clerkErrorMessage(reason))
      })
      .finally(() => {
        if (active) setListLoading(false)
      })
    return () => { active = false }
  }, [organization, orgRole, page, reloadKey, signOut])

  async function send(event: FormEvent) {
    event.preventDefault()
    if (!organization || busy) return
    const started = orgId
    const emailError = emailFieldError(email)
    const roleError = roleFieldError(role)
    setFieldErrors({ emailAddress: emailError, role: roleError })
    setMessage('')
    setError('')
    if (emailError || roleError) return
    setBusy('send')
    try {
      const identifiers = [...await memberEmails(organization), user?.primaryEmailAddress?.emailAddress ?? '']
      if (!sameOrganization(started)) return
      if (membershipBlocksInvite(identifiers, email)) {
        setError('Esta pessoa já pertence à empresa.')
        return
      }
      const pending = await allPending(organization)
      if (!sameOrganization(started)) return
      if (hasUsablePending(pending, email)) {
        setError('Já existe um convite pendente para este e-mail. Use reenviar.')
        return
      }
      const sent = email.trim()
      await organization.inviteMember({ emailAddress: sent, role })
      if (!sameOrganization(started)) return
      setEmail('')
      setMessage(`Convite enviado para ${sent} como ${roleLabel(role)}. Ele expira em 7 dias.`)
      setPage(1)
      setReloadKey((value) => value + 1)
    } catch (reason) {
      await fail(reason, started)
    } finally {
      if (sameOrganization(started)) setBusy(null)
    }
  }

  async function revoke(invitation: OrganizationInvitationResource) {
    if (busy) return
    const started = orgId
    setMessage('')
    setError('')
    setBusy('revoke')
    try {
      await invitation.revoke()
      if (!sameOrganization(started)) return
      setMessage('Convite revogado.')
      setReloadKey((value) => value + 1)
    } catch (reason) {
      await fail(reason, started)
    } finally {
      if (sameOrganization(started)) setBusy(null)
    }
  }

  async function resend(invitation: OrganizationInvitationResource) {
    if (!organization || busy) return
    const started = orgId
    setMessage('')
    setError('')
    setBusy('resend')
    try {
      const pending = await allPending(organization)
      if (!sameOrganization(started)) return
      const plan = resendPlan({ pending, email: invitation.emailAddress, role: invitation.role, revokeFailed: false })
      const byId = new Map(pending.map((item) => [item.id, item]))
      for (const id of plan.revokeIds) {
        const current = byId.get(id)
        if (!current) throw new Error('Não foi possível revogar o convite pendente.')
        await current.revoke()
        if (!sameOrganization(started)) return
      }
      if (!plan.invite) return
      try {
        await organization.inviteMember({ emailAddress: invitation.emailAddress, role: invitation.role })
      } catch (reason) {
        if (sameOrganization(started)) setReloadKey((value) => value + 1)
        throw reason
      }
      if (!sameOrganization(started)) return
      setMessage(`Convite enviado para ${invitation.emailAddress} como ${roleLabel(invitation.role)}. Ele expira em 7 dias.`)
      setPage(1)
      setReloadKey((value) => value + 1)
    } catch (reason) {
      if (sameOrganization(started)) setReloadKey((value) => value + 1)
      await fail(reason, started)
    } finally {
      if (sameOrganization(started)) setBusy(null)
    }
  }

  useEffect(() => {
    if (!organization || teamPageDenied(orgRole)) return
    let active = true
    const started = organization.id
    setMemberLoading(true)
    setMemberError('')
    setBlocked('')
    Promise.all([
      organization.getMemberships({ initialPage: memberPage, pageSize }),
      request<unknown>(companyMembersPath),
    ])
      .then(([memberships, body]) => {
        if (!active || orgIdRef.current !== started) return
        const core = readMemberList(body)
        if (!core) {
          setMemberRows([])
          setMemberError('O servidor retornou uma resposta inválida.')
          return
        }
        const coreById = new Map(core.map((member) => [member.userId, member]))
        const next = memberships.data.map((member) => mergeMember({
          userId: member.publicUserData?.userId,
          firstName: member.publicUserData?.firstName,
          lastName: member.publicUserData?.lastName,
          identifier: member.publicUserData?.identifier,
          role: member.role,
        }, coreById.get(member.publicUserData?.userId ?? '') ?? null))
        setMemberRows(next)
        setMemberTotal(pageTotal(memberships))
        setRoleDraft(Object.fromEntries(next.flatMap((row) => {
          const update = row.userId ? roleToUpdate(row.role) : null
          return update && row.userId ? [[row.userId, update]] : []
        })))
      })
      .catch((reason: unknown) => {
        if (!active || orgIdRef.current !== started) return
        if (reason instanceof ApiError && reason.code === 'user_deactivated') {
          setMemberRows([])
          setBlocked(reason.message)
          return
        }
        if (reason instanceof ApiError && reason.status === 401) return
        if (isClerkSessionExpired(reason)) {
          void signOut({ redirectUrl: `/sign-in?motivo=${SIGNED_OUT_REASON}` })
          return
        }
        setMemberRows([])
        setMemberError(reason instanceof ApiError ? reason.message : clerkErrorMessage(reason))
      })
      .finally(() => {
        if (active) setMemberLoading(false)
      })
    return () => { active = false }
  }, [organization, orgRole, memberPage, memberReloadKey, request, signOut])

  async function freshAdminCount(started: string | null | undefined): Promise<number | null> {
    if (!organization) return null
    const memberships = await everyMembership(organization)
    if (!sameOrganization(started)) return null
    const body = await request<unknown>(companyMembersPath)
    if (!sameOrganization(started)) return null
    const core = readMemberList(body)
    if (!core) throw new ApiError('O servidor retornou uma resposta inválida.', 200)
    return activeAdminCount(memberships.map((member) => ({
      role: member.role,
      userId: member.publicUserData?.userId ?? null,
    })), core)
  }

  async function saveRole(row: MemberRow) {
    if (!organization || !row.userId || busy) return
    const started = orgId
    const next = roleDraft[row.userId] ?? roleToUpdate(row.role)
    if (!next) {
      setError('Escolha Administrador ou Membro.')
      return
    }
    setMessage('')
    setError('')
    setBusy('role')
    try {
      if (isActiveAdmin(row.role, row.status) && next === 'member') {
        const count = await freshAdminCount(started)
        if (!sameOrganization(started) || count === null) return
        if (lastAdminBlocked({ adminCount: count, targetIsActiveAdmin: true, action: 'demote' })) {
          setError(lastAdminMessage('demote'))
          return
        }
      }
      await organization.updateMember({ userId: row.userId, role: next })
      if (!sameOrganization(started)) return
      setMessage(`Cargo atualizado para ${roleLabel(next)}.`)
      setMemberReloadKey((value) => value + 1)
    } catch (reason) {
      if (reason instanceof ApiError && reason.code === 'user_deactivated' && sameOrganization(started)) {
        setBlocked(reason.message)
        return
      }
      await fail(reason, started)
    } finally {
      if (sameOrganization(started)) setBusy(null)
    }
  }

  async function changeStatus(row: MemberRow, status: 'active' | 'deactivated') {
    if (!row.userId || busy) return
    const started = orgId
    const path = deactivationPath(row.userId)
    if (!path) {
      setError('Informe o usuário.')
      return
    }
    setMessage('')
    setError('')
    setBusy(status === 'deactivated' ? 'deactivate' : 'reactivate')
    try {
      if (status === 'deactivated' && isActiveAdmin(row.role, row.status)) {
        const count = await freshAdminCount(started)
        if (!sameOrganization(started) || count === null) return
        if (lastAdminBlocked({ adminCount: count, targetIsActiveAdmin: true, action: 'deactivate' })) {
          setError(lastAdminMessage('deactivate'))
          return
        }
      }
      await request(path, { method: status === 'deactivated' ? 'POST' : 'DELETE' })
      if (!sameOrganization(started)) return
      setMessage(status === 'deactivated' ? 'Usuário desativado.' : 'Acesso reativado.')
      setMemberReloadKey((value) => value + 1)
    } catch (reason) {
      if (!sameOrganization(started)) return
      if (reason instanceof ApiError && reason.code === 'user_deactivated') {
        setBlocked(reason.message)
        return
      }
      if (reason instanceof ApiError && reason.code === 'last_admin') {
        setError(reason.message)
        setMemberReloadKey((value) => value + 1)
        return
      }
      setError(reason instanceof ApiError ? reason.message : clerkErrorMessage(reason))
    } finally {
      if (sameOrganization(started)) setBusy(null)
    }
  }

  if (!isLoaded || !organization) return <LoadingState label="Carregando equipe..." />
  if (!orgId) return null
  if (teamPageDenied(orgRole)) {
    return <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{teamAccessDeniedMessage}</p>
  }
  if (blocked) {
    return (
      <div className="space-y-5">
        <PageHeader title="Equipe" description="Convide uma pessoa para a empresa selecionada. O convite vale 7 dias." />
        <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{blocked}</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Equipe" description="Convide uma pessoa para a empresa selecionada. O convite vale 7 dias." />
      {message && <p role="status" className="rounded-lg bg-green-50 p-4 text-sm text-green-800">{message}</p>}
      {error && <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      <Card>
        <form onSubmit={send} className="space-y-4" noValidate>
          <fieldset disabled={busy !== null} className="space-y-4 disabled:opacity-70">
            <div className="grid gap-4 md:grid-cols-2">
              <Input id="team-email" label="E-mail" type="email" autoComplete="email" requiredMark value={email} error={fieldErrors.emailAddress} onChange={(event) => setEmail(event.target.value)} />
              <Select id="team-role" label="Cargo" requiredMark value={role} error={fieldErrors.role} onChange={(event) => setRole(event.target.value as InviteRole)}>
                <option value="org:member">Membro</option>
                <option value="org:admin">Administrador</option>
              </Select>
            </div>
            <Button type="submit" fullWidth={false}>{busy === 'send' ? 'Enviando...' : 'Enviar convite'}</Button>
          </fieldset>
        </form>
      </Card>
      <Card>
        <h2 className="text-lg font-semibold text-[#083B7A]">Convites pendentes</h2>
        {listLoading && rows.length === 0 ? <LoadingState label="Carregando convites..." /> : null}
        {listError ? <ErrorState description={listError} onRetry={() => setReloadKey((value) => value + 1)} /> : null}
        {!listError && !listLoading && rows.length === 0 ? <p role="status" className="mt-4 text-sm text-slate-600">Não há convite pendente.</p> : null}
        {rows.length > 0 ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <caption className="sr-only">Convites pendentes da empresa selecionada</caption>
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th scope="col" className="px-2 py-2 font-semibold">E-mail</th>
                  <th scope="col" className="px-2 py-2 font-semibold">Cargo</th>
                  <th scope="col" className="px-2 py-2 font-semibold">Validade</th>
                  <th scope="col" className="px-2 py-2 font-semibold">Situação</th>
                  <th scope="col" className="px-2 py-2 font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((invitation) => (
                  <tr key={invitation.id} className="border-t border-slate-200">
                    <td className="px-2 py-3">{invitation.emailAddress}</td>
                    <td className="px-2 py-3">{roleLabel(invitation.role)}</td>
                    <td className="px-2 py-3">{formatValidity(invitation)}</td>
                    <td className="px-2 py-3">{situation(invitation)}</td>
                    <td className="px-2 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="small" fullWidth={false} disabled={busy !== null} onClick={() => { void revoke(invitation) }}>{busy === 'revoke' ? 'Revogando...' : 'Revogar'}</Button>
                        <Button variant="soft" size="small" fullWidth={false} disabled={busy !== null} onClick={() => { void resend(invitation) }}>{busy === 'resend' ? 'Reenviando...' : 'Reenviar'}</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
        {total > pageSize ? <div className="mt-4"><Pagination page={page} pageSize={pageSize} totalItems={total} itemLabel="convites" onPageChange={setPage} /></div> : null}
      </Card>
      <Card>
        <h2 className="text-lg font-semibold text-[#083B7A]">Usuários</h2>
        {memberLoading && memberRows.length === 0 ? <LoadingState label="Carregando usuários..." /> : null}
        {memberError ? <ErrorState description={memberError} onRetry={() => setMemberReloadKey((value) => value + 1)} /> : null}
        {!memberError && !memberLoading && memberRows.length === 0 ? <p role="status" className="mt-4 text-sm text-slate-600">Não há usuário vinculado.</p> : null}
        {memberRows.length > 0 ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[52rem] text-left text-sm">
              <caption className="sr-only">Usuários da empresa selecionada</caption>
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th scope="col" className="px-2 py-2 font-semibold">Nome</th>
                  <th scope="col" className="px-2 py-2 font-semibold">E-mail</th>
                  <th scope="col" className="px-2 py-2 font-semibold">Cargo</th>
                  <th scope="col" className="px-2 py-2 font-semibold">Status</th>
                  <th scope="col" className="px-2 py-2 font-semibold">Último acesso</th>
                  <th scope="col" className="px-2 py-2 font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {memberRows.map((row) => {
                  const current = roleToUpdate(row.role)
                  const draft = row.userId ? roleDraft[row.userId] ?? current : null
                  return (
                    <tr key={row.userId ?? `${row.email}-${row.role}`} className="border-t border-slate-200">
                      <td className="px-2 py-3">{row.name}</td>
                      <td className="px-2 py-3">{row.email}</td>
                      <td className="px-2 py-3">{roleLabel(row.role)}</td>
                      <td className="px-2 py-3">{row.status === 'deactivated' ? 'Desativado' : 'Ativo'}</td>
                      <td className="px-2 py-3">{formatLastAccess(row.lastAccessAt)}</td>
                      <td className="px-2 py-3">
                        {row.userId ? (
                          <div className="flex flex-wrap items-end gap-2">
                            {current && draft ? (
                              <Select id={`member-role-${row.userId}`} label={`Cargo de ${row.email || row.name || 'usuário'}`} hideLabel value={draft} disabled={busy !== null} onChange={(event) => setRoleDraft((currentDraft) => ({ ...currentDraft, [row.userId ?? '']: event.target.value as 'admin' | 'member' }))}>
                                <option value="member">Membro</option>
                                <option value="admin">Administrador</option>
                              </Select>
                            ) : null}
                            {current && draft ? <Button variant="outline" size="small" fullWidth={false} disabled={busy !== null || draft === current} onClick={() => { void saveRole(row) }}>{busy === 'role' ? 'Salvando...' : 'Salvar cargo'}</Button> : null}
                            {row.status === 'deactivated'
                              ? <Button variant="soft" size="small" fullWidth={false} disabled={busy !== null} onClick={() => { void changeStatus(row, 'active') }}>{busy === 'reactivate' ? 'Reativando...' : 'Reativar'}</Button>
                              : <Button variant="outline" size="small" fullWidth={false} disabled={busy !== null} onClick={() => { void changeStatus(row, 'deactivated') }}>{busy === 'deactivate' ? 'Desativando...' : 'Desativar'}</Button>}
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : null}
        {memberTotal > pageSize ? <div className="mt-4"><Pagination page={memberPage} pageSize={pageSize} totalItems={memberTotal} itemLabel="usuários" onPageChange={setMemberPage} /></div> : null}
      </Card>
    </div>
  )
}
