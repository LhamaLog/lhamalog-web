import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { ApiError } from '../../../shared/services/api'
import { endsSession } from '../../../shared/services/sessionRedirect'
import { Badge } from '../../../shared/ui/Badge'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { Input } from '../../../shared/ui/Input'
import {
  archivedTokenMessage,
  auditPath,
  readCreatedToken,
  readRotation,
  readTokenList,
  readTokenView,
  revokePath,
  rotatePath,
  tokensAfterCreate,
  tokensAfterRevoke,
  tokensAfterRotation,
  tokensPath,
} from '../tokenContract'
import type { TokenView } from '../tokenContract'
import {
  auditLine,
  createTokenBody,
  defaultTransitionHours,
  emptyTokensMessage,
  readAuditList,
  revokeQuestion,
  rotateHint,
  rotateQuestionFor,
  rotateTokenBody,
  tokenActions,
  tokenBadge,
  tokenDetails,
  tokenNameError,
  tokenNameMax,
  transitionHoursOf,
} from '../tokenManagement'
import type { AuditEntry } from '../tokenManagement'
import { useOrganizationPeople } from '../useOrganizationPeople'
import { CopyButton } from './CopyButton'

type Request = <T>(path: string, options?: RequestInit) => Promise<T>

type Props = {
  productId: string
  archived: boolean
  request: Request
  // Bumped by the form when the "Gerar nova" of the top changes the keys (K9).
  revision: number
  onChanged: () => void
}

const invalidResponse = 'O servidor retornou uma resposta inválida.'

