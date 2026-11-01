import type { ComponentProps } from 'react'
import { Input } from './Input'

type SearchInputProps = Omit<
  ComponentProps<typeof Input>,
  'type' | 'startIcon' | 'endAction' | 'compact' | 'hideLabel'
>

export function SearchInput({ placeholder = 'Buscar...', ...props }: SearchInputProps) {
  return (
    <Input
      {...props}
      type="search"
      placeholder={placeholder}
      compact
      hideLabel
      startIcon={
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="m16 16 5 5" />
        </svg>
      }
    />
  )
}
