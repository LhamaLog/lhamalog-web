import type { ComponentPropsWithoutRef } from 'react'

type TextareaProps = ComponentPropsWithoutRef<'textarea'> & { id: string; label: string; error?: string }

export function Textarea({ id, label, error, ...props }: TextareaProps) {
  return <div className="flex flex-col gap-2">
    <label htmlFor={id} className="text-sm font-semibold text-slate-900">{label}</label>
    <textarea {...props} id={id} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined}
      className="min-h-28 w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm focus:outline-2 focus:outline-[#0C70F2] disabled:opacity-50" />
    {error && <p id={`${id}-error`} className="text-sm text-red-600">{error}</p>}
  </div>
}
