import type { ComponentProps } from 'react'
import { Button } from './Button'

type PeriodSelectorProps = Omit<
  ComponentProps<typeof Button>,
  'children' | 'variant' | 'size' | 'fullWidth' | 'className' | 'style'
> & {
  label: string
}

export function PeriodSelector({ label, ...props }: PeriodSelectorProps) {
  return (
    <Button
      {...props}
      variant="outline"
      size="small"
      fullWidth={false}
      aria-label={props['aria-label'] ?? `Selecionar período. Atual: ${label}`}
      className="rounded-md! border-[#083B7A]! text-[#083B7A]! font-normal!"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M7 3v4M17 3v4M3 11h18" />
      </svg>
      {label}
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="shrink-0"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </Button>
  )
}
