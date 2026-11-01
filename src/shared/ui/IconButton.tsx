import type { ComponentProps, ReactNode } from 'react'
import { Button } from './Button'

type IconButtonProps = Omit<
  ComponentProps<typeof Button>,
  'children' | 'size' | 'fullWidth' | 'className' | 'style' | 'aria-label'
> & {
  children: ReactNode
  'aria-label': string
}

export function IconButton({
  children,
  'aria-label': label,
  ...props
}: IconButtonProps) {
  return (
    <Button
      {...props}
      size="icon"
      aria-label={label}
      fullWidth={false}
      className="shrink-0"
    >
      <span
        aria-hidden="true"
        className="flex items-center justify-center"
      >
        {children}
      </span>
    </Button>
  )
}