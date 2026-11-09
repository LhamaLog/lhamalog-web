import type { ComponentProps } from 'react'
import { Button } from './Button'

type FilterButtonProps = Omit<
  ComponentProps<typeof Button>,
  'children' | 'variant' | 'size' | 'fullWidth' | 'className' | 'style'
> & {
  count?: number
}

export function FilterButton({ count = 0, ...props }: FilterButtonProps) {
  const activeCount = Math.max(0, Math.floor(count))

  return (
    <Button
      {...props}
      size="small"
      fullWidth={false}
      className="relative rounded-full! bg-[#083B7A]! enabled:hover:bg-[#062D5E]!"
      aria-label={props['aria-label'] ?? `Filtros, ${activeCount} ativos`}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M4 4h16l-6 7v9l-4-2v-7Z" />
      </svg>
      Filtros
      {activeCount > 0 && (
        <span
          aria-hidden="true"
          className="absolute -right-1 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#0C70F2] px-1 text-xs text-white"
        >
          {activeCount}
        </span>
      )}
    </Button>
  )
}
