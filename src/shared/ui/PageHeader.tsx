import type { ReactNode } from 'react'

type PageHeaderProps = {
  title: string
  description?: string
  actions?: ReactNode
  headingLevel?: 1 | 2
}

export function PageHeader({
  title,
  description,
  actions,
  headingLevel = 1,
}: PageHeaderProps) {
  const Heading = headingLevel === 1 ? 'h1' : 'h2'

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0">
        <Heading className="break-words text-3xl font-bold text-[#083B7A]">
          {title}
        </Heading>

        {description && (
          <p className="mt-1 text-sm text-[#0C70F2]">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          {actions}
        </div>
      )}
    </div>
  )
}
