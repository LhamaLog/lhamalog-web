type SystemStatusProps = {
  label: string
  tone?: 'success' | 'warning' | 'danger' | 'neutral'
}

const dotColors = {
  success: 'bg-green-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  neutral: 'bg-slate-400',
}

export function SystemStatus({ label, tone = 'success' }: SystemStatusProps) {
  return (
    <span role="status" className="inline-flex items-center gap-2 text-xs text-[#0C70F2]">
      <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-full ${dotColors[tone]}`} />
      {label}
    </span>
  )
}
