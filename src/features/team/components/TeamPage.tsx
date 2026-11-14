import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth, useOrganization, useUser } from '@clerk/react'
import type { OrganizationInvitationResource, OrganizationResource } from '@clerk/shared/types'
import { SIGNED_OUT_REASON } from '../../auth/hooks/useSessionErrorHandler'
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
import type { InviteRole } from '../types'
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
  const orgIdRef = useRef(orgId)
  orgIdRef.current = orgId
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<InviteRole>('org:member')
  const [fieldErrors, setFieldErrors] = useState<{ emailAddress?: string, role?: string }>({})
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState<'send' | 'revoke' | 'resend' | null>(null)
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState<OrganizationInvitationResource[]>([])
  const [total, setTotal] = useState(0)
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

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

  if (!isLoaded || !organization) return <LoadingState label="Carregando equipe..." />
  if (!orgId) return null
  if (teamPageDenied(orgRole)) {
    return <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{teamAccessDeniedMessage}</p>
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
    </div>
  )
}
