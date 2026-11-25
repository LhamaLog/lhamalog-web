import { useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Card } from '../../../shared/ui/Card'
import { endpointNotConfigured, envSnippet, javaSnippet } from '../otelSnippet'
import type { OtelLogLevel } from '../types'
import { CopyButton } from './CopyButton'
import { LogLevelSlider } from './LogLevelSlider'

type Props = {
  endpoint: string
  productName: string
  traces: boolean
  logLevel: OtelLogLevel
  onTracesChange: (traces: boolean) => void
  onLogLevelChange: (level: OtelLogLevel) => void
  // The "Chave de API" field (spec 011, US2). Without it, a masked preview with disabled buttons.
  apiKey?: ReactNode
}

// "Conexão com OpenTelemetry" of 04-produto-integracao-otel.png (spec 011, US1).
export function OtelConnectionCard({ endpoint, productName, traces, logLevel, onTracesChange, onLogLevelChange, apiKey }: Props) {
  const [snippetTab, setSnippetTab] = useState<'env' | 'java'>('env')
  const endpointInput = useRef<HTMLInputElement>(null)
  // The snippet never receives the key: it always shows <sua-chave> (FR-W03).
  const snippetInput = { endpoint, productName, traces }
  const snippet = snippetTab === 'env' ? envSnippet(snippetInput) : javaSnippet(snippetInput)

  return (
    <Card className="space-y-5 sm:p-6">
      <div className="flex items-start gap-3 border-b border-slate-200 pb-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#0C70F2]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></svg>
        </span>
        <span>
          <h3 className="font-bold text-[#083B7A]">Conexão com OpenTelemetry</h3>
          <p className="text-xs text-slate-500">Conecte a aplicação ao LhamaLog para começar a receber os logs.</p>
        </span>
      </div>

      <p className="flex items-start gap-2 rounded-lg bg-blue-50 p-3 text-xs text-[#083B7A]">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="mt-px shrink-0 text-[#0C70F2]" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></svg>
        Sinais e nível mínimo ainda não são salvos no servidor: ficam guardados só neste navegador.
      </p>

      <div className="grid gap-x-6 gap-y-5 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="otel-endpoint" className="text-sm font-semibold text-slate-900">Endpoint de recebimento</label>
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-field px-3 py-1.5">
            <input
              ref={endpointInput}
              id="otel-endpoint"
              readOnly
              value={endpoint || endpointNotConfigured}
              aria-describedby="otel-endpoint-hint"
              className={`min-w-0 flex-1 bg-transparent text-sm outline-none ${endpoint ? 'text-slate-900' : 'text-slate-500'}`}
            />
            <CopyButton disabled={!endpoint} getText={() => endpoint} onFailed={() => endpointInput.current?.select()} />
          </div>
          <p id="otel-endpoint-hint" className="text-xs text-slate-500">Endereço gerado pelo LhamaLog para receber os dados.</p>
        </div>
        {apiKey ?? <MaskedKeyPreview />}
      </div>

      <fieldset className="m-0 min-w-0 space-y-2 border-0 p-0">
        <legend className="mb-2 text-sm font-semibold text-slate-900">Sinais a enviar <span className="text-red-600" aria-hidden="true">*</span></legend>
        <div className="grid gap-3 sm:grid-cols-3">
          <SignalOption id="otel-signal-logs" label="Logs" detail="Obrigatório" checked disabled />
          <SignalOption id="otel-signal-traces" label="Traces" detail="Opcional" checked={traces} onChange={onTracesChange} />
          <SignalOption id="otel-signal-metrics" label="Métricas" detail="Ainda não recebido" checked={false} disabled describedBy="otel-signal-metrics-hint" />
        </div>
        <p className="text-xs text-slate-500">Logs são necessários para a análise da IA.</p>
        <p id="otel-signal-metrics-hint" className="text-xs text-slate-500">O LhamaLog ainda não recebe métricas.</p>
      </fieldset>

      <div className="flex flex-col gap-2">
        <span id="otel-log-level-label" className="text-sm font-semibold text-slate-900">Nível mínimo de log</span>
        <LogLevelSlider id="otel-log-level" value={logLevel} onChange={onLogLevelChange} describedBy="otel-log-level-hint" />
        <p id="otel-log-level-hint" className="text-xs text-slate-500">Nível de referência para a aplicação. Ainda não é aplicado no envio dos logs.</p>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-slate-900">Configuração da aplicação</span>
        <div className="overflow-hidden rounded-xl bg-[#0B1A33] text-slate-100">
          <div className="flex items-center justify-between gap-3 border-b border-slate-700 px-4">
            <div role="tablist" aria-label="Formato da configuração" className="flex gap-4">
              {([['env', 'Variáveis de ambiente'], ['java', 'Java (agente)']] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={snippetTab === value}
                  onClick={() => setSnippetTab(value)}
                  className={`-mb-px cursor-pointer border-b-2 py-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0C70F2] ${snippetTab === value ? 'border-[#0C70F2] text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <CopyButton tone="dark" getText={() => snippet} />
          </div>
          <pre className="overflow-x-auto px-4 py-4 text-xs leading-6"><code>{snippet}</code></pre>
        </div>
        <p className="text-xs text-slate-500">Cole essas variáveis no ambiente da aplicação e reinicie o serviço. Troque {'<sua-chave>'} pela Chave de API.</p>
      </div>
    </Card>
  )
}

function SignalOption({ id, label, detail, checked, disabled = false, onChange, describedBy }: { id: string; label: string; detail: string; checked: boolean; disabled?: boolean; onChange?: (checked: boolean) => void; describedBy?: string }) {
  return (
    <label htmlFor={id} className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${checked ? 'border-[#0C70F2] bg-blue-50' : 'border-slate-200 bg-white'} ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
      <input id={id} type="checkbox" checked={checked} disabled={disabled} aria-describedby={describedBy} onChange={(event) => onChange?.(event.target.checked)} className="h-4 w-4 accent-[#0C70F2]" />
      <span>
        <span className="block text-sm font-semibold text-slate-900">{label}</span>
        <span className="block text-xs text-slate-500">{detail}</span>
      </span>
    </label>
  )
}

// Until the key field exists (Fase 3 of spec 011): masked, with the buttons disabled.
function MaskedKeyPreview() {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-slate-900">Chave de API</span>
      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-field px-3 py-1.5">
        <span className="min-w-0 flex-1 text-sm tracking-widest text-slate-500" aria-label="Chave mascarada">••••••••••••••••</span>
      </div>
      <p className="text-xs text-slate-500">Envie no header de autorização. Ela aparece só uma vez.</p>
    </div>
  )
}
