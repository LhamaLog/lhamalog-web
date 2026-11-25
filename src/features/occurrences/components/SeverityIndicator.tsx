type SeverityIndicatorProps = {
  severity: 'error' | 'warning' | 'info'
  // Text shown instead of the default one (the real list uses "Informação", spec 008 FR-002).
  label?: string
}

const severities = {
  error: { label: 'Erro', className: 'border-red-200 bg-red-50 text-red-600' },
  warning: { label: 'Alerta', className: 'border-amber-200 bg-amber-50 text-amber-700' },
  info: { label: 'Info', className: 'border-blue-200 bg-blue-50 text-[#0C70F2]' },
}

export function SeverityIndicator({ severity, label }: SeverityIndicatorProps) {
  const current = severities[severity]

  return (
    <span className={`inline-flex h-16 w-fit min-w-26 shrink-0 px-2 items-center justify-center gap-2 rounded-lg border text-sm font-bold ${current.className}`}>
      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
        {severity === 'warning' ? (
          <path d="M12 2 1 22h22Z" fill="currentColor" />
        ) : (
          <circle cx="12" cy="12" r="11" fill="currentColor" />
        )}
        <path
          d={severity === 'info' ? 'M12 11v6M12 7h.01' : 'M12 7v6M12 17h.01'}
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      {label ?? current.label}
    </span>
  )
}
