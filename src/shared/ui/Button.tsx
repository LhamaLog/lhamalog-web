import type { ComponentPropsWithoutRef } from 'react'

type ButtonProps = ComponentPropsWithoutRef<'button'>

export function Button({
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className="
        flex h-12 w-full items-center justify-center gap-2
        rounded-xl bg-[#0C70F2] px-4
        text-base font-semibold text-white
        hover:bg-[#095ECC]
        focus-visible:outline-2
        focus-visible:outline-offset-2
        focus-visible:outline-[#0C70F2]
        disabled:cursor-not-allowed disabled:opacity-50
      "
    >
      {children}
    </button>
  )
}