// "Chaves deste produto" (spec 013, K1): below the Figma card, only for who has INGESTION_TOKENS_MANAGE (the form
// does not mount it otherwise). It lives outside the disabled fieldset of an archived product, so Revogar still
// works there (K7). A new secret lives only in this component's state, until the notice is closed or the tab changes.
export function IngestionTokensSection({ productId, archived, request, revision, onChanged }: Props) {
  const people = useOrganizationPeople(true)
  const [tokens, setTokens] = useState<TokenView[] | null>(null)
  const [loadError, setLoadError] = useState('')
  const [reloadCount, setReloadCount] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [secret, setSecret] = useState('')
  const [notice, setNotice] = useState('')
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [nameError, setNameError] = useState<string>()
  const [rotatingId, setRotatingId] = useState<string | null>(null)
  const [hours, setHours] = useState(String(defaultTransitionHours))
  const [hoursError, setHoursError] = useState<string>()
  const [historyOpen, setHistoryOpen] = useState(false)
  const [audit, setAudit] = useState<AuditEntry[] | null>(null)
  const [auditError, setAuditError] = useState('')
  const [auditCount, setAuditCount] = useState(0)
  const secretInput = useRef<HTMLInputElement>(null)
  const action = useRef<AbortController | null>(null)

  useEffect(() => () => action.current?.abort(), [])

  useEffect(() => {
    const current = new AbortController()
    setLoadError('')
    request<unknown>(tokensPath(productId), { signal: current.signal })
      .then((value) => { if (!current.signal.aborted) setTokens(readTokenList(value)) })
      .catch((reason) => { if (!current.signal.aborted && !endsSession(reason)) setLoadError(messageOf(reason, 'Não foi possível carregar as chaves.')) })
    return () => current.abort()
  }, [productId, request, revision, reloadCount])

  useEffect(() => {
    if (!historyOpen) return
    const current = new AbortController()
    setAuditError('')
    request<unknown>(auditPath(productId), { signal: current.signal })
      .then((value) => { if (!current.signal.aborted) setAudit(readAuditList(value)) })
      .catch((reason) => { if (!current.signal.aborted && !endsSession(reason)) setAuditError(messageOf(reason, 'Não foi possível carregar o histórico.')) })
    return () => current.abort()
  }, [historyOpen, productId, request, revision, auditCount])

  // Runs one action at a time. After it, the audit is read again here and the form tells the top field (K9); a change
  // made by the top field bumps `revision`, which reads the list and the audit again here.
  async function run(fallback: string, work: (signal: AbortSignal) => Promise<void>) {
    if (busy) return
    setBusy(true)
    setError('')
    const current = new AbortController()
    action.current = current
    try {
      await work(current.signal)
      if (current.signal.aborted) return
      setAuditCount((count) => count + 1)
      onChanged()
    } catch (reason) {
      if (current.signal.aborted || endsSession(reason)) return
      setError(messageOf(reason, fallback))
      // Another tab changed the key first: read the list again (edge case of the spec).
      if (reason instanceof ApiError && reason.status === 409) setReloadCount((count) => count + 1)
    } finally {
      if (!current.signal.aborted) setBusy(false)
    }
  }

  function show(value: string, coreNotice: string) {
    setSecret(value)
    setNotice(coreNotice || 'Copie o token agora: ele não será exibido de novo.')
  }

  function closeSecret() {
    setSecret('')
    setNotice('')
  }

  function revoke(token: TokenView) {
    if (!window.confirm(revokeQuestion(token.name))) return
    void run('Não foi possível revogar. Tente de novo.', async (signal) => {
      const revoked = readTokenView(await request<unknown>(revokePath(productId, token.id), { method: 'POST', signal }))
      if (signal.aborted) return
      if (!revoked) throw new ApiError(invalidResponse, 0)
      setTokens((list) => tokensAfterRevoke(list ?? [], revoked))
    })
  }

  function openRotate(token: TokenView) {
    setCreating(false)
    setRotatingId(token.id)
    setHours(String(defaultTransitionHours))
    setHoursError(undefined)
  }

  function rotate(token: TokenView) {
    const period = transitionHoursOf(hours)
    if ('error' in period) {
      setHoursError(period.error)
      return
    }
    if (!window.confirm(rotateQuestionFor(token.name, period.hours))) return
    void run('Não foi possível rotacionar a chave.', async (signal) => {
      const rotation = readRotation(await request<unknown>(rotatePath(productId, token.id), { method: 'POST', signal, body: JSON.stringify(rotateTokenBody(period.hours)) }))
      if (signal.aborted) return
      if (!rotation) throw new ApiError(invalidResponse, 0)
      setTokens((list) => tokensAfterRotation(list ?? [], rotation))
      setRotatingId(null)
      show(rotation.created.secret, rotation.created.notice)
    })
  }

  function openCreate() {
    setRotatingId(null)
    setCreating(true)
    setName('')
    setNameError(undefined)
  }

  function create() {
    const found = tokenNameError(name)
    if (found) {
      setNameError(found)
      return
    }
    void run('Não foi possível criar a chave.', async (signal) => {
      const created = readCreatedToken(await request<unknown>(tokensPath(productId), { method: 'POST', signal, body: JSON.stringify(createTokenBody(name)) }))
      if (signal.aborted) return
      if (!created) throw new ApiError(invalidResponse, 0)
      setTokens((list) => tokensAfterCreate(list ?? [], created))
      setCreating(false)
      show(created.secret, created.notice)
    })
  }

  // The section is inside the product form: Enter confirms here and never submits the product.
  function onEnter(event: KeyboardEvent<HTMLInputElement>, confirm: () => void) {
    if (event.key !== 'Enter') return
    event.preventDefault()
    confirm()
  }

  return (
    <Card role="region" className="space-y-5 sm:p-6" aria-labelledby="ingestion-tokens-title">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#0C70F2]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="8" cy="15" r="4" /><path d="m10.8 12.2 8.2-8.2M17 6l2 2M15 8l2 2" /></svg>
          </span>
          <span>
            <h3 id="ingestion-tokens-title" className="font-bold text-[#083B7A]">Chaves deste produto</h3>
            <p className="text-xs text-slate-500">Revogue, rotacione e acompanhe as chaves usadas para enviar os dados.</p>
          </span>
        </div>
        <Button type="button" variant="outline" size="small" fullWidth={false} disabled={archived || busy || tokens === null} onClick={openCreate}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
          Nova chave
        </Button>
      </div>

      {archived && <p className="text-xs text-slate-500">{archivedTokenMessage} Revogar continua disponível.</p>}

      {secret && (
        <div role="status" className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <label htmlFor="ingestion-token-secret" className="text-sm font-semibold text-amber-900">Chave nova</label>
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-amber-200 bg-white px-3 py-1.5">
            <input ref={secretInput} id="ingestion-token-secret" readOnly value={secret} autoComplete="off" spellCheck={false} className="min-w-0 flex-1 bg-transparent font-mono text-sm text-slate-900 outline-none" />
            <CopyButton getText={() => secret} onFailed={() => secretInput.current?.select()} />
          </div>
          <p className="text-xs text-amber-800">{notice}</p>
          <Button type="button" variant="outline" size="small" fullWidth={false} onClick={closeSecret}>Fechar</Button>
        </div>
      )}

      {creating && (
        <div className="space-y-3 rounded-lg border border-slate-200 p-4">
          <Input id="ingestion-token-name" label="Nome da chave" compact requiredMark maxLength={tokenNameMax + 20} value={name} error={nameError} hint="Por exemplo, cluster-producao." autoFocus onChange={(event) => { setName(event.target.value); setNameError(undefined) }} onKeyDown={(event) => onEnter(event, create)} />
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="small" fullWidth={false} disabled={busy} onClick={create}>{busy ? 'Criando...' : 'Criar chave'}</Button>
            <Button type="button" variant="secondary" size="small" fullWidth={false} disabled={busy} onClick={() => setCreating(false)}>Cancelar</Button>
          </div>
        </div>
      )}

      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

      {tokens === null && !loadError && <p className="text-sm text-slate-500">Carregando chaves...</p>}
      {loadError && (
        <div role="alert" className="flex flex-wrap items-center gap-3 text-sm text-red-600">
          <span>{loadError}</span>
          <Button type="button" variant="outline" size="small" fullWidth={false} onClick={() => setReloadCount((count) => count + 1)}>Tentar de novo</Button>
        </div>
      )}
      {tokens !== null && tokens.length === 0 && <p className="text-sm text-slate-500">{emptyTokensMessage}</p>}
      {tokens !== null && tokens.length > 0 && (
        <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200">
          {tokens.map((token) => {
            const badge = tokenBadge(token.state)
            const actions = tokenActions(token, archived)
            const details = tokenDetails(token, people)
            return (
              <li key={token.id} className="space-y-3 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <p className="flex flex-wrap items-center gap-2">
                      <span className="break-all text-sm font-semibold text-slate-900">{token.name || 'Sem nome'}</span>
                      <Badge variant={badge.variant} dot>{badge.label}</Badge>
                    </p>
                    <p className="text-xs text-slate-500">{details.created}</p>
                    {details.end && <p className="text-xs text-slate-500">{details.end}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {actions.rotate !== 'hidden' && (
                      <Button type="button" variant="outline" size="small" fullWidth={false} disabled={actions.rotate === 'disabled' || busy} title={actions.rotate === 'disabled' ? archivedTokenMessage : undefined} onClick={() => openRotate(token)}>Rotacionar</Button>
                    )}
                    {actions.revoke && (
                      <Button type="button" variant="outline" size="small" fullWidth={false} disabled={busy} onClick={() => revoke(token)}>Revogar</Button>
                    )}
                  </div>
                </div>
                {rotatingId === token.id && actions.rotate === 'enabled' && (
                  <div className="space-y-3 rounded-lg bg-slate-50 p-3">
                    <div className="sm:w-60">
                      <Input id={`ingestion-token-hours-${token.id}`} type="number" inputMode="numeric" min={1} max={168} step={1} label="Período de transição (horas)" compact value={hours} error={hoursError} hint={rotateHint} autoFocus onChange={(event) => { setHours(event.target.value); setHoursError(undefined) }} onKeyDown={(event) => onEnter(event, () => rotate(token))} />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" size="small" fullWidth={false} disabled={busy} onClick={() => rotate(token)}>{busy ? 'Rotacionando...' : 'Rotacionar chave'}</Button>
                      <Button type="button" variant="secondary" size="small" fullWidth={false} disabled={busy} onClick={() => setRotatingId(null)}>Cancelar</Button>
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <div className="border-t border-slate-200 pt-4">
        <button
          type="button"
          aria-expanded={historyOpen}
          aria-controls="ingestion-tokens-history"
          onClick={() => setHistoryOpen((open) => !open)}
          className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-[#083B7A] hover:text-[#0C70F2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0C70F2]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={historyOpen ? 'rotate-90' : ''}><path d="m9 6 6 6-6 6" /></svg>
          Histórico
        </button>
        {historyOpen && (
          <div id="ingestion-tokens-history" className="mt-3">
            {audit === null && !auditError && <p className="text-sm text-slate-500">Carregando histórico...</p>}
            {auditError && <p role="alert" className="text-sm text-red-600">{auditError}</p>}
            {audit !== null && audit.length === 0 && <p className="text-sm text-slate-500">Nenhuma operação registrada ainda.</p>}
            {audit !== null && audit.length > 0 && (
              <ol className="space-y-2">
                {audit.map((entry) => {
                  const line = auditLine(entry, tokens ?? [], people)
                  return (
                    <li key={entry.id} className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">{line.action}</span>
                      {' · '}
                      <span className="break-all">{line.token}</span>
                      {' · '}
                      {line.who}
                      {' · '}
                      {line.when}
                      {line.detail && <span className="block text-xs text-slate-500">{line.detail}</span>}
                    </li>
                  )
                })}
              </ol>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}

// The message of the Core; without an answer from it (network, status 0), the message of the action (edge case).
function messageOf(reason: unknown, fallback: string): string {
  return reason instanceof ApiError && reason.status !== 0 ? reason.message : fallback
}
