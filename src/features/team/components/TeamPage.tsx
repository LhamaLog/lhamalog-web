import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth, useOrganization, useUser } from '@clerk/react'
import type { OrganizationInvitationResource, OrganizationMembershipResource, OrganizationResource } from '@clerk/shared/types'
import { useSessionErrorHandler } from '../../auth/hooks/useSessionErrorHandler'
import { ApiError } from '../../../shared/services/api'
import { classifyRejection } from '../../../shared/services/sessionRedirect'
import { useApi } from '../../../shared/services/useApi'
import {
  clerkErrorMessage,
  hasUsablePending,
  invitationExpiry,
  isClerkSessionExpired,
  membershipBlocksInvite,
  resendPlan,
  roleLabel,
  teamLoadKey,
} from '../invitations'
import { companyMembersPath, deactivationPath, readMemberList } from '../memberContract'
import { activeAdminCount, deactivatedTeamBlock, isActiveAdmin, localLastAdminGuard, mergeMember, roleToUpdate, shouldApplyTeamList, teamListsForCurrentOrganization, teamScreen } from '../members'
import type { InviteRole, MemberRow } from '../types'
import { emailFieldError, roleFieldError } from '../validation'
import { useAccess } from '../../access/useAccess'
import { canDeactivate, canDemote, demoteGuard, inviteHelpFor, inviteRolesFor, isOwnerRow, ownerDeactivateMessage, resendBlocked, rowRoleLabel } from '../ownerRules'
import { fullAccessMessage } from '../productAccess'
import { personRolesPath, readPersonRoles } from '../../notification-roles/roleContract'
import { MemberProductsPanel } from './MemberProductsPanel'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { ErrorState } from '../../../shared/ui/ErrorState'
import { Input } from '../../../shared/ui/Input'
import { LoadingState } from '../../../shared/ui/LoadingState'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { Pagination } from '../../../shared/ui/Pagination'
import { Select } from '../../../shared/ui/Select'

const pageSize = 10
const maxPages = 100
const incompleteListMessage = 'A lista pode estar incompleta.'

function listMayBeIncomplete(total: number): boolean {
  return total > pageSize * maxPages
}

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
  } while ((page - 1) * pageSize < total && page <= maxPages)
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
  } while ((page - 1) * pageSize < total && page <= maxPages)
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
  } while ((page - 1) * pageSize < total && page <= maxPages)
  return emails
}

