import { useRef } from 'react'
import type { KeyboardEvent } from 'react'
import { logLevels } from '../otelSnippet'
import type { OtelLogLevel } from '../types'

// "Nível mínimo de log" of the Figma: a track with DEBUG, INFO, WARN and ERROR. A radiogroup, so the arrow keys
// move the level. The value goes to the local draft (spec 011, F1).
export function LogLevelSlider({ id, value, onChange, disabled = false, describedBy }: { id: string; value: OtelLogLevel; onChange: (value: OtelLogLevel) => void; disabled?: boolean; describedBy?: string }) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([])
  const selected = Math.max(0, logLevels.indexOf(value))
  const last = logLevels.length - 1

  function move(event: KeyboardEvent, index: number) {
    const keys: Record<string, number> = { ArrowRight: index + 1, ArrowUp: index + 1, ArrowLeft: index - 1, ArrowDown: index - 1, Home: 0, End: last }
    if (!(event.key in keys)) return
    event.preventDefault()
    const next = Math.min(last, Math.max(0, keys[event.key]))
    onChange(logLevels[next])
    buttons.current[next]?.focus()
  }

  return (
    <div role="radiogroup" id={id} aria-labelledby={`${id}-label`} aria-describedby={describedBy} className="rounded-xl border border-slate-200 px-6 py-5">
      <div className="relative mx-2">
        <span aria-hidden="true" className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-slate-200" />
        <span aria-hidden="true" className="absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-[#0C70F2]" style={{ width: `${(selected / last) * 100}%` }} />
        <div className="relative flex justify-between">
          {logLevels.map((level, index) => {
            const checked = index === selected
            return (
              <button
                key={level}
                ref={(element) => { buttons.current[index] = element }}
                type="button"
                role="radio"
                aria-checked={checked}
                aria-label={level}
                tabIndex={checked ? 0 : -1}
                disabled={disabled}
                onClick={() => onChange(level)}
                onKeyDown={(event) => move(event, index)}
                className={`flex h-5 w-5 cursor-pointer items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0C70F2] disabled:cursor-not-allowed ${checked ? 'border-2 border-[#0C70F2] bg-white' : index < selected ? 'bg-[#0C70F2]' : 'bg-slate-300'}`}
              />
            )
          })}
        </div>
      </div>
      <div aria-hidden="true" className="mt-3 flex justify-between text-xs">
        {logLevels.map((level, index) => <span key={level} className={`w-12 text-center first:-ml-3 last:-mr-3 ${index === selected ? 'font-bold text-[#0C70F2]' : 'text-slate-500'}`}>{level}</span>)}
      </div>
    </div>
  )
}
