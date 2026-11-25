import { useEffect, useRef, useState } from 'react'

// "Copiar" of the OpenTelemetry tab (spec 011, R9). When the browser refuses the clipboard, `onFailed` lets the
// field select its text, and the button tells the person to copy by hand.
export function CopyButton({
  getText,
  onFailed,
  disabled = false,
  label = 'Copiar',
  tone = 'light',
}: {
  getText: () => string
  onFailed?: () => void
  disabled?: boolean
  label?: string
  tone?: 'light' | 'dark'
}) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  async function copy() {
    if (timer.current) clearTimeout(timer.current)
    try {
      if (!navigator.clipboard) throw new Error('clipboard unavailable')
      await navigator.clipboard.writeText(getText())
      setState('copied')
    } catch {
      setState('failed')
      onFailed?.()
    }
    timer.current = setTimeout(() => setState('idle'), 4000)
  }

  const colors = tone === 'dark'
    ? 'border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700'
    : 'border-blue-100 bg-blue-50 text-[#0C70F2] hover:bg-blue-100'

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={disabled}
        onClick={copy}
        className={`inline-flex h-8 shrink-0 cursor-pointer items-center gap-1 rounded-md border px-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0C70F2] disabled:cursor-not-allowed disabled:opacity-50 ${colors}`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true"><path d="M9 9h11v11H9z" /><path d="M5 15H4V4h11v1" /></svg>
        {state === 'copied' ? 'Copiado' : label}
      </button>
      <span role="status" className="sr-only">{state === 'copied' ? 'Copiado para a área de transferência.' : ''}</span>
      {state === 'failed' && <span role="alert" className="text-xs text-red-600">Copie manualmente com Ctrl+C.</span>}
    </span>
  )
}
