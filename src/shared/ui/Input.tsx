import type { ComponentPropsWithoutRef } from 'react'

type InputProps = ComponentPropsWithoutRef<'input'> & {
  id: string
  label: string
}

export function Input({
  id,
  label,
  type = 'text',
  ...props
}: InputProps) {
  return (
    <div className="flex w-full flex-col gap-2">
      <label
        htmlFor={id}
        className="text-base font-semibold text-slate-900"
      >
        {label}
      </label>

      <input
        {...props}
        id={id}
        type={type}
        className="
          h-14 w-full rounded-xl border border-slate-200
          bg-slate-50 px-4 text-base text-slate-900
          placeholder:text-slate-600
          focus:border-[#0C70F2] focus:outline-none
          focus:ring-2 focus:ring-[#0C70F2]/20
          disabled:cursor-not-allowed disabled:opacity-50
        "
      />
    </div>
  )
}