export function TeamPage() {
  const { orgId, orgRole } = useAuth()
  const { user } = useUser()
  const { organization, isLoaded } = useOrganization()
  const request = useApi()
  // LLT-120: owner and invitation rules come from the Core access (spec 005, US2 and US3).
  const access = useAccess()
  const ownerUserId = access.ownerUserId
  const inviteOptions = inviteRolesFor(access.role, ownerUserId !== null)
  const [productsFor, setProductsFor] = useState<MemberRow | null>(null)
  const [rolesText, setRolesText] = useState<Record<string, string>>({})
  const orgIdRef = useRef(orgId)
  const organizationRef = useRef(organization)
  const requestRef = useRef(request)
  const endSession = useSessionErrorHandler()
  const endSessionRef = useRef(endSession)
  orgIdRef.current = orgId
  organizationRef.current = organization
  requestRef.current = request
  endSessionRef.current = endSession
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
  const organizationId = organization?.id ?? null
  const [listOrgId, setListOrgId] = useState(organizationId)
  const nextLists = teamListsForCurrentOrganization({
    previousOrgId: listOrgId,
    nextOrgId: organizationId,
    invitations: rows,
    members: memberRows,
  })
  if (nextLists.changed) {
    setListOrgId(organizationId)
    setRows(nextLists.invitations)
    setTotal(0)
    setMemberRows(nextLists.members)
    setMemberTotal(0)
    setRoleDraft({})
  }
  const invitationKey = teamLoadKey({ organizationId, orgRole, page, reloadKey })
  const memberKey = teamLoadKey({ organizationId, orgRole, page: memberPage, reloadKey: memberReloadKey })

  const sameOrganization = useCallback((started: string | null | undefined) => orgIdRef.current === started, [])

  const fail = useCallback(async (reason: unknown, started: string | null | undefined) => {
    if (isClerkSessionExpired(reason)) {
      await endSessionRef.current(reason, true)
      return
    }
    if (!sameOrganization(started)) return
    setError(clerkErrorMessage(reason))
  }, [sameOrganization])

  useEffect(() => {
    const current = organizationRef.current
    if (!invitationKey || !current || current.id !== organizationId) return
    let active = true
    const started = current.id
    setListLoading(true)
    setListError('')
    current.getInvitations({ status: ['pending'], initialPage: page, pageSize })
      .then((result) => {
        if (!shouldApplyTeamList({ active, startedOrgId: started, currentOrgId: orgIdRef.current })) return
        setRows(result.data)
        setTotal(pageTotal(result))
      })
      .catch((reason: unknown) => {
        if (!shouldApplyTeamList({ active, startedOrgId: started, currentOrgId: orgIdRef.current })) return
        if (isClerkSessionExpired(reason)) {
          void endSessionRef.current(reason, true)
          return
        }
        setListError(clerkErrorMessage(reason))
      })
      .finally(() => {
        if (active) setListLoading(false)
      })
    return () => { active = false }
  }, [invitationKey, organizationId, page])

  async function send(event: FormEvent) {
    event.preventDefault()
    if (!organization || busy) return
    const started = orgId
    const emailError = emailFieldError(email)
    const roleError = roleFieldError(role) ?? (inviteOptions.includes(role) ? undefined : 'Escolha um cargo que você pode convidar.')
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
    const blockedResend = resendBlocked(access.role, ownerUserId !== null, invitation.role)
    if (blockedResend) {
      setMessage('')
      setError(blockedResend)
      return
    }
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
    const current = organizationRef.current
    if (!memberKey || !current || current.id !== organizationId) return
    let active = true
    const started = current.id
    setMemberLoading(true)
    setMemberError('')
    setBlocked('')
    Promise.all([
      current.getMemberships({ initialPage: memberPage, pageSize }),
      requestRef.current<unknown>(companyMembersPath),
    ])
      .then(([memberships, body]) => {
        if (!shouldApplyTeamList({ active, startedOrgId: started, currentOrgId: orgIdRef.current })) return
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
        if (!shouldApplyTeamList({ active, startedOrgId: started, currentOrgId: orgIdRef.current })) return
        const block = reason instanceof ApiError ? deactivatedTeamBlock(reason) : null
        if (block !== null) {
          setMemberRows([])
          setBlocked(block)
          return
        }
        // O useApi já encerrou a sessão (401 ou 403 de segurança); não mostra erro durante a saída.
        if (reason instanceof ApiError && classifyRejection(reason.status, reason.code, reason.serverMessage) === 'session') return
        if (isClerkSessionExpired(reason)) {
          void endSessionRef.current(reason, true)
          return
        }
        setMemberRows([])
        setMemberError(reason instanceof ApiError ? reason.message : clerkErrorMessage(reason))
      })
      .finally(() => {
        if (active) setMemberLoading(false)
      })
    return () => { active = false }
  }, [memberKey, organizationId, memberPage])

  async function freshAdminCount(started: string | null | undefined): Promise<number | null> {
    const current = organizationRef.current
    if (!current) return null
    const memberships = await everyMembership(current)
    if (!sameOrganization(started)) return null
    const body = await requestRef.current<unknown>(companyMembersPath)
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
    const ownerBlock = demoteGuard(row.userId, ownerUserId, next)
    if (ownerBlock) {
      setMessage('')
      setError(ownerBlock)
      return
    }
    setMessage('')
    setError('')
    setBusy('role')
    try {
      if (isActiveAdmin(row.role, row.status) && next === 'member') {
        const count = await freshAdminCount(started)
        const guard = localLastAdminGuard({
          action: 'demote',
          targetIsActiveAdmin: true,
          adminCount: count,
          sameOrganization: sameOrganization(started),
        })
        if (!guard.call) {
          if (guard.error) setError(guard.error)
          return
        }
      }
      const current = organizationRef.current
      if (!current || !sameOrganization(started)) return
      await current.updateMember({ userId: row.userId, role: next })
      if (!sameOrganization(started)) return
      setMessage(`Cargo atualizado para ${roleLabel(next)}.`)
      setMemberReloadKey((value) => value + 1)
    } catch (reason) {
      const block = reason instanceof ApiError ? deactivatedTeamBlock(reason) : null
      if (block !== null && sameOrganization(started)) {
        setBlocked(block)
        return
      }
      await fail(reason, started)
    } finally {
      if (sameOrganization(started)) setBusy(null)
    }
  }

  // Notification roles of one person, loaded only when asked (spec 005, US6 scenario 4).
  async function showRoles(userId: string) {
    const path = personRolesPath(userId)
    if (!path) return
    setRolesText((current) => ({ ...current, [userId]: 'Carregando cargos...' }))
    try {
      const body = readPersonRoles(await requestRef.current<unknown>(path))
      const text = !body ? 'Não foi possível ler os cargos.' : body.roles.length === 0 ? 'Sem cargo de notificação.' : body.roles.map((item) => item.name).join(', ')
      setRolesText((current) => ({ ...current, [userId]: text }))
    } catch (reason) {
      setRolesText((current) => ({ ...current, [userId]: reason instanceof Error ? reason.message : 'Não foi possível carregar os cargos.' }))
    }
  }

  async function changeStatus(row: MemberRow, status: 'active' | 'deactivated') {
    if (!row.userId || busy) return
    if (status === 'deactivated' && !canDeactivate(row.userId, ownerUserId)) {
      setMessage('')
      setError(ownerDeactivateMessage)
      return
    }
    if (status === 'deactivated') {
      const who = row.name.trim() || row.email.trim() || 'este usuário'
      if (!window.confirm(`Desativar ${who}? A pessoa continua na empresa, com status Desativado.`)) return
    }
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
        const guard = localLastAdminGuard({
          action: 'deactivate',
          targetIsActiveAdmin: true,
          adminCount: count,
          sameOrganization: sameOrganization(started),
        })
        if (!guard.call) {
          if (guard.error) setError(guard.error)
          return
        }
      }
      await requestRef.current(path, { method: status === 'deactivated' ? 'POST' : 'DELETE' })
      if (!sameOrganization(started)) return
      setMessage(status === 'deactivated' ? 'Usuário desativado.' : 'Acesso reativado.')
      setMemberReloadKey((value) => value + 1)
    } catch (reason) {
      if (!sameOrganization(started)) return
      const block = reason instanceof ApiError ? deactivatedTeamBlock(reason) : null
      if (block !== null) {
        setBlocked(block)
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
  const screen = teamScreen({ orgRole, blockedMessage: blocked })
  if (screen.mode === 'denied') {
    return <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{screen.message}</p>
  }
  if (screen.mode === 'deactivated') {
    return (
      <div className="space-y-5">
        <PageHeader title="Equipe" description="Convide uma pessoa para a empresa selecionada. O convite vale 7 dias." />
        <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{screen.message}</p>
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
                {inviteOptions.map((option) => <option key={option} value={option}>{roleLabel(option)}</option>)}
              </Select>
            </div>
            {inviteHelpFor(inviteOptions) ? <p className="text-sm text-slate-600">{inviteHelpFor(inviteOptions)}</p> : null}
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
        {listMayBeIncomplete(total) ? <p role="status" className="mt-4 rounded-lg bg-amber-50 p-4 text-sm text-amber-800">{incompleteListMessage}</p> : null}
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
                  const owner = isOwnerRow(row.userId, ownerUserId)
                  const current = canDemote(row.userId, ownerUserId) ? roleToUpdate(row.role) : null
                  const draft = row.userId ? roleDraft[row.userId] ?? current : null
                  return (
                    <tr key={row.userId ?? `${row.email}-${row.role}`} className="border-t border-slate-200">
                      <td className="px-2 py-3">{row.name}</td>
                      <td className="px-2 py-3">{row.email}</td>
                      <td className="px-2 py-3">{rowRoleLabel(row.role, owner)}</td>
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
                              : owner ? null : <Button variant="outline" size="small" fullWidth={false} disabled={busy !== null} onClick={() => { void changeStatus(row, 'deactivated') }}>{busy === 'deactivate' ? 'Desativando...' : 'Desativar'}</Button>}
                            {access.can('PRODUCT_ACCESS_MANAGE')
                              ? owner || roleToUpdate(row.role) === 'admin'
                                ? <span className="text-xs text-slate-600">{fullAccessMessage}</span>
                                : <Button variant="soft" size="small" fullWidth={false} onClick={() => setProductsFor(row)}>Produtos</Button>
                              : null}
                            {access.can('NOTIFICATION_ROLES_MANAGE') && row.userId
                              ? rolesText[row.userId]
                                ? <span className="text-xs text-slate-600">Cargos: {rolesText[row.userId]}</span>
                                : <Button variant="soft" size="small" fullWidth={false} onClick={() => { if (row.userId) void showRoles(row.userId) }}>Cargos</Button>
                              : null}
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
        {productsFor?.userId ? (
          <MemberProductsPanel
            key={productsFor.userId}
            userId={productsFor.userId}
            personLabel={productsFor.name.trim() || productsFor.email.trim() || 'usuário'}
            onClose={() => setProductsFor(null)}
          />
        ) : null}
        {listMayBeIncomplete(memberTotal) ? <p role="status" className="mt-4 rounded-lg bg-amber-50 p-4 text-sm text-amber-800">{incompleteListMessage}</p> : null}
        {memberTotal > pageSize ? <div className="mt-4"><Pagination page={memberPage} pageSize={pageSize} totalItems={memberTotal} itemLabel="usuários" onPageChange={setMemberPage} /></div> : null}
      </Card>
    </div>
  )
}
