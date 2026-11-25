import { useEffect, useRef, useState } from 'react'
import { ApiError } from '../../../shared/services/api'
import { endsSession } from '../../../shared/services/sessionRedirect'
import {
  activeToken,
  archivedTokenMessage,
  connectionState,
  defaultTokenName,
  expiringHint,
  expiringToken,
  generateMode,
  notAdminTokenHint,
  readCreatedToken,
  readRotation,
  readTokenList,
  rotateBody,
  rotatePath,
  rotateQuestion,
  tokensAfterCreate,
  tokensAfterRotation,
  tokensPath,
  unsavedProductTokenHint,
} from '../tokenContract'
import type { TokenView } from '../tokenContract'
import { CopyButton } from './CopyButton'

type Request = <T>(path: string, options?: RequestInit) => Promise<T>

type Props = {
  productId?: string
  productName: string
  archived: boolean
  admin: boolean
  request: Request
  onConnectionChange: (state: 'waiting' | 'none' | 'unknown') => void
}

const helpText = 'Envie no header de autorização. Ela aparece só uma vez.'

// "Chave de API" of the Figma (spec 011, US2 and F5). The secret lives only in this component's state: it is never
// stored, logged or put in the URL or in the snippet, and it is gone when the component leaves the screen (FR-W03).
export function ApiKeyField({ productId, productName, archived, admin, request, onConnectionChange }: Props) {
  const [tokens, setTokens] = useState<TokenView[] | null>(null)
  const [secret, setSecret] = useState('')
  const [notice, setNotice] = useState('')
  const [visible, setVisible] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const controller = useRef<AbortController | null>(null)
  const canList = Boolean(productId) && admin

  useEffect(() => () => controller.current?.abort(), [])

  // Only admins can list tokens (the Core refuses the others with 403 not_admin), so nobody else asks for them.
  useEffect(() => {
    if (!canList || !productId) return
    const current = new AbortController()
    controller.current = current
    request<unknown>(tokensPath(productId), { signal: current.signal })
      .then((value) => { if (!current.signal.aborted) setTokens(readTokenList(value)) })
      .catch((reason) => { if (!current.signal.aborted && !endsSession(reason)) setError(messageOf(reason, 'Não foi possível carregar a chave.')) })
    return () => current.abort()
  }, [canList, productId, request])

  const active = tokens ? activeToken(tokens) : null
  const previous = tokens ? expiringToken(tokens) : null

  useEffect(() => {
    if (!productId) onConnectionChange('none')
    else onConnectionChange(connectionState(canList && tokens !== null, active !== null))
  }, [productId, canList, tokens, active, onConnectionChange])

  async function generate() {
    if (!productId || busy || tokens === null) return
    const mode = generateMode(active)
    if (mode === 'rotate' && !window.confirm(rotateQuestion)) return
    setBusy(true)
    setError('')
    const current = new AbortController()
    controller.current = current
    try {
      if (mode === 'rotate' && active) {
        const rotation = readRotation(await request<unknown>(rotatePath(productId, active.id), { method: 'POST', signal: current.signal, body: JSON.stringify(rotateBody) }))
        if (current.signal.aborted) return
        if (!rotation) throw new ApiError('O servidor retornou uma resposta inválida.', 0)
        setTokens(tokensAfterRotation(tokens, rotation))
        show(rotation.created.secret, rotation.created.notice)
      } else {
        const created = readCreatedToken(await request<unknown>(tokensPath(productId), { method: 'POST', signal: current.signal, body: JSON.stringify({ name: defaultTokenName(productName) }) }))
        if (current.signal.aborted) return
        if (!created) throw new ApiError('O servidor retornou uma resposta inválida.', 0)
        setTokens(tokensAfterCreate(tokens, created))
        show(created.secret, created.notice)
      }
    } catch (reason) {
      if (!current.signal.aborted && !endsSession(reason)) setError(messageOf(reason, 'Não foi possível gerar a chave.'))
    } finally {
      if (!current.signal.aborted) setBusy(false)
    }
  }

  function show(value: string, coreNotice: string) {
    setSecret(value)
    setNotice(coreNotice || 'Copie o token agora: ele não será exibido de novo.')
    setVisible(true)
  }

  const hint = !productId ? unsavedProductTokenHint
    : !admin ? notAdminTokenHint
      : archived ? archivedTokenMessage
        : helpText
  const generateDisabled = !productId || !admin || archived || busy || tokens === null
  const masked = active || secret ? '••••••••••••••••' : tokens === null && canList ? 'Carregando...' : 'Nenhuma chave gerada'

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="otel-api-key" className="text-sm font-semibold text-slate-900">Chave de API</label>
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-field px-3 py-1.5">
        <input
          ref={input}
          id="otel-api-key"
          readOnly
          // The value is in the input only while it is visible, right after it was generated.
          value={secret && visible ? secret : masked}
          aria-describedby="otel-api-key-hint"
          autoComplete="off"
          spellCheck={false}
          className={`min-w-0 flex-1 bg-transparent text-sm outline-none ${secret && visible ? 'font-mono text-slate-900' : 'tracking-widest text-slate-500'}`}
        />
        {/* Without a saved product the buttons show disabled (US1.4); without admin they do not show (W1). */}
        {admin && (
          <>
            <button
              type="button"
              disabled={!secret}
              aria-label={visible ? 'Ocultar a chave' : 'Mostrar a chave'}
              aria-pressed={!visible}
              onClick={() => setVisible((current) => !current)}
              className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-[#0C70F2] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>
            </button>
            <button
              type="button"
              disabled={generateDisabled}
              onClick={generate}
              className="inline-flex h-8 shrink-0 cursor-pointer items-center gap-1 rounded-md border border-slate-200 bg-white px-2 text-sm text-[#0C70F2] hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0C70F2] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-2.6-6.4M21 4v5h-5" /></svg>
              {busy ? 'Gerando...' : 'Gerar nova'}
            </button>
            <CopyButton disabled={!secret} getText={() => secret} onFailed={() => { setVisible(true); requestAnimationFrame(() => input.current?.select()) }} />
          </>
        )}
      </div>
      <p id="otel-api-key-hint" className="text-xs text-slate-500">{hint}</p>
      {secret && <p role="status" className="rounded-lg bg-amber-50 p-2 text-xs text-amber-800">{notice}</p>}
      {previous && admin && <p className="text-xs text-slate-500">{expiringHint(previous)}</p>}
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    </div>
  )
}

function messageOf(reason: unknown, fallback: string): string {
  return reason instanceof ApiError ? reason.message : fallback
}
