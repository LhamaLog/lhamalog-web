import type { ComponentPropsWithoutRef } from 'react'

type CheckboxProps = Omit<
  ComponentPropsWithoutRef<'input'>,
  'type' | 'id' | 'className' | 'style'
> & {
  id: string
  label?: string
}

export function Checkbox({
  id,
  label,
  disabled,
  ...props
}: CheckboxProps) {
  return (
    <div className="flex items-center gap-2">
      <input
        {...props}
        id={id}
        type="checkbox"
        disabled={disabled}
        className="
          h-5 w-5 shrink-0 cursor-pointer
          appearance-none rounded-md
          border border-slate-300 bg-white
          checked:border-[#0C70F2] checked:bg-[#0C70F2]
          checked:bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%2020%2020%22%3E%3Cpath%20d=%22m5%2010%203%203%207-7%22%20fill=%22none%22%20stroke=%22white%22%20stroke-width=%222%22%20stroke-linecap=%22round%22%20stroke-linejoin=%22round%22/%3E%3C/svg%3E')]
          focus-visible:outline-2
          focus-visible:outline-offset-2
          focus-visible:outline-[#0C70F2]
          disabled:cursor-not-allowed disabled:opacity-50
        "
      />

      {label && (
        <label
          htmlFor={id}
          className={`
            text-sm text-slate-600
            ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
          `}
        >
          {label}
        </label>
      )}
    </div>
  )
}